FROM cypress/included:12.11.0

WORKDIR /app

COPY . .

RUN npm install

CMD ["npm", "run", "test"]
