from flask import Blueprint, request, jsonify, session
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash, check_password_hash
import json
import secrets
import string
from src.models.interview import (
    db, InterviewCode, QuestionSet, Question, InterviewSession, 
    QuestionResponse, AIPromptTemplate, AdminUser
)

admin_bp = Blueprint('admin', __name__)

def generate_interview_code(length=8):
    """Generate a random interview code"""
    characters = string.ascii_uppercase + string.digits
    return ''.join(secrets.choice(characters) for _ in range(length))

def require_admin_auth():
    """Check if admin is authenticated"""
    return session.get('admin_authenticated', False)

@admin_bp.route('/login', methods=['POST'])
def admin_login():
    """Admin login endpoint"""
    try:
        data = request.get_json()
        username = data.get('username', '').strip()
        password = data.get('password', '')
        
        if not username or not password:
            return jsonify({'error': 'Username and password are required'}), 400
        
        # Check if admin user exists
        admin = AdminUser.query.filter_by(username=username, is_active=True).first()
        
        if not admin or not check_password_hash(admin.password_hash, password):
            return jsonify({'error': 'Invalid credentials'}), 401
        
        # Update last login
        admin.last_login = datetime.utcnow()
        db.session.commit()
        
        # Set session
        session['admin_authenticated'] = True
        session['admin_id'] = admin.id
        session['admin_username'] = admin.username
        
        return jsonify({
            'success': True,
            'admin': {
                'id': admin.id,
                'username': admin.username,
                'email': admin.email
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/logout', methods=['POST'])
def admin_logout():
    """Admin logout endpoint"""
    session.clear()
    return jsonify({'success': True})

@admin_bp.route('/check-auth', methods=['GET'])
def check_auth():
    """Check admin authentication status"""
    if require_admin_auth():
        admin_id = session.get('admin_id')
        admin = AdminUser.query.get(admin_id)
        return jsonify({
            'authenticated': True,
            'admin': {
                'id': admin.id,
                'username': admin.username,
                'email': admin.email
            }
        })
    else:
        return jsonify({'authenticated': False})

@admin_bp.route('/codes', methods=['GET'])
def get_codes():
    """Get all interview codes"""
    if not require_admin_auth():
        return jsonify({'error': 'Authentication required'}), 401
    
    try:
        codes = InterviewCode.query.order_by(InterviewCode.created_at.desc()).all()
        
        return jsonify({
            'codes': [{
                'id': code.id,
                'code': code.code,
                'candidate_name': code.candidate_name,
                'is_used': code.is_used,
                'created_at': code.created_at.isoformat(),
                'used_at': code.used_at.isoformat() if code.used_at else None,
                'expires_at': code.expires_at.isoformat() if code.expires_at else None
            } for code in codes]
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/codes', methods=['POST'])
def create_code():
    """Create new interview code"""
    if not require_admin_auth():
        return jsonify({'error': 'Authentication required'}), 401
    
    try:
        data = request.get_json()
        expires_in_hours = data.get('expires_in_hours', 24)
        
        # Generate unique code
        while True:
            code = generate_interview_code()
            existing = InterviewCode.query.filter_by(code=code).first()
            if not existing:
                break
        
        # Calculate expiration
        expires_at = datetime.utcnow() + timedelta(hours=expires_in_hours)
        
        interview_code = InterviewCode(
            code=code,
            expires_at=expires_at
        )
        
        db.session.add(interview_code)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'code': {
                'id': interview_code.id,
                'code': interview_code.code,
                'expires_at': interview_code.expires_at.isoformat()
            }
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/codes/<int:code_id>', methods=['DELETE'])
def delete_code(code_id):
    """Delete interview code"""
    if not require_admin_auth():
        return jsonify({'error': 'Authentication required'}), 401
    
    try:
        code = InterviewCode.query.get(code_id)
        
        if not code:
            return jsonify({'error': 'Code not found'}), 404
        
        if code.is_used:
            return jsonify({'error': 'Cannot delete used code'}), 400
        
        db.session.delete(code)
        db.session.commit()
        
        return jsonify({'success': True})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/question-sets', methods=['GET'])
def get_question_sets():
    """Get all question sets"""
    if not require_admin_auth():
        return jsonify({'error': 'Authentication required'}), 401
    
    try:
        question_sets = QuestionSet.query.order_by(QuestionSet.created_at.desc()).all()
        
        return jsonify({
            'question_sets': [{
                'id': qs.id,
                'name': qs.name,
                'description': qs.description,
                'is_active': qs.is_active,
                'created_at': qs.created_at.isoformat(),
                'question_count': len(qs.questions)
            } for qs in question_sets]
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/question-sets', methods=['POST'])
def create_question_set():
    """Create new question set"""
    if not require_admin_auth():
        return jsonify({'error': 'Authentication required'}), 401
    
    try:
        data = request.get_json()
        name = data.get('name', '').strip()
        description = data.get('description', '').strip()
        questions = data.get('questions', [])
        
        if not name:
            return jsonify({'error': 'Name is required'}), 400
        
        question_set = QuestionSet(
            name=name,
            description=description,
            is_active=False  # Start as inactive
        )
        
        db.session.add(question_set)
        db.session.flush()  # Get the ID
        
        # Add questions
        for i, q_data in enumerate(questions):
            question = Question(
                question_set_id=question_set.id,
                text=q_data.get('text', ''),
                order_index=i,
                time_limit=q_data.get('time_limit', 300),
                hints=json.dumps(q_data.get('hints', []))
            )
            db.session.add(question)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'question_set': {
                'id': question_set.id,
                'name': question_set.name,
                'description': question_set.description
            }
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/question-sets/<int:set_id>/activate', methods=['POST'])
def activate_question_set(set_id):
    """Activate a question set (deactivate others)"""
    if not require_admin_auth():
        return jsonify({'error': 'Authentication required'}), 401
    
    try:
        # Deactivate all question sets
        QuestionSet.query.update({'is_active': False})
        
        # Activate the selected one
        question_set = QuestionSet.query.get(set_id)
        if not question_set:
            return jsonify({'error': 'Question set not found'}), 404
        
        question_set.is_active = True
        db.session.commit()
        
        return jsonify({'success': True})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/sessions', methods=['GET'])
def get_sessions():
    """Get all interview sessions"""
    if not require_admin_auth():
        return jsonify({'error': 'Authentication required'}), 401
    
    try:
        sessions = InterviewSession.query.order_by(InterviewSession.created_at.desc()).all()
        
        return jsonify({
            'sessions': [{
                'id': session.session_id,
                'candidate_name': session.candidate_name,
                'status': session.status,
                'question_set_name': session.question_set.name,
                'started_at': session.started_at.isoformat() if session.started_at else None,
                'completed_at': session.completed_at.isoformat() if session.completed_at else None,
                'created_at': session.created_at.isoformat(),
                'response_count': len(session.responses)
            } for session in sessions]
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/sessions/<session_id>/details', methods=['GET'])
def get_session_details(session_id):
    """Get detailed session information"""
    if not require_admin_auth():
        return jsonify({'error': 'Authentication required'}), 401
    
    try:
        session = InterviewSession.query.filter_by(session_id=session_id).first()
        
        if not session:
            return jsonify({'error': 'Session not found'}), 404
        
        # Get responses with questions
        responses = []
        for response in session.responses:
            responses.append({
                'id': response.id,
                'question': {
                    'id': response.question.id,
                    'text': response.question.text,
                    'order_index': response.question.order_index
                },
                'transcript': response.transcript,
                'ai_analysis': json.loads(response.ai_analysis) if response.ai_analysis else None,
                'ai_score': response.ai_score,
                'started_at': response.started_at.isoformat(),
                'completed_at': response.completed_at.isoformat() if response.completed_at else None
            })
        
        return jsonify({
            'session': {
                'id': session.session_id,
                'candidate_name': session.candidate_name,
                'status': session.status,
                'question_set': {
                    'id': session.question_set.id,
                    'name': session.question_set.name,
                    'description': session.question_set.description
                },
                'started_at': session.started_at.isoformat() if session.started_at else None,
                'completed_at': session.completed_at.isoformat() if session.completed_at else None,
                'created_at': session.created_at.isoformat()
            },
            'responses': responses
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/ai-prompts', methods=['GET'])
def get_ai_prompts():
    """Get all AI prompt templates"""
    if not require_admin_auth():
        return jsonify({'error': 'Authentication required'}), 401
    
    try:
        prompts = AIPromptTemplate.query.order_by(AIPromptTemplate.created_at.desc()).all()
        
        return jsonify({
            'prompts': [{
                'id': prompt.id,
                'name': prompt.name,
                'description': prompt.description,
                'prompt_text': prompt.prompt_text,
                'is_default': prompt.is_default,
                'created_at': prompt.created_at.isoformat(),
                'updated_at': prompt.updated_at.isoformat()
            } for prompt in prompts]
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/ai-prompts', methods=['POST'])
def create_ai_prompt():
    """Create new AI prompt template"""
    if not require_admin_auth():
        return jsonify({'error': 'Authentication required'}), 401
    
    try:
        data = request.get_json()
        name = data.get('name', '').strip()
        description = data.get('description', '').strip()
        prompt_text = data.get('prompt_text', '').strip()
        is_default = data.get('is_default', False)
        
        if not name or not prompt_text:
            return jsonify({'error': 'Name and prompt text are required'}), 400
        
        # If setting as default, unset other defaults
        if is_default:
            AIPromptTemplate.query.update({'is_default': False})
        
        prompt = AIPromptTemplate(
            name=name,
            description=description,
            prompt_text=prompt_text,
            is_default=is_default
        )
        
        db.session.add(prompt)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'prompt': {
                'id': prompt.id,
                'name': prompt.name,
                'description': prompt.description,
                'is_default': prompt.is_default
            }
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500



# Session Detail Routes
@admin_bp.route('/sessions/<session_id>/responses', methods=['GET'])
def get_session_responses(session_id):
    """Get all responses for a session"""
    if not require_admin_auth():
        return jsonify({'error': 'Authentication required'}), 401
    
    try:
        session_obj = InterviewSession.query.filter_by(session_id=session_id).first()
        if not session_obj:
            return jsonify({'error': 'Session not found'}), 404
        
        responses = QuestionResponse.query.filter_by(session_id=session_obj.id).all()
        
        response_data = []
        for response in responses:
            response_data.append({
                'id': response.id,
                'question_id': response.question_id,
                'question_text': response.question.text if response.question else '',
                'response_text': response.response_text,
                'ai_analysis': response.ai_analysis,
                'ai_score': response.ai_score,
                'created_at': response.created_at.isoformat()
            })
        
        return jsonify({
            'success': True,
            'responses': response_data
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/sessions/<session_id>/transcripts', methods=['GET'])
def get_session_transcripts(session_id):
    """Get all transcripts for a session"""
    if not require_admin_auth():
        return jsonify({'error': 'Authentication required'}), 401
    
    try:
        from src.models.interview import TranscriptSegment
        
        session_obj = InterviewSession.query.filter_by(session_id=session_id).first()
        if not session_obj:
            return jsonify({'error': 'Session not found'}), 404
        
        transcripts = TranscriptSegment.query.filter_by(session_id=session_obj.id).order_by(TranscriptSegment.start_time).all()
        
        transcript_data = []
        for transcript in transcripts:
            transcript_data.append({
                'id': transcript.id,
                'text': transcript.text,
                'confidence': transcript.confidence,
                'start_time': transcript.start_time,
                'end_time': transcript.end_time,
                'timestamp': transcript.created_at.isoformat()
            })
        
        return jsonify({
            'success': True,
            'transcripts': transcript_data
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/sessions/<session_id>/ai-responses', methods=['GET'])
def get_session_ai_responses(session_id):
    """Get all AI responses for a session"""
    if not require_admin_auth():
        return jsonify({'error': 'Authentication required'}), 401
    
    try:
        from src.models.interview import AIResponse
        
        session_obj = InterviewSession.query.filter_by(session_id=session_id).first()
        if not session_obj:
            return jsonify({'error': 'Session not found'}), 404
        
        ai_responses = AIResponse.query.filter_by(session_id=session_obj.id).order_by(AIResponse.created_at).all()
        
        ai_response_data = []
        for ai_response in ai_responses:
            ai_response_data.append({
                'id': ai_response.id,
                'question_id': ai_response.question_id,
                'response_type': ai_response.response_type,
                'response_text': ai_response.response_text,
                'context_data': ai_response.context_data,
                'created_at': ai_response.created_at.isoformat()
            })
        
        return jsonify({
            'success': True,
            'ai_responses': ai_response_data
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/sessions/<session_id>/recordings', methods=['GET'])
def get_session_recordings(session_id):
    """Get all recordings for a session"""
    if not require_admin_auth():
        return jsonify({'error': 'Authentication required'}), 401
    
    try:
        from src.models.interview import Recording
        
        session_obj = InterviewSession.query.filter_by(session_id=session_id).first()
        if not session_obj:
            return jsonify({'error': 'Session not found'}), 404
        
        recordings = Recording.query.filter_by(session_id=session_obj.id).all()
        
        recording_data = []
        for recording in recordings:
            recording_data.append({
                'id': recording.id,
                'recording_type': recording.recording_type,
                'file_path': recording.file_path,
                'file_size': recording.file_size,
                'duration': recording.duration,
                'created_at': recording.created_at.isoformat()
            })
        
        return jsonify({
            'success': True,
            'recordings': recording_data
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/recordings/<int:recording_id>/download', methods=['GET'])
def download_recording(recording_id):
    """Download a recording file"""
    if not require_admin_auth():
        return jsonify({'error': 'Authentication required'}), 401
    
    try:
        from src.models.interview import Recording
        from flask import send_file
        import os
        
        recording = Recording.query.get_or_404(recording_id)
        
        if not os.path.exists(recording.file_path):
            return jsonify({'error': 'Recording file not found'}), 404
        
        return send_file(
            recording.file_path,
            as_attachment=True,
            download_name=f'recording_{recording_id}.webm'
        )
        
    except Exception as e:

        return jsonify({'error': str(e)}), 500

