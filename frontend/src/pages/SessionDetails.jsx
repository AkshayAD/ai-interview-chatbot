import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft, 
  Play, 
  Download, 
  MessageCircle, 
  Clock, 
  User,
  FileText,
  BarChart3,
  Bot
} from 'lucide-react';
import { adminAPI } from '../services/api';

const SessionDetails = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  
  const [session, setSession] = useState(null);
  const [responses, setResponses] = useState([]);
  const [transcripts, setTranscripts] = useState([]);
  const [aiResponses, setAiResponses] = useState([]);
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadSessionDetails();
  }, [sessionId]);

  const loadSessionDetails = async () => {
    try {
      setLoading(true);
      
      const [
        sessionResponse,
        responsesResponse,
        transcriptsResponse,
        aiResponsesResponse,
        recordingsResponse
      ] = await Promise.all([
        adminAPI.getSession(sessionId),
        adminAPI.getSessionResponses(sessionId),
        adminAPI.getSessionTranscripts(sessionId),
        adminAPI.getSessionAIResponses(sessionId),
        adminAPI.getSessionRecordings(sessionId)
      ]);

      setSession(sessionResponse.session);
      setResponses(responsesResponse.responses || []);
      setTranscripts(transcriptsResponse.transcripts || []);
      setAiResponses(aiResponsesResponse.ai_responses || []);
      setRecordings(recordingsResponse.recordings || []);
      
    } catch (err) {
      console.error('Failed to load session details:', err);
      setError('Failed to load session details');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const downloadRecording = async (recordingId) => {
    try {
      const response = await adminAPI.downloadRecording(recordingId);
      // Handle download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `recording_${recordingId}.webm`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Failed to download recording:', err);
      setError('Failed to download recording');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading session details...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Session Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">The requested session could not be found.</p>
            <Button onClick={() => navigate('/admin')} className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/admin')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Session Details</h1>
                <p className="text-gray-600">{session.candidate_name}</p>
              </div>
            </div>
            <Badge variant={
              session.status === 'completed' ? 'default' :
              session.status === 'active' ? 'secondary' : 'outline'
            }>
              {session.status}
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Session Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Candidate</p>
                  <p className="text-lg font-bold text-gray-900">{session.candidate_name}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <FileText className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Responses</p>
                  <p className="text-lg font-bold text-gray-900">{responses.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Clock className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Duration</p>
                  <p className="text-lg font-bold text-gray-900">
                    {session.completed_at ? 
                      formatDuration(
                        (new Date(session.completed_at) - new Date(session.created_at)) / 1000
                      ) : 'In Progress'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg Score</p>
                  <p className="text-lg font-bold text-gray-900">
                    {responses.length > 0 ? 
                      Math.round(
                        responses.reduce((sum, r) => sum + (r.ai_score || 0), 0) / responses.length
                      ) : 'N/A'
                    }%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Content */}
        <Tabs defaultValue="responses" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="responses">Responses</TabsTrigger>
            <TabsTrigger value="transcripts">Transcripts</TabsTrigger>
            <TabsTrigger value="ai-responses">AI Responses</TabsTrigger>
            <TabsTrigger value="recordings">Recordings</TabsTrigger>
          </TabsList>

          {/* Responses Tab */}
          <TabsContent value="responses">
            <Card>
              <CardHeader>
                <CardTitle>Interview Responses</CardTitle>
                <CardDescription>
                  Candidate responses to interview questions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {responses.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      No responses recorded yet
                    </p>
                  ) : (
                    responses.map((response, index) => (
                      <div key={response.id} className="border rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold">
                            Question {index + 1}
                          </h3>
                          <div className="flex items-center space-x-2">
                            {response.ai_score && (
                              <Badge variant="outline">
                                Score: {response.ai_score}%
                              </Badge>
                            )}
                            <Badge variant="secondary">
                              {formatDate(response.created_at)}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Question:</h4>
                            <p className="text-gray-700 bg-gray-50 p-3 rounded">
                              {response.question_text}
                            </p>
                          </div>
                          
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Response:</h4>
                            <p className="text-gray-700 bg-blue-50 p-3 rounded">
                              {response.response_text || 'No response recorded'}
                            </p>
                          </div>
                          
                          {response.ai_analysis && (
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">AI Analysis:</h4>
                              <div className="bg-green-50 p-3 rounded">
                                <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                                  {JSON.stringify(response.ai_analysis, null, 2)}
                                </pre>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transcripts Tab */}
          <TabsContent value="transcripts">
            <Card>
              <CardHeader>
                <CardTitle>Live Transcripts</CardTitle>
                <CardDescription>
                  Real-time speech-to-text transcription during the interview
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {transcripts.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      No transcripts available
                    </p>
                  ) : (
                    transcripts.map((transcript) => (
                      <div key={transcript.id} className="flex items-start space-x-4 p-4 border rounded-lg">
                        <div className="flex-shrink-0">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-500">
                              {formatDate(transcript.timestamp)}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              Confidence: {Math.round(transcript.confidence * 100)}%
                            </Badge>
                          </div>
                          <p className="text-gray-800">{transcript.text}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Responses Tab */}
          <TabsContent value="ai-responses">
            <Card>
              <CardHeader>
                <CardTitle>AI Responses</CardTitle>
                <CardDescription>
                  AI-generated hints and feedback during the interview
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {aiResponses.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      No AI responses generated
                    </p>
                  ) : (
                    aiResponses.map((aiResponse) => (
                      <div key={aiResponse.id} className="flex items-start space-x-4 p-4 border rounded-lg">
                        <div className="flex-shrink-0">
                          <div className="p-2 bg-purple-100 rounded-lg">
                            <Bot className="h-4 w-4 text-purple-600" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="secondary">
                              {aiResponse.response_type}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              {formatDate(aiResponse.created_at)}
                            </span>
                          </div>
                          <p className="text-gray-800">{aiResponse.response_text}</p>
                          {aiResponse.context_data && (
                            <details className="mt-2">
                              <summary className="text-sm text-gray-500 cursor-pointer">
                                View Context Data
                              </summary>
                              <pre className="text-xs text-gray-600 mt-2 bg-gray-50 p-2 rounded">
                                {JSON.stringify(aiResponse.context_data, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recordings Tab */}
          <TabsContent value="recordings">
            <Card>
              <CardHeader>
                <CardTitle>Session Recordings</CardTitle>
                <CardDescription>
                  Audio and video recordings from the interview session
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recordings.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      No recordings available
                    </p>
                  ) : (
                    recordings.map((recording) => (
                      <div key={recording.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <div className="flex items-center space-x-3">
                            <Badge variant="outline">
                              {recording.recording_type}
                            </Badge>
                            <span className="font-medium">
                              Recording {recording.id}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            Duration: {formatDuration(recording.duration || 0)} • 
                            Size: {Math.round((recording.file_size || 0) / 1024 / 1024)}MB • 
                            Created: {formatDate(recording.created_at)}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadRecording(recording.id)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SessionDetails;

