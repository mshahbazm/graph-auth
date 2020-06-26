require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const { ApolloServer } = require('apollo-server-express');
const mongoose = require('mongoose');
const cors = require('cors');

const typeDefs = require('./schema');
const resolvers = require('./resolvers');
const { createContext } = require('./controller');


require('./db')();

const app = express();
app.use(bodyParser.json({limit: '20mb'}));

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
app.use(cookieParser());

const server = new ApolloServer({
  typeDefs,
  resolvers,
  playground: true,
  context: createContext,
});

server.applyMiddleware({ app, cors: false });

mongoose.connection.on('connected', () => {
  app.listen({ port: 4000 }, () => console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`));
});

