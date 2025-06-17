from flask import Blueprint, request
from flask_socketio import emit, join_room, leave_room, disconnect
from datetime import datetime
import json
from src.models.interview import (
    db, InterviewSession, TranscriptSegment, Recording
)

socketio_bp = Blueprint('websocket', __name__)

# Store active sessions
active_sessions = {}

def handle_connect():
    """Handle client connection"""
    print(f"Client connected: {request.sid}")
    emit('connected', {'message': 'Connected to interview server'})

def handle_disconnect():
    """Handle client disconnection"""
    print(f"Client disconnected: {request.sid}")
    # Clean up any active sessions for this client
    for session_id, session_data in list(active_sessions.items()):
        if session_data.get('client_id') == request.sid:
            del active_sessions[session_id]
            break

def handle_join_interview(data):
    """Handle candidate joining an interview session"""
    try:
        session_id = data.get('session_id')
        
        if not session_id:
            emit('error', {'message': 'Session ID is required'})
            return
        
        # Verify session exists
        session = InterviewSession.query.filter_by(session_id=session_id).first()
        if not session:
            emit('error', {'message': 'Invalid session ID'})
            return
        
        # Join the room
        join_room(session_id)
        
        # Store session info
        active_sessions[session_id] = {
            'client_id': request.sid,
            'session_db_id': session.id,
            'candidate_name': session.candidate_name,
            'status': session.status,
            'joined_at': datetime.utcnow()
        }
        
        emit('joined_interview', {
            'session_id': session_id,
            'candidate_name': session.candidate_name,
            'status': session.status
        })
        
        print(f"Candidate {session.candidate_name} joined session {session_id}")
        
    except Exception as e:
        emit('error', {'message': str(e)})

def handle_leave_interview(data):
    """Handle candidate leaving an interview session"""
    try:
        session_id = data.get('session_id')
        
        if session_id in active_sessions:
            leave_room(session_id)
            del active_sessions[session_id]
            
        emit('left_interview', {'session_id': session_id})
        
    except Exception as e:
        emit('error', {'message': str(e)})

def handle_audio_data(data):
    """Handle real-time audio data for transcription"""
    try:
        session_id = data.get('session_id')
        audio_data = data.get('audio_data')  # Base64 encoded audio
        timestamp = data.get('timestamp', datetime.utcnow().timestamp())
        
        if not session_id or not audio_data:
            emit('error', {'message': 'Session ID and audio data are required'})
            return
        
        # Verify session is active
        if session_id not in active_sessions:
            emit('error', {'message': 'Session not active'})
            return
        
        # Process audio with Gemini API asynchronously
        import asyncio
        from src.services.gemini_service import gemini_service
        
        async def process_transcription():
            try:
                import base64
                # Decode audio data
                audio_bytes = base64.b64decode(audio_data)
                
                # Get transcription from Gemini
                transcription = await gemini_service.transcribe_audio(audio_bytes, 'webm')
                
                if transcription and transcription.strip():
                    # Save transcript segment
                    session = InterviewSession.query.filter_by(session_id=session_id).first()
                    if session:
                        segment = TranscriptSegment(
                            session_id=session.id,
                            text=transcription,
                            confidence=0.95,  # Gemini doesn't provide confidence
                            start_time=timestamp,
                            end_time=timestamp + 2.0  # Assume 2-second chunks
                        )
                        db.session.add(segment)
                        db.session.commit()
                        
                        # Broadcast transcript to room
                        emit('transcript_update', {
                            'session_id': session_id,
                            'text': transcription,
                            'confidence': 0.95,
                            'timestamp': timestamp
                        }, room=session_id)
                
            except Exception as e:
                print(f"Error processing transcription: {str(e)}")
                emit('error', {'message': 'Failed to process transcription'})
        
        # Run transcription in background
        asyncio.create_task(process_transcription())
        
        # Acknowledge receipt immediately
        emit('audio_processed', {
            'session_id': session_id,
            'timestamp': timestamp,
            'status': 'processing'
        })
        
    except Exception as e:
        emit('error', {'message': str(e)})

def handle_transcript_segment(data):
    """Handle transcribed text segment"""
    try:
        session_id = data.get('session_id')
        text = data.get('text', '')
        confidence = data.get('confidence', 0.0)
        start_time = data.get('start_time', 0.0)
        end_time = data.get('end_time', 0.0)
        question_id = data.get('question_id')
        
        if not session_id or not text:
            emit('error', {'message': 'Session ID and text are required'})
            return
        
        # Get session from database
        session = InterviewSession.query.filter_by(session_id=session_id).first()
        if not session:
            emit('error', {'message': 'Session not found'})
            return
        
        # Save transcript segment
        segment = TranscriptSegment(
            session_id=session.id,
            question_id=question_id,
            text=text,
            confidence=confidence,
            start_time=start_time,
            end_time=end_time
        )
        
        db.session.add(segment)
        db.session.commit()
        
        # Broadcast transcript to room
        emit('transcript_update', {
            'session_id': session_id,
            'text': text,
            'confidence': confidence,
            'start_time': start_time,
            'end_time': end_time,
            'question_id': question_id
        }, room=session_id)
        
    except Exception as e:
        db.session.rollback()
        emit('error', {'message': str(e)})

def handle_ai_response_request(data):
    """Handle request for AI response/hint"""
    try:
        session_id = data.get('session_id')
        question_id = data.get('question_id')
        transcript_context = data.get('transcript_context', '')
        request_type = data.get('type', 'hint')  # hint, clarification, encouragement
        
        if not session_id or not question_id:
            emit('error', {'message': 'Session ID and question ID are required'})
            return
        
        # Verify session
        session = InterviewSession.query.filter_by(session_id=session_id).first()
        if not session:
            emit('error', {'message': 'Session not found'})
            return
        
        # Process AI response with Gemini API asynchronously
        import asyncio
        from src.services.gemini_service import gemini_service
        from src.models.interview import Question
        
        async def process_ai_response():
            try:
                # Get question text
                question = Question.query.filter_by(id=question_id).first()
                if not question:
                    emit('error', {'message': 'Question not found'})
                    return
                
                # Get AI prompt from session's question set
                ai_prompt = None
                if session.question_set and hasattr(session.question_set, 'ai_prompt'):
                    ai_prompt = session.question_set.ai_prompt.prompt_text if session.question_set.ai_prompt else None
                
                # Generate AI response
                ai_response_data = await gemini_service.generate_ai_response(
                    question.text, transcript_context, request_type, ai_prompt
                )
                
                if ai_response_data:
                    # Save AI response to database
                    from src.models.interview import AIResponse
                    ai_response = AIResponse(
                        session_id=session.id,
                        question_id=question_id,
                        response_type=request_type,
                        response_text=ai_response_data.get('message', ''),
                        context_data={
                            'transcript_length': len(transcript_context),
                            'response_type': request_type,
                            'gemini_response': ai_response_data
                        }
                    )
                    db.session.add(ai_response)
                    db.session.commit()
                    
                    # Send AI response to the session
                    emit('ai_response', {
                        'session_id': session_id,
                        'question_id': question_id,
                        'response': {
                            'type': ai_response_data.get('type', request_type),
                            'message': ai_response_data.get('message', ''),
                            'timestamp': ai_response.created_at.isoformat()
                        }
                    }, room=session_id)
                else:
                    # Fallback response if Gemini fails
                    fallback_responses = {
                        'hint': "Try breaking down the problem into smaller components and think about the key factors involved.",
                        'clarification': "Consider what assumptions you're making and whether they're reasonable for this type of problem.",
                        'encouragement': "You're on the right track! Keep thinking through it step by step."
                    }
                    
                    fallback_message = fallback_responses.get(request_type, fallback_responses['hint'])
                    
                    emit('ai_response', {
                        'session_id': session_id,
                        'question_id': question_id,
                        'response': {
                            'type': request_type,
                            'message': fallback_message,
                            'timestamp': datetime.utcnow().isoformat()
                        }
                    }, room=session_id)
                
            except Exception as e:
                print(f"Error processing AI response: {str(e)}")
                emit('error', {'message': 'Failed to generate AI response'})
        
        # Run AI response generation in background
        asyncio.create_task(process_ai_response())
        
        # Acknowledge request immediately
        emit('ai_request_received', {
            'session_id': session_id,
            'question_id': question_id,
            'type': request_type
        })
        
    except Exception as e:
        emit('error', {'message': str(e)})

def handle_video_stream_start(data):
    """Handle video stream start"""
    try:
        session_id = data.get('session_id')
        stream_config = data.get('config', {})
        
        if not session_id:
            emit('error', {'message': 'Session ID is required'})
            return
        
        # Verify session
        if session_id not in active_sessions:
            emit('error', {'message': 'Session not active'})
            return
        
        # Update session with video stream info
        active_sessions[session_id]['video_stream'] = {
            'active': True,
            'config': stream_config,
            'started_at': datetime.utcnow()
        }
        
        emit('video_stream_started', {
            'session_id': session_id,
            'config': stream_config
        }, room=session_id)
        
    except Exception as e:
        emit('error', {'message': str(e)})

def handle_video_stream_stop(data):
    """Handle video stream stop"""
    try:
        session_id = data.get('session_id')
        
        if session_id in active_sessions:
            if 'video_stream' in active_sessions[session_id]:
                active_sessions[session_id]['video_stream']['active'] = False
                active_sessions[session_id]['video_stream']['stopped_at'] = datetime.utcnow()
        
        emit('video_stream_stopped', {
            'session_id': session_id
        }, room=session_id)
        
    except Exception as e:
        emit('error', {'message': str(e)})

def handle_recording_metadata(data):
    """Handle recording metadata"""
    try:
        session_id = data.get('session_id')
        question_id = data.get('question_id')
        recording_type = data.get('type', 'video')  # audio, video, screen
        file_info = data.get('file_info', {})
        
        if not session_id:
            emit('error', {'message': 'Session ID is required'})
            return
        
        # Get session from database
        session = InterviewSession.query.filter_by(session_id=session_id).first()
        if not session:
            emit('error', {'message': 'Session not found'})
            return
        
        # Save recording metadata
        recording = Recording(
            session_id=session.id,
            question_id=question_id,
            recording_type=recording_type,
            file_path=file_info.get('path', ''),
            file_size=file_info.get('size'),
            duration=file_info.get('duration')
        )
        
        db.session.add(recording)
        db.session.commit()
        
        emit('recording_saved', {
            'session_id': session_id,
            'recording_id': recording.id,
            'type': recording_type
        }, room=session_id)
        
    except Exception as e:
        db.session.rollback()
        emit('error', {'message': str(e)})

def handle_session_status_update(data):
    """Handle session status updates"""
    try:
        session_id = data.get('session_id')
        status = data.get('status')
        
        if not session_id or not status:
            emit('error', {'message': 'Session ID and status are required'})
            return
        
        # Update session in database
        session = InterviewSession.query.filter_by(session_id=session_id).first()
        if session:
            session.status = status
            if status == 'completed':
                session.completed_at = datetime.utcnow()
            db.session.commit()
        
        # Update active session
        if session_id in active_sessions:
            active_sessions[session_id]['status'] = status
        
        emit('session_status_updated', {
            'session_id': session_id,
            'status': status
        }, room=session_id)
        
    except Exception as e:
        db.session.rollback()
        emit('error', {'message': str(e)})

# Register socket event handlers
def register_socket_handlers(socketio):
    """Register all socket event handlers"""
    socketio.on_event('connect', handle_connect)
    socketio.on_event('disconnect', handle_disconnect)
    socketio.on_event('join_interview', handle_join_interview)
    socketio.on_event('leave_interview', handle_leave_interview)
    socketio.on_event('audio_data', handle_audio_data)
    socketio.on_event('transcript_segment', handle_transcript_segment)
    socketio.on_event('ai_response_request', handle_ai_response_request)
    socketio.on_event('video_stream_start', handle_video_stream_start)
    socketio.on_event('video_stream_stop', handle_video_stream_stop)
    socketio.on_event('recording_metadata', handle_recording_metadata)
    socketio.on_event('session_status_update', handle_session_status_update)

