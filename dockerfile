
FROM node:latest

ENV Mon_teste "Ceci est un teste de dockerFile"

RUN npm install

EXPOSE 80 501

CMD ["npm", "start"]