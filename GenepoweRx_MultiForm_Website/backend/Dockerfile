FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
RUN mkdir -p uploads/generated/lifestyle uploads/generated/short_lifestyle uploads/generated/wes uploads/generated/onco
RUN mkdir -p uploads/uploaded/lifestyle uploads/uploaded/short_lifestyle uploads/uploaded/wes uploads/uploaded/onco
EXPOSE 5000
CMD ["node", "server.js"]
