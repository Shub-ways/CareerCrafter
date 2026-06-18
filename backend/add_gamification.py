import sqlite3

def run_migration():
    conn = sqlite3.connect("careercrafter.db")
    cursor = conn.cursor()
    try:
        cursor.execute("ALTER TABLE profiles ADD COLUMN points INTEGER DEFAULT 0")
        print("Added points column")
    except sqlite3.OperationalError as e:
        print(f"Points column error: {e}")
        
    try:
        cursor.execute("ALTER TABLE profiles ADD COLUMN badges TEXT")
        print("Added badges column")
    except sqlite3.OperationalError as e:
        print(f"Badges column error: {e}")
        
    conn.commit()
    conn.close()

if __name__ == "__main__":
    run_migration()
