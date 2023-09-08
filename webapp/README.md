# webapp

Hello! This is a simple ChatGPT webapp application.

## Requirements

- NodeJS >= v18.17.1
- npm >= 9.6.7

## Setup

```bash
# Install node modules
npm i
```

## Development

Please create **.env.development** environment file in the root directory with the following variables:
- VITE_PROXY_BACKEND=http://127.0.0.1:8080

```bash
# Run dev server
npm run dev
```

## Deployment

Please create **.env** environment file in the root directory with the following variables:
- VITE_PROXY_BACKEND=<production_backend_url>

```bash
# Build to "dist" folder
npm run build
```
