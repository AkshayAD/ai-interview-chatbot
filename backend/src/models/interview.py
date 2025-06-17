from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import uuid
from src.models.user import db

class InterviewCode(db.Model):
    __tablename__ = 'interview_codes'
    
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(50), unique=True, nullable=False)
    candidate_name = db.Column(db.String(100), nullable=True)
    is_used = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    used_at = db.Column(db.DateTime, nullable=True)
    expires_at = db.Column(db.DateTime, nullable=True)
    
    # Relationship to interview sessions
    interview_sessions = db.relationship('InterviewSession', backref='interview_code', lazy=True)

class QuestionSet(db.Model):
    __tablename__ = 'question_sets'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationship to questions
    questions = db.relationship('Question', backref='question_set', lazy=True, cascade='all, delete-orphan')

class Question(db.Model):
    __tablename__ = 'questions'
    
    id = db.Column(db.Integer, primary_key=True)
    question_set_id = db.Column(db.Integer, db.ForeignKey('question_sets.id'), nullable=False)
    text = db.Column(db.Text, nullable=False)
    order_index = db.Column(db.Integer, nullable=False)
    time_limit = db.Column(db.Integer, default=300)  # seconds
    hints = db.Column(db.Text, nullable=True)  # JSON string of hints
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class InterviewSession(db.Model):
    __tablename__ = 'interview_sessions'
    
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.String(100), unique=True, nullable=False, default=lambda: str(uuid.uuid4()))
    code_id = db.Column(db.Integer, db.ForeignKey('interview_codes.id'), nullable=False)
    candidate_name = db.Column(db.String(100), nullable=False)
    question_set_id = db.Column(db.Integer, db.ForeignKey('question_sets.id'), nullable=False)
    status = db.Column(db.String(20), default='pending')  # pending, active, completed, terminated
    current_question_id = db.Column(db.Integer, db.ForeignKey('questions.id'), nullable=True)
    started_at = db.Column(db.DateTime, nullable=True)
    completed_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # AI Configuration
    ai_prompt_config = db.Column(db.Text, nullable=True)  # JSON string for AI prompt configuration
    
    # Relationships
    question_set = db.relationship('QuestionSet', backref='interview_sessions')
    current_question = db.relationship('Question', foreign_keys=[current_question_id])
    responses = db.relationship('QuestionResponse', backref='interview_session', lazy=True, cascade='all, delete-orphan')
    recordings = db.relationship('Recording', backref='interview_session', lazy=True, cascade='all, delete-orphan')

class QuestionResponse(db.Model):
    __tablename__ = 'question_responses'
    
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey('interview_sessions.id'), nullable=False)
    question_id = db.Column(db.Integer, db.ForeignKey('questions.id'), nullable=False)
    transcript = db.Column(db.Text, nullable=True)
    ai_analysis = db.Column(db.Text, nullable=True)  # JSON string of AI analysis
    ai_score = db.Column(db.Float, nullable=True)
    started_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime, nullable=True)
    
    # Relationships
    question = db.relationship('Question', backref='responses')

class Recording(db.Model):
    __tablename__ = 'recordings'
    
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey('interview_sessions.id'), nullable=False)
    question_id = db.Column(db.Integer, db.ForeignKey('questions.id'), nullable=True)
    recording_type = db.Column(db.String(20), nullable=False)  # audio, video, screen
    file_path = db.Column(db.String(500), nullable=False)
    file_size = db.Column(db.Integer, nullable=True)
    duration = db.Column(db.Float, nullable=True)  # seconds
    cloud_url = db.Column(db.String(1000), nullable=True)  # Cloud storage URL
    storage_type = db.Column(db.String(20), default='local')  # local, cloud
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    question = db.relationship('Question', backref='recordings')

class TranscriptSegment(db.Model):
    __tablename__ = 'transcript_segments'
    
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey('interview_sessions.id'), nullable=False)
    question_id = db.Column(db.Integer, db.ForeignKey('questions.id'), nullable=True)
    text = db.Column(db.Text, nullable=False)
    confidence = db.Column(db.Float, nullable=True)
    start_time = db.Column(db.Float, nullable=False)  # seconds from session start
    end_time = db.Column(db.Float, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    session = db.relationship('InterviewSession', backref='transcript_segments')
    question = db.relationship('Question', backref='transcript_segments')

class AIPromptTemplate(db.Model):
    __tablename__ = 'ai_prompt_templates'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    prompt_text = db.Column(db.Text, nullable=False)
    is_default = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class AdminUser(db.Model):
    __tablename__ = 'admin_users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(100), nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime, nullable=True)

