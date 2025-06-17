import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Edit, 
  Trash2, 
  Bot,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { adminAPI } from '../services/api';

const AIPromptManagement = () => {
  const navigate = useNavigate();
  
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingPrompt, setEditingPrompt] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    prompt_text: '',
    is_active: false
  });

  useEffect(() => {
    loadPrompts();
  }, []);

  const loadPrompts = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAIPrompts();
      setPrompts(response.prompts || []);
    } catch (err) {
      console.error('Failed to load AI prompts:', err);
      setError('Failed to load AI prompts');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      prompt_text: '',
      is_active: false
    });
    setEditingPrompt(null);
    setShowCreateForm(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.prompt_text.trim()) {
      setError('Name and prompt text are required');
      return;
    }

    try {
      const response = await adminAPI.createAIPrompt(formData);
      
      if (response.success) {
        setSuccess('AI prompt created successfully');
        resetForm();
        await loadPrompts();
      } else {
        setError(response.error || 'Failed to create AI prompt');
      }
    } catch (err) {
      console.error('Failed to create AI prompt:', err);
      setError('Failed to create AI prompt');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.prompt_text.trim()) {
      setError('Name and prompt text are required');
      return;
    }

    try {
      const response = await adminAPI.updateAIPrompt(editingPrompt.id, formData);
      
      if (response.success) {
        setSuccess('AI prompt updated successfully');
        resetForm();
        await loadPrompts();
      } else {
        setError(response.error || 'Failed to update AI prompt');
      }
    } catch (err) {
      console.error('Failed to update AI prompt:', err);
      setError('Failed to update AI prompt');
    }
  };

  const handleEdit = (prompt) => {
    setFormData({
      name: prompt.name,
      description: prompt.description || '',
      prompt_text: prompt.prompt_text,
      is_active: prompt.is_active
    });
    setEditingPrompt(prompt);
    setShowCreateForm(true);
  };

  const handleDelete = async (promptId) => {
    if (!confirm('Are you sure you want to delete this AI prompt?')) {
      return;
    }

    try {
      const response = await adminAPI.deleteAIPrompt(promptId);
      
      if (response.success) {
        setSuccess('AI prompt deleted successfully');
        await loadPrompts();
      } else {
        setError(response.error || 'Failed to delete AI prompt');
      }
    } catch (err) {
      console.error('Failed to delete AI prompt:', err);
      setError('Failed to delete AI prompt');
    }
  };

  const handleActivate = async (promptId) => {
    try {
      const response = await adminAPI.activateAIPrompt(promptId);
      
      if (response.success) {
        setSuccess('AI prompt activated successfully');
        await loadPrompts();
      } else {
        setError(response.error || 'Failed to activate AI prompt');
      }
    } catch (err) {
      console.error('Failed to activate AI prompt:', err);
      setError('Failed to activate AI prompt');
    }
  };

  const defaultPromptTemplate = `You are an AI interview assistant helping candidates with guesstimate questions. 
Your role is to provide helpful guidance without giving away the answer.

Question: {question}
Candidate's current response: {transcript}
Response type requested: {response_type}

Based on the response type, provide appropriate guidance:

- For "hint": Give a subtle hint to help the candidate think through the problem
- For "feedback": Provide constructive feedback on their approach so far
- For "encouragement": Offer encouragement and motivation to continue

Guidelines:
1. Be supportive and encouraging
2. Don't give direct answers
3. Help them think through the problem systematically
4. Keep responses concise (1-2 sentences)
5. Focus on the thinking process, not the final number

Respond with a JSON object in this format:
{
    "type": "{response_type}",
    "message": "Your helpful response here"
}`;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading AI prompts...</p>
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
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/admin')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">AI Prompt Management</h1>
                <p className="text-gray-600">Configure AI behavior for interviews</p>
              </div>
            </div>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Prompt
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Create/Edit Form */}
        {showCreateForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>
                {editingPrompt ? 'Edit AI Prompt' : 'Create New AI Prompt'}
              </CardTitle>
              <CardDescription>
                Configure how the AI assistant responds to candidates during interviews
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={editingPrompt ? handleUpdate : handleCreate} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Prompt Name</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g., Supportive Guesstimate Assistant"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Brief description of this prompt's purpose"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="prompt_text">Prompt Template</Label>
                  <Textarea
                    id="prompt_text"
                    name="prompt_text"
                    value={formData.prompt_text}
                    onChange={handleInputChange}
                    placeholder={defaultPromptTemplate}
                    rows={15}
                    className="font-mono text-sm"
                    required
                  />
                  <p className="text-sm text-gray-600">
                    Use placeholders: {'{question}'}, {'{transcript}'}, {'{response_type}'}
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                    className="rounded"
                  />
                  <Label htmlFor="is_active">Set as active prompt</Label>
                </div>

                <div className="flex items-center space-x-4">
                  <Button type="submit">
                    <Save className="h-4 w-4 mr-2" />
                    {editingPrompt ? 'Update Prompt' : 'Create Prompt'}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Prompts List */}
        <div className="space-y-6">
          {prompts.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No AI Prompts</h3>
                <p className="text-gray-600 mb-4">
                  Create your first AI prompt to customize interview assistance
                </p>
                <Button onClick={() => setShowCreateForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Prompt
                </Button>
              </CardContent>
            </Card>
          ) : (
            prompts.map((prompt) => (
              <Card key={prompt.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-3">
                        <CardTitle>{prompt.name}</CardTitle>
                        <Badge variant={prompt.is_active ? 'default' : 'secondary'}>
                          {prompt.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      {prompt.description && (
                        <CardDescription className="mt-1">
                          {prompt.description}
                        </CardDescription>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {!prompt.is_active && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleActivate(prompt.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Activate
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(prompt)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(prompt.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Prompt Template:</h4>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                          {prompt.prompt_text}
                        </pre>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      Created: {new Date(prompt.created_at).toLocaleString()}
                      {prompt.updated_at && prompt.updated_at !== prompt.created_at && (
                        <span> • Updated: {new Date(prompt.updated_at).toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AIPromptManagement;

