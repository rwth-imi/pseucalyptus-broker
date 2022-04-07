FROM node:16
WORKDIR /opt/pseucalyptus-broker
COPY package.json .
RUN npm install
COPY dist/src/main.js .
EXPOSE 3000
CMD [ "node", "main" ]
