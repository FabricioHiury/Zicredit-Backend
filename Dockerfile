Stage de desenvolvimento
FROM node:18.2 AS development

ENV NODE_ENV=development
ENV TZ=America/Sao_Paulo
WORKDIR /opt/app

COPY package.json ./
RUN npm install
RUN npm install -g @nestjs/cli
COPY . .
RUN npx prisma generate
RUN npm run build

EXPOSE 80
CMD ["npm", "run", "start:dev"]


Stage de produção
FROM node:18.2 AS production

ENV NODE_ENV=production
ENV TZ=America/Sao_Paulo
WORKDIR /opt/app

COPY package.json ./
RUN npm install --only=production
RUN npm install -g @nestjs/cli
COPY . .
RUN npx prisma generate

RUN npm run build

EXPOSE 80
CMD ["npm", "run", "start"]