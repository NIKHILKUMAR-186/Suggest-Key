import subprocess, sys
result = subprocess.run(["git", "cat-file", "--batch-all-objects", "--batch-check"], capture_output=True, text=True, errors="replace")
hashes = [line.split()[0] for line in result.stdout.strip().split("\n") if line]
print(f"Total objects: {len(hashes)}")
secret_found = False
for h in hashes:
    r = subprocess.run(["git", "cat-file", "-p", h], capture_output=True, errors="replace")
    try:
        content = r.stdout.decode("utf-8", errors="replace")
    except:
        content = str(r.stdout)
    if "sb_secret_olDu" in content:
        print(f"SECRET FOUND IN: {h}")
        secret_found = True
if not secret_found:
    print("CLEAN: No secret found in any git object")
