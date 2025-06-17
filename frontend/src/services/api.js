import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // For session cookies
});

// Interview API
export const interviewAPI = {
  // Validate interview code and candidate name
  validateCode: async (code, candidateName) => {
    const response = await api.post('/api/interview/validate-code', {
      code,
      candidate_name: candidateName,
    });
    return response.data;
  },

  // Get session details
  getSession: async (sessionId) => {
    const response = await api.get(`/api/interview/session/${sessionId}`);
    return response.data;
  },

  // Start interview session
  startSession: async (sessionId) => {
    const response = await api.post(`/api/interview/session/${sessionId}/start`);
    return response.data;
  },

  // Move to next question
  nextQuestion: async (sessionId) => {
    const response = await api.post(`/api/interview/session/${sessionId}/next-question`);
    return response.data;
  },

  // Save response for a question
  saveResponse: async (sessionId, questionId, transcript, aiAnalysis, aiScore) => {
    const response = await api.post(`/api/interview/session/${sessionId}/response`, {
      question_id: questionId,
      transcript,
      ai_analysis: aiAnalysis,
      ai_score: aiScore,
    });
    return response.data;
  },

  // Get AI prompt configuration
  getAIPrompt: async (sessionId) => {
    const response = await api.get(`/api/interview/session/${sessionId}/ai-prompt`);
    return response.data;
  },
};

// Admin API
export const adminAPI = {
  // Admin login
  login: async (username, password) => {
    const response = await api.post('/api/admin/login', {
      username,
      password,
    });
    return response.data;
  },

  // Admin logout
  logout: async () => {
    const response = await api.post('/api/admin/logout');
    return response.data;
  },

  // Check authentication status
  checkAuth: async () => {
    const response = await api.get('/api/admin/check-auth');
    return response.data;
  },

  // Get all interview codes
  getCodes: async () => {
    const response = await api.get('/api/admin/codes');
    return response.data;
  },

  // Create new interview code
  createCode: async (expiresInHours = 24) => {
    const response = await api.post('/api/admin/codes', {
      expires_in_hours: expiresInHours,
    });
    return response.data;
  },

  // Delete interview code
  deleteCode: async (codeId) => {
    const response = await api.delete(`/api/admin/codes/${codeId}`);
    return response.data;
  },

  // Get all question sets
  getQuestionSets: async () => {
    const response = await api.get('/api/admin/question-sets');
    return response.data;
  },

  // Create new question set
  createQuestionSet: async (name, description, questions) => {
    const response = await api.post('/api/admin/question-sets', {
      name,
      description,
      questions,
    });
    return response.data;
  },

  // Activate question set
  activateQuestionSet: async (setId) => {
    const response = await api.post(`/api/admin/question-sets/${setId}/activate`);
    return response.data;
  },

  // Get all interview sessions
  getSessions: async () => {
    const response = await api.get('/api/admin/sessions');
    return response.data;
  },

  // Get session details
  getSessionDetails: async (sessionId) => {
    const response = await api.get(`/api/admin/sessions/${sessionId}/details`);
    return response.data;
  },

  // Get session responses
  getSessionResponses: async (sessionId) => {
    const response = await api.get(`/api/admin/sessions/${sessionId}/responses`);
    return response.data;
  },

  // Get session transcripts
  getSessionTranscripts: async (sessionId) => {
    const response = await api.get(`/api/admin/sessions/${sessionId}/transcripts`);
    return response.data;
  },

  // Get session AI responses
  getSessionAIResponses: async (sessionId) => {
    const response = await api.get(`/api/admin/sessions/${sessionId}/ai-responses`);
    return response.data;
  },

  // Get session recordings
  getSessionRecordings: async (sessionId) => {
    const response = await api.get(`/api/admin/sessions/${sessionId}/recordings`);
    return response.data;
  },

  // Download recording
  downloadRecording: async (recordingId) => {
    const response = await api.get(`/api/admin/recordings/${recordingId}/download`, {
      responseType: 'blob'
    });
    return response;
  },

  // Get single session
  getSession: async (sessionId) => {
    const response = await api.get(`/api/admin/sessions/${sessionId}`);
    return response.data;
  },

  // Get AI prompt templates
  getAIPrompts: async () => {
    const response = await api.get('/api/admin/ai-prompts');
    return response.data;
  },

  // Create AI prompt template
  createAIPrompt: async (data) => {
    const response = await api.post('/api/admin/ai-prompts', data);
    return response.data;
  },

  // Update AI prompt template
  updateAIPrompt: async (promptId, data) => {
    const response = await api.put(`/api/admin/ai-prompts/${promptId}`, data);
    return response.data;
  },

  // Delete AI prompt template
  deleteAIPrompt: async (promptId) => {
    const response = await api.delete(`/api/admin/ai-prompts/${promptId}`);
    return response.data;
  },

  // Activate AI prompt template
  activateAIPrompt: async (promptId) => {
    const response = await api.post(`/api/admin/ai-prompts/${promptId}/activate`);
    return response.data;
  },
};

export default api;

