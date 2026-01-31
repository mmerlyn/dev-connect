#!/bin/bash
set -e

# Configuration - UPDATE THESE VALUES
BUCKET_NAME="devconnect-web"
REGION="us-east-1"
DISTRIBUTION_ID="ELXD92MNBRIO8"

echo "=== DevConnect Frontend AWS Deployment ==="

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo "Error: AWS CLI not installed. Run: brew install awscli"
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo "Error: AWS credentials not configured. Run: aws configure"
    exit 1
fi

echo "AWS Account: $(aws sts get-caller-identity --query Account --output text)"

# Build the frontend
echo ""
echo "=== Building frontend ==="
npm run build

# Check if bucket exists
if aws s3api head-bucket --bucket "$BUCKET_NAME" 2>/dev/null; then
    echo "Bucket $BUCKET_NAME exists"
else
    echo "Creating S3 bucket: $BUCKET_NAME"

    if [ "$REGION" = "us-east-1" ]; then
        aws s3api create-bucket --bucket "$BUCKET_NAME" --region "$REGION"
    else
        aws s3api create-bucket --bucket "$BUCKET_NAME" --region "$REGION" \
            --create-bucket-configuration LocationConstraint="$REGION"
    fi

    # Disable block public access
    aws s3api put-public-access-block --bucket "$BUCKET_NAME" --public-access-block-configuration \
        "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"

    # Enable static website hosting
    aws s3 website "s3://$BUCKET_NAME" --index-document index.html --error-document index.html

    # Set bucket policy for public read
    aws s3api put-bucket-policy --bucket "$BUCKET_NAME" --policy "{
        \"Version\": \"2012-10-17\",
        \"Statement\": [{
            \"Sid\": \"PublicReadGetObject\",
            \"Effect\": \"Allow\",
            \"Principal\": \"*\",
            \"Action\": \"s3:GetObject\",
            \"Resource\": \"arn:aws:s3:::$BUCKET_NAME/*\"
        }]
    }"

    echo "Bucket created and configured for static hosting"
fi

# Sync files to S3
echo ""
echo "=== Uploading to S3 ==="
aws s3 sync dist/ "s3://$BUCKET_NAME" --delete \
    --cache-control "max-age=31536000" \
    --exclude "index.html"

# Upload index.html with no-cache
aws s3 cp dist/index.html "s3://$BUCKET_NAME/index.html" \
    --cache-control "no-cache, no-store, must-revalidate"

echo ""
echo "=== Deployment Complete ==="
echo ""
echo "S3 Website URL:"
echo "  http://$BUCKET_NAME.s3-website-$REGION.amazonaws.com"
echo ""

# Invalidate CloudFront if distribution ID is set
if [ -n "$DISTRIBUTION_ID" ]; then
    echo "Invalidating CloudFront cache..."
    aws cloudfront create-invalidation --distribution-id "$DISTRIBUTION_ID" --paths "/*"
    echo "CloudFront invalidation started"
fi

echo "Done!"
