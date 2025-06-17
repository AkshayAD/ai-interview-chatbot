import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  connect() {
    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        autoConnect: true,
      });

      this.socket.on('connect', () => {
        console.log('Connected to server');
        this.isConnected = true;
      });

      this.socket.on('disconnect', () => {
        console.log('Disconnected from server');
        this.isConnected = false;
      });

      this.socket.on('error', (error) => {
        console.error('Socket error:', error);
      });
    }
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Interview session events
  joinInterview(sessionId) {
    if (this.socket) {
      this.socket.emit('join_interview', { session_id: sessionId });
    }
  }

  leaveInterview(sessionId) {
    if (this.socket) {
      this.socket.emit('leave_interview', { session_id: sessionId });
    }
  }

  // Audio/Video events
  sendAudioData(sessionId, audioData, timestamp) {
    if (this.socket) {
      this.socket.emit('audio_data', {
        session_id: sessionId,
        audio_data: audioData,
        timestamp: timestamp,
      });
    }
  }

  startVideoStream(sessionId, config) {
    if (this.socket) {
      this.socket.emit('video_stream_start', {
        session_id: sessionId,
        config: config,
      });
    }
  }

  stopVideoStream(sessionId) {
    if (this.socket) {
      this.socket.emit('video_stream_stop', {
        session_id: sessionId,
      });
    }
  }

  // Transcript events
  sendTranscriptSegment(sessionId, text, confidence, startTime, endTime, questionId) {
    if (this.socket) {
      this.socket.emit('transcript_segment', {
        session_id: sessionId,
        text: text,
        confidence: confidence,
        start_time: startTime,
        end_time: endTime,
        question_id: questionId,
      });
    }
  }

  // AI response events
  requestAIResponse(sessionId, questionId, transcriptContext, type = 'hint') {
    if (this.socket) {
      this.socket.emit('ai_response_request', {
        session_id: sessionId,
        question_id: questionId,
        transcript_context: transcriptContext,
        type: type,
      });
    }
  }

  // Recording events
  sendRecordingMetadata(sessionId, questionId, type, fileInfo) {
    if (this.socket) {
      this.socket.emit('recording_metadata', {
        session_id: sessionId,
        question_id: questionId,
        type: type,
        file_info: fileInfo,
      });
    }
  }

  // Session status events
  updateSessionStatus(sessionId, status) {
    if (this.socket) {
      this.socket.emit('session_status_update', {
        session_id: sessionId,
        status: status,
      });
    }
  }

  // Event listeners
  onJoinedInterview(callback) {
    if (this.socket) {
      this.socket.on('joined_interview', callback);
    }
  }

  onLeftInterview(callback) {
    if (this.socket) {
      this.socket.on('left_interview', callback);
    }
  }

  onAudioProcessed(callback) {
    if (this.socket) {
      this.socket.on('audio_processed', callback);
    }
  }

  onTranscriptUpdate(callback) {
    if (this.socket) {
      this.socket.on('transcript_update', callback);
    }
  }

  onAIResponse(callback) {
    if (this.socket) {
      this.socket.on('ai_response', callback);
    }
  }

  onVideoStreamStarted(callback) {
    if (this.socket) {
      this.socket.on('video_stream_started', callback);
    }
  }

  onVideoStreamStopped(callback) {
    if (this.socket) {
      this.socket.on('video_stream_stopped', callback);
    }
  }

  onRecordingSaved(callback) {
    if (this.socket) {
      this.socket.on('recording_saved', callback);
    }
  }

  onSessionStatusUpdated(callback) {
    if (this.socket) {
      this.socket.on('session_status_updated', callback);
    }
  }

  onError(callback) {
    if (this.socket) {
      this.socket.on('error', callback);
    }
  }

  // Remove event listeners
  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;

