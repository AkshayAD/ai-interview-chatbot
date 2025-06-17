import google.generativeai as genai
import base64
import io
import os
from typing import Optional, Dict, Any, List
import logging
import asyncio
import json

logger = logging.getLogger(__name__)

class GeminiService:
    def __init__(self):
        """Initialize Gemini API service"""
        self.api_key = os.getenv('GEMINI_API_KEY')
        if not self.api_key:
            logger.warning("GEMINI_API_KEY not found in environment variables")
            return
            
        genai.configure(api_key=self.api_key)
        
        # Initialize models
        self.text_model = genai.GenerativeModel('gemini-1.5-flash')
        self.audio_model = genai.GenerativeModel('gemini-1.5-flash')
        
        logger.info("Gemini API service initialized successfully")

    def is_available(self) -> bool:
        """Check if Gemini API is available"""
        return self.api_key is not None

    async def transcribe_audio(self, audio_data: bytes, format: str = 'webm') -> Optional[str]:
        """
        Transcribe audio data using Gemini API
        
        Args:
            audio_data: Raw audio bytes
            format: Audio format (webm, mp3, wav, etc.)
            
        Returns:
            Transcribed text or None if failed
        """
        if not self.is_available():
            logger.error("Gemini API not available")
            return None
            
        try:
            # Convert audio data to base64
            audio_b64 = base64.b64encode(audio_data).decode('utf-8')
            
            # Create audio part for Gemini
            audio_part = {
                "mime_type": f"audio/{format}",
                "data": audio_b64
            }
            
            # Create prompt for transcription
            prompt = """
            Please transcribe the audio content accurately. 
            Return only the transcribed text without any additional formatting or commentary.
            If the audio is unclear or contains no speech, return an empty string.
            """
            
            # Generate transcription
            response = await asyncio.to_thread(
                self.audio_model.generate_content,
                [prompt, audio_part]
            )
            
            if response and response.text:
                transcription = response.text.strip()
                logger.info(f"Transcription successful: {len(transcription)} characters")
                return transcription
            else:
                logger.warning("No transcription returned from Gemini")
                return ""
                
        except Exception as e:
            logger.error(f"Error transcribing audio: {str(e)}")
            return None

    async def generate_ai_response(
        self, 
        question: str, 
        transcript: str, 
        response_type: str = 'hint',
        ai_prompt: str = None
    ) -> Optional[Dict[str, Any]]:
        """
        Generate AI response based on question and candidate transcript
        
        Args:
            question: The interview question
            transcript: Candidate's response transcript
            response_type: Type of response (hint, feedback, encouragement)
            ai_prompt: Custom AI prompt template
            
        Returns:
            AI response with type and message
        """
        if not self.is_available():
            logger.error("Gemini API not available")
            return None
            
        try:
            # Default AI prompt if none provided
            if not ai_prompt:
                ai_prompt = self._get_default_ai_prompt()
            
            # Format the prompt with context
            formatted_prompt = ai_prompt.format(
                question=question,
                transcript=transcript,
                response_type=response_type
            )
            
            # Generate AI response
            response = await asyncio.to_thread(
                self.text_model.generate_content,
                formatted_prompt
            )
            
            if response and response.text:
                ai_text = response.text.strip()
                
                # Parse response if it's JSON format
                try:
                    ai_response = json.loads(ai_text)
                    if isinstance(ai_response, dict):
                        return ai_response
                except json.JSONDecodeError:
                    pass
                
                # Return simple text response
                return {
                    'type': response_type,
                    'message': ai_text,
                    'timestamp': None
                }
            else:
                logger.warning("No AI response generated")
                return None
                
        except Exception as e:
            logger.error(f"Error generating AI response: {str(e)}")
            return None

    def _get_default_ai_prompt(self) -> str:
        """Get default AI prompt template"""
        return """
You are an AI interview assistant helping candidates with guesstimate questions. 
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
}
"""

    async def analyze_response_quality(
        self, 
        question: str, 
        transcript: str
    ) -> Optional[Dict[str, Any]]:
        """
        Analyze the quality of a candidate's response
        
        Args:
            question: The interview question
            transcript: Complete candidate response
            
        Returns:
            Analysis with score and feedback
        """
        if not self.is_available():
            logger.error("Gemini API not available")
            return None
            
        try:
            prompt = f"""
            Analyze this interview response for a guesstimate question.
            
            Question: {question}
            Candidate Response: {transcript}
            
            Evaluate the response on these criteria:
            1. Structured thinking approach (0-25 points)
            2. Reasonable assumptions (0-25 points)
            3. Mathematical accuracy (0-25 points)
            4. Communication clarity (0-25 points)
            
            Provide a JSON response with:
            {{
                "total_score": <0-100>,
                "breakdown": {{
                    "structure": <0-25>,
                    "assumptions": <0-25>,
                    "math": <0-25>,
                    "communication": <0-25>
                }},
                "strengths": ["strength1", "strength2"],
                "improvements": ["improvement1", "improvement2"],
                "overall_feedback": "Brief overall assessment"
            }}
            """
            
            response = await asyncio.to_thread(
                self.text_model.generate_content,
                prompt
            )
            
            if response and response.text:
                try:
                    analysis = json.loads(response.text.strip())
                    logger.info(f"Response analysis completed: {analysis.get('total_score', 0)}/100")
                    return analysis
                except json.JSONDecodeError:
                    logger.error("Failed to parse analysis JSON")
                    return None
            else:
                logger.warning("No analysis generated")
                return None
                
        except Exception as e:
            logger.error(f"Error analyzing response: {str(e)}")
            return None

    async def generate_follow_up_question(
        self, 
        original_question: str, 
        transcript: str
    ) -> Optional[str]:
        """
        Generate a follow-up question based on the candidate's response
        
        Args:
            original_question: The original interview question
            transcript: Candidate's response
            
        Returns:
            Follow-up question or None
        """
        if not self.is_available():
            logger.error("Gemini API not available")
            return None
            
        try:
            prompt = f"""
            Based on this guesstimate interview exchange, generate a thoughtful follow-up question.
            
            Original Question: {original_question}
            Candidate Response: {transcript}
            
            Generate a follow-up question that:
            1. Builds on their response
            2. Tests deeper thinking
            3. Explores assumptions they made
            4. Is appropriate for the interview context
            
            Return only the follow-up question, no additional text.
            """
            
            response = await asyncio.to_thread(
                self.text_model.generate_content,
                prompt
            )
            
            if response and response.text:
                follow_up = response.text.strip()
                logger.info("Follow-up question generated successfully")
                return follow_up
            else:
                logger.warning("No follow-up question generated")
                return None
                
        except Exception as e:
            logger.error(f"Error generating follow-up question: {str(e)}")
            return None

# Global instance
gemini_service = GeminiService()

