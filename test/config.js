import chai from 'chai';
import chaiHttp from 'chai-http';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../server';

chai.use(chaiHttp);
chai.use(sinonChai);
const { expect } = chai;
const request = () => chai.request(app);

const useDatabase = () => {
  let mongoServer;
  const opts = { useUnifiedTopology: true, useNewUrlParser: true, useFindAndModify: false };

  before(async () => {
    mongoServer = new MongoMemoryServer();
    const mongoUri = await mongoServer.getUri();
    await mongoose.connect(mongoUri, opts);
  });

  afterEach(async () => {
    await mongoose.connection.db.dropDatabase();
  });

  after(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });
};

export { chai, expect, request, sinon, useDatabase };
