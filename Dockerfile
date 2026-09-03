# مرحله build
FROM node:20-alpine AS builder

WORKDIR /app

COPY frontend/package*.json ./

RUN npm ci

COPY frontend .

RUN npx @tailwindcss/cli -i ./src/input.css -o ./public/styles/style.css --minify



# مرحله runtime
FROM nginx:alpine

COPY --from=builder /app/public /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]