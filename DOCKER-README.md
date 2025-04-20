# Docker Setup for Baby Health App

This document explains how to run the Baby Health App using Docker.

## Prerequisites

- Docker and Docker Compose installed on your machine
- Backend API code (if running the full stack)

## Available Docker Configurations

The setup includes several options for running the application:

1. **Production Mode**: Builds and serves the React app with Nginx
2. **Development Mode**: Runs the React development server with hot-reloading
3. **Full Stack**: Runs both frontend and backend services

## Running the Application

### Production Mode (Optimized Build)

To run the production build of the frontend:

```bash
# Build and run the frontend container
docker-compose up --build frontend
```

This will:

- Build the React app
- Serve it using Nginx on port 80
- You can access the app at http://localhost

### Development Mode (with Hot Reloading)

For local development with hot reloading:

```bash
# Run the development version with hot reloading
docker-compose --profile dev up frontend-dev
```

This will:

- Mount your local source code into the container
- Run the React development server with hot reloading enabled
- You can access the app at http://localhost:3000

### Full Stack (Frontend + Backend)

To run both the frontend and backend services:

```bash
# Set the backend path if it's not in the default location
export BACKEND_PATH=/path/to/your/backend

# Run all services
docker-compose up --build
```

This will:

- Build and run the frontend container
- Run the backend API service
- Connect them together

## Environment Configuration

You can customize the setup using environment variables:

- `BACKEND_PATH`: Path to the backend code (default: `../baby-health-api`)
- `REACT_APP_API_URL`: URL for the backend API (default: `http://localhost:7000`)

## Stopping the Application

To stop all running containers:

```bash
docker-compose down
```

## Building for Production Deployment

To build the frontend image for production deployment:

```bash
docker build -t baby-health-app:latest .
```

## Troubleshooting

- If you see errors related to permissions, try running the commands with `sudo`
- If the backend isn't detected, check that the `BACKEND_PATH` variable points to a valid directory containing your API code
- For connection issues between frontend and backend, ensure the `REACT_APP_API_URL` is set correctly
