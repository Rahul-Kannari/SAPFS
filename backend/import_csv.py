import csv
import os
import sys
import uuid
import psycopg2

DB_NAME = os.getenv('DB_NAME', 'sapfs_db')
DB_USER = os.getenv('DB_USER', 'postgres')
DB_PASS = os.getenv('DB_PASS', 'Rahul@8296')
DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_PORT = os.getenv('DB_PORT', '5432')

def get_risk_level(cgpa, attendance_pct, backlogs):
    if backlogs > 2 or cgpa < 5.5 or attendance_pct < 60:
        return 'critical'
    elif backlogs > 0 or cgpa < 6.5 or attendance_pct < 75:
        return 'high'
    elif cgpa < 7.5 or attendance_pct < 85:
        return 'medium'
    return 'low'

def import_csv(csv_filepath):
    if not os.path.exists(csv_filepath):
        print(f"Error: CSV file not found at {csv_filepath}")
        return

    conn = psycopg2.connect(dbname=DB_NAME, user=DB_USER, password=DB_PASS, host=DB_HOST, port=DB_PORT)
    conn.autocommit = True
    cur = conn.cursor()

    print(f"Reading CSV file: {csv_filepath}...")
    with open(csv_filepath, mode='r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    print(f"Found {len(rows)} rows in CSV file.")

    # 1. Ensure departments exist
    dept_codes = {
        'CSE': 'Computer Science Engineering',
        'IT': 'Information Technology',
        'ECE': 'Electronics & Communication',
        'EEE': 'Electrical & Electronics',
        'MECH': 'Mechanical Engineering',
        'CIVIL': 'Civil Engineering',
        'AI & DS': 'Artificial Intelligence & Data Science'
    }
    
    dept_map = {}
    for code, name in dept_codes.items():
        cur.execute("SELECT id FROM departments WHERE code = %s;", (code,))
        row = cur.fetchone()
        if row:
            dept_map[code] = row[0]
        else:
            dept_id = str(uuid.uuid4())
            cur.execute("INSERT INTO departments (id, code, name) VALUES (%s, %s, %s);", (dept_id, code, name))
            dept_map[code] = dept_id

FIRST_NAMES = [
    "Aarav", "Ananya", "Rohan", "Priya", "Aditya", "Sneha", "Karan", "Pooja", "Vikram", "Neha",
    "Arjun", "Kavya", "Rahul", "Isha", "Siddharth", "Riya", "Aman", "Divya", "Varun", "Meera",
    "Manish", "Tanvi", "Deepak", "Anushka", "Nikhil", "Shreya", "Abhishek", "Kirti", "Yash", "Swati",
    "Tarun", "Bhavna", "Rishabh", "Preeti", "Gaurav", "Nisha", "Alok", "Simran", "Kartik", "Pallavi",
    "Harsh", "Radhika", "Vivek", "Sonal", "Mayank", "Niharika", "Sumit", "Aditi", "Kunal", "Richa"
]

LAST_NAMES = [
    "Sharma", "Patel", "Verma", "Gupta", "Singh", "Reddy", "Kumar", "Joshi", "Mehta", "Rao",
    "Nair", "Deshmukh", "Chowdhury", "Das", "Agarwal", "Bhat", "Shah", "Sen", "Pillai", "Pandey",
    "Tripathi", "Mishra", "Saxena", "Kapoor", "Malhotra", "Kulkarni", "Banerjee", "Dutta", "Roy", "Shetty"
]

DEPARTMENTS = ['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL', 'AI & DS']

def import_csv(csv_filepath):
    if not os.path.exists(csv_filepath):
        print(f"Error: CSV file not found at {csv_filepath}")
        return

    conn = psycopg2.connect(dbname=DB_NAME, user=DB_USER, password=DB_PASS, host=DB_HOST, port=DB_PORT)
    conn.autocommit = True
    cur = conn.cursor()

    print(f"Reading CSV file: {csv_filepath}...")
    with open(csv_filepath, mode='r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    print(f"Found {len(rows)} rows in CSV file.")

    # 1. Ensure departments exist
    dept_codes = {
        'CSE': 'Computer Science Engineering',
        'IT': 'Information Technology',
        'ECE': 'Electronics & Communication',
        'EEE': 'Electrical & Electronics',
        'MECH': 'Mechanical Engineering',
        'CIVIL': 'Civil Engineering',
        'AI & DS': 'Artificial Intelligence & Data Science'
    }
    
    dept_map = {}
    for code, name in dept_codes.items():
        cur.execute("SELECT id FROM departments WHERE code = %s;", (code,))
        row = cur.fetchone()
        if row:
            dept_map[code] = row[0]
        else:
            dept_id = str(uuid.uuid4())
            cur.execute("INSERT INTO departments (id, code, name) VALUES (%s, %s, %s);", (dept_id, code, name))
            dept_map[code] = dept_id

    students_imported = 0

    for idx, row in enumerate(rows):
        col = {k.strip(): v.strip() for k, v in row.items() if k}
        
        s_id = col.get('Student_ID') or str(idx + 1)
        try:
            sid_num = int(s_id)
        except ValueError:
            sid_num = idx + 1

        first_name = FIRST_NAMES[sid_num % len(FIRST_NAMES)]
        last_name = LAST_NAMES[(sid_num * 3) % len(LAST_NAMES)]
        
        dept_code = DEPARTMENTS[sid_num % len(DEPARTMENTS)]
        dept_id = dept_map[dept_code]
        
        age = int(col.get('Age') or 20)
        gender = col.get('Gender') or 'Female'
        attendance_pct = float(col.get('Attendance_Rate') or 85.0)
        cgpa = float(col.get('Prior_GPA') or 3.0)
        lms_logins = int(col.get('LMS_Logins') or 150)
        study_hours = float(col.get('Study_Hours_Per_Week') or 20.0)
        assignment_sub_rate = float(col.get('Assignment_Submission_Rate') or 80.0)
        engagement_score = float(col.get('Engagement_Score') or 50.0)
        final_perf = col.get('Final_Academic_Performance') or 'Medium'

        if final_perf.strip().lower() == 'low':
            risk_level = 'high'
        elif final_perf.strip().lower() == 'medium':
            risk_level = 'medium'
        elif final_perf.strip().lower() == 'high':
            risk_level = 'low'
        else:
            risk_level = 'medium'

        current_semester = ((sid_num - 1) % 8) + 1
        batch_year = 2024 - (current_semester // 2)
        email = f"student{s_id}@sapfs.edu"

        # 1. Upsert User
        cur.execute("SELECT id FROM users WHERE email = %s;", (email,))
        user_row = cur.fetchone()
        if user_row:
            user_id = user_row[0]
        else:
            user_id = str(uuid.uuid4())
            hashed_pass = "$2b$12$HlyQc/JxFEZEckbclkLv7uOoW.a3uMb62dw4MLszQvRtl4/IxbhgG"
            cur.execute(
                "INSERT INTO users (id, email, hashed_password, role, is_active, is_verified) VALUES (%s, %s, %s, %s, %s, %s);",
                (user_id, email, hashed_pass, 'student', True, True)
            )

        # 2. Upsert Student with ALL base paper dataset columns
        cur.execute("SELECT id FROM students WHERE student_id = %s;", (s_id,))
        student_row = cur.fetchone()
        if student_row:
            student_id_uuid = student_row[0]
            cur.execute(
                """UPDATE students SET first_name=%s, last_name=%s, department_id=%s, batch_year=%s, 
                   current_semester=%s, cgpa=%s, risk_level=%s, gender=%s, age=%s, attendance_pct=%s, 
                   lms_logins=%s, study_hours=%s, assignment_submission_rate=%s, engagement_score=%s, 
                   final_academic_performance=%s WHERE id=%s;""",
                (first_name, last_name, dept_id, batch_year, current_semester, cgpa, risk_level, gender,
                 age, attendance_pct, lms_logins, study_hours, assignment_sub_rate, engagement_score, final_perf, student_id_uuid)
            )
        else:
            student_id_uuid = str(uuid.uuid4())
            cur.execute(
                """INSERT INTO students (id, user_id, student_id, first_name, last_name, department_id, batch_year, current_semester, cgpa, risk_level, gender, age, attendance_pct, lms_logins, study_hours, assignment_submission_rate, engagement_score, final_academic_performance)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);""",
                (student_id_uuid, user_id, s_id, first_name, last_name, dept_id, batch_year, current_semester, cgpa, risk_level, gender, age, attendance_pct, lms_logins, study_hours, assignment_sub_rate, engagement_score, final_perf)
            )
            students_imported += 1

        # 3. Timeseries insertion
        cur.execute(
            """INSERT INTO student_performance_timeseries (id, student_id, semester_number, academic_year, sgpa, cgpa, attendance_percentage, backlogs)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s) ON CONFLICT DO NOTHING;""",
            (str(uuid.uuid4()), student_id_uuid, current_semester, f"2024-2025", cgpa, cgpa, attendance_pct, 0)
        )

    conn.close()
    print(f"SUCCESS: Imported {len(rows)} students into PostgreSQL database 'sapfs_db'.")

if __name__ == '__main__':
    filepath = sys.argv[1] if len(sys.argv) > 1 else "student_performance_dataset.csv"
    import_csv(filepath)
