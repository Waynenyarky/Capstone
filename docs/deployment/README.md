# Deployment Guide

Step-by-step instructions for running the Capstone application locally, with MongoDB Atlas, and in production.

## Prerequisites

- **Docker** and **Docker Compose** (for running services in containers)
- **Node.js** and **npm** (for the web frontend and any local scripts; version per project requirements)
- **Environment file:** Copy [.env.example](../../.env.example) to `.env` at the project root and fill in required variables for your scenario.

## Deployment scenarios

| Scenario | Document | Description |
|----------|----------|-------------|
| **Local development** | [local.md](local.md) | One-command start with `./start.sh`, manual Docker, ports, and .env for local dev |
| **MongoDB Atlas** | [atlas.md](atlas.md) | Use a cloud MongoDB Atlas cluster (encryption at rest, TLS); `./start.sh --atlas` |
| **Production** | [production.md](production.md) | Production compose, env hardening, backups, optional TLS |

## Quick reference

- **Start (default):** `./start.sh`
- **Stop:** `./stop.sh`
- **Restart:** `./restart.sh`
- **Status:** `./start.sh --status`
- **Atlas:** Set `MONGO_URI` in `.env`, then `./start.sh --atlas`

See [local.md](local.md) for all `./start.sh` flags and manual Docker steps.
