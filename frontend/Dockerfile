FROM node:lts AS build

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Build frontend
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:stable-alpine

# Copy build output to nginx html folder
COPY --from=build /app/public /usr/share/nginx/html

# Copy custom nginx.conf
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
