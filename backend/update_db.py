import sqlite3

try:
    conn = sqlite3.connect('c:/Users/shubh/Desktop/CareerCrafter-main/backend/careercrafter.db')
    cursor = conn.cursor()
    
    # Check if columns exist first to prevent errors
    cursor.execute("PRAGMA table_info(users)")
    columns = [col[1] for col in cursor.fetchall()]
    
    if "email" not in columns:
        cursor.execute("ALTER TABLE users ADD COLUMN email VARCHAR")
    if "is_verified" not in columns:
        cursor.execute("ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT 0")
    if "otp_code" not in columns:
        cursor.execute("ALTER TABLE users ADD COLUMN otp_code VARCHAR")
    if "otp_expiry" not in columns:
        cursor.execute("ALTER TABLE users ADD COLUMN otp_expiry DATETIME")
        
    conn.commit()
    print("Successfully updated users table.")
except Exception as e:
    print(f"Error: {e}")
finally:
    if 'conn' in locals():
        conn.close()
