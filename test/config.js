import chai from 'chai';
import chaiHttp from 'chai-http';
import sinon from 'sinon';
import app from '../server/index';

chai.use(chaiHttp);
const { expect } = chai;
const request = () => chai.request(app);

export { chai, expect, request, sinon };
