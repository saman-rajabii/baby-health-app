# Baby Health App

A React application for tracking baby health metrics during pregnancy, including kick counting and contraction timing.

## Running with Docker

This project is containerized with Docker for easy setup and deployment.

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

### Quick Start

1. Clone the repository:

   ```bash
   git clone https://github.com/saman-rajabii/baby-health-app.git
   cd baby-health-app
   ```

2. Build and start the containers:

   ```bash
   docker-compose up --build
   ```

3. Access the application:
   - Frontend: http://localhost:80
   - Backend API: http://localhost:7000

### Development Mode

For development with hot reloading:

```bash
docker-compose --profile dev up frontend-dev
```

This will run the application in development mode on http://localhost:3000

### Running Individual Services

To run only the frontend:

```bash
docker-compose up frontend
```

To run only the backend (requires backend code):

```bash
docker-compose up backend
```

### Stopping the Application

```bash
docker-compose down
```

To remove volumes as well:

```bash
docker-compose down -v
```

## Backend Configuration

The application expects the backend API code to be in `../baby-health-api` by default. You can change this location by setting the `BACKEND_PATH` environment variable:

```bash
export BACKEND_PATH=/path/to/backend
docker-compose up
```

## Environment Variables

- `REACT_APP_API_URL`: URL for the backend API (default: http://localhost:7000)
- `BACKEND_PATH`: Path to the backend code (default: ../baby-health-api)

## Manual Build (without Docker)

If you prefer to run without Docker:

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the development server:

   ```bash
   npm start
   ```

3. Build for production:
   ```bash
   npm run build
   ```
