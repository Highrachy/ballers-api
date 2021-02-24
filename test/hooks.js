import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer;
const opts = { useUnifiedTopology: true, useNewUrlParser: true, useFindAndModify: false };

exports.mochaHooks = {
  beforeAll: async () => {
    mongoServer = new MongoMemoryServer();
    const mongoUri = await mongoServer.getUri();
    await mongoose.connect(mongoUri, opts);
  },

  afterEach: async () => {
    await mongoose.connection.db.dropDatabase();
  },

  afterAll: async () => {
    await mongoServer.stop();
  },
};
