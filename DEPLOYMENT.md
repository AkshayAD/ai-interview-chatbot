# AI Video Interview Chatbot - Deployment Guide

## Overview

This comprehensive guide covers deploying the AI Video Interview Chatbot to production environments. The application consists of a React frontend and Flask backend with real-time video/audio capabilities, AI-powered transcription, and cloud storage integration.

## Architecture Summary

### Frontend (React + Vite)
- **Framework**: React 18 with Vite build system
- **UI Components**: Tailwind CSS + shadcn/ui
- **Real-time Features**: WebRTC for video/audio capture
- **Communication**: Socket.IO client for real-time updates
- **Routing**: React Router for navigation

### Backend (Flask + Python)
- **Framework**: Flask with SQLAlchemy ORM
- **Database**: SQLite (development) / PostgreSQL (production)
- **Real-time**: Flask-SocketIO for WebSocket communication
- **AI Integration**: Google Gemini API for transcription and responses
- **Storage**: Local files + AWS S3 cloud storage
- **Authentication**: Session-based admin authentication

## Deployment Options

### Option 1: Vercel (Recommended for Frontend) + Railway (Backend)

#### Frontend Deployment (Vercel)

1. **Prepare Frontend for Deployment**
   ```bash
   cd frontend
   npm run build
   ```

2. **Create vercel.json Configuration**
   ```json
   {
     "rewrites": [
       {
         "source": "/(.*)",
         "destination": "/index.html"
       }
     ],
     "env": {
       "VITE_API_URL": "https://your-backend-url.railway.app"
     }
   }
   ```

3. **Deploy to Vercel**
   - Connect GitHub repository to Vercel
   - Set environment variables in Vercel dashboard
   - Deploy automatically on git push

#### Backend Deployment (Railway)

1. **Create railway.json**
   ```json
   {
     "build": {
       "builder": "NIXPACKS"
     },
     "deploy": {
       "startCommand": "cd backend && python src/main.py",
       "healthcheckPath": "/api/admin/check-auth"
     }
   }
   ```

2. **Environment Variables for Railway**
   ```
   FLASK_ENV=production
   SECRET_KEY=your-production-secret-key
   DATABASE_URL=postgresql://user:pass@host:port/dbname
   GEMINI_API_KEY=your-gemini-api-key
   AWS_ACCESS_KEY_ID=your-aws-access-key
   AWS_SECRET_ACCESS_KEY=your-aws-secret-key
   AWS_S3_BUCKET_NAME=your-s3-bucket-name
   AWS_REGION=us-east-1
   PORT=5000
   ```

### Option 2: Full-Stack Deployment on Render

#### Create render.yaml
```yaml
services:
  - type: web
    name: ai-interview-backend
    env: python
    buildCommand: "cd backend && pip install -r requirements.txt"
    startCommand: "cd backend && python src/main.py"
    envVars:
      - key: FLASK_ENV
        value: production
      - key: DATABASE_URL
        fromDatabase:
          name: ai-interview-db
          property: connectionString
      - key: SECRET_KEY
        generateValue: true
      - key: GEMINI_API_KEY
        sync: false
      - key: AWS_ACCESS_KEY_ID
        sync: false
      - key: AWS_SECRET_ACCESS_KEY
        sync: false
      - key: AWS_S3_BUCKET_NAME
        sync: false

  - type: web
    name: ai-interview-frontend
    env: static
    buildCommand: "cd frontend && npm install && npm run build"
    staticPublishPath: frontend/dist
    envVars:
      - key: VITE_API_URL
        value: https://ai-interview-backend.onrender.com

databases:
  - name: ai-interview-db
    databaseName: ai_interview_chatbot
    user: ai_interview_user
```

## Environment Configuration

### Production Environment Variables

#### Backend (.env)
```bash
# Flask Configuration
FLASK_ENV=production
SECRET_KEY=your-super-secure-secret-key-here
PORT=5000

# Database Configuration
DATABASE_URL=postgresql://username:password@host:port/database_name

# Gemini AI Configuration
GEMINI_API_KEY=your-gemini-api-key-here

# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_S3_BUCKET_NAME=your-s3-bucket-name
AWS_REGION=us-east-1

# CORS Configuration
CORS_ORIGINS=https://your-frontend-domain.com

# Admin Configuration
ADMIN_USERNAME=admin
ADMIN_PASSWORD=secure-admin-password

# Interview Configuration
DEFAULT_INTERVIEW_DURATION=30
MAX_RECORDING_SIZE=100
```

#### Frontend (.env)
```bash
# API Configuration
VITE_API_URL=https://your-backend-domain.com

# WebSocket Configuration
VITE_SOCKET_URL=https://your-backend-domain.com

# Application Configuration
VITE_APP_NAME=AI Interview Chatbot
VITE_APP_VERSION=1.0.0
```

## Database Setup

### PostgreSQL Production Setup

1. **Create Database**
   ```sql
   CREATE DATABASE ai_interview_chatbot;
   CREATE USER ai_interview_user WITH PASSWORD 'secure_password';
   GRANT ALL PRIVILEGES ON DATABASE ai_interview_chatbot TO ai_interview_user;
   ```

2. **Update Backend for PostgreSQL**
   ```bash
   cd backend
   pip install psycopg2-binary
   ```

3. **Database Migration**
   The application will automatically create tables on first run.

## Cloud Storage Setup

### AWS S3 Configuration

1. **Create S3 Bucket**
   ```bash
   aws s3 mb s3://your-interview-recordings-bucket
   ```

2. **Set Bucket Policy**
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Principal": {
           "AWS": "arn:aws:iam::YOUR-ACCOUNT-ID:user/YOUR-IAM-USER"
         },
         "Action": [
           "s3:GetObject",
           "s3:PutObject",
           "s3:DeleteObject"
         ],
         "Resource": "arn:aws:s3:::your-interview-recordings-bucket/*"
       }
     ]
   }
   ```

3. **Create IAM User**
   - Create IAM user with S3 access
   - Generate access keys
   - Add keys to environment variables

## Security Considerations

### Production Security Checklist

- [ ] Use HTTPS for all communications
- [ ] Set secure SECRET_KEY for Flask sessions
- [ ] Configure CORS properly for production domains
- [ ] Use environment variables for all sensitive data
- [ ] Enable database connection encryption
- [ ] Set up proper S3 bucket permissions
- [ ] Configure rate limiting for API endpoints
- [ ] Use secure admin passwords
- [ ] Enable database backups
- [ ] Set up monitoring and logging

### HTTPS Configuration

For production deployment, ensure:
1. SSL certificates are properly configured
2. All API calls use HTTPS
3. WebSocket connections use WSS (secure WebSocket)
4. Mixed content warnings are resolved

## Performance Optimization

### Frontend Optimization

1. **Build Optimization**
   ```bash
   cd frontend
   npm run build
   ```

2. **Asset Optimization**
   - Images are optimized and compressed
   - Code splitting is enabled
   - Bundle size is minimized

### Backend Optimization

1. **Production WSGI Server**
   ```bash
   pip install gunicorn
   gunicorn --worker-class eventlet -w 1 --bind 0.0.0.0:5000 src.main:app
   ```

2. **Database Optimization**
   - Use connection pooling
   - Add database indexes for frequently queried fields
   - Implement query optimization

## Monitoring and Logging

### Application Monitoring

1. **Health Check Endpoints**
   - `/api/admin/check-auth` - Backend health
   - Frontend serves static files

2. **Logging Configuration**
   ```python
   import logging
   logging.basicConfig(level=logging.INFO)
   ```

3. **Error Tracking**
   - Implement error tracking service (Sentry)
   - Monitor API response times
   - Track user engagement metrics

## Backup and Recovery

### Database Backup

1. **Automated Backups**
   ```bash
   pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **S3 Backup**
   - Enable S3 versioning
   - Set up lifecycle policies
   - Regular backup verification

## Troubleshooting

### Common Deployment Issues

1. **CORS Errors**
   - Verify CORS_ORIGINS environment variable
   - Check frontend API URL configuration

2. **Database Connection Issues**
   - Verify DATABASE_URL format
   - Check database server accessibility
   - Confirm user permissions

3. **File Upload Issues**
   - Verify S3 credentials and permissions
   - Check bucket configuration
   - Confirm file size limits

4. **WebSocket Connection Issues**
   - Ensure WebSocket support on hosting platform
   - Check firewall and proxy configurations
   - Verify Socket.IO version compatibility

### Debug Mode

For debugging in production:
```bash
# Backend
FLASK_DEBUG=True python src/main.py

# Frontend
npm run dev
```

## Scaling Considerations

### Horizontal Scaling

1. **Load Balancing**
   - Use load balancer for multiple backend instances
   - Implement sticky sessions for WebSocket connections

2. **Database Scaling**
   - Read replicas for query optimization
   - Connection pooling
   - Database sharding if needed

3. **File Storage Scaling**
   - CDN for static assets
   - S3 with CloudFront distribution
   - Multiple region deployment

## Cost Optimization

### Resource Management

1. **Compute Resources**
   - Right-size server instances
   - Use auto-scaling when available
   - Monitor resource utilization

2. **Storage Costs**
   - Implement S3 lifecycle policies
   - Compress recordings before upload
   - Regular cleanup of old data

3. **API Costs**
   - Monitor Gemini API usage
   - Implement request caching
   - Optimize AI prompt efficiency

This deployment guide provides comprehensive instructions for deploying the AI Video Interview Chatbot to production environments with proper security, performance, and scalability considerations.

