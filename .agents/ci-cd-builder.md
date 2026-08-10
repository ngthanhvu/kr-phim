---
name: ci-cd-builder
display_name: CI/CD Builder
description: Create CI/CD pipelines — GitHub Actions, GitLab CI, Jenkins, and CircleCI with test, build, and deploy stages. Use when setting up automation, continuous integration, deployment workflows, or pipeline configuration.
---

# CI/CD Builder

## Overview

Create CI/CD pipelines for the CineK projects (`kr-phim` and `telegram-bot`) with test, build, and deploy stages. Supports GitHub Actions as the primary CI/CD platform.

## When to Use This Skill

Use **CI/CD Builder** when you need to:

- Set up GitHub Actions workflows for CI/CD
- Automate testing, building, and deployment pipelines
- Configure staging vs production deployment environments
- Add cache optimization, parallel jobs, or artifact management
- Set up auto-deploy on push to main/master branches

## Project Context

### kr-phim (Nuxt 4 + Vue 3 + Tailwind v4)
- **Build command:** `npm run build`
- **Dev command:** `npm run dev`
- **Test command:** `npm run test` (if configured)
- **Lint command:** `npm run lint`
- **Type check:** `npm run typecheck` (if configured)
- **Package manager:** npm
- **Runtime:** Node.js 20+
- **Docker:** Uses docker-compose for development and production

### telegram-bot
- Check `package.json` for exact scripts
- May use Python/Node depending on implementation

## GitHub Actions Workflow Structure

### Directory Layout

```
.github/
├── workflows/
│   ├── ci.yml              # Continuous Integration (every PR/push)
│   ├── deploy-staging.yml  # Staging deployment (main branch)
│   └── deploy-production.yml # Production deployment (tag/release)
├── ISSUE_TEMPLATE/
└── PULL_REQUEST_TEMPLATE.md
```

### CI Workflow (ci.yml)

```yaml
name: CI

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main, develop]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: kr-phim/package-lock.json

      - name: Install dependencies
        working-directory: ./kr-phim
        run: npm ci

      - name: Lint
        working-directory: ./kr-phim
        run: npm run lint

      - name: Type check
        working-directory: ./kr-phim
        run: npm run typecheck || echo "No typecheck script"

      - name: Build
        working-directory: ./kr-phim
        run: npm run build
```

### Deploy Staging (deploy-staging.yml)

```yaml
name: Deploy Staging

on:
  push:
    branches: [main]

jobs:
  deploy-staging:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        working-directory: ./kr-phim
        run: npm ci

      - name: Build
        working-directory: ./kr-phim
        run: npm run build
        env:
          NODE_ENV: production
          ${{ secrets.STAGING_ENV_VARS }}

      - name: Deploy to staging
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.STAGING_SERVER_HOST }}
          username: ${{ secrets.STAGING_SERVER_USER }}
          key: ${{ secrets.STAGING_SERVER_SSH_KEY }}
          script: |
            cd /opt/cinek/staging
            docker compose pull
            docker compose up -d kr-phim
```

### Deploy Production (deploy-production.yml)

```yaml
name: Deploy Production

on:
  release:
    types: [published]
  push:
    tags:
      - 'v*'

jobs:
  deploy-production:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        working-directory: ./kr-phim
        run: npm ci

      - name: Build
        working-directory: ./kr-phim
        run: npm run build
        env:
          NODE_ENV: production
          ${{ secrets.PRODUCTION_ENV_VARS }}

      - name: Deploy to production
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.PRODUCTION_SERVER_HOST }}
          username: ${{ secrets.PRODUCTION_SERVER_USER }}
          key: ${{ secrets.PRODUCTION_SERVER_SSH_KEY }}
          script: |
            cd /opt/cinek/production
            docker compose pull
            docker compose up -d kr-phim
```

## Docker-Based Deployment (Recommended)

Since the project uses Docker Compose, the preferred deployment strategy:

```yaml
name: Deploy via Docker

on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Deploy to'
        required: true
        default: 'staging'
        type: choice
        options:
          - staging
          - production

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Build Docker image
        run: |
          docker build -t cinemk:$(echo ${{ github.sha }} | cut -c1-7) ./kr-phim

      - name: Push to registry
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Push image
        run: |
          docker tag cinemk:$(echo ${{ github.sha }} | cut -c1-7) ${{ secrets.DOCKER_REPO }}:latest
          docker tag cinemk:$(echo ${{ github.sha }} | cut -c1-7) ${{ secrets.DOCKER_REPO }}:${{ github.sha }}
          docker push ${{ secrets.DOCKER_REPO }}:latest
          docker push ${{ secrets.DOCKER_REPO }}:${{ github.sha }}
```

## Best Practices

1. **Cache node_modules** — Use `actions/cache` or `actions/setup-node` with `cache: 'npm'`
2. **Separate CI/CD** — Keep CI (tests/lint) separate from deployment workflows
3. **Environment-specific secrets** — Use different secrets for staging vs production
4. **Pipeline caching** — Cache Docker layers and build artifacts between runs
5. **Parallel jobs** — Run lint, test, and build in parallel when possible
6. **Rollback strategy** — Always keep previous image tags for quick rollback
7. **Health checks** — Add post-deploy health check steps
8. **Notifications** — Add Slack/Discord webhook notifications for deploy status

## Environment Variables

Common env vars needed across environments:

| Variable | Description |
|----------|-------------|
| `NODE_ENV` | `production` or `development` |
| `DATABASE_URL` | Database connection string |
| `NUXT_SECRET` | App secret key |
| `REDIS_URL` | Redis connection (if used) |
| `API_URL` | External API endpoints |

Store sensitive values in GitHub Secrets — never hardcode them.

## Common Pitfalls

- **Missing `.dockerignore`** — Ensure `node_modules`, `.git`, and logs are excluded
- **Large images** — Use multi-stage builds to minimize image size
- **Slow installs** — Always use `npm ci` instead of `npm install` in CI
- **Port conflicts** — Verify ports don't clash in docker-compose
- **Secrets leakage** — Never log or expose secrets in workflow outputs

## Integration Checklist

After creating a CI/CD pipeline:

- [ ] Add GitHub repository secrets for all required credentials
- [ ] Test the workflow on a feature branch
- [ ] Verify staging deployment works end-to-end
- [ ] Confirm production deploy only triggers on release/tag
- [ ] Add branch protection rules (require CI to pass)
- [ ] Document the pipeline in team README
