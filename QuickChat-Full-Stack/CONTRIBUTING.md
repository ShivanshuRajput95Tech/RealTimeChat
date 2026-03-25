# Contributing to QuickChat

Thank you for your interest in contributing to QuickChat! This guide will help you get started with contributing to the project.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting](#issue-reporting)

## 🤝 Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct. Please be respectful and considerate to other contributors.

## 🚀 Getting Started

1. **Fork the repository**
2. **Clone your fork**:
   ```bash
   git clone https://github.com/your-username/QuickChat.git
   cd QuickChat/QuickChat-Full-Stack
   ```

3. **Set up the development environment**:
   ```bash
   # Install server dependencies
   cd server && npm install
   
   # Install client dependencies
   cd ../client && npm install
   ```

4. **Configure environment variables**:
   ```bash
   cp server/.env.example server/.env
   # Edit server/.env with your credentials
   ```

## 🛠️ Development Setup

### Prerequisites
- Node.js 18.x or higher
- MongoDB (local or Atlas)
- Redis (optional for caching)
- Git

### Environment Variables
Required environment variables in `server/.env`:
```
PORT=5000
NODE_ENV=development
JWT_SECRET=your-secret-key
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb://localhost:27017/quickchat
REDIS_URL=redis://localhost:6379
```

### Running the Application
```bash
# Start the server (Terminal 1)
cd server && npm run server

# Start the client (Terminal 2)
cd client && npm run dev
```

## 📁 Project Structure

```
QuickChat-Full-Stack/
├── client/                 # React frontend
│   ├── context/           # React contexts (state management)
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   └── lib/           # Utility functions
│   └── package.json
│
├── server/                 # Node.js backend
│   ├── controllers/       # Route handlers
│   ├── models/            # Mongoose schemas
│   ├── routes/            # Express routes
│   ├── middleware/         # Express middleware
│   ├── services/          # Business logic
│   ├── lib/               # Utilities and helpers
│   ├── utils/             # Utility functions
│   └── package.json
│
└── docs/                   # Documentation
```

## 💻 Coding Standards

### JavaScript/Node.js
- Use ES6+ features
- Follow Airbnb JavaScript Style Guide
- Use meaningful variable and function names
- Add JSDoc comments for complex functions
- Use async/await instead of callbacks

### React
- Use functional components with hooks
- Follow React best practices
- Use TypeScript for new components (if applicable)
- Keep components small and focused
- Use React.memo for performance optimization

### API Design
- Follow RESTful conventions
- Use proper HTTP status codes
- Return consistent response formats
- Validate all input data
- Handle errors gracefully

### Database
- Use proper indexing for performance
- Validate data at the schema level
- Use pagination for large datasets
- Implement proper error handling

## 🧪 Testing

### Running Tests
```bash
# Server tests
cd server && npm test

# Client tests
cd client && npm test
```

### Writing Tests
- Write unit tests for utility functions
- Write integration tests for API endpoints
- Use descriptive test names
- Mock external dependencies

## 🔄 Pull Request Process

1. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**:
   - Follow coding standards
   - Add tests for new features
   - Update documentation if needed

3. **Commit your changes**:
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

4. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Create a Pull Request**:
   - Provide a clear description
   - Reference any related issues
   - Include screenshots for UI changes

### Commit Message Format
Use conventional commits:
```
feat: add new feature
fix: fix a bug
docs: update documentation
style: formatting changes
refactor: code refactoring
test: add tests
chore: maintenance tasks
```

## 🐛 Issue Reporting

When reporting issues, please include:
1. **Description**: Clear description of the issue
2. **Steps to Reproduce**: How to reproduce the issue
3. **Expected Behavior**: What you expected to happen
4. **Actual Behavior**: What actually happened
5. **Environment**: OS, Node.js version, browser (if applicable)
6. **Screenshots**: If applicable

### Issue Templates
Use the provided issue templates when creating new issues.

## 📚 Additional Resources

- [Node.js Documentation](https://nodejs.org/en/docs/)
- [React Documentation](https://reactjs.org/docs/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Socket.IO Documentation](https://socket.io/docs/)

## 🙏 Thank You

Thank you for contributing to QuickChat! Your contributions help make this project better for everyone.