import psycopg2
import os

DB_NAME = os.getenv('DB_NAME', 'sapfs_db')
DB_USER = os.getenv('DB_USER', 'postgres')
DB_PASS = os.getenv('DB_PASS', 'Rahul@8296')
DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_PORT = os.getenv('DB_PORT', '5432')

def truncate_all_tables():
    print(f"Connecting to database '{DB_NAME}' at {DB_HOST}:{DB_PORT}...")
    try:
        conn = psycopg2.connect(
            dbname=DB_NAME, 
            user=DB_USER, 
            password=DB_PASS, 
            host=DB_HOST, 
            port=DB_PORT
        )
        conn.autocommit = True
        cur = conn.cursor()

        # Get list of all user tables in public schema
        cur.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
              AND table_type = 'BASE TABLE'
              AND table_name NOT IN ('alembic_version');
        """)
        tables = [row[0] for row in cur.fetchall()]

        if not tables:
            print("No tables found in public schema.")
            return

        print(f"Found {len(tables)} tables: {', '.join(tables)}")
        print("Truncating all tables with CASCADE...")

        for table in tables:
            cur.execute(f'TRUNCATE TABLE "{table}" CASCADE;')
            print(f"  - Truncated table: {table}")

        conn.close()
        print("\nSUCCESS: All database tables have been completely truncated. All data removed.")
    except Exception as e:
        print(f"Error while truncating database tables: {e}")

if __name__ == '__main__':
    truncate_all_tables()
