import sqlite3

conn = sqlite3.connect('c:/Users/shubh/Desktop/CareerCrafter-main/backend/careercrafter.db')
cursor = conn.cursor()

try:
    cursor.execute("ALTER TABLE profiles ADD COLUMN linkedin_url VARCHAR")
    print("Added linkedin_url")
except Exception as e:
    print(e)
    
try:
    cursor.execute("ALTER TABLE profiles ADD COLUMN github_url VARCHAR")
    print("Added github_url")
except Exception as e:
    print(e)

conn.commit()
conn.close()
