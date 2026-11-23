import base64
import hashlib
import io
import json
import os
from pathlib import Path
import tarfile
import tempfile
import unittest
from unittest.mock import patch

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
            for bad in ("../package/package.json", "package/package.json"):
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
