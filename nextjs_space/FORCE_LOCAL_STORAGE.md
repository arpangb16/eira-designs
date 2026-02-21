# Force Local Storage

If you want to use local file storage instead of AWS, even when AWS credentials are configured, you have two options:

## Option 1: Environment Variable (Recommended)

Add this to your `.env.local` file:

```
USE_LOCAL_STORAGE=true
```

This will force the system to use local storage regardless of AWS configuration.

## Option 2: Remove AWS Configuration

Remove or comment out AWS variables in your `.env` or `.env.local` file:

```bash
# AWS_PROFILE=hosted_storage
# AWS_REGION=us-west-2
# AWS_BUCKET_NAME=abacusai-apps-c36fd14986af5dbe4280982c-us-west-2
# AWS_FOLDER_PREFIX=16728/
```

## Automatic Fallback

The system will automatically fall back to local storage if:
- AWS credentials are not accessible
- AWS operations fail
- `AWS_BUCKET_NAME` is not set

## File Locations

Local files are stored in:
- `public/uploads/` - Private uploads
- `public/uploads/public/` - Public uploads

Files are accessible at: `http://localhost:3000/uploads/...`



