#!/usr/bin/env bash
# investigate_ext_stringln.sh
# Reconcile the current EXTENSION/STRINGLN counts under
# sd_card_content/badusb_extra_payloads/**/configuration_needed/ against
# the original figures in issues #2 and #3, using git content history
# (blob hashes), not just path-string matching -- so a file that only
# MOVED (never changed content) is correctly counted as "still present".
set -uo pipefail
cd ~/t-embed-cc1101-suite || { echo "repo not found at ~/t-embed-cc1101-suite"; exit 1; }

OUT=~/investigate_report.txt
: > "$OUT"
log() { printf '%s\n' "$@" | tee -a "$OUT"; }

log "=== Issue #3 (EXTENSION) -- body + comments ==="
gh issue view 3 --json body -q '.body' >> "$OUT" 2>&1
gh issue view 3 --json comments -q '.comments[].body' >> "$OUT" 2>&1
log ""
log "=== Issue #2 (STRINGLN) -- body + comments ==="
gh issue view 2 --json body -q '.body' >> "$OUT" 2>&1
gh issue view 2 --json comments -q '.comments[].body' >> "$OUT" 2>&1
log ""

# --- collect (commit, path) pairs for every file ever ADDED under each
# original quarantine subfolder, anywhere in history ---
git log --all --diff-filter=A --name-only --pretty=format:'C:%H' \
  -- ':(glob)**/depende_de_extension/**' 2>/dev/null \
  | awk '/^C:/{c=$0; sub("C:","",c); next} NF{print c"\t"$0}' \
  | sort -u -t$'\t' -k2,2 > /tmp/ext_added.tsv

git log --all --diff-filter=A --name-only --pretty=format:'C:%H' \
  -- ':(glob)**/sintaxe_extra_nao_suportada/**' 2>/dev/null \
  | awk '/^C:/{c=$0; sub("C:","",c); next} NF{print c"\t"$0}' \
  | sort -u -t$'\t' -k2,2 > /tmp/stringln_added.tsv

log "=== Raw counts of files ever added under the ORIGINAL quarantine dirs ==="
log "depende_de_extension (issue #3 says ~275): $(wc -l < /tmp/ext_added.tsv)"
log "sintaxe_extra_nao_suportada (issue #2 says ~25): $(wc -l < /tmp/stringln_added.tsv)"
log ""

git ls-tree -r HEAD | awk '{print $3"\t"$4}' > /tmp/head_blobs.tsv

python3 - <<'PYEOF' | tee -a "$OUT"
import subprocess, hashlib, csv, os

def sh(cmd):
    return subprocess.run(cmd, shell=True, capture_output=True, text=True).stdout

head_blobs = set()
with open('/tmp/head_blobs.tsv') as f:
    for line in f:
        parts = line.rstrip('\n').split('\t', 1)
        if len(parts) == 2:
            head_blobs.add(parts[0])

dedup_sha256 = {}
if os.path.exists('dedup_removed_badusb.csv'):
    with open('dedup_removed_badusb.csv', newline='', encoding='utf-8') as f:
        for row in csv.DictReader(f):
            dedup_sha256.setdefault(row['sha256'], []).append((row['removed_path'], row['kept_path']))

def analyze(tsv_path, label, expected):
    print(f"\n=== {label} (expected ~{expected}) ===")
    pairs = []
    with open(tsv_path) as f:
        for line in f:
            line = line.rstrip('\n')
            if not line:
                continue
            commit, path = line.split('\t', 1)
            pairs.append((commit, path))

    still_present = 0
    dedup_matched = 0
    missing = 0
    missing_examples = []
    for commit, path in pairs:
        blobsha = sh(f"git rev-parse {commit}:{subprocess.list2cmdline([path])}").strip()
        if not blobsha or 'fatal' in blobsha.lower():
            missing += 1
            missing_examples.append((path, "could-not-resolve-blob-at-add-commit"))
            continue
        if blobsha in head_blobs:
            still_present += 1
            continue
        content = subprocess.run(f"git cat-file -p {blobsha}", shell=True, capture_output=True).stdout
        h = hashlib.sha256(content).hexdigest()
        if h in dedup_sha256:
            dedup_matched += 1
        else:
            missing += 1
            if len(missing_examples) < 20:
                missing_examples.append((path, f"sha256={h[:12]}... not in HEAD, not in dedup log"))

    print(f"total original files added under this dir (all of history): {len(pairs)}")
    print(f"still present today, by CONTENT (possibly at a new path): {still_present}")
    print(f"accounted for as removed by dedup_badusb.py (logged): {dedup_matched}")
    print(f"UNACCOUNTED FOR (neither present nor in dedup log -- needs explanation): {missing}")
    if missing_examples:
        print("examples of unaccounted-for original paths:")
        for p, reason in missing_examples:
            print(f"  {p}\n      [{reason}]")

analyze('/tmp/ext_added.tsv', 'EXTENSION quarantine (issue #3)', 275)
analyze('/tmp/stringln_added.tsv', 'STRINGLN quarantine (issue #2)', 25)
PYEOF

log ""
log "=== Spot check: current files matching bare 'STRINGLN' substring that DO NOT carry _precisa_edicao_manual in their path ==="
log "(these are candidates for false positives in the earlier verify_configuration_needed_v1.sh substring scan)"
find sd_card_content/badusb_extra_payloads -type d -name 'configuration_needed' 2>/dev/null | while read -r d; do
  find "$d" -type f 2>/dev/null | while read -r f; do
    case "$f" in
      *_precisa_edicao_manual*) continue ;;
    esac
    if grep -ql "STRINGLN" "$f" 2>/dev/null; then
      {
        echo "--- $f ---"
        grep -n -C1 "STRINGLN" "$f" | head -6
        echo
      } >> "$OUT"
    fi
  done
done

log ""
log "Full report written to: $OUT"
log "Please paste the contents of $OUT back."
