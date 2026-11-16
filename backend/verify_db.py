import psycopg2
import os

DB_NAME = os.getenv('DB_NAME', 'sapfs_db')
DB_USER = os.getenv('DB_USER', 'postgres')
DB_PASS = os.getenv('DB_PASS', 'Rahul@8296')
DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_PORT = os.getenv('DB_PORT', '5432')

def check_row_counts():
    conn = psycopg2.connect(dbname=DB_NAME, user=DB_USER, password=DB_PASS, host=DB_HOST, port=DB_PORT)
    cur = conn.cursor()
    cur.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
        ORDER BY table_name;
    """)
    tables = [row[0] for row in cur.fetchall()]
    print("=== DATABASE TABLE ROW COUNTS ===")
    total_rows = 0
    for t in tables:
        cur.execute(f'SELECT COUNT(*) FROM "{t}"')
        count = cur.fetchone()[0]
        total_rows += count
        print(f"  {t}: {count} rows")
    print(f"\nTOTAL ROWS ACROSS ALL {len(tables)} TABLES: {total_rows}")
    conn.close()

if __name__ == '__main__':
    check_row_counts()
