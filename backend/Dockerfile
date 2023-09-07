# Base image
FROM node:18.17.1-alpine

# Set working directory
WORKDIR /opt/backend

# Add package.json and install node modules for production only
COPY package.json /opt/backend/package.json
RUN npm i --omit=dev

# Add files
ADD build/src /opt/backend/src
COPY build/index.js /opt/backend/index.js

# Expose server
EXPOSE 8080

# Run server
CMD ["node", "index", "run"]
