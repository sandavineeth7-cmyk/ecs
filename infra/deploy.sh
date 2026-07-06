#!/usr/bin/env sh
set -eu

: "${AWS_REGION:?Set AWS_REGION}"
: "${AWS_ACCOUNT_ID:?Set AWS_ACCOUNT_ID}"
: "${ECS_CLUSTER:?Set ECS_CLUSTER}"
: "${ECS_SERVICE:?Set ECS_SERVICE}"

REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

aws ecr describe-repositories --repository-names luma-web >/dev/null 2>&1 || aws ecr create-repository --repository-name luma-web >/dev/null
aws ecr describe-repositories --repository-names luma-backend >/dev/null 2>&1 || aws ecr create-repository --repository-name luma-backend >/dev/null
aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$REGISTRY"

docker build --platform linux/amd64 -t "$REGISTRY/luma-web:latest" ./frontend
docker build --platform linux/amd64 -t "$REGISTRY/luma-backend:latest" ./backend
docker push "$REGISTRY/luma-web:latest"
docker push "$REGISTRY/luma-backend:latest"

sed -e "s/AWS_ACCOUNT_ID/$AWS_ACCOUNT_ID/g" -e "s/AWS_REGION/$AWS_REGION/g" infra/task-definition.json > /tmp/luma-task-definition.json
aws logs create-log-group --log-group-name /ecs/luma 2>/dev/null || true
aws ecs register-task-definition --cli-input-json file:///tmp/luma-task-definition.json >/dev/null
aws ecs update-service --cluster "$ECS_CLUSTER" --service "$ECS_SERVICE" --task-definition luma --force-new-deployment

echo "Deployment started. Watch it with:"
echo "aws ecs wait services-stable --cluster $ECS_CLUSTER --services $ECS_SERVICE"
