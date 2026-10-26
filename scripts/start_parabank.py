"""Start the official ParaBank image on this CI runner, never configure a public host."""
import http.cookiejar
import json
import os
from pathlib import Path
import subprocess
import time
import urllib.parse
import urllib.request

IMAGE = 'parasoft/parabank@sha256:4a122c72f653edb979b1b84d98c5c7e938b43f22f9e46d8e041de759390982a4'
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
    deadline = time.monotonic() + 90
    last_error = 'admin form not found'
    initialized = False
    while True:
        try:
            if not initialized:
                request = urllib.request.Request(BASE + '/services/bank/initializeDB', data=b'', method='POST')
                with opener.open(request, timeout=10) as response:
                    response.read()
                initialized = True
            with opener.open(BASE + '/admin.htm', timeout=5) as response:
                html = response.read().decode()
            if 'accessMode' in html:
                break
        except (OSError, TimeoutError) as error:
            last_error = str(error)
        if time.monotonic() >= deadline:
            subprocess.run(['docker', 'logs', '--tail', '100', 'parabank-under-test'], check=False)
            subprocess.run(['docker', 'inspect', '--format', '{{json .State}}', 'parabank-under-test'], check=False)
            raise RuntimeError('Official ParaBank did not become ready: ' + last_error)
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
