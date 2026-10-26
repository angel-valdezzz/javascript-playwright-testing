"""Start the official ParaBank image on this CI runner, never configure a public host."""
import http.cookiejar
import json
import os
from pathlib import Path
import subprocess
import time
import urllib.parse
import urllib.request

IMAGE = 'parasoft/parabank:baseline'
BASE = 'http://127.0.0.1:8080/parabank'


def main():
    subprocess.run(['docker', 'pull', IMAGE], check=True)
    inspected = subprocess.check_output(['docker', 'image', 'inspect', IMAGE], text=True)
    digest = json.loads(inspected)[0]['RepoDigests']
    Path('reports').mkdir(exist_ok=True)
    Path('reports/parabank-image.json').write_text(json.dumps(digest, indent=2), encoding='utf-8')
    print('Official ParaBank image:', ', '.join(digest), flush=True)
    subprocess.run(['docker', 'run', '--detach', '--name', 'parabank-under-test',
                    '--publish', '127.0.0.1:8080:8080', IMAGE], check=True)
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
    deadline = time.monotonic() + 180
    while True:
        try:
            with opener.open(BASE + '/admin.htm', timeout=5) as response:
                html = response.read().decode()
            if 'accessMode' in html:
                break
        except (OSError, TimeoutError):
            pass
        if time.monotonic() >= deadline:
            raise RuntimeError('Official ParaBank did not become ready within 180 seconds')
        time.sleep(2)
    # GET above loads the official form into this session; bind only these fields.
    # This address is fixed to loopback and cannot target the public demo instance.
    data = urllib.parse.urlencode({'accessMode': 'jdbc', 'initialBalance': '1000',
                                   'minimumBalance': '100'}).encode()
    with opener.open(BASE + '/admin.htm', data=data, timeout=10) as response:
        html = response.read().decode()
    if 'Settings saved successfully.' not in html:
        raise RuntimeError('Could not configure isolated ParaBank for JDBC')
    with open(os.environ['GITHUB_ENV'], 'a', encoding='utf-8') as env:
        env.write('PARABANK_URL=' + BASE + '\n')
    print('Isolated ParaBank ready with JDBC and fictional customer balances.', flush=True)


if __name__ == '__main__':
    main()
