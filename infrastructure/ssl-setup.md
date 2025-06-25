# SSL/TLS and Domain Configuration Guide

## Overview
This guide provides step-by-step instructions for setting up a custom domain with SSL/TLS certificates for the crypto trading platform.

## Prerequisites
- Domain name purchased (e.g., cryptoplatform.com)
- AWS Route53 access
- AWS Certificate Manager access
- Load balancer already deployed: `crypto-platform-dev-alb-505391454.us-east-1.elb.amazonaws.com`

## Step 1: Create Route53 Hosted Zone

```bash
# Create hosted zone for your domain
aws route53 create-hosted-zone \
  --name cryptoplatform.com \
  --caller-reference $(date +%s) \
  --hosted-zone-config Comment="Crypto Platform Production Domain"

# Note the Name Servers from the output and update your domain registrar
```

## Step 2: Request SSL Certificate

```bash
# Request wildcard certificate for domain and subdomains
aws acm request-certificate \
  --domain-name cryptoplatform.com \
  --subject-alternative-names "*.cryptoplatform.com" \
  --validation-method DNS \
  --tags Key=Name,Value=crypto-platform-ssl-cert Key=Environment,Value=production

# Note the CertificateArn from the output
```

## Step 3: Validate Certificate

```bash
# Get certificate validation records
aws acm describe-certificate \
  --certificate-arn arn:aws:acm:us-east-1:ACCOUNT:certificate/CERT-ID \
  --query "Certificate.DomainValidationOptions"

# Create DNS validation records in Route53
aws route53 change-resource-record-sets \
  --hosted-zone-id Z1234567890ABC \
  --change-batch file://cert-validation-records.json
```

## Step 4: Create DNS Records

```bash
# Create A record pointing to load balancer
aws route53 change-resource-record-sets \
  --hosted-zone-id Z1234567890ABC \
  --change-batch '{
    "Changes": [{
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "cryptoplatform.com",
        "Type": "A",
        "AliasTarget": {
          "DNSName": "crypto-platform-dev-alb-505391454.us-east-1.elb.amazonaws.com",
          "EvaluateTargetHealth": true,
          "HostedZoneId": "Z35SXDOTRQ7X7K"
        }
      }
    }]
  }'

# Create CNAME for www subdomain
aws route53 change-resource-record-sets \
  --hosted-zone-id Z1234567890ABC \
  --change-batch '{
    "Changes": [{
      "Action": "CREATE", 
      "ResourceRecordSet": {
        "Name": "www.cryptoplatform.com",
        "Type": "CNAME",
        "TTL": 300,
        "ResourceRecords": [{"Value": "cryptoplatform.com"}]
      }
    }]
  }'
```

## Step 5: Update Load Balancer with SSL

```bash
# Create HTTPS listener
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:us-east-1:645634482532:loadbalancer/app/crypto-platform-dev-alb/44137dd90dd48879 \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=arn:aws:acm:us-east-1:ACCOUNT:certificate/CERT-ID \
  --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:us-east-1:645634482532:targetgroup/crypto-platform-dev-web-app/2126926f2ef09d03

# Create redirect from HTTP to HTTPS
aws elbv2 modify-listener \
  --listener-arn arn:aws:elasticloadbalancing:us-east-1:645634482532:listener/app/crypto-platform-dev-alb/44137dd90dd48879/27c5ee54a12c9fb8 \
  --default-actions Type=redirect,RedirectConfig='{Protocol=HTTPS,Port=443,StatusCode=HTTP_301}'
```

## Step 6: Configure Subdomains

```bash
# API subdomain for trading engine
aws route53 change-resource-record-sets \
  --hosted-zone-id Z1234567890ABC \
  --change-batch '{
    "Changes": [{
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "api.cryptoplatform.com",
        "Type": "A",
        "AliasTarget": {
          "DNSName": "crypto-platform-dev-alb-505391454.us-east-1.elb.amazonaws.com",
          "EvaluateTargetHealth": true,
          "HostedZoneId": "Z35SXDOTRQ7X7K"
        }
      }
    }]
  }'

# Bot subdomain for Telegram webhook
aws route53 change-resource-record-sets \
  --hosted-zone-id Z1234567890ABC \
  --change-batch '{
    "Changes": [{
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "bot.cryptoplatform.com", 
        "Type": "A",
        "AliasTarget": {
          "DNSName": "crypto-platform-dev-alb-505391454.us-east-1.elb.amazonaws.com",
          "EvaluateTargetHealth": true,
          "HostedZoneId": "Z35SXDOTRQ7X7K"
        }
      }
    }]
  }'
```

## Step 7: Update Application Configuration

Update environment variables in ECS task definitions:

```json
{
  "name": "NEXTAUTH_URL",
  "value": "https://cryptoplatform.com"
},
{
  "name": "TELEGRAM_WEBHOOK_URL", 
  "value": "https://bot.cryptoplatform.com/telegram/webhook"
},
{
  "name": "API_BASE_URL",
  "value": "https://api.cryptoplatform.com"
}
```

## Step 8: Configure ALB Listener Rules

```bash
# Rule for API traffic
aws elbv2 create-rule \
  --listener-arn arn:aws:elasticloadbalancing:us-east-1:645634482532:listener/app/crypto-platform-dev-alb/44137dd90dd48879/HTTPS-LISTENER-ARN \
  --conditions Field=host-header,Values=api.cryptoplatform.com \
  --priority 100 \
  --actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:us-east-1:645634482532:targetgroup/crypto-dev-trading-engine/34da8661cfaf4310

# Rule for bot traffic  
aws elbv2 create-rule \
  --listener-arn arn:aws:elasticloadbalancing:us-east-1:645634482532:listener/app/crypto-platform-dev-alb/44137dd90dd48879/HTTPS-LISTENER-ARN \
  --conditions Field=host-header,Values=bot.cryptoplatform.com \
  --priority 200 \
  --actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:us-east-1:645634482532:targetgroup/crypto-platform-dev-telegram-bot/d9fff5ab6463477c
```

## Security Headers Configuration

Add security headers to ALB responses:

```bash
# Create custom response headers
aws elbv2 modify-listener \
  --listener-arn HTTPS-LISTENER-ARN \
  --default-actions Type=forward,TargetGroupArn=TARGET-GROUP-ARN,ForwardConfig='{
    "TargetGroups": [{"TargetGroupArn": "TARGET-GROUP-ARN", "Weight": 1}],
    "TargetGroupStickinessConfig": {"Enabled": false}
  }' \
  --default-actions Type=fixed-response,FixedResponseConfig='{
    "StatusCode": "200",
    "ContentType": "text/html",
    "MessageBody": "<html><head><title>Secure</title></head><body>Secure connection established</body></html>"
  }'
```

## Monitoring and Validation

```bash
# Test SSL certificate
openssl s_client -connect cryptoplatform.com:443 -servername cryptoplatform.com

# Test domain resolution
nslookup cryptoplatform.com
dig cryptoplatform.com

# Test HTTPS redirect
curl -I http://cryptoplatform.com

# Test subdomains
curl -I https://api.cryptoplatform.com/health
curl -I https://bot.cryptoplatform.com/health
```

## Final URLs After Setup

- **Main Website**: https://cryptoplatform.com
- **API Endpoint**: https://api.cryptoplatform.com
- **Telegram Bot**: https://bot.cryptoplatform.com
- **Admin Panel**: https://admin.cryptoplatform.com (future)

## Cost Implications

- **Route53 Hosted Zone**: $0.50/month
- **SSL Certificate**: Free (AWS Certificate Manager)
- **DNS Queries**: $0.40 per million queries
- **No additional ALB costs for HTTPS**

## Security Benefits

- ✅ End-to-end encryption
- ✅ Domain validation
- ✅ Professional appearance
- ✅ SEO benefits
- ✅ Browser security indicators
- ✅ API security for mobile apps

## Next Steps

1. Purchase domain name
2. Execute the commands above in sequence
3. Update application configurations
4. Test all endpoints
5. Monitor certificate expiration (auto-renewed by AWS)

This setup provides enterprise-grade SSL/TLS security for the crypto trading platform.
