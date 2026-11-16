import asyncio, httpx, sys
BASE = 'http://localhost:8000'
async def run_tests():
    results = []
    token = ''
    student_id = None
    async with httpx.AsyncClient(timeout=30) as c:
        try:
            r = await c.get(BASE + '/health')
            results.append(('Backend Health', r.status_code, str(r.json())[:80]))
        except Exception as e:
            results.append(('Backend Health', 'ERR', str(e)[:80]))
        try:
            r = await c.post(BASE + '/api/v1/auth/login', json={'email':'admin@sapfs.edu','password':'Admin@123'})
            token = r.json().get('access_token','') if r.status_code==200 else ''
            results.append(('Login Admin', r.status_code, 'token_ok' if token else r.text[:80]))
        except Exception as e:
            results.append(('Login Admin', 'ERR', str(e)[:80]))
        hdrs = {'Authorization': 'Bearer ' + token}
        GETS = [
            ('Auth /me', '/api/v1/auth/me'),
            ('Students List', '/api/v1/students?page_size=3'),
            ('Dashboard Stats', '/api/v1/dashboard/stats'),
            ('Perf Trends', '/api/v1/dashboard/performance-trends'),
            ('Faculty List', '/api/v1/faculty'),
            ('Courses List', '/api/v1/courses'),
            ('Pred History', '/api/v1/predictions/history?limit=3'),
            ('Risk Report', '/api/v1/predictions/risk-report'),
            ('Agents Health v1', '/api/v1/agents/health'),
            ('Agents Health v2', '/api/v2/agents/health'),
            ('Model Evaluation', '/api/v1/agents/evaluation'),
            ('Risk Dashboard', '/api/v1/agents/risk-dashboard'),
            ('Academic Records', '/api/v1/academic-records'),
            ('Reports Summary', '/api/v1/reports/summary'),
        ]
        for label, url in GETS:
            try:
                r = await c.get(BASE + url, headers=hdrs)
                detail = str(r.json())[:80] if r.status_code==200 else r.text[:80]
                if label=='Students List' and r.status_code==200:
                    items = r.json().get('items',[])
                    student_id = items[0]['id'] if items else None
                    detail = 'total=' + str(r.json().get('total'))
                results.append((label, r.status_code, detail))
            except Exception as e:
                results.append((label, 'ERR', str(e)[:80]))
        if student_id:
            POSTS = [
                ('Predict-v2', '/api/v1/agents/predict-v2', {'student_id':student_id,'use_ensemble':True}),
                ('Advisor Chat', '/api/v1/agents/advisor/chat', {'student_id':student_id,'query':'How can I improve my GPA?'}),
                ('Simulate', '/api/v1/predictions/simulate', {'current_gpa':7.2,'target_attendance':88.0,'target_assignment_rate':0.92,'target_backlogs':0}),
            ]
            for label, url, body in POSTS:
                try:
                    r = await c.post(BASE + url, json=body, headers=hdrs, timeout=60)
                    results.append((label, r.status_code, str(r.json())[:80] if r.status_code==200 else r.text[:80]))
                except Exception as e:
                    results.append((label, 'ERR', str(e)[:80]))
        try:
            r2 = await c.get('http://localhost:3000/', timeout=5)
            results.append(('Frontend 3000', r2.status_code, 'React app up'))
        except Exception as e:
            results.append(('Frontend 3000', 'ERR', str(e)[:60]))
    return results
results = asyncio.run(run_tests())
passed = sum(1 for _,s,_ in results if s==200)
failed = len(results)-passed
print('=' * 72)
print('TEST                           STATUS   DETAIL')
print('-' * 72)
for n,s,d in results:
    icon = 'PASS' if s==200 else 'FAIL'
    print('[' + icon + '] ' + n.ljust(30) + str(s).ljust(8) + str(d)[:55])
print('=' * 72)
print('PASSED: ' + str(passed) + '/' + str(len(results)) + '   FAILED: ' + str(failed) + '/' + str(len(results)))
sys.exit(0 if failed==0 else 1)
