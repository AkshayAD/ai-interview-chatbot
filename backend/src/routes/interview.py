from flask import Blueprint, request, jsonify
from datetime import datetime
import json
from src.models.interview import (
    db, InterviewCode, QuestionSet, Question, InterviewSession, 
    QuestionResponse, AIPromptTemplate
)

interview_bp = Blueprint('interview', __name__)

@interview_bp.route('/validate-code', methods=['POST'])
def validate_code():
    """Validate interview code and candidate name"""
    try:
        data = request.get_json()
        code = data.get('code', '').strip()
        candidate_name = data.get('candidate_name', '').strip()
        
        if not code or not candidate_name:
            return jsonify({'error': 'Code and candidate name are required'}), 400
        
        # Find the interview code
        interview_code = InterviewCode.query.filter_by(code=code, is_used=False).first()
        
        if not interview_code:
            return jsonify({'error': 'Invalid or already used code'}), 404
        
        # Check if code has expired
        if interview_code.expires_at and interview_code.expires_at < datetime.utcnow():
            return jsonify({'error': 'Code has expired'}), 400
        
        # Get active question set
        question_set = QuestionSet.query.filter_by(is_active=True).first()
        if not question_set:
            return jsonify({'error': 'No active question set available'}), 500
        
        # Create interview session
        session = InterviewSession(
            code_id=interview_code.id,
            candidate_name=candidate_name,
            question_set_id=question_set.id,
            status='pending'
        )
        
        # Mark code as used
        interview_code.is_used = True
        interview_code.used_at = datetime.utcnow()
        interview_code.candidate_name = candidate_name
        
        db.session.add(session)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'session_id': session.session_id,
            'candidate_name': candidate_name,
            'question_set': {
                'id': question_set.id,
                'name': question_set.name,
                'description': question_set.description
            }
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@interview_bp.route('/session/<session_id>', methods=['GET'])
def get_session(session_id):
    """Get interview session details"""
    try:
        session = InterviewSession.query.filter_by(session_id=session_id).first()
        
        if not session:
            return jsonify({'error': 'Session not found'}), 404
        
        # Get questions for the session
        questions = Question.query.filter_by(question_set_id=session.question_set_id).order_by(Question.order_index).all()
        
        return jsonify({
            'session': {
                'id': session.session_id,
                'candidate_name': session.candidate_name,
                'status': session.status,
                'current_question_id': session.current_question_id,
                'started_at': session.started_at.isoformat() if session.started_at else None,
                'question_set': {
                    'id': session.question_set.id,
                    'name': session.question_set.name,
                    'description': session.question_set.description
                }
            },
            'questions': [{
                'id': q.id,
                'text': q.text,
                'order_index': q.order_index,
                'time_limit': q.time_limit,
                'hints': json.loads(q.hints) if q.hints else []
            } for q in questions]
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@interview_bp.route('/session/<session_id>/start', methods=['POST'])
def start_session(session_id):
    """Start an interview session"""
    try:
        session = InterviewSession.query.filter_by(session_id=session_id).first()
        
        if not session:
            return jsonify({'error': 'Session not found'}), 404
        
        if session.status != 'pending':
            return jsonify({'error': 'Session already started or completed'}), 400
        
        # Get first question
        first_question = Question.query.filter_by(
            question_set_id=session.question_set_id
        ).order_by(Question.order_index).first()
        
        if not first_question:
            return jsonify({'error': 'No questions available'}), 500
        
        # Update session
        session.status = 'active'
        session.started_at = datetime.utcnow()
        session.current_question_id = first_question.id
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'current_question': {
                'id': first_question.id,
                'text': first_question.text,
                'time_limit': first_question.time_limit,
                'hints': json.loads(first_question.hints) if first_question.hints else []
            }
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@interview_bp.route('/session/<session_id>/next-question', methods=['POST'])
def next_question(session_id):
    """Move to the next question in the interview"""
    try:
        session = InterviewSession.query.filter_by(session_id=session_id).first()
        
        if not session:
            return jsonify({'error': 'Session not found'}), 404
        
        if session.status != 'active':
            return jsonify({'error': 'Session is not active'}), 400
        
        # Get current question
        current_question = Question.query.get(session.current_question_id)
        if not current_question:
            return jsonify({'error': 'Current question not found'}), 500
        
        # Get next question
        next_q = Question.query.filter(
            Question.question_set_id == session.question_set_id,
            Question.order_index > current_question.order_index
        ).order_by(Question.order_index).first()
        
        if next_q:
            # Move to next question
            session.current_question_id = next_q.id
            db.session.commit()
            
            return jsonify({
                'success': True,
                'current_question': {
                    'id': next_q.id,
                    'text': next_q.text,
                    'time_limit': next_q.time_limit,
                    'hints': json.loads(next_q.hints) if next_q.hints else []
                }
            })
        else:
            # No more questions, complete the interview
            session.status = 'completed'
            session.completed_at = datetime.utcnow()
            db.session.commit()
            
            return jsonify({
                'success': True,
                'interview_completed': True,
                'message': 'Interview completed successfully'
            })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@interview_bp.route('/session/<session_id>/response', methods=['POST'])
def save_response(session_id):
    """Save candidate response for a question"""
    try:
        data = request.get_json()
        question_id = data.get('question_id')
        transcript = data.get('transcript', '')
        ai_analysis = data.get('ai_analysis', {})
        ai_score = data.get('ai_score')
        
        session = InterviewSession.query.filter_by(session_id=session_id).first()
        
        if not session:
            return jsonify({'error': 'Session not found'}), 404
        
        # Check if response already exists
        existing_response = QuestionResponse.query.filter_by(
            session_id=session.id,
            question_id=question_id
        ).first()
        
        if existing_response:
            # Update existing response
            existing_response.transcript = transcript
            existing_response.ai_analysis = json.dumps(ai_analysis) if ai_analysis else None
            existing_response.ai_score = ai_score
            existing_response.completed_at = datetime.utcnow()
        else:
            # Create new response
            response = QuestionResponse(
                session_id=session.id,
                question_id=question_id,
                transcript=transcript,
                ai_analysis=json.dumps(ai_analysis) if ai_analysis else None,
                ai_score=ai_score,
                completed_at=datetime.utcnow()
            )
            db.session.add(response)
        
        db.session.commit()
        
        return jsonify({'success': True})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@interview_bp.route('/session/<session_id>/ai-prompt', methods=['GET'])
def get_ai_prompt(session_id):
    """Get AI prompt configuration for the session"""
    try:
        session = InterviewSession.query.filter_by(session_id=session_id).first()
        
        if not session:
            return jsonify({'error': 'Session not found'}), 404
        
        # Get session-specific prompt or default
        if session.ai_prompt_config:
            prompt_config = json.loads(session.ai_prompt_config)
        else:
            default_prompt = AIPromptTemplate.query.filter_by(is_default=True).first()
            if default_prompt:
                prompt_config = {
                    'template_id': default_prompt.id,
                    'prompt_text': default_prompt.prompt_text
                }
            else:
                return jsonify({'error': 'No AI prompt configuration available'}), 500
        
        return jsonify({'ai_prompt': prompt_config})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@interview_bp.route('/upload-recording', methods=['POST'])
def upload_recording():
    """Upload interview recording"""
    try:
        # Check if file is present
        if 'recording' not in request.files:
            return jsonify({'error': 'No recording file provided'}), 400
        
        file = request.files['recording']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Get form data
        session_id = request.form.get('session_id')
        question_id = request.form.get('question_id')
        recording_type = request.form.get('recording_type', 'video')
        duration = request.form.get('duration', '0')
        
        if not session_id:
            return jsonify({'error': 'Session ID is required'}), 400
        
        # Verify session exists
        session = InterviewSession.query.filter_by(session_id=session_id).first()
        if not session:
            return jsonify({'error': 'Invalid session ID'}), 404
        
        # Create uploads directory if it doesn't exist
        import os
        upload_dir = os.path.join(os.getcwd(), 'uploads', 'recordings')
        os.makedirs(upload_dir, exist_ok=True)
        
        # Generate unique filename
        import uuid
        file_extension = os.path.splitext(file.filename)[1] or '.webm'
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = os.path.join(upload_dir, unique_filename)
        
        # Save file temporarily
        file.save(file_path)
        file_size = os.path.getsize(file_path)
        
        # Upload to cloud storage
        from src.services.cloud_storage import cloud_storage
        storage_result = cloud_storage.upload_file(file_path, session_id, recording_type)
        
        # Save recording metadata to database
        from src.models.interview import Recording
        recording = Recording(
            session_id=session.id,
            question_id=int(question_id) if question_id and question_id.isdigit() else None,
            recording_type=recording_type,
            file_path=file_path if storage_result['storage_type'] == 'local' else storage_result.get('cloud_key', file_path),
            file_size=file_size,
            duration=float(duration) if duration else 0.0,
            cloud_url=storage_result.get('cloud_url'),
            storage_type=storage_result['storage_type']
        )
        
        db.session.add(recording)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'recording_id': recording.id,
            'file_size': file_size,
            'duration': recording.duration,
            'storage_type': storage_result['storage_type'],
            'message': 'Recording uploaded successfully'
        })
        
    except Exception as e:
        db.session.rollback()
        print(f"Error uploading recording: {str(e)}")
        return jsonify({'error': 'Failed to upload recording'}), 500

@interview_bp.route('/session/<session_id>/recordings', methods=['GET'])
def get_session_recordings(session_id):
    """Get all recordings for a session"""
    try:
        # Verify session exists
        session = InterviewSession.query.filter_by(session_id=session_id).first()
        if not session:
            return jsonify({'error': 'Session not found'}), 404
        
        # Get recordings
        from src.models.interview import Recording
        recordings = Recording.query.filter_by(session_id=session.id).order_by(Recording.created_at).all()
        
        recording_data = []
        for recording in recordings:
            recording_data.append({
                'id': recording.id,
                'recording_type': recording.recording_type,
                'file_size': recording.file_size,
                'duration': recording.duration,
                'question_id': recording.question_id,
                'created_at': recording.created_at.isoformat()
            })
        
        return jsonify({
            'success': True,
            'recordings': recording_data
        })
        
    except Exception as e:
        print(f"Error getting recordings: {str(e)}")
        return jsonify({'error': 'Failed to get recordings'}), 500

@interview_bp.route('/recording/<int:recording_id>/download', methods=['GET'])
def download_recording(recording_id):
    """Download a recording file"""
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
        print(f"Error downloading recording: {str(e)}")
        return jsonify({'error': 'Failed to download recording'}), 500

