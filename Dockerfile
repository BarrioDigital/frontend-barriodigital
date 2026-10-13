# Paso 1: Construir el proyecto frontend
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Paso 2: Servir los estáticos con Nginx y aplicar la configuración con Reverse Proxy
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html

# Copiar la configuración de Nginx desde la raíz del proyecto hacia la imagen
COPY default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
EXPOSE 443
CMD ["nginx", "-g", "daemon off;"]