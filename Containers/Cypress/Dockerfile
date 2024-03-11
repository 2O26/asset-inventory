
FROM cypress/included
WORKDIR /app
COPY . .
RUN npm install
CMD ["npm", "run", "npx cypress run"]