# Luma

Luma is an original, Netflix-inspired full-stack streaming catalog built as an AWS learning project. It has a polished React interface, a Node/Express API, PostgreSQL persistence, health checks, and production container images.

This is a catalog and playback **demo**. It deliberately does not copy Netflix branding or provide copyrighted video files.

## What is included

- Responsive home page, cinematic hero, content rails, search, detail modal, and mobile navigation
- Watchlist and continue-watching progress persisted through the API
- PostgreSQL in Docker Compose; automatic in-memory fallback when `DATABASE_URL` is absent
- Separate Nginx frontend and Node API images
- Non-root backend container, security headers, graceful shutdown, and container health checks
- ECS Fargate task-definition example and an ECR deployment helper
- Original generated hero art at `frontend/public/assets/orbit-fall-hero.png`

## Run locally

Requirements: Docker Desktop with Docker Compose.

```bash
docker compose up --build
```

Open [http://localhost:3000](http://localhost:3000). The API health endpoint is available through the frontend proxy:

```bash
curl http://localhost:3000/api/health
```

Stop the stack with `docker compose down`. Add `-v` if you also want to delete the local database volume.

## Run without Docker

Use Node.js 22 or newer. The API falls back to memory, so PostgreSQL is optional in this mode.

```bash
cd backend
npm install
npm run dev
```

In another terminal:

```bash
cd frontend
npm install
VITE_API_URL=http://localhost:8080/api npm run dev
```

## Tests

```bash
cd backend && npm test
cd frontend && npm run build
```

## Deploy to AWS ECS Fargate

The example runs `web` and `backend` in the same Fargate task. Only the web container exposes port 80; Nginx reaches the private API on `127.0.0.1:8080`.

You need:

1. AWS CLI configured (`aws configure`)
2. Docker running
3. An ECS cluster and Fargate service
4. An Application Load Balancer target group forwarding to container `web`, port `80`
5. The standard `ecsTaskExecutionRole`

Create the service initially in the AWS console using:

- Launch type: Fargate
- Container/port: `web:80`
- Health check path: `/health`
- Task security group: inbound port 80 only from the ALB security group
- Public subnets for the ALB, private subnets for ECS tasks when possible

Then copy `.env.example`, fill in the values, and run:

```bash
set -a
. ./.env
set +a
chmod +x infra/deploy.sh
./infra/deploy.sh
```

The script creates ECR repositories if needed, builds `linux/amd64` images, pushes them, registers a new task definition, and updates the service.

### Add RDS persistence

The ECS example intentionally uses the API's memory fallback so the first deployment is small. For persistent data:

1. Create an RDS PostgreSQL database in the same VPC.
2. Allow inbound port 5432 to RDS only from the ECS task security group.
3. Store the full PostgreSQL URL in AWS Secrets Manager.
4. Give the execution role `secretsmanager:GetSecretValue`.
5. Add this entry to the backend container in `infra/task-definition.json`:

```json
"secrets": [
  {
    "name": "DATABASE_URL",
    "valueFrom": "arn:aws:secretsmanager:REGION:ACCOUNT:secret:luma/database-url"
  }
]
```

Use a URL shaped like `postgres://USER:PASSWORD@RDS_HOST:5432/luma`. For production, also set `DB_SSL=true` if your RDS configuration requires TLS.

## Architecture

```text
Internet → ALB :80/443 → ECS task
                          ├─ Nginx/React :80
                          └─ Node API :8080 → RDS PostgreSQL (optional)
```

For a serious production service, add Cognito authentication, CloudFront, S3/MediaConvert for licensed video assets, HTTPS through ACM, autoscaling, WAF, and infrastructure as code.
