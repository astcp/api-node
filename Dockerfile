# Imagen base de Node.js ligera
FROM node:20-alpine

# Directorio de trabajo dentro del contenedor
WORKDIR /app

COPY package*.json ./

# Instala las dependencias de Node.js.
RUN npm install --omit=dev

COPY . .

EXPOSE 3000

CMD ["npm", "start"]