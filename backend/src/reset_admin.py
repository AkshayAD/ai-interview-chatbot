import os
import sys
from flask import Flask
from werkzeug.security import generate_password_hash

# Add the 'src' directory to the Python path to allow for correct module imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Now we can import from the models package
from src.models.interview import db, AdminUser

def reset_admin_password():
    """
    Resets the password for the default 'admin' user to 'admin123'.
    """
    app = Flask(__name__)
    database_url = os.getenv("DATABASE_URL")

    if not database_url:
        print("Error: DATABASE_URL environment variable not set.")
        return

    # Configure the Flask app with the database URI
    app.config["SQLALCHEMY_DATABASE_URI"] = database_url
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    db.init_app(app)

    with app.app_context():
        print("Searching for admin user...")
        admin_user = AdminUser.query.filter_by(username="admin").first()

        if admin_user:
            print("Admin user found. Resetting password...")
            # Set the new password
            new_password = "admin123"
            admin_user.password_hash = generate_password_hash(new_password)
            db.session.commit()
            print(f"Admin password has been reset to: {new_password}")
        else:
            print("Admin user not found.")

if __name__ == "__main__":
    reset_admin_password()
