"""
Migration script to add last_login_date column to users table.
Run this script to update the database schema.
"""

from sqlalchemy import create_engine, text

DATABASE_URL = "postgresql://postgres:QaitaJanaru2026!@localhost:5432/qaitajanaru"

engine = create_engine(DATABASE_URL)

def migrate():
    with engine.connect() as connection:
        # Check if column already exists
        result = connection.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'users' 
            AND column_name = 'last_login_date'
        """))
        
        if result.fetchone():
            print("Column 'last_login_date' already exists in users table.")
            return
        
        # Add the column
        connection.execute(text("""
            ALTER TABLE users 
            ADD COLUMN last_login_date DATE
        """))
        
        connection.commit()
        print("Successfully added 'last_login_date' column to users table.")

if __name__ == "__main__":
    migrate()
