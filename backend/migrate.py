import os
import sqlite3
import psycopg2
from dotenv import load_dotenv

load_dotenv()

# Fix: Strip "sqlite:///" prefix from DATABASE_URL to get the actual file path
raw_db_url = os.environ.get("DATABASE_URL", "")
SQLITE_DB = raw_db_url.replace("sqlite:///", "")

# Override with full absolute path
SQLITE_DB = r"C:\Users\albug\PycharmProjects\Personal projects\greenlandtour\backend\instance\glttravel.db"

PG_CONN_STR = os.environ.get("POSTGRES_URL")

print(f"SQLite path: {SQLITE_DB}")
print(f"PostgreSQL: {PG_CONN_STR[:50]}...")  # partial for safety

if not SQLITE_DB or not os.path.exists(SQLITE_DB):
    raise FileNotFoundError(f"SQLite file not found: '{SQLITE_DB}'. Make sure migrate.py is in the same folder as glttravel.db")

if not PG_CONN_STR:
    raise ValueError("POSTGRES_URL is not set in your .env file")

def get_pg_type(sqlite_type):
    sqlite_type = sqlite_type.upper()
    if "INT" in sqlite_type:       return "INTEGER"
    if "CHAR" in sqlite_type or "TEXT" in sqlite_type or "CLOB" in sqlite_type: return "TEXT"
    if "REAL" in sqlite_type or "FLOA" in sqlite_type or "DOUB" in sqlite_type: return "DOUBLE PRECISION"
    if "BLOB" in sqlite_type:      return "BYTEA"
    if "DATE" in sqlite_type or "TIME" in sqlite_type: return "TIMESTAMP"
    if "BOOL" in sqlite_type:      return "BOOLEAN"
    return "TEXT"  # fallback

sqlite_conn = sqlite3.connect(SQLITE_DB)
sqlite_cur = sqlite_conn.cursor()

pg_conn = psycopg2.connect(PG_CONN_STR)
pg_cur = pg_conn.cursor()

# Get all tables
sqlite_cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
tables = [row[0] for row in sqlite_cur.fetchall()]
print(f"\nFound tables: {tables}")

for table in tables:
    print(f"\n→ Migrating table: {table}")

    # Get column info
    sqlite_cur.execute(f"PRAGMA table_info({table})")
    columns = sqlite_cur.fetchall()  # (cid, name, type, notnull, dflt, pk)

    # Build CREATE TABLE
    col_defs = []
    for col in columns:
        name = col[1]
        col_type = get_pg_type(col[2])
        pk = col[5]
        notnull = "NOT NULL" if col[3] else ""
        if pk and col_type == "INTEGER":
            col_defs.append(f'"{name}" SERIAL PRIMARY KEY')
        else:
            col_defs.append(f'"{name}" {col_type} {notnull}'.strip())

    create_sql = f'CREATE TABLE IF NOT EXISTS "{table}" ({", ".join(col_defs)});'
    print(f"  Creating: {create_sql}")
    pg_cur.execute(f'DROP TABLE IF EXISTS "{table}" CASCADE;')
    pg_cur.execute(create_sql)

    # Copy rows
    sqlite_cur.execute(f'SELECT * FROM "{table}"')
    rows = sqlite_cur.fetchall()
    if rows:
        col_names = ', '.join([f'"{col[1]}"' for col in columns])
        placeholders = ', '.join(['%s'] * len(columns))
        insert_sql = f'INSERT INTO "{table}" ({col_names}) VALUES ({placeholders})'

        # Convert SQLite 0/1 integers to Python booleans for BOOLEAN columns
        bool_indexes = [i for i, col in enumerate(columns) if "BOOL" in col[2].upper()]
        converted_rows = []
        for row in rows:
            row = list(row)
            for i in bool_indexes:
                if row[i] is not None:
                    row[i] = bool(row[i])
            converted_rows.append(tuple(row))

        pg_cur.executemany(insert_sql, converted_rows)
        print(f"  ✓ Inserted {len(rows)} rows")
    else:
        print(f"  ✓ Table created (no rows)")

pg_conn.commit()
sqlite_conn.close()
pg_conn.close()
print("\n✅ Migration complete!")