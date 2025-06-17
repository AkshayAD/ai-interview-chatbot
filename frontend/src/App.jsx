import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CandidateLanding from './pages/CandidateLanding';
import InterviewSession from './pages/InterviewSession';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import SessionDetails from './pages/SessionDetails';
import AIPromptManagement from './pages/AIPromptManagement';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Candidate Routes */}
          <Route path="/" element={<CandidateLanding />} />
          <Route path="/interview/:sessionId" element={<InterviewSession />} />
          
          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/sessions/:sessionId" element={<SessionDetails />} />
          <Route path="/admin/ai-prompts" element={<AIPromptManagement />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;