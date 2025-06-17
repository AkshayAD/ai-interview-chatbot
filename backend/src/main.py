import os
import sys
# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_socketio import SocketIO
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import models
from src.models.user import db
from src.models.interview import (
    InterviewCode, QuestionSet, Question, InterviewSession, 
    QuestionResponse, Recording, TranscriptSegment, AIPromptTemplate, AdminUser
)

# Import routes
from src.routes.user import user_bp
from src.routes.interview import interview_bp
from src.routes.admin import admin_bp
from src.routes.websocket import register_socket_handlers

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'asdf#FGSgvasgf$5$WGT')

# CORS configuration
CORS(app, origins=os.getenv('CORS_ORIGINS', 'http://localhost:3000,http://localhost:5173').split(','))

# SocketIO configuration
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

# Register blueprints
app.register_blueprint(user_bp, url_prefix='/api')
app.register_blueprint(interview_bp, url_prefix='/api/interview')
app.register_blueprint(admin_bp, url_prefix='/api/admin')

# Database configuration
database_url = os.getenv("DATABASE_URL", f"sqlite:///{os.path.join(os.path.dirname(__file__), 'database', 'app.db')}")
print(f"Attempting to connect to database: {database_url}")
app.config['SQLALCHEMY_DATABASE_URI'] = database_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize database
db.init_app(app)

# Register WebSocket handlers
register_socket_handlers(socketio)

with app.app_context():
    db.create_all()
    
    # Create default admin user if none exists
    if not AdminUser.query.first():
        from werkzeug.security import generate_password_hash
        admin_user = AdminUser(
            username='admin',
            password_hash=generate_password_hash('admin123'),
            email='admin@interview-chatbot.com',
            is_active=True
        )
        db.session.add(admin_user)
        db.session.commit()
        print("Default admin user created: admin/admin123")
    
    # Create default AI prompt template if none exists
    if not AIPromptTemplate.query.filter_by(is_default=True).first():
        default_prompt = AIPromptTemplate(
            name="Default Interview Assistant",
            description="Default AI prompt for interview assistance",
            prompt_text="""You are an AI interview assistant helping conduct a technical interview. Your role is to:

1. Guide the candidate through guesstimate questions
2. Provide helpful hints when the candidate is stuck (but not direct answers)
3. Ask clarifying questions to help the candidate think through problems
4. Encourage structured thinking and problem-solving approaches
5. Be supportive but maintain interview standards

Guidelines:
- Give hints that guide thinking, not solutions
- Ask follow-up questions to probe deeper understanding
- Encourage the candidate to explain their reasoning
- Help break down complex problems into smaller parts
- Maintain a professional but friendly tone
- Do not provide direct answers to the questions
- Focus on the problem-solving process rather than just the final answer

Current question context will be provided with each interaction.""",
            is_default=True
        )
        db.session.add(default_prompt)
        db.session.commit()

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    static_folder_path = app.static_folder
    if static_folder_path is None:
            return "Static folder not configured", 404

    if path != "" and os.path.exists(os.path.join(static_folder_path, path)):
        return send_from_directory(static_folder_path, path)
    else:
        index_path = os.path.join(static_folder_path, 'index.html')
        if os.path.exists(index_path):
            return send_from_directory(static_folder_path, 'index.html')
        else:
            return "index.html not found", 404


if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)
