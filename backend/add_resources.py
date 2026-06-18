import sqlite3

def upgrade():
    conn = sqlite3.connect('careercrafter.db')
    cursor = conn.cursor()
    
    try:
        cursor.execute('ALTER TABLE history ADD COLUMN resources TEXT')
        print("Successfully added resources column to history table.")
    except sqlite3.OperationalError as e:
        print(f"Error (maybe column already exists): {e}")
        
    conn.commit()
    conn.close()

if __name__ == "__main__":
    upgrade()
