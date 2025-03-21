# CLAUDE.md - Development Guide

## Build/Run Commands
- `npm install` - Install dependencies
- `npm start` - Start production server
- `npm run dev` - Start development server with hot-reload

## Code Style Guidelines
- **Formatting**: Use consistent indentation (2 spaces)
- **Naming**: Use camelCase for variables and functions, PascalCase for classes
- **Error Handling**: Always use try/catch blocks with proper error logging for async operations
- **Architecture**: Follow MVC pattern with Koa.js middleware structure
- **API Structure**: RESTful endpoints with consistent response formats
- **Cache Strategy**: Use NodeCache with appropriate TTL values

## Project Structure
- `main.js` - Main server entrypoint
- `public/` - Static assets and frontend code
  - `index.html` - Main frontend HTML
  - `utils.js` - Frontend utility functions

## Docker Usage
- `docker build -t crypto-chart .` - Build Docker image
- `docker-compose up -d` - Start with Docker Compose

## Frontend Patterns
- Clean architecture implementation with data flow: Utils → Domain → UI → Services → Controller
- Responsive design adapting to different screen sizes
- User parameters stored in URL for shareable states