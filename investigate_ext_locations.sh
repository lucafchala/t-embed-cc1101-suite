#!/usr/bin/env bash
# investigate_ext_locations.sh
# Follow-up to investigate_ext_stringln.sh: for every one of the original
# 275 EXTENSION-quarantine files that still exists by content, find its
# CURRENT path and check whether it landed under a configuration_needed/
# folder (as it should, since it still literally contains "EXTENSION") or
# somewhere else (a real classification bug).
set -uo pipefail
cd ~/t-embed-cc1101-suite || { echo "repo not found at ~/t-embed-cc1101-suite"; exit 1; }

OUT=~/investigate_ext_locations_report.txt
: > "$OUT"
log() { printf '%s\n' "$@" | tee -a "$OUT"; }

git log --all --diff-filter=A --name-only --pretty=format:'C:%H' \
  -- ':(glob)**/depende_de_extension/**' 2>/dev/null \
  | awk '/^C:/{c=$0; sub("C:","",c); next} NF{print c"\t"$0}' \
  | sort -u -t$'\t' -k2,2 > /tmp/ext_added.tsv

git ls-tree -r HEAD | awk '{print $3"\t"$4}' > /tmp/head_blobs_full.tsv

python3 - <<'PYEOF' | tee -a "$OUT"
import subprocess, hashlib

def sh(cmd):
    return subprocess.run(cmd, shell=True, capture_output=True, text=True).stdout

head_blob_paths = {}
with open('/tmp/head_blobs_full.tsv') as f:
    for line in f:
        parts = line.rstrip('\n').split('\t', 1)
        if len(parts) == 2:
            head_blob_paths.setdefault(parts[0], []).append(parts[1])

pairs = []
with open('/tmp/ext_added.tsv') as f:
    for line in f:
        line = line.rstrip('\n')
        if not line:
            continue
        commit, path = line.split('\t', 1)
        pairs.append((commit, path))

under_config_needed = []
elsewhere = []
truly_missing = []

for commit, path in pairs:
    blobsha = sh(f"git rev-parse {commit}:{subprocess.list2cmdline([path])}").strip()
    if not blobsha or 'fatal' in blobsha.lower():
        truly_missing.append((path, "no-blob"))
        continue
    current_paths = head_blob_paths.get(blobsha)
    if not current_paths:
        truly_missing.append((path, "content-not-in-HEAD"))
        continue
    hits_cn = [p for p in current_paths if 'configuration_needed' in p]
    if hits_cn:
        under_config_needed.append((path, hits_cn))
    else:
        elsewhere.append((path, current_paths))

print(f"\nTotal original EXTENSION files: {len(pairs)}")
print(f"Now under a configuration_needed/ folder somewhere: {len(under_config_needed)}")
print(f"Content survives but current path is NOT under configuration_needed/: {len(elsewhere)}")
print(f"Truly missing (no matching content anywhere in HEAD): {len(truly_missing)}")

if elsewhere:
    print("\n--- Files whose EXTENSION-dependent content is now classified OUTSIDE configuration_needed/ ---")
    for orig, cur in elsewhere:
        print(f"  ORIGINAL: {orig}")
        for c in cur:
            print(f"    NOW AT:  {c}")

if truly_missing:
    print("\n--- Truly missing ---")
    for p, reason in truly_missing:
        print(f"  {p}  [{reason}]")
PYEOF

log ""
log "=== Fresh direct scan: current files under any configuration_needed/ folder, by literal content ==="
python3 - <<'PYEOF' | tee -a "$OUT"
import os

root = "sd_card_content/badusb_extra_payloads"
ext_count = 0
stringln_only_count = 0
ext_paths = []
stringln_paths = []
for dirpath, dirnames, filenames in os.walk(root):
    if os.path.basename(dirpath) != "configuration_needed":
        continue
    for fn in filenames:
        full = os.path.join(dirpath, fn)
        try:
            with open(full, 'rb') as f:
                data = f.read()
        except OSError:
            continue
        has_ext = b"EXTENSION" in data
        has_stringln = b"STRINGLN" in data
        if has_ext:
            ext_count += 1
            ext_paths.append(full)
        elif has_stringln:
            stringln_only_count += 1
            stringln_paths.append(full)

print(f"Files under configuration_needed/ containing EXTENSION: {ext_count}")
print(f"Files under configuration_needed/ containing STRINGLN (no EXTENSION): {stringln_only_count}")
PYEOF

log ""
log "Full report written to: $OUT"
log "Please paste the contents of $OUT back."
