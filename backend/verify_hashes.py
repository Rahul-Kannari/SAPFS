# pyrefly: ignore [missing-import]
import psycopg2, bcrypt

conn = psycopg2.connect(dbname='sapfs_db', user='postgres', password='Rahul@8296', host='localhost')
cur = conn.cursor()
emails = ['admin@sapfs.edu', 'dr.sharma@sapfs.edu', 'arjun.kumar@student.sapfs.edu']
cur.execute('SELECT email, hashed_password FROM users WHERE email = ANY(%s)', (emails,))
pw_map = {
    'admin@sapfs.edu': 'Admin@123',
    'dr.sharma@sapfs.edu': 'Faculty@123',
    'arjun.kumar@student.sapfs.edu': 'Student@123'
}
for email, h in cur.fetchall():
    ok = bcrypt.checkpw(pw_map[email].encode(), h.encode())
    print(email + ': ' + ('OK' if ok else 'FAIL') + ' hash=' + h[:10])
conn.close()
