# backend

Hello! This is a simple ChatGPT backend application.

## Requirements

- NodeJS >= v18.17.1
- npm >= 9.6.7
- MongoDB Atlas
- OpenAI API key

## Setup

```bash
# Install node modules
npm i

# Create default environment file
# This will create a file called ".env" in the root directory
npm run init

# Edit .env file and edit following fields
# ...
# MONGODB_URI=<mongodb_uri>
# OPENAI_API_KEY=<openai_api_key>
# ...
```

## Deployment

```bash
# Run web server
npm run start
```

