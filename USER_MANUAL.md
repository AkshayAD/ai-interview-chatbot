# AI Video Interview Chatbot - User Manual

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Admin Dashboard](#admin-dashboard)
4. [Conducting Interviews](#conducting-interviews)
5. [Managing Interview Data](#managing-interview-data)
6. [AI Configuration](#ai-configuration)
7. [Troubleshooting](#troubleshooting)
8. [Best Practices](#best-practices)

## Introduction

The AI Video Interview Chatbot is a comprehensive platform for conducting automated video interviews with real-time AI assistance. The system provides:

- **Real-time video/audio recording** during interviews
- **AI-powered transcription** using Google Gemini API
- **Intelligent response analysis** and candidate guidance
- **Comprehensive admin dashboard** for interview management
- **Cloud storage integration** for secure recording storage
- **Customizable question sets** for different interview types

## Getting Started

### System Requirements

**For Candidates:**
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Webcam and microphone access
- Stable internet connection (minimum 1 Mbps upload)

**For Administrators:**
- Admin access credentials
- Modern web browser
- Stable internet connection

### Initial Setup

1. **Access the Application**
   - Navigate to the deployed application URL
   - The landing page will display the interview interface

2. **Admin First-Time Setup**
   - Click "Admin Access" on the landing page
   - Login with default credentials: `admin` / `admin123`
   - **Important**: Change the default password immediately

## Admin Dashboard

### Accessing the Dashboard

1. Click "Admin Access" on the main page
2. Enter your admin credentials
3. You'll be redirected to the admin dashboard

### Dashboard Overview

The admin dashboard provides four main sections:

#### 1. Interview Codes Tab
- **Generate New Codes**: Create unique interview codes for candidates
- **View Active Codes**: See all unused interview codes
- **Code Management**: Set expiration times and track usage

#### 2. Question Sets Tab
- **Create Question Sets**: Build custom interview question collections
- **Manage Questions**: Add, edit, or remove individual questions
- **Set Active Questions**: Choose which question set to use for interviews

#### 3. Sessions Tab
- **View All Sessions**: See completed and ongoing interview sessions
- **Session Details**: Access detailed information about each interview
- **Export Data**: Download session data and recordings

#### 4. Settings Tab
- **AI Configuration**: Customize AI behavior and prompts
- **System Settings**: Configure application preferences
- **User Management**: Manage admin accounts

### Creating Interview Codes

1. Navigate to the "Interview Codes" tab
2. Click "Generate New Code"
3. Set expiration time (default: 24 hours)
4. The system generates a unique 8-character code
5. Share this code with the candidate

### Setting Up Question Sets

1. Go to the "Question Sets" tab
2. Click "Create New Question Set"
3. Enter a name and description
4. Add questions one by one:
   - Enter the question text
   - Set time limit (default: 5 minutes)
   - Add optional hints for the AI assistant
5. Save and activate the question set

### Managing Interview Sessions

1. Access the "Sessions" tab to view all interviews
2. Click "View Details" on any session to see:
   - **Responses Tab**: Candidate answers with AI scoring
   - **Transcripts Tab**: Real-time speech-to-text transcription
   - **AI Responses Tab**: All AI hints and feedback provided
   - **Recordings Tab**: Audio/video recordings with download links

## Conducting Interviews

### For Candidates

#### Starting an Interview

1. **Access the Platform**
   - Navigate to the interview platform URL
   - You'll see the candidate landing page

2. **Enter Information**
   - Enter your full name
   - Input the interview code provided by the administrator
   - Click "Start Interview"

3. **Camera and Microphone Setup**
   - Grant permission for camera and microphone access
   - Test your audio and video before proceeding
   - Ensure good lighting and clear audio

#### During the Interview

1. **Question Presentation**
   - Questions appear one at a time
   - Read each question carefully
   - Note the time limit for each question

2. **Recording Process**
   - Your video and audio are recorded automatically
   - A recording indicator shows when recording is active
   - Speak clearly and maintain eye contact with the camera

3. **AI Assistant Features**
   - The AI provides real-time transcription of your speech
   - Helpful hints may appear if you're struggling
   - AI feedback is displayed in the chat area

4. **Navigation**
   - Complete each question before moving to the next
   - You cannot return to previous questions
   - The interview ends automatically after all questions

#### Interview Best Practices

- **Environment**: Choose a quiet, well-lit location
- **Technology**: Test your camera and microphone beforehand
- **Appearance**: Dress professionally as you would for an in-person interview
- **Communication**: Speak clearly and at a moderate pace
- **Engagement**: Look at the camera, not the screen, when speaking

### For Administrators

#### Monitoring Live Interviews

1. Access the admin dashboard during interview times
2. Navigate to "Sessions" tab
3. View real-time session status and progress
4. Monitor for any technical issues

#### Post-Interview Review

1. **Access Session Details**
   - Go to Sessions tab
   - Click "View Details" for the completed interview

2. **Review Responses**
   - Read candidate answers
   - Check AI scoring and analysis
   - Review transcription accuracy

3. **Download Recordings**
   - Access the Recordings tab
   - Download video/audio files for detailed review
   - Files are available in WebM format

## Managing Interview Data

### Data Organization

The system automatically organizes interview data:

- **Sessions**: Each interview creates a unique session
- **Responses**: Candidate answers are stored with timestamps
- **Transcripts**: Real-time speech-to-text is saved
- **Recordings**: Video/audio files are stored securely
- **AI Analysis**: AI scoring and feedback is preserved

### Data Export

1. **Individual Sessions**
   - Navigate to session details
   - Use download buttons for specific data types
   - Export transcripts as text files

2. **Bulk Export**
   - Use the Sessions tab for bulk operations
   - Filter sessions by date range or status
   - Export multiple sessions at once

### Data Retention

- **Recordings**: Stored in cloud storage (AWS S3)
- **Database**: Session data retained indefinitely
- **Cleanup**: Implement regular cleanup policies as needed

## AI Configuration

### Customizing AI Behavior

1. **Access AI Prompts**
   - Navigate to the admin dashboard
   - Click on "AI Prompts" in the navigation menu

2. **Create Custom Prompts**
   - Click "Create New Prompt"
   - Enter a descriptive name
   - Write the AI instruction prompt
   - Use template variables: `{question}`, `{transcript}`, `{response_type}`

3. **Prompt Examples**

   **Encouraging Assistant:**
   ```
   You are a supportive interview assistant. Based on the question "{question}" and the candidate's response "{transcript}", provide encouraging feedback and gentle hints if needed. Be positive and constructive.
   ```

   **Technical Interviewer:**
   ```
   You are conducting a technical interview. For the question "{question}" and response "{transcript}", provide specific technical feedback and ask follow-up questions to assess deeper understanding.
   ```

### AI Response Types

The system supports different AI response types:

- **Hints**: Gentle guidance when candidates are stuck
- **Encouragement**: Positive reinforcement during responses
- **Follow-up**: Additional questions for clarification
- **Analysis**: Detailed scoring and feedback

### Monitoring AI Performance

1. **Review AI Responses**
   - Check the AI Responses tab in session details
   - Evaluate the quality and relevance of AI feedback

2. **Adjust Prompts**
   - Modify AI prompts based on performance
   - Test different prompt variations
   - Monitor candidate satisfaction with AI assistance

## Troubleshooting

### Common Issues

#### Camera/Microphone Problems

**Issue**: Camera or microphone not working
**Solutions**:
- Check browser permissions for camera/microphone access
- Ensure no other applications are using the camera
- Try refreshing the page and granting permissions again
- Test with a different browser

#### Recording Issues

**Issue**: Recordings not saving properly
**Solutions**:
- Check internet connection stability
- Verify cloud storage configuration
- Ensure sufficient storage space
- Contact administrator if issues persist

#### AI Not Responding

**Issue**: AI assistant not providing feedback
**Solutions**:
- Verify Gemini API key is configured correctly
- Check API usage limits and quotas
- Review AI prompt configuration
- Monitor backend logs for errors

#### Login Problems

**Issue**: Cannot access admin dashboard
**Solutions**:
- Verify username and password
- Check if account is active
- Clear browser cache and cookies
- Reset password if necessary

### Technical Support

For technical issues:

1. **Check System Status**
   - Verify all services are running
   - Check database connectivity
   - Confirm API integrations are working

2. **Review Logs**
   - Backend application logs
   - Browser console errors
   - Network request failures

3. **Contact Support**
   - Provide detailed error descriptions
   - Include browser and system information
   - Share relevant log entries

## Best Practices

### For Administrators

#### Interview Preparation

1. **Test the System**
   - Conduct test interviews before real sessions
   - Verify all features are working correctly
   - Check recording quality and AI responses

2. **Question Design**
   - Create clear, specific questions
   - Set appropriate time limits
   - Provide helpful hints for AI assistance

3. **Candidate Communication**
   - Send clear instructions before interviews
   - Provide technical requirements
   - Include backup contact information

#### Data Management

1. **Regular Backups**
   - Export important session data regularly
   - Backup database and recordings
   - Test restore procedures

2. **Privacy Compliance**
   - Follow data protection regulations
   - Implement data retention policies
   - Secure sensitive information

3. **Performance Monitoring**
   - Monitor system performance regularly
   - Track AI API usage and costs
   - Optimize based on usage patterns

### For Candidates

#### Pre-Interview Preparation

1. **Technical Setup**
   - Test camera and microphone beforehand
   - Ensure stable internet connection
   - Close unnecessary applications

2. **Environment Preparation**
   - Choose a quiet, professional location
   - Ensure good lighting
   - Minimize distractions

3. **Content Preparation**
   - Review the job description
   - Prepare examples and stories
   - Practice speaking clearly and concisely

#### During the Interview

1. **Technical Best Practices**
   - Speak clearly and at moderate pace
   - Look at the camera when speaking
   - Wait for questions to load completely

2. **Communication Tips**
   - Structure your responses clearly
   - Use specific examples
   - Ask for clarification if needed

3. **AI Interaction**
   - Pay attention to AI hints and feedback
   - Use AI suggestions to improve responses
   - Don't rely entirely on AI assistance

This user manual provides comprehensive guidance for both administrators and candidates using the AI Video Interview Chatbot platform. For additional support or questions, please contact your system administrator.

