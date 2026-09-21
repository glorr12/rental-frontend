FROM node:22-slim

WORKDIR /app

# Same layer-cache trick as the backend Dockerfile: dependencies only reinstall when
# package*.json actually changes, not on every source edit.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

EXPOSE 5173

# --host 0.0.0.0: Vite's dev server binds to localhost by default, which inside a container
# is only reachable from *inside* that same container - the port mapping in docker-compose.yml
# would forward to nothing. --host 0.0.0.0 makes it listen on all interfaces so the mapped
# port actually works from the host machine's browser.
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
