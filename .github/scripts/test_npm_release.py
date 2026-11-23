import base64
import hashlib
import io
import json
import os
import socket
import subprocess
from pathlib import Path
import tarfile
import tempfile
import unittest
from unittest.mock import patch
from urllib.error import HTTPError, URLError

import npm_release as gate

DATA = b"verified bytes"
DIGEST = hashlib.sha256(DATA).hexdigest()
SRI = "sha512-" + base64.b64encode(hashlib.sha512(DATA).digest()).decode("ascii")
NAME = "linhey-rhine-design-0.18.1"
MANIFEST = {"name": gate.PACKAGE, "version": "0.18.1", "repository": {"url": f"git+https://github.com/{gate.REPO}.git"}, "publishConfig": {"access": "public", "registry": gate.REGISTRY + "/"}}


class ReleaseGuards(unittest.TestCase):
    def test_dispatch_requires_literal_stable_tag_and_digest(self):
        self.assertEqual(gate.inputs("v0.18.1", DIGEST.upper()), ("0.18.1", DIGEST))
        for tag in ("0.18.1", "v0.18.1-rc.1", "v0.018.1", "v1.2.3;echo x", "v1.2.3" + chr(10)):
            with self.assertRaises(ValueError):
                gate.inputs(tag, DIGEST)
        with self.assertRaises(ValueError):
            gate.inputs("v0.18.1", "not-a-digest")

    def test_release_is_published_and_checksums_match(self):
        files = [{"name": NAME + suffix, "state": "uploaded", "size": 128, "digest": "sha256:" + DIGEST} for suffix in (".tgz", ".sha256")]
        release = {"tagName":"v0.18.1", "isDraft":False, "isPrerelease":False, "publishedAt":"2026-11-23T00:00:00Z", "assets":files}
        self.assertEqual(gate.release_assets(release, "v0.18.1", "0.18.1", DIGEST), files)
        for invalid in ({**release, "isDraft":True}, {**release, "isPrerelease":True}, {**release, "assets":files + files[:1]}, {**release, "assets":files[:1]}):
            with self.assertRaises(ValueError):
                gate.release_assets(invalid, "v0.18.1", "0.18.1", DIGEST)
        with self.assertRaises(ValueError):
            gate.release_assets(release, "v0.18.1", "0.18.1", "a" * 64)

    def test_package_identity_and_archive_are_checked_without_extraction(self):
        with tempfile.TemporaryDirectory() as root:
            tar = Path(root) / "sample.tgz"
            content = json.dumps(MANIFEST).encode()
            def archive(*names):
                with tarfile.open(tar, "w:gz") as output:
                    for name in names:
                        file = tarfile.TarInfo(name)
                        file.size = len(content)
                        output.addfile(file, io.BytesIO(content))
            archive("package/package.json")
            gate.check_package(gate.package_metadata(tar), MANIFEST, "0.18.1")
            with self.assertRaises(ValueError):
                gate.check_package({**MANIFEST, "scripts":{"postinstall":"false"}}, MANIFEST, "0.18.1")
            for bad in ("../package/package.json", "package/package.json", "package/./package.json", "package//package.json"):
                archive("package/package.json", bad)
                with self.assertRaises(ValueError):
                    gate.package_metadata(tar)

    def test_registry_missing_matches_and_different_bytes(self):
        with patch.object(gate, "registry_get", return_value=None):
            self.assertEqual(gate.registry_state("0.18.1", DIGEST), "missing")
        info = {"name":gate.PACKAGE, "version":"0.18.1", "dist":{"tarball":gate.REGISTRY + f"/{gate.PACKAGE}/-/rhine-design-0.18.1.tgz", "integrity":SRI}}
        with patch.object(gate, "registry_get", side_effect=[json.dumps(info).encode(), DATA]):
            self.assertEqual(gate.registry_state("0.18.1", DIGEST), "identical")
        for blob in (b"different bytes", b""):
            with patch.object(gate, "registry_get", side_effect=[json.dumps(info).encode(), blob]):
                with self.assertRaisesRegex(ValueError, "different bytes"):
                    gate.registry_state("0.18.1", DIGEST)

    def test_verify_mode_cannot_publish_even_if_npm_missing(self):
        with patch.dict(os.environ,{"RELEASE_TAG":"v0.18.1","RELEASE_SHA256":DIGEST}), patch.object(gate.sys,"argv",["npm_release.py","verify"]), patch.object(gate,"prepare"), patch.object(gate,"registry_state",return_value="missing"), patch.object(gate,"latest",return_value="0.18.0"), patch.object(gate,"publish") as publish, patch("builtins.print") as output:
            gate.main()
            publish.assert_not_called()
            self.assertEqual(json.loads(output.call_args.args[0])["result"], "verified_no_write")

    def test_publish_requires_canonical_oidc_job_and_cannot_downgrade(self):
        with patch.dict(os.environ,{},clear=True), self.assertRaisesRegex(ValueError,"GitHub main OIDC job"):
            gate.publish(Path(NAME), "0.18.1", DIGEST)
        env = {"GITHUB_ACTIONS":"true","GITHUB_REPOSITORY":gate.REPO,"GITHUB_REF":"refs/heads/main","ACTIONS_ID_TOKEN_REQUEST_URL":"fixture"}
        with patch.dict(os.environ,env,clear=True), patch.object(gate,"latest",return_value="0.19.0"), patch.object(gate.subprocess,"run") as invoke:
            with self.assertRaisesRegex(ValueError,"older or equal"):
                gate.publish(Path(NAME), "0.18.1", DIGEST)
            invoke.assert_not_called()

    def test_npm_accepts_but_public_metadata_is_delayed_without_republish(self):
        env = {"GITHUB_ACTIONS":"true", "GITHUB_REPOSITORY":gate.REPO, "GITHUB_REF":"refs/heads/main", "ACTIONS_ID_TOKEN_REQUEST_URL":"fixture"}
        with tempfile.TemporaryDirectory() as root:
            tarball = Path(root) / (NAME + ".tgz")
            tarball.write_bytes(DATA)
            with (patch.dict(os.environ, env, clear=True),
                  patch.object(gate, "latest", return_value="0.18.0"),
                  patch.object(gate, "run", return_value="11.19.0"),
                  patch.object(gate.subprocess, "run") as invoke,
                  patch.object(gate, "registry_state", return_value="missing") as registry,
                  patch.object(gate.time, "sleep"), patch("builtins.print") as output):
                result = gate.publish(tarball, "0.18.1", DIGEST)
                self.assertEqual(result, "npm_accepted_registry_pending")
                invoke.assert_called_once()
                self.assertEqual(invoke.call_args.args[0][:2], ["npm", "publish"])
                self.assertGreater(registry.call_count, 1)
                self.assertTrue(any(str(c.args[0]).startswith("::warning") for c in output.call_args_list))

    def test_post_publish_retries_transient_read_errors_and_stale_latest(self):
        transient = HTTPError(gate.REGISTRY, 503, "temporary", None, None)
        self.addCleanup(transient.close)
        with (patch.object(gate, "registry_state", side_effect=[transient, URLError(TimeoutError()), URLError(socket.gaierror(socket.EAI_AGAIN, "temporary DNS")), "pending_tarball", "identical", "identical"]) as registry,
              patch.object(gate, "latest", side_effect=["0.18.0", "0.18.1"]),
              patch.object(gate.time, "sleep"), patch("builtins.print") as output):
            self.assertEqual(gate.confirm_publication("0.18.1", DIGEST, SRI), "published_and_read_back")
            self.assertEqual(registry.call_count, 6)
            output.assert_not_called()

    def test_manifest_can_propagate_before_tarball_but_only_after_acceptance(self):
        version = "0.18.1"
        path = f"/{gate.PACKAGE}/-/rhine-design-{version}.tgz"
        info = {"name":gate.PACKAGE, "version":version, "dist":{"tarball":gate.REGISTRY + path, "integrity":SRI}}
        payload = json.dumps(info).encode()
        missing_tarball = HTTPError(gate.REGISTRY + path, 404, "not visible", None, None)
        self.addCleanup(missing_tarball.close)
        with patch.object(gate, "registry_get", side_effect=[payload, missing_tarball]) as get:
            with self.assertRaises(HTTPError):
                gate.registry_state(version, DIGEST)
            self.assertFalse(get.call_args.kwargs["missing_ok"])
        with patch.object(gate, "registry_get", side_effect=[payload, None]) as get:
            self.assertEqual(gate.registry_state(version, DIGEST, accepted_integrity=SRI), "pending_tarball")
            self.assertTrue(get.call_args.kwargs["missing_ok"])
        with patch.object(gate, "registry_get", return_value=payload) as get:
            with self.assertRaisesRegex(ValueError, "different package integrity"):
                gate.registry_state(version, DIGEST, accepted_integrity="unexpected integrity")
            get.assert_called_once()

    def test_real_readback_contradictions_and_nontransient_errors_still_fail(self):
        denied = HTTPError(gate.REGISTRY, 403, "denied", None, None)
        self.addCleanup(denied.close)
        for error in (ValueError("different bytes"), denied, URLError(socket.gaierror(socket.EAI_NONAME, "permanent DNS"))):
            with patch.object(gate, "registry_state", side_effect=error) as registry:
                with self.assertRaises(type(error)):
                    gate.confirm_publication("0.18.1", DIGEST, SRI)
                registry.assert_called_once()
        with patch.object(gate, "registry_state", return_value="identical"), patch.object(gate, "latest", return_value="0.19.0"):
            with self.assertRaisesRegex(ValueError, "refusing to retag"):
                gate.confirm_publication("0.18.1", DIGEST, SRI)

    def test_registry_already_has_exact_bytes_never_writes_even_in_publish_mode(self):
        with (patch.dict(os.environ,{"RELEASE_TAG":"v0.18.1","RELEASE_SHA256":DIGEST}),
              patch.object(gate.sys,"argv",["npm_release.py","publish"]), patch.object(gate,"prepare"),
              patch.object(gate,"registry_state",return_value="identical"), patch.object(gate,"publish") as publish,
              patch("builtins.print") as output):
            gate.main()
            publish.assert_not_called()
            self.assertEqual(json.loads(output.call_args.args[0])["result"], "already_exists_identical_no_write")

    def test_rejected_write_is_not_an_accepted_publication(self):
        env = {"GITHUB_ACTIONS":"true", "GITHUB_REPOSITORY":gate.REPO, "GITHUB_REF":"refs/heads/main", "ACTIONS_ID_TOKEN_REQUEST_URL":"fixture"}
        with tempfile.TemporaryDirectory() as root:
            tarball = Path(root) / (NAME + ".tgz")
            tarball.write_bytes(DATA)
            with (patch.dict(os.environ, env, clear=True), patch.object(gate, "latest", return_value="0.18.0"),
                  patch.object(gate, "run", return_value="11.19.0"),
                  patch.object(gate.subprocess, "run", side_effect=subprocess.CalledProcessError(1, ["npm", "publish"])) as invoke,
                  patch.object(gate, "confirm_publication") as confirm):
                with self.assertRaises(subprocess.CalledProcessError):
                    gate.publish(tarball, "0.18.1", DIGEST)
                invoke.assert_called_once()
                confirm.assert_not_called()
