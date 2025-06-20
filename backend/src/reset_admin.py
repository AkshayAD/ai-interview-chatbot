import os
from flask import Flask
from werkzeug.security import generate_password_hash
from src.models.user import db
from src.models.interview import AdminUser

def reset_admin_password():
    app = Flask(__name__)
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("DATABASE_URL environment variable not set.")
        return

    app.config["SQLALCHEMY_DATABASE_URI"] = database_url
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    db.init_app(app)

    with app.app_context():
        admin_user = AdminUser.query.filter_by(username="admin").first()
        if admin_user:
            admin_user.password_hash = generate_password_hash("admin123")
            db.session.commit()
            print("Admin password reset to admin123 successfully.")
        else:
            print("Admin user not found.")

if __name__ == "__main__":
    reset_admin_password()


