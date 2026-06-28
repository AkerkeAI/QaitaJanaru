"""
Migration script to add phone authentication fields to the User model.
Run this script to update the database schema.

Compatible with PostgreSQL (Render) and SQLite (local development).
"""

from app.db.session import SessionLocal, engine
from sqlalchemy import text, inspect

def add_phone_fields():
    """Add phone and phone_verified columns to users table"""
    db = SessionLocal()

    try:
        # Get database inspector to check existing columns
        inspector = inspect(engine)
        columns = [col['name'] for col in inspector.get_columns('users')]

        # Check and add phone column
        if 'phone' not in columns:
            print("Adding phone column...")
            db.execute(text("ALTER TABLE users ADD COLUMN phone VARCHAR"))
            db.commit()
            print("✓ Phone column added")
        else:
            print("✓ Phone column already exists")

        # Refresh inspector after first change
        inspector = inspect(engine)
        columns = [col['name'] for col in inspector.get_columns('users')]

        # Check and add phone_verified column
        if 'phone_verified' not in columns:
            print("Adding phone_verified column...")
            db.execute(text("ALTER TABLE users ADD COLUMN phone_verified BOOLEAN DEFAULT FALSE"))
            db.commit()
            print("✓ Phone verified column added")
        else:
            print("✓ Phone verified column already exists")

        print("\n✅ Migration completed successfully!")

    except Exception as e:
        print(f"❌ Error during migration: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    add_phone_fields()
