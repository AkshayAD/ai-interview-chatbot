# AI Video Interview Chatbot - API Documentation

## Overview

This document provides comprehensive API documentation for the AI Video Interview Chatbot backend. The API is built with Flask and provides RESTful endpoints for interview management, real-time communication, and administrative functions.

## Base URL

```
Development: http://localhost:5000
Production: https://your-backend-domain.com
```

## Authentication

The API uses session-based authentication for admin endpoints. Admin users must login to receive a session cookie that authenticates subsequent requests.

### Admin Authentication Flow

1. POST `/api/admin/login` - Authenticate admin user
2. Use session cookie for subsequent admin API calls
3. POST `/api/admin/logout` - End admin session

## API Endpoints

### Admin Authentication

#### POST /api/admin/login

Authenticate admin user and create session.

**Request Body:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Login successful",
  "admin": {
    "id": 1,
    "username": "admin"
  }
}
```

**Response (Error):**
```json
{
  "error": "Invalid credentials"
}
```

#### POST /api/admin/logout

End admin session.

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### GET /api/admin/check-auth

Check if admin is authenticated.

**Response (Authenticated):**
```json
{
  "authenticated": true,
  "admin": {
    "id": 1,
    "username": "admin"
  }
}
```

**Response (Not Authenticated):**
```json
{
  "authenticated": false
}
```

### Interview Code Management

#### POST /api/admin/codes

Create a new interview code.

**Authentication:** Required

**Request Body:**
```json
{
  "expires_in_hours": 24
}
```

**Response:**
```json
{
  "success": true,
  "code": "ABC12345",
  "expires_at": "2024-01-15T10:30:00Z"
}
```

#### GET /api/admin/codes

Get all interview codes.

**Authentication:** Required

**Response:**
```json
{
  "codes": [
    {
      "id": 1,
      "code": "ABC12345",
      "candidate_name": null,
      "is_used": false,
      "created_at": "2024-01-14T10:30:00Z",
      "expires_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### DELETE /api/admin/codes/{code_id}

Delete an interview code.

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "message": "Code deleted successfully"
}
```

### Question Set Management

#### POST /api/admin/question-sets

Create a new question set.

**Authentication:** Required

**Request Body:**
```json
{
  "name": "Technical Interview",
  "description": "Questions for software engineering positions",
  "questions": [
    {
      "text": "Explain the difference between REST and GraphQL APIs.",
      "time_limit": 300,
      "hints": "Consider data fetching, query flexibility, and caching."
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "question_set_id": 1,
  "message": "Question set created successfully"
}
```

#### GET /api/admin/question-sets

Get all question sets.

**Authentication:** Required

**Response:**
```json
{
  "question_sets": [
    {
      "id": 1,
      "name": "Technical Interview",
      "description": "Questions for software engineering positions",
      "is_active": true,
      "created_at": "2024-01-14T10:30:00Z",
      "questions": [
        {
          "id": 1,
          "text": "Explain the difference between REST and GraphQL APIs.",
          "order_index": 0,
          "time_limit": 300,
          "hints": "Consider data fetching, query flexibility, and caching."
        }
      ]
    }
  ]
}
```

#### PUT /api/admin/question-sets/{set_id}/activate

Activate a question set for interviews.

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "message": "Question set activated successfully"
}
```

#### DELETE /api/admin/question-sets/{set_id}

Delete a question set.

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "message": "Question set deleted successfully"
}
```

### Interview Session Management

#### POST /api/interview/validate-code

Validate interview code and start session.

**Request Body:**
```json
{
  "code": "ABC12345",
  "candidate_name": "John Doe"
}
```

**Response (Success):**
```json
{
  "success": true,
  "session_id": "uuid-session-id",
  "candidate_name": "John Doe",
  "questions": [
    {
      "id": 1,
      "text": "Explain the difference between REST and GraphQL APIs.",
      "time_limit": 300,
      "order_index": 0
    }
  ]
}
```

**Response (Error):**
```json
{
  "error": "Invalid or expired code"
}
```

#### POST /api/interview/submit-response

Submit candidate response to a question.

**Request Body:**
```json
{
  "session_id": "uuid-session-id",
  "question_id": 1,
  "transcript": "REST APIs use HTTP methods and endpoints...",
  "ai_analysis": "Good understanding of REST principles...",
  "ai_score": 8.5
}
```

**Response:**
```json
{
  "success": true,
  "response_id": 1,
  "message": "Response submitted successfully"
}
```

#### GET /api/interview/session/{session_id}/status

Get interview session status.

**Response:**
```json
{
  "session": {
    "id": "uuid-session-id",
    "candidate_name": "John Doe",
    "status": "in_progress",
    "current_question": 1,
    "started_at": "2024-01-14T10:30:00Z",
    "completed_at": null
  }
}
```

### Recording Management

#### POST /api/interview/upload-recording

Upload interview recording.

**Content-Type:** multipart/form-data

**Form Data:**
- `recording`: File (video/audio recording)
- `session_id`: String (session identifier)
- `question_id`: Integer (optional, question being answered)
- `recording_type`: String ("video" or "audio")
- `duration`: Float (recording duration in seconds)

**Response:**
```json
{
  "success": true,
  "recording_id": 1,
  "file_size": 1048576,
  "duration": 120.5,
  "storage_type": "cloud",
  "message": "Recording uploaded successfully"
}
```

#### GET /api/interview/session/{session_id}/recordings

Get all recordings for a session.

**Response:**
```json
{
  "success": true,
  "recordings": [
    {
      "id": 1,
      "recording_type": "video",
      "file_size": 1048576,
      "duration": 120.5,
      "question_id": 1,
      "created_at": "2024-01-14T10:30:00Z"
    }
  ]
}
```

#### GET /api/interview/recording/{recording_id}/download

Download a recording file.

**Authentication:** Admin required

**Response:** File download (video/audio file)

### Admin Session Management

#### GET /api/admin/sessions

Get all interview sessions.

**Authentication:** Required

**Query Parameters:**
- `status`: Filter by session status (optional)
- `limit`: Number of sessions to return (default: 50)
- `offset`: Pagination offset (default: 0)

**Response:**
```json
{
  "sessions": [
    {
      "id": 1,
      "session_id": "uuid-session-id",
      "candidate_name": "John Doe",
      "status": "completed",
      "started_at": "2024-01-14T10:30:00Z",
      "completed_at": "2024-01-14T11:00:00Z",
      "question_set_name": "Technical Interview"
    }
  ],
  "total": 1,
  "limit": 50,
  "offset": 0
}
```

#### GET /api/admin/sessions/{session_id}/details

Get detailed session information.

**Authentication:** Required

**Response:**
```json
{
  "session": {
    "id": 1,
    "session_id": "uuid-session-id",
    "candidate_name": "John Doe",
    "status": "completed",
    "started_at": "2024-01-14T10:30:00Z",
    "completed_at": "2024-01-14T11:00:00Z"
  },
  "responses": [
    {
      "id": 1,
      "question_id": 1,
      "question_text": "Explain the difference between REST and GraphQL APIs.",
      "transcript": "REST APIs use HTTP methods...",
      "ai_analysis": "Good understanding...",
      "ai_score": 8.5,
      "started_at": "2024-01-14T10:30:00Z",
      "completed_at": "2024-01-14T10:35:00Z"
    }
  ],
  "transcripts": [
    {
      "id": 1,
      "text": "REST APIs use HTTP methods",
      "confidence": 0.95,
      "start_time": 0.0,
      "end_time": 2.5,
      "created_at": "2024-01-14T10:30:00Z"
    }
  ],
  "recordings": [
    {
      "id": 1,
      "recording_type": "video",
      "file_size": 1048576,
      "duration": 120.5,
      "created_at": "2024-01-14T10:30:00Z"
    }
  ]
}
```

### AI Prompt Management

#### GET /api/admin/ai-prompts

Get all AI prompt templates.

**Authentication:** Required

**Response:**
```json
{
  "prompts": [
    {
      "id": 1,
      "name": "Default Interview Assistant",
      "description": "Standard AI assistant for interviews",
      "prompt_text": "You are a helpful interview assistant...",
      "is_default": true,
      "created_at": "2024-01-14T10:30:00Z",
      "updated_at": "2024-01-14T10:30:00Z"
    }
  ]
}
```

#### POST /api/admin/ai-prompts

Create a new AI prompt template.

**Authentication:** Required

**Request Body:**
```json
{
  "name": "Technical Interview Assistant",
  "description": "AI assistant specialized for technical interviews",
  "prompt_text": "You are a technical interview assistant. Based on the question '{question}' and candidate response '{transcript}', provide technical feedback and guidance.",
  "is_default": false
}
```

**Response:**
```json
{
  "success": true,
  "prompt_id": 2,
  "message": "AI prompt created successfully"
}
```

#### PUT /api/admin/ai-prompts/{prompt_id}

Update an AI prompt template.

**Authentication:** Required

**Request Body:**
```json
{
  "name": "Updated Technical Assistant",
  "description": "Updated description",
  "prompt_text": "Updated prompt text...",
  "is_default": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "AI prompt updated successfully"
}
```

#### DELETE /api/admin/ai-prompts/{prompt_id}

Delete an AI prompt template.

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "message": "AI prompt deleted successfully"
}
```

## WebSocket Events

The application uses Socket.IO for real-time communication during interviews.

### Client Events (Frontend → Backend)

#### join_interview

Join an interview session for real-time updates.

**Data:**
```json
{
  "session_id": "uuid-session-id"
}
```

#### audio_data

Send audio data for real-time transcription.

**Data:**
```json
{
  "session_id": "uuid-session-id",
  "audio_data": "base64-encoded-audio",
  "question_id": 1
}
```

#### request_ai_response

Request AI assistance during interview.

**Data:**
```json
{
  "session_id": "uuid-session-id",
  "question_id": 1,
  "transcript": "Current candidate response...",
  "response_type": "hint"
}
```

### Server Events (Backend → Frontend)

#### transcription_update

Real-time transcription update.

**Data:**
```json
{
  "session_id": "uuid-session-id",
  "transcript": "Transcribed text...",
  "confidence": 0.95,
  "is_final": false
}
```

#### ai_response

AI assistant response.

**Data:**
```json
{
  "session_id": "uuid-session-id",
  "response_type": "hint",
  "message": "Consider explaining the benefits of each approach...",
  "question_id": 1
}
```

#### interview_status

Interview status update.

**Data:**
```json
{
  "session_id": "uuid-session-id",
  "status": "question_completed",
  "current_question": 2
}
```

## Error Handling

### HTTP Status Codes

- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Access denied
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

### Error Response Format

```json
{
  "error": "Error message description",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional error details"
  }
}
```

### Common Error Codes

- `INVALID_CODE`: Interview code is invalid or expired
- `SESSION_NOT_FOUND`: Interview session not found
- `AUTHENTICATION_REQUIRED`: Admin authentication required
- `INVALID_CREDENTIALS`: Login credentials are incorrect
- `UPLOAD_FAILED`: File upload failed
- `AI_SERVICE_ERROR`: AI service unavailable

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

- **Admin endpoints**: 100 requests per minute
- **Interview endpoints**: 50 requests per minute
- **Upload endpoints**: 10 requests per minute
- **WebSocket connections**: 5 connections per IP

## Data Models

### InterviewSession

```json
{
  "id": 1,
  "session_id": "uuid-string",
  "candidate_name": "string",
  "status": "pending|in_progress|completed|cancelled",
  "started_at": "ISO-8601-datetime",
  "completed_at": "ISO-8601-datetime|null",
  "question_set_id": 1
}
```

### QuestionResponse

```json
{
  "id": 1,
  "session_id": 1,
  "question_id": 1,
  "transcript": "string",
  "ai_analysis": "string",
  "ai_score": 8.5,
  "started_at": "ISO-8601-datetime",
  "completed_at": "ISO-8601-datetime"
}
```

### Recording

```json
{
  "id": 1,
  "session_id": 1,
  "question_id": 1,
  "recording_type": "video|audio",
  "file_path": "string",
  "file_size": 1048576,
  "duration": 120.5,
  "cloud_url": "string|null",
  "storage_type": "local|cloud",
  "created_at": "ISO-8601-datetime"
}
```

## SDK and Integration Examples

### JavaScript/Node.js Example

```javascript
// Admin login
const loginResponse = await fetch('/api/admin/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    username: 'admin',
    password: 'admin123'
  }),
  credentials: 'include' // Include cookies
});

// Create interview code
const codeResponse = await fetch('/api/admin/codes', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    expires_in_hours: 24
  }),
  credentials: 'include'
});

// WebSocket connection
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

socket.emit('join_interview', {
  session_id: 'uuid-session-id'
});

socket.on('transcription_update', (data) => {
  console.log('Transcription:', data.transcript);
});
```

### Python Example

```python
import requests
import json

# Admin login
session = requests.Session()
login_response = session.post('http://localhost:5000/api/admin/login', 
  json={
    'username': 'admin',
    'password': 'admin123'
  }
)

# Create interview code
code_response = session.post('http://localhost:5000/api/admin/codes',
  json={
    'expires_in_hours': 24
  }
)

print(code_response.json())
```

This API documentation provides comprehensive information for integrating with the AI Video Interview Chatbot backend. For additional support or questions about specific endpoints, please refer to the source code or contact the development team.

