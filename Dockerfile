# Base image
FROM node:18.17.1-alpine
# FROM oven/bun

# Set working directory
WORKDIR /opt/backend

# Add package.json and install node modules for production only
COPY backend/package.json /opt/backend/package.json
RUN npm i --omit=dev
# RUN bun install --omit=dev

# Add files
ADD backend/build/src /opt/backend/src
COPY backend/build/index.js /opt/backend/index.js

# Add webapp files
ADD webapp/dist /opt/webapp/dist

# Expose server
EXPOSE 8080

# Run server
CMD ["node", "index", "run"]
# CMD ["bun", "index.js", "run"]
