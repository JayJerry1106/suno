# UseSuno Downloader — zero-dependency Node app
FROM node:18-alpine
WORKDIR /app

# Copy manifest + source (no npm install needed; the app has zero deps)
COPY package.json ./
COPY server.js ./
COPY index.html ./
COPY styles.css ./
COPY app.js ./
COPY i18n.js ./

# The platform sets PORT; we default to 3000 for local runs.
ENV PORT=3000
EXPOSE 3000

CMD ["node", "server.js"]
