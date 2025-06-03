FROM node:20 AS builder

RUN mkdir /app

ARG NG_APP_API

ENV NG_APP_API=${NG_APP_API}

WORKDIR /app

COPY . .

RUN npm install
RUN npm run build:dev
RUN ls -la dist/ || echo "Pasta dist não existe"
RUN find dist -type d || echo "Nada encontrado na pasta dist"

FROM nginx:stable-alpine AS runtime

COPY --from=builder /app/dist/chatbot-ematerce-painel-front/browser /usr/share/nginx/html

RUN echo 'server { listen 80; server_name _; root /usr/share/nginx/html; location / { try_files $uri $uri/ /index.html; } }' > /etc/nginx/conf.d/default.conf

EXPOSE 80

RUN chmod -R 755 /usr/share/nginx/html
