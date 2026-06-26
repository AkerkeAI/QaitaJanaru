"""
Migration script to add task progress fields to the users table.
Run this script to update the database schema for the new task system.
"""

from sqlalchemy import text
from app.db.session import engine


def upgrade():
    """Add task progress fields to users table"""
    with engine.connect() as conn:
        # Add task_progress column (JSON)
        conn.execute(text("""
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS task_progress JSON
        """))
        
        # Add claimed_rewards column (JSON)
        conn.execute(text("""
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS claimed_rewards JSON DEFAULT '[]'
        """))
        
        # Add last_daily_reset column (DateTime)
        conn.execute(text("""
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS last_daily_reset TIMESTAMP
        """))
        
        # Add last_weekly_reset column (DateTime)
        conn.execute(text("""
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS last_weekly_reset TIMESTAMP
        """))
        
        # Add current_week_set column (String)
        conn.execute(text("""
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS current_week_set VARCHAR(50) DEFAULT 'week-set-a'
        """))
        
        conn.commit()
        print("Migration completed successfully!")


def downgrade():
    """Remove task progress fields from users table"""
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE users DROP COLUMN IF EXISTS task_progress"))
        conn.execute(text("ALTER TABLE users DROP COLUMN IF EXISTS claimed_rewards"))
        conn.execute(text("ALTER TABLE users DROP COLUMN IF EXISTS last_daily_reset"))
        conn.execute(text("ALTER TABLE users DROP COLUMN IF EXISTS last_weekly_reset"))
        conn.execute(text("ALTER TABLE users DROP COLUMN IF EXISTS current_week_set"))
        conn.commit()
        print("Rollback completed successfully!")


if __name__ == "__main__":
    print("Running migration to add task progress fields...")
    upgrade()
