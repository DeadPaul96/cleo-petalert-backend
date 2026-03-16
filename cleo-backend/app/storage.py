import os
import boto3
from botocore.exceptions import ClientError
from dotenv import load_dotenv

load_dotenv()

class StorageManager:
    def __init__(self):
        self.access_key = os.getenv("R2_ACCESS_KEY_ID")
        self.secret_key = os.getenv("R2_SECRET_ACCESS_KEY")
        self.endpoint = os.getenv("R2_ENDPOINT_URL")
        self.bucket_name = os.getenv("R2_BUCKET_NAME")
        self.public_domain = os.getenv("R2_PUBLIC_DOMAIN")

        self.s3_client = boto3.client(
            service_name='s3',
            endpoint_url=self.endpoint,
            aws_access_key_id=self.access_key,
            aws_secret_access_key=self.secret_key,
            region_name='auto'  # R2 expects 'auto'
        )

    def upload_file(self, file_content, object_name, content_type="image/jpeg"):
        """
        Uploads a file to the R2 bucket.
        :param file_content: Bytes of the file
        :param object_name: Name of the file in the bucket (e.g. 'avatars/123.jpg')
        :param content_type: MIME type of the file
        :return: Public URL of the uploaded file
        """
        try:
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=object_name,
                Body=file_content,
                ContentType=content_type
            )
            
            # Construct the public URL
            if self.public_domain:
                return f"{self.public_domain.rstrip('/')}/{object_name}"
            else:
                # Fallback to endpoint-based URL if public domain is not set
                return f"{self.endpoint}/{self.bucket_name}/{object_name}"
                
        except ClientError as e:
            print(f"Error uploading to R2: {e}")
            return None

storage_manager = StorageManager()
