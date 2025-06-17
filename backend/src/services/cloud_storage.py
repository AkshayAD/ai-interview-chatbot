import os
import boto3
from botocore.exceptions import ClientError
import uuid
from datetime import datetime

class CloudStorageService:
    """Service for handling cloud storage operations"""
    
    def __init__(self):
        self.s3_client = None
        self.bucket_name = os.getenv('AWS_S3_BUCKET_NAME')
        self.aws_access_key = os.getenv('AWS_ACCESS_KEY_ID')
        self.aws_secret_key = os.getenv('AWS_SECRET_ACCESS_KEY')
        self.aws_region = os.getenv('AWS_REGION', 'us-east-1')
        
        # Initialize S3 client if credentials are available
        if self.aws_access_key and self.aws_secret_key and self.bucket_name:
            try:
                self.s3_client = boto3.client(
                    's3',
                    aws_access_key_id=self.aws_access_key,
                    aws_secret_access_key=self.aws_secret_key,
                    region_name=self.aws_region
                )
                print("Cloud storage initialized successfully")
            except Exception as e:
                print(f"Failed to initialize cloud storage: {e}")
                self.s3_client = None
        else:
            print("Cloud storage not configured - using local storage")
    
    def upload_file(self, file_path, session_id, recording_type='video'):
        """Upload file to cloud storage or keep local"""
        try:
            if self.s3_client and self.bucket_name:
                # Generate cloud storage key
                timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
                file_extension = os.path.splitext(file_path)[1]
                cloud_key = f"recordings/{session_id}/{timestamp}_{uuid.uuid4()}{file_extension}"
                
                # Upload to S3
                self.s3_client.upload_file(
                    file_path, 
                    self.bucket_name, 
                    cloud_key,
                    ExtraArgs={
                        'ContentType': 'video/webm' if recording_type == 'video' else 'audio/webm',
                        'ServerSideEncryption': 'AES256'
                    }
                )
                
                # Generate presigned URL for access
                cloud_url = self.s3_client.generate_presigned_url(
                    'get_object',
                    Params={'Bucket': self.bucket_name, 'Key': cloud_key},
                    ExpiresIn=3600 * 24 * 7  # 7 days
                )
                
                # Remove local file after successful upload
                if os.path.exists(file_path):
                    os.remove(file_path)
                
                return {
                    'cloud_url': cloud_url,
                    'cloud_key': cloud_key,
                    'storage_type': 'cloud'
                }
            else:
                # Keep file locally
                return {
                    'cloud_url': None,
                    'cloud_key': None,
                    'storage_type': 'local'
                }
                
        except ClientError as e:
            print(f"Error uploading to cloud storage: {e}")
            return {
                'cloud_url': None,
                'cloud_key': None,
                'storage_type': 'local'
            }
    
    def delete_file(self, cloud_key):
        """Delete file from cloud storage"""
        try:
            if self.s3_client and self.bucket_name and cloud_key:
                self.s3_client.delete_object(
                    Bucket=self.bucket_name,
                    Key=cloud_key
                )
                return True
        except ClientError as e:
            print(f"Error deleting from cloud storage: {e}")
        return False
    
    def get_download_url(self, cloud_key, expires_in=3600):
        """Generate presigned download URL"""
        try:
            if self.s3_client and self.bucket_name and cloud_key:
                return self.s3_client.generate_presigned_url(
                    'get_object',
                    Params={'Bucket': self.bucket_name, 'Key': cloud_key},
                    ExpiresIn=expires_in
                )
        except ClientError as e:
            print(f"Error generating download URL: {e}")
        return None

# Global instance
cloud_storage = CloudStorageService()

