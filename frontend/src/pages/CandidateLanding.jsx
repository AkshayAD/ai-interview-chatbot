import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Video, Mic, Users } from 'lucide-react';
import { interviewAPI } from '../services/api';

const CandidateLanding = () => {
  const [formData, setFormData] = useState({
    candidateName: '',
    interviewCode: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.candidateName.trim() || !formData.interviewCode.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await interviewAPI.validateCode(
        formData.interviewCode.trim(),
        formData.candidateName.trim()
      );

      if (response.success) {
        // Navigate to interview session
        navigate(`/interview/${response.session_id}`);
      } else {
        setError(response.error || 'Failed to validate code');
      }
    } catch (err) {
      console.error('Validation error:', err);
      setError(
        err.response?.data?.error || 
        'Failed to validate code. Please check your code and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-600 p-3 rounded-full">
              <Video className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            AI Interview Chatbot
          </h1>
          <p className="text-gray-600">
            Welcome to your AI-powered interview session
          </p>
        </div>

        {/* Main Form Card */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl text-center">Join Interview</CardTitle>
            <CardDescription className="text-center">
              Enter your details to start the interview session
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="candidateName">Full Name</Label>
                <Input
                  id="candidateName"
                  name="candidateName"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.candidateName}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="interviewCode">Interview Code</Label>
                <Input
                  id="interviewCode"
                  name="interviewCode"
                  type="text"
                  placeholder="Enter your interview code"
                  value={formData.interviewCode}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="w-full uppercase"
                  style={{ textTransform: 'uppercase' }}
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Validating...
                  </>
                ) : (
                  'Start Interview'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Features Info */}
        <div className="mt-8 grid grid-cols-1 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 p-2 rounded-full">
                <Video className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Video Recording</h3>
                <p className="text-sm text-gray-600">Your interview will be recorded for review</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 rounded-full">
                <Mic className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Live Transcription</h3>
                <p className="text-sm text-gray-600">Real-time speech-to-text conversion</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="bg-purple-100 p-2 rounded-full">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">AI Assistant</h3>
                <p className="text-sm text-gray-600">Get hints and guidance during the interview</p>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Link */}
        <div className="mt-8 text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin/login')}
            className="text-gray-500 hover:text-gray-700"
          >
            Admin Access
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CandidateLanding;

