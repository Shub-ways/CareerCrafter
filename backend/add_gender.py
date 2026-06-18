import sqlite3

def add_gender_column():
    conn = sqlite3.connect("careercrafter.db")
    cursor = conn.cursor()
    try:
        cursor.execute("ALTER TABLE profiles ADD COLUMN gender VARCHAR")
        print("Successfully added gender column.")
    except sqlite3.OperationalError as e:
        print(f"Error (maybe column already exists): {e}")
    conn.commit()
    conn.close()

if __name__ == "__main__":
    add_gender_column()
