from app.db.session import SessionLocal
from app.models.user import User
from app.services.level_service import update_level_and_progress


def migrate_all_users():
    db = SessionLocal()
    try:
        users = db.query(User).all()
        print(f"Found {len(users)} users to migrate")
        
        for user in users:
            print(f"Migrating user {user.id} ({user.full_name})")
            # Ensure all fields are initialized
            if user.completed_daily_tasks is None:
                user.completed_daily_tasks = []
            if user.completed_weekly_tasks is None:
                user.completed_weekly_tasks = []
            if user.completed_achievement_chapters is None:
                user.completed_achievement_chapters = []
                
            # Calculate experience and update level
            update_level_and_progress(user)
            
            db.add(user)
            
        db.commit()
        print("Migration complete!")
    except Exception as e:
        print(f"Error during migration: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    migrate_all_users()
