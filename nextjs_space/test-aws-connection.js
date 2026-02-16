// Test AWS S3 Connection
const { S3Client, ListBucketsCommand, HeadBucketCommand } = require("@aws-sdk/client-s3");
require('dotenv').config({ path: '.env' });

async function testAWSConnection() {
  console.log('🔍 Testing AWS S3 Connection...\n');
  
  // Check environment variables
  console.log('📋 Environment Variables:');
  console.log('  AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID ? '✅ Set' : '❌ Not set');
  console.log('  AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? '✅ Set' : '❌ Not set');
  console.log('  AWS_REGION:', process.env.AWS_REGION || '❌ Not set');
  console.log('  AWS_BUCKET_NAME:', process.env.AWS_BUCKET_NAME || '❌ Not set');
  console.log('  AWS_FOLDER_PREFIX:', process.env.AWS_FOLDER_PREFIX || '❌ Not set');
  console.log('  AWS_PROFILE:', process.env.AWS_PROFILE || '❌ Not set');
  console.log('');
  
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.log('❌ Missing AWS credentials. Cannot test connection.');
    process.exit(1);
  }
  
  try {
    // Create S3 client
    const s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-west-2',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
    
    console.log('🔌 Attempting to connect to AWS S3...\n');
    
    let connectionWorking = false;
    
    // Test 1: Try to generate a presigned URL (what the app actually needs)
    if (process.env.AWS_BUCKET_NAME) {
      console.log('Test 1: Testing presigned URL generation (what the app uses)...');
      try {
        const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
        const { PutObjectCommand } = require("@aws-sdk/client-s3");
        
        const testKey = `${process.env.AWS_FOLDER_PREFIX || ''}test-connection-${Date.now()}.txt`;
        const command = new PutObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: testKey,
          ContentType: 'text/plain',
        });
        
        const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 });
        console.log('  ✅ Successfully generated presigned URL!');
        console.log('  📝 Test key:', testKey);
        console.log('  🔗 Presigned URL generated (first 50 chars):', presignedUrl.substring(0, 50) + '...');
        console.log('  ✅ AWS S3 connection is WORKING for uploads!');
        connectionWorking = true;
      } catch (error) {
        console.log('  ❌ Failed to generate presigned URL:', error.message);
        if (error.name === 'AccessDenied' || error.$metadata?.httpStatusCode === 403) {
          console.log('  ⚠️  You may not have permission to upload to this bucket');
          console.log('  💡 The credentials are valid, but permissions may be restricted');
        }
      }
    } else {
      console.log('  ⚠️  AWS_BUCKET_NAME not set, skipping test');
    }
    
    // Test 2: Check if specific bucket exists and is accessible (optional check)
    if (process.env.AWS_BUCKET_NAME && !connectionWorking) {
      console.log('\nTest 2: Checking bucket access (optional)...');
      try {
        const headCommand = new HeadBucketCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
        });
        await s3Client.send(headCommand);
        console.log(`  ✅ Bucket "${process.env.AWS_BUCKET_NAME}" is accessible!`);
        connectionWorking = true;
      } catch (error) {
        if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
          console.log(`  ❌ Bucket "${process.env.AWS_BUCKET_NAME}" not found`);
        } else if (error.name === 'Forbidden' || error.$metadata?.httpStatusCode === 403) {
          console.log(`  ⚠️  Cannot verify bucket access (403 Forbidden)`);
          console.log('     This is OK if you can still generate presigned URLs');
        } else {
          console.log(`  ⚠️  Error accessing bucket: ${error.message}`);
        }
      }
    }
    
    if (!connectionWorking) {
      throw new Error('Could not establish working connection to AWS S3');
    }
    
    console.log('\n✅ All AWS connection tests passed!');
    console.log('🚀 AWS S3 is properly configured and accessible.');
    
  } catch (error) {
    console.log('\n❌ AWS Connection Test Failed!');
    console.log('Error details:');
    console.log('  Name:', error.name);
    console.log('  Message:', error.message);
    if (error.$metadata) {
      console.log('  HTTP Status:', error.$metadata.httpStatusCode);
      console.log('  Request ID:', error.$metadata.requestId);
    }
    console.log('\n💡 Troubleshooting:');
    console.log('  1. Verify AWS credentials are correct');
    console.log('  2. Check if your AWS account has S3 permissions');
    console.log('  3. Verify the bucket name is correct');
    console.log('  4. Check if your IP is not blocked by AWS');
    process.exit(1);
  }
}

testAWSConnection();

