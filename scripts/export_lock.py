"""Export public dependency resolution for committing the exact CI lockfile."""
import base64
import gzip
import hashlib
from pathlib import Path
lock = Path('package-lock.json')
if lock.exists():
    data = lock.read_bytes()
    encoded = base64.b64encode(gzip.compress(data, mtime=0)).decode('ascii')
    print('AUTOMATION_LOCK_SHA256=' + hashlib.sha256(data).hexdigest())
    for offset in range(0, len(encoded), 4096):
        print('AUTOMATION_LOCK_CHUNK=' + encoded[offset:offset+4096])
