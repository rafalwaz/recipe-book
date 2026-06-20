import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

db_url = os.getenv("DATABASE_URL")
print(f"DATABASE_URL: {db_url}")

try:
    conn = psycopg2.connect(db_url)
    print("Połączenie z bazą danych: UDANE!")
    cur = conn.cursor()
    
    cur.execute("""
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'recipes'
        );
    """)
    exists = cur.fetchone()[0]
    print(f"Czy tabela 'recipes' istnieje w tej bazie?: {exists}")
    
    if exists:
        cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'recipes';")
        cols = cur.fetchall()
        print("Kolumny w tabeli 'recipes':")
        for col in cols:
            print(f" - {col[0]} ({col[1]})")
    
    cur.execute("SELECT datname FROM pg_database WHERE datistemplate = false;")
    dbs = [row[0] for row in cur.fetchall()]
    print(f"Wszystkie bazy na tym serwerze: {dbs}")
    
    cur.close()
    conn.close()
except Exception as e:
    print(f"BŁĄD PODCZAS DIAGNOSTYKI: {e}")
