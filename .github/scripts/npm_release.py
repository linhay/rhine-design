"""Verify a tagged GitHub Release and optionally publish the identical tarball via OIDC."""
import base64
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import socket
import subprocess
import sys
import tarfile
import tempfile
import time
from urllib.error import HTTPError, URLError
from urllib.request import HTTPRedirectHandler, Request, build_opener

REPO = "linhay/rhine-design"
PACKAGE = "@linhey/rhine-design"
REGISTRY = "https://registry.npmjs.org"
ENCODED_PACKAGE = "@linhey%2Frhine-design"
SIGNER = "DDD1D1825F3E7397B186F262FB824469334BE8DB"
VERSION = r"(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)"
MAX_ASSET = 32 * 1024 * 1024


def require(condition, message):
    if not condition:
        raise ValueError(message)


def inputs(tag, sha):
    require(re.fullmatch("v" + VERSION, tag, re.ASCII) is not None and len(tag) <= 35, "Use a stable vMAJOR.MINOR.PATCH tag.")
    require(re.fullmatch("[0-9a-fA-F]{64}", sha, re.ASCII) is not None, "An independently verified SHA-256 is required.")
    return tag[1:], sha.lower()


def version_tuple(version):
    match = re.fullmatch(VERSION, version, re.ASCII)
    require(match is not None and len(version) <= 34, "Expected a stable npm version.")
    return tuple(map(int, match.groups()))


def run(*args, env=None, cwd=None):
    return subprocess.run(args, check=True, capture_output=True, text=True, env=env, cwd=cwd, timeout=90).stdout


def verify_tag(tag, scratch):
    ref = f"refs/tags/{tag}"
    require(run("git", "cat-file", "-t", ref).strip() == "tag", "Release tag must be annotated and signed.")
    header = run("git", "cat-file", "-p", ref).split(chr(10) * 2, 1)[0].splitlines()
    require(f"tag {tag}" in header and "type commit" in header, "Signed tag name or target type does not match the release.")
    home = scratch / "gpg"
    home.mkdir(mode=0o700)
    env = {**os.environ, "GNUPGHOME": str(home)}
    run("gpg", "--batch", "--import", str(Path(__file__).resolve().parents[1] / "keys/rhine-release.asc"), env=env)
    sig = subprocess.run(["git", "-c", "gpg.program=gpg", "verify-tag", "--raw", ref], capture_output=True, text=True, env=env, timeout=30)
    fingerprints = [row.split()[2] for row in sig.stderr.splitlines() if row.startswith("[GNUPG:] VALIDSIG ")]
    require(sig.returncode == 0 and fingerprints == [SIGNER], "Release tag is not signed by the pinned key.")
    commit = run("git", "rev-parse", ref + "^{commit}").strip()
    run("git", "merge-base", "--is-ancestor", commit, "HEAD")
    return json.loads(run("git", "show", f"{commit}:package.json"))


def release_assets(release, tag, version, expected):
    require(release["tagName"] == tag and release["isDraft"] is False and release["isPrerelease"] is False and release["publishedAt"], "Expected the public, stable GitHub Release for the signed tag.")
    stem = f"linhey-rhine-design-{version}"
    files = []
    for name, limit in ((stem + ".tgz", MAX_ASSET), (stem + ".sha256", 1024)):
        matches = [a for a in release["assets"] if a["name"] == name]
        require(len(matches) == 1, f"Expected exactly one Release asset named {name}.")
        asset = matches[0]
        require(asset["state"] == "uploaded" and 0 < asset["size"] <= limit, f"Invalid Release asset: {name}.")
        require(re.fullmatch("sha256:[0-9a-f]{64}", asset.get("digest") or ""), f"GitHub did not provide a SHA-256 for {name}.")
        files.append(asset)
    require(files[0]["digest"] == "sha256:" + expected, "GitHub tarball digest does not match the dispatch SHA-256.")
    return files


def package_metadata(tarball):
    metadata = None
    total = 0
    count = 0
    seen = set()
    with tarfile.open(tarball, "r:gz") as archive:
        for entry in archive:
            count += 1
            total += entry.size
            require(count <= 4000 and total <= 128 * 1024 * 1024, "Package exceeds archive limits.")
            path = PurePosixPath(entry.name)
            parts = path.parts
            require(parts and parts[0] == "package" and ".." not in parts and chr(92) not in entry.name and path.as_posix() == entry.name and (entry.isfile() or entry.isdir()), "Expected canonical package archive paths.")
            require(path not in seen, "Duplicate archive destination.")
            seen.add(path)
            if entry.name == "package/package.json":
                require(metadata is None and entry.isfile() and entry.size <= 120_000, "Invalid package.json archive member.")
                with archive.extractfile(entry) as source:
                    metadata = json.load(source)
    require(isinstance(metadata, dict), "Missing package manifest.")
    return metadata


def check_package(actual, tagged, version):
    for manifest in (actual, tagged):
        require(manifest.get("name") == PACKAGE and manifest.get("version") == version and not manifest.get("private"), "Tagged and packed manifests must identify this public package and version.")
        require(manifest.get("repository", {}).get("url") == f"git+https://github.com/{REPO}.git", "Unexpected package source repository.")
        require(manifest.get("publishConfig") == {"access": "public", "registry": REGISTRY + "/"}, "Unexpected npm publish configuration.")
    require(actual == tagged, "Packed manifest differs from the manifest at the signed tag.")


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise ValueError("Unexpected registry redirect.")


def registry_get(path, limit, missing_ok=False):
    request = Request(REGISTRY + path, headers={"Cache-Control": "no-cache", "User-Agent": "Rhine-verified-release/1"})
    try:
        with build_opener(NoRedirect()).open(request, timeout=20) as response:
            require(response.status == 200, "Unexpected registry response.")
            data = response.read(limit + 1)
    except HTTPError as error:
        error.close()
        if missing_ok and error.code == 404:
            return None
        raise
    require(len(data) <= limit, "Registry response exceeded size limit.")
    return data


def registry_state(version, expected, *, accepted_integrity=None):
    payload = registry_get(f"/{ENCODED_PACKAGE}/{version}", 512_000, missing_ok=True)
    if payload is None:
        return "missing"
    info = json.loads(payload)
    require(info.get("name") == PACKAGE and info.get("version") == version, "Unexpected registry package identity.")
    path = f"/{PACKAGE}/-/rhine-design-{version}.tgz"
    require(info["dist"]["tarball"] == REGISTRY + path, "Unexpected registry tarball URL.")
    if accepted_integrity is not None:
        require(info["dist"]["integrity"] == accepted_integrity, "Public npm metadata reports a different package integrity.")
    # Only after npm confirms a write can a visible manifest with a missing
    # tarball be treated as propagation. Preflight still fails closed.
    data = registry_get(path, MAX_ASSET, missing_ok=accepted_integrity is not None)
    if data is None:
        return "pending_tarball"
    sri = "sha512-" + base64.b64encode(hashlib.sha512(data).digest()).decode("ascii")
    require(hashlib.sha256(data).hexdigest() == expected and info["dist"]["integrity"] == sri, "Existing npm version has different bytes; refusing to overwrite or retag.")
    return "identical"


def latest():
    return json.loads(registry_get(f"/-/package/{ENCODED_PACKAGE}/dist-tags", 64_000))["latest"]


def prepare(tag, version, expected, scratch):
    tagged = verify_tag(tag, scratch)
    release = json.loads(run("gh", "release", "view", tag, "-R", REPO, "--json", "tagName,isDraft,isPrerelease,publishedAt,assets"))
    assets = release_assets(release, tag, version, expected)
    for asset in assets:
        run("gh", "release", "download", tag, "-R", REPO, "--pattern", asset["name"], "--dir", str(scratch))
        data = (scratch / asset["name"]).read_bytes()
        require(len(data) == asset["size"] and "sha256:" + hashlib.sha256(data).hexdigest() == asset["digest"], "Downloaded asset does not match GitHub Release metadata.")
    tarball, checksum = (scratch / asset["name"] for asset in assets)
    require(checksum.read_text(encoding="ascii").split() == [expected, tarball.name], "Invalid GitHub Release checksum file.")
    check_package(package_metadata(tarball), tagged, version)
    return tarball


def confirm_publication(version, expected, integrity):
    """After acknowledgement, only retry anonymous reads. Mismatches still fail."""
    deadline = time.monotonic() + 180
    reason = "exact version metadata is not visible yet"
    for attempt in range(13):
        if attempt and time.monotonic() >= deadline:
            break
        try:
            state = registry_state(version, expected, accepted_integrity=integrity)
            if state == "identical":
                current = latest()
                if current == version:
                    return "published_and_read_back"
                require(version_tuple(current) < version_tuple(version), "The published artifact matches but latest is already on a newer version; refusing to retag.")
                reason = "latest still shows an older version"
            elif state == "pending_tarball":
                reason = "version metadata is visible but the tarball is not yet available"
            elif state == "missing":
                reason = "exact version metadata is not visible yet"
            else:
                raise ValueError("Unexpected registry visibility state.")
        except HTTPError as error:
            if error.code != 429 and not 500 <= error.code < 600:
                raise
            reason = f"public registry returned HTTP {error.code}"
        except (URLError, TimeoutError, ConnectionError, socket.gaierror) as error:
            cause = error.reason if isinstance(error, URLError) else error
            if isinstance(cause, socket.gaierror) and cause.errno == socket.EAI_AGAIN:
                reason = "public registry DNS lookup failed temporarily"
            elif isinstance(cause, (TimeoutError, ConnectionError)):
                reason = "public registry connection timed out or was interrupted"
            else:
                raise
        remaining = deadline - time.monotonic()
        if attempt < 12 and remaining > 0:
            time.sleep(min(15, remaining))
    print(f"::warning title=npm accepted; registry readback pending::{PACKAGE}@{version}: {reason}. Do not republish. Use publish=false to verify artifact identity and check latest separately with npm view {PACKAGE} dist-tags --prefer-online.", flush=True)
    return "npm_accepted_registry_pending"


def publish(tarball, version, expected):
    require(os.environ.get("GITHUB_ACTIONS") == "true" and os.environ.get("GITHUB_REPOSITORY") == REPO and os.environ.get("GITHUB_REF") == "refs/heads/main" and os.environ.get("ACTIONS_ID_TOKEN_REQUEST_URL"), "Publish is only available to the GitHub main OIDC job.")
    require(version_tuple(version) > version_tuple(latest()), "Refusing to move latest to an older or equal version.")
    npm_version = run("npm", "--version").strip()
    require(version_tuple(npm_version) >= (11, 5, 1), "Trusted publishing needs npm 11.5.1 or newer.")
    env = {key: value for key, value in os.environ.items() if key not in {"NODE_AUTH_TOKEN", "NPM_TOKEN", "NPM_AUTH_TOKEN", "GH_TOKEN", "GITHUB_TOKEN"} and not key.lower().startswith("npm_config_")}
    user = tarball.parent / "npmrc-user"
    system = tarball.parent / "npmrc-global"
    user.touch(exist_ok=False)
    system.touch(exist_ok=False)
    integrity = "sha512-" + base64.b64encode(hashlib.sha512(tarball.read_bytes()).digest()).decode("ascii")
    # Do not invoke scripts in the downloaded package or retry a publish request.
    subprocess.run(["npm", "publish", str(tarball), "--access=public", "--tag=latest", f"--registry={REGISTRY}/", "--ignore-scripts", f"--userconfig={user}", f"--globalconfig={system}", "--fetch-retries=0"], env=env, cwd=tarball.parent, check=True, timeout=120)
    print(f"npm accepted {PACKAGE}@{version}; checking public registry without any further writes.", flush=True)
    return confirm_publication(version, expected, integrity)


def main():
    require(sys.argv[1:] in (["verify"], ["publish"]), "Use verify or publish.")
    mode = sys.argv[1]
    tag = os.environ.get("RELEASE_TAG", "")
    version, expected = inputs(tag, os.environ.get("RELEASE_SHA256", ""))
    with tempfile.TemporaryDirectory(prefix="rhine-release-") as work:
        tarball = prepare(tag, version, expected, Path(work))
        state = registry_state(version, expected)
        if state == "identical":
            result = "already_exists_identical_no_write"
        elif mode == "verify":
            require(version_tuple(version) > version_tuple(latest()), "Refusing to promote an older or equal version to latest.")
            result = "verified_no_write"
        else:
            result = publish(tarball, version, expected)
        print(json.dumps({"package": PACKAGE, "version": version, "sha256": expected, "result": result}))


if __name__ == "__main__":
    try:
        main()
    except (KeyError, ValueError, OSError, subprocess.SubprocessError, tarfile.TarError) as error:
        sys.exit(str(error))
