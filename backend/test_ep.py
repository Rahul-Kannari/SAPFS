import urllib.request, json

base = 'http://127.0.0.1:8000'
data = json.dumps({'email': 'admin@sapfs.edu', 'password': 'Admin@123'}).encode()
req = urllib.request.Request(base + '/api/v1/auth/login', data=data,
                             headers={'Content-Type': 'application/json'}, method='POST')
token = json.loads(urllib.request.urlopen(req).read())['access_token']
headers = {'Authorization': f'Bearer {token}'}

try:
    r = urllib.request.urlopen(urllib.request.Request(base + '/api/v1/dashboard/stats', headers=headers))
    print(r.read().decode())
except urllib.error.HTTPError as e:
    print(f'STATUS: {e.code}')
    print(f'BODY: {e.read().decode()}')
