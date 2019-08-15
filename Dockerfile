FROM node:lts

COPY ./package.json ./
COPY ./package-lock.json ./
RUN npm ci

COPY . .

CMD npm run start