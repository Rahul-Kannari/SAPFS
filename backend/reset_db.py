import psycopg2
import os

DB_NAME = 'sapfs_db'
DB_USER = 'postgres'
DB_PASS = 'Rahul@8296'
DB_HOST = 'localhost'

def reset_db():
    conn = psycopg2.connect(dbname=DB_NAME, user=DB_USER, password=DB_PASS, host=DB_HOST)
    conn.autocommit = True
    cur = conn.cursor()

    print("Dropping and recreating public schema...")
    cur.execute("DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO postgres; GRANT ALL ON SCHEMA public TO PUBLIC;")
    
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    schema1 = os.path.join(base_dir, "database", "migrations", "001_initial_schema.sql")
    schema2 = os.path.join(base_dir, "database", "migrations", "v2", "002_advanced_features.sql")
    seed = os.path.join(base_dir, "database", "seeds", "001_seed_data.sql")
    
    for filepath in [schema1, schema2, seed]:
        if os.path.exists(filepath):
            print(f"Executing {os.path.basename(filepath)}...")
            with open(filepath, 'r', encoding='utf-8') as f:
                sql = f.read()
            cur.execute(sql)
        else:
            print(f"Warning: File not found {filepath}")
            
    conn.close()
    print("Database reset and initial seed data re-applied successfully!")

if __name__ == '__main__':
    reset_db()
