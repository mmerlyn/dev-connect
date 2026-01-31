#!/bin/bash
set -e

# Configuration
BUCKET_NAME="devconnect-web"
REGION="us-east-1"

echo "=== Setting up CloudFront Distribution ==="

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo "Error: AWS CLI not installed"
    exit 1
fi

# Create CloudFront Origin Access Control (OAC)
echo "Creating Origin Access Control..."
OAC_ID=$(aws cloudfront create-origin-access-control \
    --origin-access-control-config "{
        \"Name\": \"$BUCKET_NAME-oac\",
        \"Description\": \"OAC for $BUCKET_NAME\",
        \"SigningProtocol\": \"sigv4\",
        \"SigningBehavior\": \"always\",
        \"OriginAccessControlOriginType\": \"s3\"
    }" \
    --query 'OriginAccessControl.Id' --output text 2>/dev/null || echo "")

if [ -z "$OAC_ID" ]; then
    echo "OAC may already exist, looking up..."
    OAC_ID=$(aws cloudfront list-origin-access-controls \
        --query "OriginAccessControlList.Items[?Name=='$BUCKET_NAME-oac'].Id" \
        --output text)
fi

echo "OAC ID: $OAC_ID"

# Create CloudFront distribution
echo ""
echo "Creating CloudFront distribution..."

CALLER_REF=$(date +%s)

DISTRIBUTION=$(aws cloudfront create-distribution \
    --distribution-config "{
        \"CallerReference\": \"$CALLER_REF\",
        \"Comment\": \"DevConnect Frontend\",
        \"Enabled\": true,
        \"DefaultRootObject\": \"index.html\",
        \"Origins\": {
            \"Quantity\": 1,
            \"Items\": [{
                \"Id\": \"S3-$BUCKET_NAME\",
                \"DomainName\": \"$BUCKET_NAME.s3.$REGION.amazonaws.com\",
                \"S3OriginConfig\": {
                    \"OriginAccessIdentity\": \"\"
                },
                \"OriginAccessControlId\": \"$OAC_ID\"
            }]
        },
        \"DefaultCacheBehavior\": {
            \"TargetOriginId\": \"S3-$BUCKET_NAME\",
            \"ViewerProtocolPolicy\": \"redirect-to-https\",
            \"AllowedMethods\": {
                \"Quantity\": 2,
                \"Items\": [\"GET\", \"HEAD\"],
                \"CachedMethods\": {
                    \"Quantity\": 2,
                    \"Items\": [\"GET\", \"HEAD\"]
                }
            },
            \"CachePolicyId\": \"658327ea-f89d-4fab-a63d-7e88639e58f6\",
            \"Compress\": true
        },
        \"CustomErrorResponses\": {
            \"Quantity\": 2,
            \"Items\": [
                {
                    \"ErrorCode\": 403,
                    \"ResponsePagePath\": \"/index.html\",
                    \"ResponseCode\": \"200\",
                    \"ErrorCachingMinTTL\": 10
                },
                {
                    \"ErrorCode\": 404,
                    \"ResponsePagePath\": \"/index.html\",
                    \"ResponseCode\": \"200\",
                    \"ErrorCachingMinTTL\": 10
                }
            ]
        },
        \"PriceClass\": \"PriceClass_100\"
    }" \
    --query 'Distribution.{Id:Id,DomainName:DomainName}' --output json)

DISTRIBUTION_ID=$(echo "$DISTRIBUTION" | grep -o '"Id": "[^"]*"' | cut -d'"' -f4)
DOMAIN_NAME=$(echo "$DISTRIBUTION" | grep -o '"DomainName": "[^"]*"' | cut -d'"' -f4)

echo ""
echo "=== CloudFront Setup Complete ==="
echo ""
echo "Distribution ID: $DISTRIBUTION_ID"
echo "CloudFront URL:  https://$DOMAIN_NAME"
echo ""
echo "IMPORTANT: Update your deploy-aws.sh with:"
echo "  DISTRIBUTION_ID=\"$DISTRIBUTION_ID\""
echo ""
echo "Update S3 bucket policy to allow CloudFront access:"
echo ""
cat << EOF
aws s3api put-bucket-policy --bucket $BUCKET_NAME --policy '{
    "Version": "2012-10-17",
    "Statement": [{
        "Sid": "AllowCloudFrontServicePrincipal",
        "Effect": "Allow",
        "Principal": {
            "Service": "cloudfront.amazonaws.com"
        },
        "Action": "s3:GetObject",
        "Resource": "arn:aws:s3:::$BUCKET_NAME/*",
        "Condition": {
            "StringEquals": {
                "AWS:SourceArn": "arn:aws:cloudfront::$(aws sts get-caller-identity --query Account --output text):distribution/$DISTRIBUTION_ID"
            }
        }
    }]
}'
EOF
echo ""
echo "Note: CloudFront deployment takes 5-10 minutes to propagate globally."
