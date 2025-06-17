import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  LogOut, 
  Plus, 
  Copy, 
  Trash2, 
  Users, 
  FileText, 
  Settings,
  Eye,
  Bot,
  BarChart3,
  Clock,
  CheckCircle
} from 'lucide-react';
import { adminAPI } from '../services/api';

const AdminDashboard = () => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [codes, setCodes] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [questionSets, setQuestionSets] = useState([]);
  const navigate = useNavigate();

  // Check authentication and load data
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authResponse = await adminAPI.checkAuth();
        
        if (!authResponse.authenticated) {
          navigate('/admin/login');
          return;
        }

        setAdmin(authResponse.admin);
        
        // Load dashboard data
        await loadDashboardData();
        
      } catch (err) {
        console.error('Auth check failed:', err);
        navigate('/admin/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  const loadDashboardData = async () => {
    try {
      const [codesResponse, sessionsResponse, questionSetsResponse] = await Promise.all([
        adminAPI.getCodes(),
        adminAPI.getSessions(),
        adminAPI.getQuestionSets()
      ]);

      setCodes(codesResponse.codes || []);
      setSessions(sessionsResponse.sessions || []);
      setQuestionSets(questionSetsResponse.question_sets || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError('Failed to load dashboard data');
    }
  };

  const handleLogout = async () => {
    try {
      await adminAPI.logout();
      navigate('/admin/login');
    } catch (err) {
      console.error('Logout failed:', err);
      navigate('/admin/login');
    }
  };

  const createNewCode = async () => {
    try {
      const response = await adminAPI.createCode(24); // 24 hours expiry
      if (response.success) {
        await loadDashboardData(); // Refresh codes
      }
    } catch (err) {
      console.error('Failed to create code:', err);
      setError('Failed to create new code');
    }
  };

  const deleteCode = async (codeId) => {
    try {
      await adminAPI.deleteCode(codeId);
      await loadDashboardData(); // Refresh codes
    } catch (err) {
      console.error('Failed to delete code:', err);
      setError('Failed to delete code');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
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
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600">Welcome back, {admin?.username}</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={() => navigate('/')}>
                <Eye className="h-4 w-4 mr-2" />
                View Site
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
          
          {/* Navigation Menu */}
          <div className="mt-4 border-t pt-4">
            <nav className="flex space-x-6">
              <Link 
                to="/admin" 
                className="flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Dashboard
              </Link>
              <Link 
                to="/admin/ai-prompts" 
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md"
              >
                <Bot className="h-4 w-4 mr-2" />
                AI Prompts
              </Link>
              <Button 
                variant="ghost" 
                size="sm"
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
                onClick={() => window.open('/admin/analytics', '_blank')}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </Button>
            </nav>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Sessions</p>
                  <p className="text-2xl font-bold text-gray-900">{sessions.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {sessions.filter(s => s.status === 'completed').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Codes</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {codes.filter(c => !c.is_used).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FileText className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Question Sets</p>
                  <p className="text-2xl font-bold text-gray-900">{questionSets.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="codes" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="codes">Interview Codes</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="questions">Questions</TabsTrigger>
          </TabsList>

          {/* Interview Codes Tab */}
          <TabsContent value="codes">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Interview Codes</CardTitle>
                    <CardDescription>
                      Manage interview access codes for candidates
                    </CardDescription>
                  </div>
                  <Button onClick={createNewCode}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Code
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {codes.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      No interview codes created yet
                    </p>
                  ) : (
                    codes.map((code) => (
                      <div key={code.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <div className="flex items-center space-x-3">
                            <span className="font-mono text-lg font-bold">{code.code}</span>
                            <Badge variant={code.is_used ? 'secondary' : 'default'}>
                              {code.is_used ? 'Used' : 'Active'}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {code.candidate_name && (
                              <span>Used by: {code.candidate_name} • </span>
                            )}
                            Created: {formatDate(code.created_at)}
                            {code.expires_at && (
                              <span> • Expires: {formatDate(code.expires_at)}</span>
                            )}
                          </div>
                        </div>
                        {!code.is_used && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteCode(code.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sessions Tab */}
          <TabsContent value="sessions">
            <Card>
              <CardHeader>
                <CardTitle>Interview Sessions</CardTitle>
                <CardDescription>
                  View and manage all interview sessions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sessions.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      No interview sessions yet
                    </p>
                  ) : (
                    sessions.map((session) => (
                      <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <div className="flex items-center space-x-3">
                            <span className="font-medium">{session.candidate_name}</span>
                            <Badge variant={
                              session.status === 'completed' ? 'default' :
                              session.status === 'active' ? 'secondary' : 'outline'
                            }>
                              {session.status}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            Question Set: {session.question_set_name} • 
                            Responses: {session.response_count} • 
                            Created: {formatDate(session.created_at)}
                            {session.completed_at && (
                              <span> • Completed: {formatDate(session.completed_at)}</span>
                            )}
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate(`/admin/sessions/${session.session_id}`)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Questions Tab */}
          <TabsContent value="questions">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Question Sets</CardTitle>
                    <CardDescription>
                      Manage interview question sets and configurations
                    </CardDescription>
                  </div>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Question Set
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {questionSets.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      No question sets created yet
                    </p>
                  ) : (
                    questionSets.map((set) => (
                      <div key={set.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <div className="flex items-center space-x-3">
                            <span className="font-medium">{set.name}</span>
                            <Badge variant={set.is_active ? 'default' : 'secondary'}>
                              {set.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {set.description} • 
                            Questions: {set.question_count} • 
                            Created: {formatDate(set.created_at)}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {!set.is_active && (
                            <Button variant="outline" size="sm">
                              Activate
                            </Button>
                          )}
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
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

export default AdminDashboard;

