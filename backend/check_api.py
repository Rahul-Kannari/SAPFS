import urllib.request, json

base = 'http://127.0.0.1:8000'
data = json.dumps({'email': 'admin@sapfs.edu', 'password': 'Admin@123'}).encode()
req = urllib.request.Request(base + '/api/v1/auth/login', data=data,
                             headers={'Content-Type': 'application/json'}, method='POST')
resp = json.loads(urllib.request.urlopen(req).read())
token = resp['access_token']
headers = {'Authorization': f'Bearer {token}'}

tests = [
    ('/api/v1/dashboard/stats',            'Dashboard Stats'),
    ('/api/v1/dashboard/performance-trends','Performance Trends'),
    ('/api/v1/students/?limit=3',          'Students List'),
    ('/api/v1/faculty',                    'Faculty List'),
    ('/api/v1/courses',                    'Courses List'),
    ('/api/v1/assignments',                'Assignments'),
    ('/api/v1/predictions/history',        'Predictions History'),
    ('/api/v2/agents/health',              'Agents v2 Health'),
]

print(f'Logged in as admin. Testing {len(tests)} endpoints...\n')
all_ok = True
for ep, name in tests:
    try:
        r = urllib.request.urlopen(
            urllib.request.Request(base + ep, headers=headers), timeout=5)
        body = json.loads(r.read())
        snippet = str(body)[:70]
        print(f'  [OK]   {name:30s} {r.status} -- {snippet}')
    except urllib.error.HTTPError as e:
        body = e.read().decode()[:80]
        print(f'  [FAIL] {name:30s} {e.code} -- {body}')
        all_ok = False
    except Exception as e:
        print(f'  [ERR]  {name:30s} ERR -- {e}')
        all_ok = False

print('\n' + ('All endpoints OK!' if all_ok else 'Some endpoints need fixing.'))
