FROM node:20-alpine AS builder

WORKDIR /app

COPY frontend/package*.json ./

RUN npm ci

COPY frontend .

RUN npx @tailwindcss/cli -i ./src/input.css -o ./public/styles/style.css --minify


FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN npm install -g serve

COPY --from=builder /app ./

EXPOSE 3000

CMD ["serve", "public", "-l", "3000"]