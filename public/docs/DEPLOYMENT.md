# RefBase MCP - Deployment and Production Guide

This guide provides comprehensive instructions for deploying the RefBase MCP in production environments, including Docker containers, cloud platforms, monitoring, and scaling considerations.

## Table of Contents

1. [Production Requirements](#production-requirements)
2. [Docker Deployment](#docker-deployment)
3. [Cloud Platform Deployment](#cloud-platform-deployment)
4. [High Availability Setup](#high-availability-setup)
5. [Monitoring and Logging](#monitoring-and-logging)
6. [Security Hardening](#security-hardening)
7. [Performance Optimization](#performance-optimization)
8. [Backup and Recovery](#backup-and-recovery)
9. [CI/CD Pipeline](#cicd-pipeline)
10. [Troubleshooting Production Issues](#troubleshooting-production-issues)

---

## Production Requirements

### System Requirements

**Minimum Production Specifications:**
- **CPU**: 2 vCPUs (4 vCPUs recommended)
- **Memory**: 2GB RAM (4GB recommended)
- **Storage**: 10GB SSD (50GB recommended for logs)
- **Network**: Stable internet connection with low latency to RefBase API

**Operating System Support:**
- Ubuntu 20.04+ LTS
- CentOS 8+/RHEL 8+
- Amazon Linux 2
- Docker containers (any Linux distribution)

### Software Dependencies

**Required:**
- Node.js 18+ LTS
- npm 8+ or yarn 1.22+
- PM2 or similar process manager

**Optional but Recommended:**
- nginx (reverse proxy)
- Redis (caching layer)
- logrotate (log management)
- fail2ban (security)

### Network Requirements

**Outbound Access:**
- RefBase API endpoint (HTTPS/443)
- npm registry (HTTPS/443)
- NTP servers (UDP/123)

**Inbound Access:**
- MCP server port (default 3000)
- Health check endpoint
- Management interfaces (SSH/22)

---

## Docker Deployment

### Basic Docker Setup

**1. Create Dockerfile:**
```dockerfile
# Production Dockerfile for RefBase MCP
FROM node:18-alpine AS builder

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S refbase -u 1001

# Set working directory
WORKDIR /app

# Copy built application
COPY --from=builder --chown=refbase:nodejs /app/dist ./dist
COPY --from=builder --chown=refbase:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=refbase:nodejs /app/package*.json ./

# Create directories
RUN mkdir -p /app/logs /app/config && \
    chown -R refbase:nodejs /app

# Switch to non-root user
USER refbase

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); }).on('error', () => { process.exit(1); });"

# Start the application
CMD ["node", "dist/index.js"]
```

**2. Create docker-compose.yml:**
```yaml
version: '3.8'

services:
  refbase-mcp:
    build: .
    container_name: refbase-mcp
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - MCP_SERVER_PORT=3000
      - LOG_LEVEL=info
      - LOG_FILE=/app/logs/production.log
    env_file:
      - .env.production
    ports:
      - "3000:3000"
    volumes:
      - ./logs:/app/logs
      - ./config:/app/config:ro
    networks:
      - refbase-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s

  nginx:
    image: nginx:alpine
    container_name: refbase-mcp-proxy
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
      - ./logs/nginx:/var/log/nginx
    depends_on:
      - refbase-mcp
    networks:
      - refbase-network

  redis:
    image: redis:7-alpine
    container_name: refbase-mcp-cache
    restart: unless-stopped
    command: redis-server --appendonly yes
    volumes:
      - redis-data:/data
    networks:
      - refbase-network

networks:
  refbase-network:
    driver: bridge

volumes:
  redis-data:
```

**3. Create nginx configuration:**
```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream refbase_mcp {
        server refbase-mcp:3000;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=mcp:10m rate=10r/s;

    server {
        listen 80;
        server_name refbase.dev;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name refbase.dev;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;

        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";

        location / {
            limit_req zone=mcp burst=20 nodelay;
            
            proxy_pass http://refbase_mcp;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        location /health {
            access_log off;
            proxy_pass http://refbase_mcp;
        }
    }
}
```

**4. Deploy with Docker Compose:**
```bash
# Create production environment file
cp .env.example .env.production

# Edit production configuration
nano .env.production

# Build and start services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f refbase-mcp
```

---

## Cloud Platform Deployment

### AWS Deployment

**Using AWS ECS with Fargate:**

1. **Create ECR repository:**
```bash
aws ecr create-repository --repository-name refbase-mcp
```

2. **Build and push image:**
```bash
# Get login token
aws ecr get-login-password --region us-west-2 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-west-2.amazonaws.com

# Build and tag image
docker build -t refbase-mcp .
docker tag refbase-mcp:latest <account-id>.dkr.ecr.us-west-2.amazonaws.com/refbase-mcp:latest

# Push image
docker push <account-id>.dkr.ecr.us-west-2.amazonaws.com/refbase-mcp:latest
```

3. **Create ECS task definition:**
```json
{
  "family": "refbase-mcp",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::account:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "refbase-mcp",
      "image": "<account-id>.dkr.ecr.us-west-2.amazonaws.com/refbase-mcp:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "REFBASE_TOKEN",
          "valueFrom": "arn:aws:secretsmanager:us-west-2:account:secret:refbase/token"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/refbase-mcp",
          "awslogs-region": "us-west-2",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": [
          "CMD-SHELL",
          "curl -f http://localhost:3000/health || exit 1"
        ],
        "interval": 30,
        "timeout": 5,
        "retries": 3
      }
    }
  ]
}
```

4. **Create Application Load Balancer:**
```bash
# Create ALB
aws elbv2 create-load-balancer \
  --name refbase-mcp-alb \
  --subnets subnet-12345 subnet-67890 \
  --security-groups sg-12345

# Create target group
aws elbv2 create-target-group \
  --name refbase-mcp-targets \
  --protocol HTTP \
  --port 3000 \
  --vpc-id vpc-12345 \
  --target-type ip \
  --health-check-path /health
```

### Google Cloud Platform Deployment

**Using Cloud Run:**

1. **Create cloudbuild.yaml:**
```yaml
steps:
  # Build the container image
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/refbase-mcp:$COMMIT_SHA', '.']

  # Push the container image to Container Registry
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/refbase-mcp:$COMMIT_SHA']

  # Deploy container image to Cloud Run
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
    - 'run'
    - 'deploy'
    - 'refbase-mcp'
    - '--image'
    - 'gcr.io/$PROJECT_ID/refbase-mcp:$COMMIT_SHA'
    - '--region'
    - 'us-central1'
    - '--platform'
    - 'managed'

images:
- 'gcr.io/$PROJECT_ID/refbase-mcp:$COMMIT_SHA'
```

2. **Deploy with Cloud Build:**
```bash
gcloud builds submit --config cloudbuild.yaml
```

### Azure Deployment

**Using Container Instances:**

1. **Create resource group:**
```bash
az group create --name refbase-mcp-rg --location eastus
```

2. **Deploy container:**
```bash
az container create \
  --resource-group refbase-mcp-rg \
  --name refbase-mcp \
  --image your-registry/refbase-mcp:latest \
  --cpu 1 \
  --memory 2 \
  --restart-policy Always \
  --ports 3000 \
  --environment-variables NODE_ENV=production \
  --secure-environment-variables REFBASE_TOKEN=your-token
```

---

## High Availability Setup

### Load Balancer Configuration

**HAProxy Setup:**
```
# haproxy.cfg
global
    daemon
    maxconn 4096

defaults
    mode http
    timeout connect 5000ms
    timeout client 50000ms
    timeout server 50000ms

frontend mcp_frontend
    bind *:80
    bind *:443 ssl crt /etc/ssl/certs/certificate.pem
    redirect scheme https if !{ ssl_fc }
    default_backend mcp_servers

backend mcp_servers
    balance roundrobin
    option httpchk GET /health
    server mcp1 10.0.1.10:3000 check
    server mcp2 10.0.1.11:3000 check
    server mcp3 10.0.1.12:3000 check
```

### Multi-Instance Deployment

**PM2 Cluster Mode:**
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'refbase-mcp',
    script: './dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      MCP_SERVER_PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max_old_space_size=1024'
  }]
};
```

**Kubernetes Deployment:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: refbase-mcp
spec:
  replicas: 3
  selector:
    matchLabels:
      app: refbase-mcp
  template:
    metadata:
      labels:
        app: refbase-mcp
    spec:
      containers:
      - name: refbase-mcp
        image: refbase-mcp:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: REFBASE_TOKEN
          valueFrom:
            secretKeyRef:
              name: refbase-secrets
              key: token
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: refbase-mcp-service
spec:
  selector:
    app: refbase-mcp
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
```

---

## Monitoring and Logging

### Prometheus Monitoring

**prometheus.yml configuration:**
```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'refbase-mcp'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: /metrics
    scrape_interval: 10s
```

**Add monitoring endpoint to server:**
```typescript
// Add to your server
import { register } from 'prom-client';

app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (ex) {
    res.status(500).end(ex);
  }
});
```

### Grafana Dashboard

**Import dashboard JSON:**
```json
{
  "dashboard": {
    "title": "RefBase MCP",
    "panels": [
      {
        "title": "Request Rate",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])"
          }
        ]
      },
      {
        "title": "Response Times",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_ms_bucket[5m]))"
          }
        ]
      }
    ]
  }
}
```

### Centralized Logging

**ELK Stack Configuration:**

**Filebeat configuration:**
```yaml
# filebeat.yml
filebeat.inputs:
- type: log
  enabled: true
  paths:
    - /app/logs/*.log
  fields:
    service: refbase-mcp
  json.keys_under_root: true

output.elasticsearch:
  hosts: ["elasticsearch:9200"]
  index: "refbase-mcp-%{+yyyy.MM.dd}"

setup.template.name: "refbase-mcp"
setup.template.pattern: "refbase-mcp-*"
```

**Logstash filter:**
```ruby
# logstash.conf
filter {
  if [fields][service] == "refbase-mcp" {
    if [message] =~ /^{.*}$/ {
      json {
        source => "message"
      }
    }
    
    date {
      match => [ "timestamp", "ISO8601" ]
    }
  }
}
```

### Health Checks

**Comprehensive health check endpoint:**
```typescript
app.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      refbase_api: 'unknown',
      database: 'unknown',
      cache: 'unknown'
    },
    metrics: {
      memory: process.memoryUsage(),
      uptime: process.uptime()
    }
  };

  try {
    // Check RefBase API
    await refbaseClient.healthCheck();
    health.services.refbase_api = 'healthy';
  } catch (error) {
    health.services.refbase_api = 'unhealthy';
    health.status = 'degraded';
  }

  // Check cache
  try {
    await cache.ping();
    health.services.cache = 'healthy';
  } catch (error) {
    health.services.cache = 'unhealthy';
  }

  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});
```

---

## Security Hardening

### SSL/TLS Configuration

**Generate SSL certificates:**
```bash
# Using Let's Encrypt
certbot certonly --webroot -w /var/www/html -d refbase.dev

# Or self-signed for internal use
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/refbase-mcp.key \
  -out /etc/ssl/certs/refbase-mcp.crt
```

### Firewall Configuration

**UFW rules:**
```bash
# Allow SSH
ufw allow 22/tcp

# Allow HTTP/HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Allow MCP port (if direct access needed)
ufw allow 3000/tcp

# Enable firewall
ufw --force enable
```

### Environment Security

**Secure environment variables:**
```bash
# Use a secrets management system
# AWS Secrets Manager, HashiCorp Vault, etc.

# Or secure .env file
chmod 600 .env.production
chown root:root .env.production
```

**Docker secrets:**
```yaml
# docker-compose.yml
services:
  refbase-mcp:
    secrets:
      - refbase_token
    environment:
      - REFBASE_TOKEN_FILE=/run/secrets/refbase_token

secrets:
  refbase_token:
    file: ./secrets/refbase_token.txt
```

### Rate Limiting and DDoS Protection

**Application-level rate limiting:**
```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);
```

**Fail2ban configuration:**
```ini
# /etc/fail2ban/jail.local
[refbase-mcp]
enabled = true
port = 3000
filter = refbase-mcp
logpath = /app/logs/production.log
maxretry = 5
bantime = 3600
```

---

## Performance Optimization

### Node.js Optimization

**PM2 configuration with optimization:**
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'refbase-mcp',
    script: './dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    node_args: [
      '--max_old_space_size=2048',
      '--enable-source-maps',
      '--unhandled-rejections=strict'
    ],
    env: {
      NODE_ENV: 'production',
      UV_THREADPOOL_SIZE: 16
    }
  }]
};
```

### Caching Strategy

**Redis caching implementation:**
```typescript
import Redis from 'ioredis';

const redis = new Redis({
  host: 'localhost',
  port: 6379,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3
});

// Cache middleware
const cacheMiddleware = (ttl = 300) => {
  return async (req, res, next) => {
    const key = `cache:${req.path}:${JSON.stringify(req.query)}`;
    
    try {
      const cached = await redis.get(key);
      if (cached) {
        return res.json(JSON.parse(cached));
      }
    } catch (error) {
      // Log error but continue
    }
    
    // Override res.json to cache response
    const originalJson = res.json;
    res.json = function(data) {
      redis.setex(key, ttl, JSON.stringify(data));
      return originalJson.call(this, data);
    };
    
    next();
  };
};
```

### Database Connection Pooling

**Optimized database configuration:**
```typescript
// Database connection pool
const poolConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  
  // Pool settings
  max: 20, // max number of clients
  min: 5,  // min number of clients
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  
  // Keep connections alive
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
};
```

---

## Backup and Recovery

### Data Backup Strategy

**Configuration backup script:**
```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backups/refbase-mcp"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p "$BACKUP_DIR/$DATE"

# Backup configuration files
cp -r /app/config "$BACKUP_DIR/$DATE/"
cp /app/.env.production "$BACKUP_DIR/$DATE/"

# Backup logs (last 7 days)
find /app/logs -name "*.log" -mtime -7 -exec cp {} "$BACKUP_DIR/$DATE/" \;

# Compress backup
tar -czf "$BACKUP_DIR/backup_$DATE.tar.gz" -C "$BACKUP_DIR" "$DATE"
rm -rf "$BACKUP_DIR/$DATE"

# Clean old backups (keep 30 days)
find "$BACKUP_DIR" -name "backup_*.tar.gz" -mtime +30 -delete

echo "Backup completed: backup_$DATE.tar.gz"
```

### Disaster Recovery Plan

**Recovery procedures:**

1. **System Recovery:**
```bash
# Restore from backup
cd /app
tar -xzf /backups/refbase-mcp/backup_YYYYMMDD_HHMMSS.tar.gz

# Restore configuration
cp backup_*/config/* ./config/
cp backup_*/.env.production .

# Reinstall dependencies
npm ci --production

# Start services
pm2 start ecosystem.config.js
```

2. **Container Recovery:**
```bash
# Pull latest image
docker pull your-registry/refbase-mcp:latest

# Restore configuration
docker run -d \
  --name refbase-mcp \
  -v /backups/config:/app/config:ro \
  -v /backups/.env.production:/app/.env:ro \
  your-registry/refbase-mcp:latest
```

### Automated Backup

**Cron job setup:**
```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /usr/local/bin/backup.sh >> /var/log/backup.log 2>&1

# Weekly configuration backup
0 3 * * 0 /usr/local/bin/config-backup.sh >> /var/log/backup.log 2>&1
```

---

## CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Run linting
        run: npm run lint

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Docker Buildx
        uses: docker/setup-buildx-action@v2
      
      - name: Login to registry
        uses: docker/login-action@v2
        with:
          registry: ${{ secrets.DOCKER_REGISTRY }}
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}
      
      - name: Build and push
        uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: |
            ${{ secrets.DOCKER_REGISTRY }}/refbase-mcp:latest
            ${{ secrets.DOCKER_REGISTRY }}/refbase-mcp:${{ github.sha }}

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Deploy to production
        uses: appleboy/ssh-action@v0.1.5
        with:
          host: ${{ secrets.PROD_HOST }}
          username: ${{ secrets.PROD_USER }}
          key: ${{ secrets.PROD_SSH_KEY }}
          script: |
            cd /opt/refbase-mcp
            docker-compose pull
            docker-compose up -d --no-deps refbase-mcp
            docker system prune -f
```

### GitLab CI Pipeline

```yaml
# .gitlab-ci.yml
stages:
  - test
  - build
  - deploy

variables:
  DOCKER_DRIVER: overlay2
  IMAGE_TAG: $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA

test:
  stage: test
  image: node:18-alpine
  cache:
    paths:
      - node_modules/
  script:
    - npm ci
    - npm run test
    - npm run lint
  only:
    - main
    - merge_requests

build:
  stage: build
  image: docker:20.10.16
  services:
    - docker:20.10.16-dind
  script:
    - docker build -t $IMAGE_TAG .
    - docker push $IMAGE_TAG
  only:
    - main

deploy_production:
  stage: deploy
  image: alpine:latest
  before_script:
    - apk add --no-cache openssh-client
    - eval $(ssh-agent -s)
    - echo "$SSH_PRIVATE_KEY" | ssh-add -
    - mkdir -p ~/.ssh
    - echo "$SSH_KNOWN_HOSTS" > ~/.ssh/known_hosts
  script:
    - ssh $PROD_USER@$PROD_HOST "cd /opt/refbase-mcp && docker-compose pull && docker-compose up -d"
  only:
    - main
  when: manual
```

---

## Troubleshooting Production Issues

### Common Production Problems

**1. High Memory Usage:**
```bash
# Check memory usage
docker stats refbase-mcp

# Monitor memory over time
watch -n 1 'ps aux | grep node'

# Analyze heap dump
node --inspect-brk=0.0.0.0:9229 dist/index.js
```

**Solutions:**
- Increase memory limits
- Enable garbage collection logging
- Review memory leaks in code
- Implement connection pooling

**2. Connection Timeouts:**
```bash
# Check network connectivity
curl -v https://refbase.dev/api/health

# Monitor connection pool
netstat -an | grep :3000 | wc -l

# Check DNS resolution
nslookup refbase.dev
```

**Solutions:**
- Increase timeout values
- Implement retry logic
- Check network latency
- Verify DNS settings

**3. Rate Limiting Issues:**
```bash
# Monitor rate limiting
tail -f /app/logs/production.log | grep "rate limit"

# Check current limits
redis-cli get rate_limit:user:12345
```

**Solutions:**
- Adjust rate limit configuration
- Implement user-specific limits
- Add burst capacity
- Monitor usage patterns

### Emergency Procedures

**1. Service Restart:**
```bash
# Docker deployment
docker-compose restart refbase-mcp

# PM2 deployment
pm2 restart refbase-mcp

# Kubernetes deployment
kubectl rollout restart deployment/refbase-mcp
```

**2. Rollback Deployment:**
```bash
# Docker rollback
docker tag refbase-mcp:previous refbase-mcp:latest
docker-compose up -d

# Kubernetes rollback
kubectl rollout undo deployment/refbase-mcp
```

**3. Scale Up/Down:**
```bash
# Docker Swarm
docker service scale refbase-mcp=5

# Kubernetes
kubectl scale deployment refbase-mcp --replicas=5
```

### Monitoring Alerts

**Prometheus alerting rules:**
```yaml
# alerts.yml
groups:
- name: refbase-mcp
  rules:
  - alert: HighErrorRate
    expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
    for: 2m
    annotations:
      summary: "High error rate detected"
      
  - alert: HighResponseTime
    expr: histogram_quantile(0.95, rate(http_request_duration_ms_bucket[5m])) > 1000
    for: 5m
    annotations:
      summary: "High response time detected"
      
  - alert: ServiceDown
    expr: up{job="refbase-mcp"} == 0
    for: 1m
    annotations:
      summary: "Service is down"
```

This comprehensive deployment guide covers all aspects of running RefBase MCP in production, from basic Docker deployment to enterprise-scale Kubernetes clusters with full monitoring and alerting capabilities.