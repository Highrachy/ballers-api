import chai from 'chai';
import chaiHttp from 'chai-http';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import app from '../server';

chai.use(chaiHttp);
chai.use(sinonChai);
const { expect } = chai;
const request = () => chai.request(app);

const useDatabase = () => {};

export { chai, expect, request, sinon, useDatabase };
