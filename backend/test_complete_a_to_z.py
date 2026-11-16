import asyncio
import httpx
import sys
import psycopg2
import os

DB_NAME = os.getenv('DB_NAME', 'sapfs_db')
DB_USER = os.getenv('DB_USER', 'postgres')
DB_PASS = os.getenv('DB_PASS', 'Rahul@8296')
DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_PORT = os.getenv('DB_PORT', '5432')
BASE_URL = 'http://localhost:8000'
FRONTEND_URL = 'http://localhost:3000'

results = []

def record(category, test_name, status, detail):
    results.append({
        'category': category,
        'test_name': test_name,
        'status': status,
        'detail': str(detail)
    })

# 1. Database Verification
def verify_database():
    print("Checking Database Integrity...")
    try:
        conn = psycopg2.connect(dbname=DB_NAME, user=DB_USER, password=DB_PASS, host=DB_HOST, port=DB_PORT)
        cur = conn.cursor()
        
        # Check connection
        cur.execute("SELECT version();")
        v = cur.fetchone()[0]
        record("Database", "PostgreSQL Connection", "PASS", v.split(',')[0])
        
        # Check students count
        cur.execute("SELECT COUNT(*) FROM students;")
        student_count = cur.fetchone()[0]
        record("Database", "Students Table", "PASS" if student_count >= 2000 else "FAIL", f"{student_count} records")
        
        # Check departments
        cur.execute("SELECT COUNT(*) FROM departments;")
        dept_count = cur.fetchone()[0]
        record("Database", "Departments Table", "PASS" if dept_count >= 7 else "FAIL", f"{dept_count} departments")
        
        # Check timeseries
        cur.execute("SELECT COUNT(*) FROM student_performance_timeseries;")
        ts_count = cur.fetchone()[0]
        record("Database", "Timeseries Table", "PASS" if ts_count >= 2000 else "FAIL", f"{ts_count} records")
        
        # Check users count
        cur.execute("SELECT COUNT(*) FROM users;")
        user_count = cur.fetchone()[0]
        record("Database", "Users Table", "PASS" if user_count >= 2000 else "FAIL", f"{user_count} users")

        # Check GPA ranges in DB
        cur.execute("SELECT MIN(cgpa), MAX(cgpa), AVG(cgpa) FROM students;")
        min_gpa, max_gpa, avg_gpa = cur.fetchone()
        record("Database", "CGPA Data Integrity", "PASS" if min_gpa is not None and 0 <= min_gpa <= max_gpa <= 10 else "FAIL", f"Min:{min_gpa:.2f}, Max:{max_gpa:.2f}, Avg:{avg_gpa:.2f}")

        conn.close()
    except Exception as e:
        record("Database", "PostgreSQL Connection", "FAIL", str(e))

# 2. End-to-End API and Multi-Agent Verification
async def verify_apis():
    print("Checking Backend APIs and ML Multi-Agents...")
    async with httpx.AsyncClient(timeout=45.0) as client:
        # Backend Health
        try:
            r = await client.get(f"{BASE_URL}/health")
            record("API Health", "GET /health", "PASS" if r.status_code == 200 else "FAIL", f"{r.status_code}: {r.json()}")
        except Exception as e:
            record("API Health", "GET /health", "FAIL", str(e))

        # Security: Invalid Login
        try:
            r = await client.post(f"{BASE_URL}/api/v1/auth/login", json={"email": "fake@test.edu", "password": "WrongPassword"})
            record("Security", "POST /api/v1/auth/login (Invalid)", "PASS" if r.status_code in [400, 401] else "FAIL", f"Status {r.status_code} properly rejected")
        except Exception as e:
            record("Security", "POST /api/v1/auth/login (Invalid)", "FAIL", str(e))

        # Security: Protected route without token
        try:
            r = await client.get(f"{BASE_URL}/api/v1/auth/me")
            record("Security", "GET /api/v1/auth/me (No Token)", "PASS" if r.status_code in [401, 403] else "FAIL", f"Status {r.status_code} properly rejected")
        except Exception as e:
            record("Security", "GET /api/v1/auth/me (No Token)", "FAIL", str(e))

        # Security: Valid Login
        token = ""
        try:
            r = await client.post(f"{BASE_URL}/api/v1/auth/login", json={"email": "admin@sapfs.edu", "password": "Admin@123"})
            if r.status_code == 200:
                token = r.json().get("access_token")
                record("Authentication", "POST /api/v1/auth/login (Admin)", "PASS", "JWT issued successfully")
            else:
                record("Authentication", "POST /api/v1/auth/login (Admin)", "FAIL", f"{r.status_code}: {r.text}")
        except Exception as e:
            record("Authentication", "POST /api/v1/auth/login (Admin)", "FAIL", str(e))

        headers = {"Authorization": f"Bearer {token}"}

        # Auth Me
        try:
            r = await client.get(f"{BASE_URL}/api/v1/auth/me", headers=headers)
            user_data = r.json() if r.status_code == 200 else {}
            record("Authentication", "GET /api/v1/auth/me", "PASS" if r.status_code == 200 else "FAIL", f"Role: {user_data.get('role')}, Email: {user_data.get('email')}")
        except Exception as e:
            record("Authentication", "GET /api/v1/auth/me", "FAIL", str(e))

        # Students List & Retrieve Student ID
        student_id = None
        try:
            r = await client.get(f"{BASE_URL}/api/v1/students?page=1&page_size=10", headers=headers)
            if r.status_code == 200:
                data = r.json()
                total = data.get("total", 0)
                items = data.get("items", [])
                if items:
                    student_id = items[0]["id"]
                record("Students", "GET /api/v1/students (Pagination)", "PASS", f"Total: {total}, Retrieved: {len(items)}")
            else:
                record("Students", "GET /api/v1/students", "FAIL", f"{r.status_code}: {r.text}")
        except Exception as e:
            record("Students", "GET /api/v1/students", "FAIL", str(e))

        # Single Student
        if student_id:
            try:
                r = await client.get(f"{BASE_URL}/api/v1/students/{student_id}", headers=headers)
                s = r.json() if r.status_code == 200 else {}
                record("Students", "GET /api/v1/students/{id}", "PASS" if r.status_code == 200 else "FAIL", f"Name: {s.get('first_name')} {s.get('last_name')}, CGPA: {s.get('cgpa')}")
            except Exception as e:
                record("Students", "GET /api/v1/students/{id}", "FAIL", str(e))

        # Dashboard Stats
        try:
            r = await client.get(f"{BASE_URL}/api/v1/dashboard/stats", headers=headers)
            data = r.json() if r.status_code == 200 else {}
            record("Dashboard", "GET /api/v1/dashboard/stats", "PASS" if r.status_code == 200 else "FAIL", f"Students: {data.get('total_students')}, Pass Rate: {data.get('pass_rate')}%")
        except Exception as e:
            record("Dashboard", "GET /api/v1/dashboard/stats", "FAIL", str(e))

        # Performance Trends
        try:
            r = await client.get(f"{BASE_URL}/api/v1/dashboard/performance-trends", headers=headers)
            trends = r.json() if r.status_code == 200 else []
            record("Dashboard", "GET /api/v1/dashboard/performance-trends", "PASS" if r.status_code == 200 and len(trends) > 0 else "FAIL", f"{len(trends)} semester data points")
        except Exception as e:
            record("Dashboard", "GET /api/v1/dashboard/performance-trends", "FAIL", str(e))

        # Risk Heatmap
        try:
            r = await client.get(f"{BASE_URL}/api/v1/dashboard/risk-heatmap", headers=headers)
            record("Dashboard", "GET /api/v1/dashboard/risk-heatmap", "PASS" if r.status_code == 200 else "FAIL", f"Status {r.status_code}")
        except Exception as e:
            record("Dashboard", "GET /api/v1/dashboard/risk-heatmap", "FAIL", str(e))

        # Attendance Analytics
        try:
            r = await client.get(f"{BASE_URL}/api/v1/dashboard/attendance-analytics", headers=headers)
            record("Dashboard", "GET /api/v1/dashboard/attendance-analytics", "PASS" if r.status_code == 200 else "FAIL", f"Status {r.status_code}")
        except Exception as e:
            record("Dashboard", "GET /api/v1/dashboard/attendance-analytics", "FAIL", str(e))

        # Reports Summary
        try:
            r = await client.get(f"{BASE_URL}/api/v1/reports/summary", headers=headers)
            record("Reports", "GET /api/v1/reports/summary", "PASS" if r.status_code == 200 else "FAIL", f"Status {r.status_code}")
        except Exception as e:
            record("Reports", "GET /api/v1/reports/summary", "FAIL", str(e))

        # Risk Summary Report
        try:
            r = await client.get(f"{BASE_URL}/api/v1/reports/risk-summary", headers=headers)
            record("Reports", "GET /api/v1/reports/risk-summary", "PASS" if r.status_code == 200 else "FAIL", f"Status {r.status_code}")
        except Exception as e:
            record("Reports", "GET /api/v1/reports/risk-summary", "FAIL", str(e))

        # Faculty List
        try:
            r = await client.get(f"{BASE_URL}/api/v1/faculty", headers=headers)
            record("Faculty", "GET /api/v1/faculty", "PASS" if r.status_code == 200 else "FAIL", f"Status {r.status_code}")
        except Exception as e:
            record("Faculty", "GET /api/v1/faculty", "FAIL", str(e))

        # Courses List
        try:
            r = await client.get(f"{BASE_URL}/api/v1/courses", headers=headers)
            record("Courses", "GET /api/v1/courses", "PASS" if r.status_code == 200 else "FAIL", f"Status {r.status_code}")
        except Exception as e:
            record("Courses", "GET /api/v1/courses", "FAIL", str(e))

        # AI Agents Health
        try:
            r = await client.get(f"{BASE_URL}/api/v1/agents/health", headers=headers)
            d = r.json() if r.status_code == 200 else {}
            record("Multi-Agent AI", "GET /api/v1/agents/health", "PASS" if r.status_code == 200 else "FAIL", f"Version: {d.get('version')}, Agents: {d.get('agents_loaded')}")
        except Exception as e:
            record("Multi-Agent AI", "GET /api/v1/agents/health", "FAIL", str(e))

        # Model Evaluation
        try:
            r = await client.get(f"{BASE_URL}/api/v1/agents/evaluation", headers=headers)
            eval_data = r.json() if r.status_code == 200 else {}
            xgb_r2 = eval_data.get('xgboost', {}).get('r2')
            record("Multi-Agent AI", "GET /api/v1/agents/evaluation", "PASS" if r.status_code == 200 else "FAIL", f"XGBoost R2: {xgb_r2}")
        except Exception as e:
            record("Multi-Agent AI", "GET /api/v1/agents/evaluation", "FAIL", str(e))

        # Risk Dashboard
        try:
            r = await client.get(f"{BASE_URL}/api/v1/agents/risk-dashboard", headers=headers)
            record("Multi-Agent AI", "GET /api/v1/agents/risk-dashboard", "PASS" if r.status_code == 200 else "FAIL", f"Status {r.status_code}")
        except Exception as e:
            record("Multi-Agent AI", "GET /api/v1/agents/risk-dashboard", "FAIL", str(e))

        # Research Export
        try:
            r = await client.get(f"{BASE_URL}/api/v1/agents/research/export?fmt=json", headers=headers)
            record("Multi-Agent AI", "GET /api/v1/agents/research/export", "PASS" if r.status_code == 200 else "FAIL", f"Status {r.status_code}")
        except Exception as e:
            record("Multi-Agent AI", "GET /api/v1/agents/research/export", "FAIL", str(e))

        # Multi-Agent Predict-V2
        if student_id:
            try:
                r = await client.post(f"{BASE_URL}/api/v1/agents/predict-v2", json={"student_id": student_id, "use_ensemble": True}, headers=headers, timeout=60)
                pred_v2 = r.json() if r.status_code == 200 else {}
                record("Inference", "POST /api/v1/agents/predict-v2", "PASS" if r.status_code == 200 else "FAIL", f"Pred GPA: {pred_v2.get('predicted_gpa')}, Risk: {pred_v2.get('risk_level')}")
            except Exception as e:
                record("Inference", "POST /api/v1/agents/predict-v2", "FAIL", str(e))

            # Advisor Chat
            try:
                r = await client.post(f"{BASE_URL}/api/v1/agents/advisor/chat", json={"student_id": student_id, "query": "What steps can I take to clear risk?"}, headers=headers)
                chat_data = r.json() if r.status_code == 200 else {}
                resp = chat_data.get("response", "")[:60] + "..."
                record("Inference", "POST /api/v1/agents/advisor/chat", "PASS" if r.status_code == 200 else "FAIL", f"Agent replied: '{resp}'")
            except Exception as e:
                record("Inference", "POST /api/v1/agents/advisor/chat", "FAIL", str(e))

            # Standard Prediction Pipeline
            try:
                r = await client.post(f"{BASE_URL}/api/v1/predictions/predict", json={"student_id": student_id, "prediction_type": "comprehensive"}, headers=headers)
                p = r.json() if r.status_code == 200 else {}
                record("Inference", "POST /api/v1/predictions/predict", "PASS" if r.status_code == 200 else "FAIL", f"GPA: {p.get('predicted_gpa')}, SHAP keys: {list(p.get('shap_values', {}).keys())}")
            except Exception as e:
                record("Inference", "POST /api/v1/predictions/predict", "FAIL", str(e))

        # What-If Scenario Simulator
        try:
            r = await client.post(f"{BASE_URL}/api/v1/predictions/simulate", json={
                "current_gpa": 7.5,
                "target_attendance": 90.0,
                "target_assignment_rate": 0.95,
                "target_backlogs": 0
            }, headers=headers)
            sim = r.json() if r.status_code == 200 else {}
            record("Inference", "POST /api/v1/predictions/simulate", "PASS" if r.status_code == 200 else "FAIL", f"Simulated GPA: {sim.get('simulated_gpa')}, Delta: {sim.get('gpa_delta')}")
        except Exception as e:
            record("Inference", "POST /api/v1/predictions/simulate", "FAIL", str(e))

        # Frontend Health Ping
        try:
            r = await client.get(FRONTEND_URL, timeout=10.0)
            record("Frontend", "HTTP GET http://localhost:3000", "PASS" if r.status_code == 200 else "FAIL", f"Status: {r.status_code}")
        except Exception as e:
            record("Frontend", "HTTP GET http://localhost:3000", "FAIL", str(e))

if __name__ == '__main__':
    verify_database()
    asyncio.run(verify_apis())

    print("\n" + "=" * 95)
    print(f"{'CATEGORY':<16} {'TEST NAME':<38} {'STATUS':<8} {'DETAIL'}")
    print("-" * 95)
    passed_count = sum(1 for r in results if r['status'] == 'PASS')
    failed_count = sum(1 for r in results if r['status'] == 'FAIL')

    for r in results:
        status_colored = f"[{r['status']}]"
        print(f"{r['category']:<16} {r['test_name']:<38} {status_colored:<8} {r['detail'][:38]}")

    print("=" * 95)
    print(f"AUDIT SUMMARY: {passed_count} PASSED, {failed_count} FAILED OUT OF {len(results)} TOTAL CHECKS.")
    print("=" * 95)
    sys.exit(0 if failed_count == 0 else 1)
