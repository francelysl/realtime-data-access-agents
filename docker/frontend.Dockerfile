FROM node:20-alpine

WORKDIR /app
COPY frontend/package.json frontend/package-lock.json* /app/
RUN npm ci
COPY frontend /app
ENV PORT=3000
EXPOSE 3000
CMD ["npm", "run", "dev"]
