# AI Video Interview Chatbot

A comprehensive, AI-powered video interview platform with real-time transcription, intelligent response analysis, and cloud-based recording storage. Built with React, Flask, and Google Gemini AI.

## 🌟 Features

### Core Functionality
- **Real-time Video/Audio Recording**: High-quality WebRTC-based recording during interviews
- **AI-Powered Transcription**: Live speech-to-text using Google Gemini API
- **Intelligent AI Assistant**: Context-aware hints, feedback, and response analysis
- **Cloud Storage Integration**: Secure recording storage with AWS S3
- **Admin Dashboard**: Comprehensive interview management and analytics

### Interview Management
- **Unique Interview Codes**: Secure, time-limited access codes for candidates
- **Customizable Question Sets**: Create and manage different interview types
- **Real-time Monitoring**: Live session tracking and progress monitoring
- **Comprehensive Analytics**: Detailed response analysis and AI scoring

### Technical Features
- **WebSocket Communication**: Real-time updates and live transcription
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Professional UI**: Modern interface built with Tailwind CSS and shadcn/ui
- **Scalable Architecture**: Production-ready with cloud deployment support

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm/pnpm
- **Python** 3.11+ with pip
- **Google Gemini API Key** (for AI features)
- **AWS S3 Bucket** (optional, for cloud storage)

### Installation

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd ai-interview-chatbot
   ```

2. **Backend Setup**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   pnpm install  # or npm install
   ```

4. **Environment Configuration**
   
   **Backend (.env):**
   ```bash
   cp backend/.env.example backend/.env
   # Edit backend/.env with your configuration
   ```
   
   **Frontend (.env):**
   ```bash
   cp frontend/.env.example frontend/.env
   # Edit frontend/.env with your configuration
   ```

5. **Start Development Servers**
   
   **Backend:**
   ```bash
   cd backend
   source venv/bin/activate
   python src/main.py
   ```
   
   **Frontend:**
   ```bash
   cd frontend
   pnpm run dev  # or npm run dev
   ```

6. **Access the Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000
   - Admin Dashboard: http://localhost:5173/admin

### Default Admin Credentials
- **Username**: admin
- **Password**: admin123

⚠️ **Important**: Change the default admin password immediately after first login.

## 📋 Usage

### For Administrators

1. **Access Admin Dashboard**
   - Navigate to `/admin` and login with admin credentials
   - The dashboard provides four main sections: Codes, Question Sets, Sessions, and Settings

2. **Create Interview Codes**
   - Go to "Interview Codes" tab
   - Click "Generate New Code" to create unique access codes
   - Set expiration time (default: 24 hours)
   - Share codes with candidates

3. **Set Up Question Sets**
   - Navigate to "Question Sets" tab
   - Create custom question collections for different interview types
   - Add questions with time limits and AI hints
   - Activate the desired question set

4. **Monitor Interviews**
   - Use "Sessions" tab to view all interview sessions
   - Access detailed session information including responses, transcripts, and recordings
   - Download recordings and export data

### For Candidates

1. **Start Interview**
   - Enter your name and the interview code provided
   - Grant camera and microphone permissions
   - Test your audio/video setup

2. **During Interview**
   - Answer questions clearly and concisely
   - Pay attention to AI hints and feedback
   - Maintain eye contact with the camera
   - Complete all questions within the time limits

## 🏗️ Architecture

### Frontend (React + Vite)
```
frontend/
├── src/
│   ├── components/ui/     # Reusable UI components
│   ├── pages/            # Main application pages
│   ├── hooks/            # Custom React hooks (WebRTC, etc.)
│   ├── services/         # API and Socket.IO services
│   └── utils/            # Utility functions
├── public/               # Static assets
└── package.json          # Dependencies and scripts
```

### Backend (Flask + Python)
```
backend/
├── src/
│   ├── models/           # Database models
│   ├── routes/           # API route handlers
│   ├── services/         # Business logic services
│   └── main.py           # Application entry point
├── uploads/              # Local file storage
├── requirements.txt      # Python dependencies
└── .env                  # Environment configuration
```

### Key Technologies

**Frontend:**
- React 18 with TypeScript support
- Vite for fast development and building
- Tailwind CSS + shadcn/ui for styling
- Socket.IO client for real-time communication
- WebRTC APIs for media capture

**Backend:**
- Flask web framework with SQLAlchemy ORM
- Flask-SocketIO for WebSocket communication
- Google Generative AI (Gemini) for transcription and analysis
- AWS S3 integration for cloud storage
- SQLite (development) / PostgreSQL (production)

## 🔧 Configuration

### Environment Variables

**Backend Configuration:**
```bash
# Flask Settings
FLASK_ENV=development
SECRET_KEY=your-secret-key

# Database
DATABASE_URL=sqlite:///app.db

# AI Integration
GEMINI_API_KEY=your-gemini-api-key

# Cloud Storage (Optional)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_S3_BUCKET_NAME=your-bucket-name
AWS_REGION=us-east-1

# Admin Settings
ADMIN_USERNAME=admin
ADMIN_PASSWORD=secure-password
```

**Frontend Configuration:**
```bash
# API Settings
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000

# Application Settings
VITE_APP_NAME=AI Interview Chatbot
```

### AI Prompt Customization

The system supports customizable AI prompts for different interview styles:

```
You are a {interview_type} assistant. Based on the question "{question}" 
and the candidate's response "{transcript}", provide {response_type} 
that helps assess their {skill_area} capabilities.
```

Template variables:
- `{question}`: Current interview question
- `{transcript}`: Candidate's spoken response
- `{response_type}`: Type of AI response (hint, encouragement, analysis)

## 🚀 Deployment

### Production Deployment Options

1. **Vercel (Frontend) + Railway (Backend)**
   - Deploy React app to Vercel
   - Deploy Flask API to Railway
   - Configure environment variables

2. **Full-Stack on Render**
   - Deploy both frontend and backend to Render
   - Use PostgreSQL database
   - Configure custom domains

3. **AWS/GCP/Azure**
   - Deploy to cloud platforms
   - Use managed databases
   - Configure load balancing

### Deployment Checklist

- [ ] Set production environment variables
- [ ] Configure HTTPS/SSL certificates
- [ ] Set up production database (PostgreSQL)
- [ ] Configure AWS S3 for file storage
- [ ] Update CORS settings for production domains
- [ ] Set secure admin passwords
- [ ] Configure monitoring and logging
- [ ] Set up automated backups

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## 📚 Documentation

- **[User Manual](./USER_MANUAL.md)**: Comprehensive guide for administrators and candidates
- **[API Documentation](./API_DOCUMENTATION.md)**: Complete API reference with examples
- **[Deployment Guide](./DEPLOYMENT.md)**: Production deployment instructions

## 🔒 Security Features

- **Session-based Authentication**: Secure admin access with session management
- **Input Validation**: Comprehensive validation for all user inputs
- **File Upload Security**: Secure file handling with type and size validation
- **CORS Configuration**: Proper cross-origin resource sharing setup
- **Environment Variables**: Sensitive data stored in environment variables
- **HTTPS Support**: SSL/TLS encryption for production deployments

## 🎯 Use Cases

### Corporate Hiring
- Technical interviews for software engineering positions
- Behavioral interviews with AI-powered analysis
- Remote interview capabilities for distributed teams

### Educational Assessments
- Student evaluation with real-time feedback
- Language proficiency testing with speech analysis
- Presentation skills assessment

### Training and Development
- Employee skill assessment
- Training program evaluation
- Performance review interviews

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow existing code style and conventions
- Add tests for new features
- Update documentation for API changes
- Ensure all tests pass before submitting PR

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For technical support or questions:

1. **Check Documentation**: Review the user manual and API documentation
2. **Search Issues**: Look for existing GitHub issues
3. **Create Issue**: Submit a detailed bug report or feature request
4. **Contact Support**: Reach out to the development team

## 🙏 Acknowledgments

- **Google Gemini AI**: For powerful speech-to-text and language processing
- **React Community**: For excellent frontend development tools
- **Flask Community**: For robust backend framework
- **shadcn/ui**: For beautiful, accessible UI components
- **Tailwind CSS**: For utility-first CSS framework

---

**Built with ❤️ for modern interview experiences**

