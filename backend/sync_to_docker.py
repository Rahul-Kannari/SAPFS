import psycopg2
import subprocess
import json
import uuid

# Connect to Local Windows PostgreSQL (where 203 students exist)
conn_local = psycopg2.connect(dbname='sapfs_db', user='postgres', password='Rahul@8296', host='localhost')
cur_local = conn_local.cursor()

cur_local.execute("SELECT id, user_id, student_id, first_name, last_name, department_id, batch_year, current_semester, cgpa, risk_level, gender FROM students;")
students = cur_local.fetchall()

print(f"Fetched {len(students)} students from local Windows PostgreSQL.")

# Build SQL statements for Docker container
sql_statements = []

for s in students:
    s_id_uuid, user_id, s_id, first_name, last_name, dept_id, batch_year, current_semester, cgpa, risk_level, gender = s
    email = f"{s_id.lower()}@sapfs.edu"
    hashed_pass = "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW"

    sql_statements.append(f"""
    INSERT INTO users (id, email, hashed_password, role, is_active, is_verified)
    VALUES ('{user_id}', '{email}', '{hashed_pass}', 'student', true, true)
    ON CONFLICT (email) DO NOTHING;
    """)

    sql_statements.append(f"""
    INSERT INTO students (id, user_id, student_id, first_name, last_name, batch_year, current_semester, cgpa, risk_level, gender)
    VALUES ('{s_id_uuid}', '{user_id}', '{s_id}', '{first_name}', '{last_name}', {batch_year}, {current_semester}, {cgpa}, '{risk_level}', '{gender or 'Other'}')
    ON CONFLICT (student_id) DO UPDATE SET
      first_name=EXCLUDED.first_name, last_name=EXCLUDED.last_name, cgpa=EXCLUDED.cgpa, risk_level=EXCLUDED.risk_level;
    """)

# Timeseries
cur_local.execute("SELECT id, student_id, semester_number, academic_year, sgpa, cgpa, attendance_percentage, backlogs FROM student_performance_timeseries;")
ts_records = cur_local.fetchall()

print(f"Fetched {len(ts_records)} performance records from local Windows PostgreSQL.")

for ts in ts_records:
    ts_id, student_id_uuid, sem_n, ac_year, sgpa, cgpa, att, bl = ts
    sql_statements.append(f"""
    INSERT INTO student_performance_timeseries (id, student_id, semester_number, academic_year, sgpa, cgpa, attendance_percentage, backlogs)
    VALUES ('{ts_id}', '{student_id_uuid}', {sem_n}, '{ac_year}', {sgpa or 0}, {cgpa or 0}, {att or 0}, {bl or 0})
    ON CONFLICT DO NOTHING;
    """)

full_sql = "\n".join(sql_statements)

# Execute via docker exec
process = subprocess.Popen(['docker', 'exec', '-i', 'sapfs_db', 'psql', '-U', 'sapfs_user', '-d', 'sapfs_db'],
                           stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

stdout, stderr = process.communicate(input=full_sql)

print("Docker psql execution complete.")
print(f"Piped {len(sql_statements)} SQL statements into Docker container sapfs_db.")

# Verify count in Docker
verify_cmd = ['docker', 'exec', '-i', 'sapfs_db', 'psql', '-U', 'sapfs_user', '-d', 'sapfs_db', '-c', 'SELECT COUNT(*) FROM students;']
v_res = subprocess.run(verify_cmd, capture_output=True, text=True)
print(v_res.stdout)
