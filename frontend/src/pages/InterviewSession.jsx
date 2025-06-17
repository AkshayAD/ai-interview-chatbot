import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Play, 
  Pause, 
  SkipForward,
  MessageCircle,
  Clock,
  User,
  Bot
} from 'lucide-react';
import useWebRTC from '../hooks/useWebRTC';
import socketService from '../services/socket';
import { interviewAPI } from '../services/api';

const InterviewSession = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  
  // Session state
  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [sessionStatus, setSessionStatus] = useState('loading');
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [aiMessages, setAiMessages] = useState([]);
  const [error, setError] = useState('');

  // WebRTC hook
  const {
    isVideoEnabled,
    isAudioEnabled,
    isRecording,
    videoRef,
    startMedia,
    stopMedia,
    toggleVideo,
    toggleAudio,
    startRecording,
    stopRecording,
    captureAudioChunk,
    error: webrtcError
  } = useWebRTC();

  // Timer ref
  const timerRef = useRef(null);
  const transcriptIntervalRef = useRef(null);

  // Initialize session
  useEffect(() => {
    const initializeSession = async () => {
      try {
        // Connect to socket
        socketService.connect();
        
        // Get session details
        const sessionData = await interviewAPI.getSession(sessionId);
        setSession(sessionData.session);
        setQuestions(sessionData.questions);
        
        if (sessionData.questions.length > 0) {
          setCurrentQuestion(sessionData.questions[0]);
        }

        // Join interview room
        socketService.joinInterview(sessionId);
        
        // Set up socket listeners
        setupSocketListeners();
        
        setSessionStatus('ready');
      } catch (err) {
        console.error('Failed to initialize session:', err);
        setError('Failed to load interview session');
        setSessionStatus('error');
      }
    };

    if (sessionId) {
      initializeSession();
    }

    return () => {
      cleanup();
    };
  }, [sessionId]);

  // Setup socket event listeners
  const setupSocketListeners = () => {
    socketService.onJoinedInterview((data) => {
      console.log('Joined interview:', data);
    });

    socketService.onTranscriptUpdate((data) => {
      setTranscript(prev => prev + ' ' + data.text);
    });

    socketService.onAIResponse((data) => {
      setAiMessages(prev => [...prev, {
        id: Date.now(),
        type: data.response.type,
        message: data.response.message,
        timestamp: new Date(data.response.timestamp)
      }]);
    });

    socketService.onError((error) => {
      console.error('Socket error:', error);
      setError(error.message);
    });
  };

  // Cleanup function
  const cleanup = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (transcriptIntervalRef.current) {
      clearInterval(transcriptIntervalRef.current);
    }
    stopMedia();
    socketService.leaveInterview(sessionId);
    socketService.disconnect();
  };

  // Start interview
  const startInterview = async () => {
    try {
      // Start media capture
      await startMedia(true, true);
      
      // Start the interview session
      const response = await interviewAPI.startSession(sessionId);
      
      if (response.success) {
        setCurrentQuestion(response.current_question);
        setSessionStatus('active');
        
        // Start recording
        startRecording();
        
        // Start timer
        startQuestionTimer(response.current_question.time_limit);
        
        // Start periodic audio capture for transcription
        startTranscriptionCapture();
        
        // Notify socket
        socketService.updateSessionStatus(sessionId, 'active');
        socketService.startVideoStream(sessionId, {
          video: isVideoEnabled,
          audio: isAudioEnabled
        });
      }
    } catch (err) {
      console.error('Failed to start interview:', err);
      setError('Failed to start interview');
    }
  };

  // Start question timer
  const startQuestionTimer = (timeLimit) => {
    setTimeRemaining(timeLimit);
    
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          // Time's up, move to next question
          handleNextQuestion();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Start transcription capture
  const startTranscriptionCapture = () => {
    transcriptIntervalRef.current = setInterval(async () => {
      try {
        const audioBlob = await captureAudioChunk(2000); // 2 second chunks
        
        // Convert to base64 for transmission
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Audio = reader.result.split(',')[1];
          socketService.sendAudioData(sessionId, base64Audio, Date.now());
        };
        reader.readAsDataURL(audioBlob);
      } catch (err) {
        console.error('Failed to capture audio:', err);
      }
    }, 2000);
  };

  // Handle next question
  const handleNextQuestion = async () => {
    try {
      // Save current response
      if (currentQuestion && transcript) {
        await interviewAPI.saveResponse(
          sessionId,
          currentQuestion.id,
          transcript,
          null, // AI analysis will be done on backend
          null  // AI score will be calculated on backend
        );
      }

      // Move to next question
      const response = await interviewAPI.nextQuestion(sessionId);
      
      if (response.success) {
        if (response.interview_completed) {
          // Interview completed
          handleInterviewComplete();
        } else {
          // Move to next question
          setCurrentQuestion(response.current_question);
          setQuestionIndex(prev => prev + 1);
          setTranscript('');
          setAiMessages([]);
          
          // Restart timer
          if (timerRef.current) {
            clearInterval(timerRef.current);
          }
          startQuestionTimer(response.current_question.time_limit);
        }
      }
    } catch (err) {
      console.error('Failed to move to next question:', err);
      setError('Failed to proceed to next question');
    }
  };

  // Handle interview completion
  const handleInterviewComplete = async () => {
    try {
      // Stop recording
      const recordingBlob = await stopRecording();
      
      // Stop media
      stopMedia();
      
      // Update session status
      socketService.updateSessionStatus(sessionId, 'completed');
      
      setSessionStatus('completed');
      
      // Clear timers
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (transcriptIntervalRef.current) {
        clearInterval(transcriptIntervalRef.current);
      }
    } catch (err) {
      console.error('Failed to complete interview:', err);
    }
  };

  // Request AI hint
  const requestHint = () => {
    if (currentQuestion) {
      socketService.requestAIResponse(
        sessionId,
        currentQuestion.id,
        transcript,
        'hint'
      );
    }
  };

  // Format time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Render loading state
  if (sessionStatus === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading interview session...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (sessionStatus === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => navigate('/')} className="w-full">
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render completed state
  if (sessionStatus === 'completed') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-green-600">Interview Completed!</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Thank you for completing the interview. Your responses have been recorded and will be reviewed.
            </p>
            <Button onClick={() => navigate('/')} className="w-full">
              Return to Home
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
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                AI Interview Session
              </h1>
              <p className="text-sm text-gray-600">
                Candidate: {session?.candidate_name}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant={sessionStatus === 'active' ? 'default' : 'secondary'}>
                {sessionStatus}
              </Badge>
              {sessionStatus === 'active' && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>{formatTime(timeRemaining)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Panel */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Video Interview</span>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={toggleVideo}
                      disabled={sessionStatus !== 'active'}
                    >
                      {isVideoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={toggleAudio}
                      disabled={sessionStatus !== 'active'}
                    >
                      {isAudioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  {!isVideoEnabled && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-white text-center">
                        <VideoOff className="h-12 w-12 mx-auto mb-2" />
                        <p>Video is disabled</p>
                      </div>
                    </div>
                  )}
                  {isRecording && (
                    <div className="absolute top-4 right-4">
                      <div className="flex items-center space-x-2 bg-red-600 text-white px-3 py-1 rounded-full text-sm">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        <span>Recording</span>
                      </div>
                    </div>
                  )}
                </div>

                {sessionStatus === 'ready' && (
                  <div className="mt-4 text-center">
                    <Button onClick={startInterview} size="lg">
                      <Play className="mr-2 h-4 w-4" />
                      Start Interview
                    </Button>
                  </div>
                )}

                {error && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {webrtcError && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertDescription>{webrtcError}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Question and Controls Panel */}
          <div className="space-y-6">
            {/* Current Question */}
            {currentQuestion && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Question {questionIndex + 1}</span>
                    {sessionStatus === 'active' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleNextQuestion}
                      >
                        <SkipForward className="h-4 w-4 mr-1" />
                        Next
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-800 mb-4">{currentQuestion.text}</p>
                  
                  {sessionStatus === 'active' && (
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>Time Remaining</span>
                          <span>{formatTime(timeRemaining)}</span>
                        </div>
                        <Progress 
                          value={(timeRemaining / currentQuestion.time_limit) * 100} 
                          className="h-2"
                        />
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={requestHint}
                        className="w-full"
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Request Hint
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Live Transcript */}
            <Card>
              <CardHeader>
                <CardTitle>Live Transcript</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 rounded-lg p-3 min-h-[100px] max-h-[200px] overflow-y-auto">
                  {transcript ? (
                    <p className="text-sm text-gray-800">{transcript}</p>
                  ) : (
                    <p className="text-sm text-gray-500 italic">
                      Start speaking to see live transcription...
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* AI Messages */}
            {aiMessages.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Bot className="h-5 w-5 mr-2" />
                    AI Assistant
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto">
                    {aiMessages.map((message) => (
                      <div key={message.id} className="bg-blue-50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <Badge variant="secondary" className="text-xs">
                            {message.type}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {message.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-800">{message.message}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewSession;

