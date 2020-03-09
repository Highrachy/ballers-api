import chai from 'chai';
import chaiHttp from 'chai-http';
import app from '../app';

chai.use(chaiHttp);
// eslint-disable-next-line no-unused-vars
const should = chai.should();

// eslint-disable-next-line no-undef
describe('Ballers', () => {
  // eslint-disable-next-line no-undef
  it('should have status 200', (done) => {
    chai.request(app)
      .get('/api/v1/welcome')
      .end((err, res) => {
        (res).should.have.status(200);
        done();
      });
  });

  // eslint-disable-next-line no-undef
  it('should return object', (done) => {
    chai.request(app)
      .get('/api/v1/welcome')
      .end((err, res) => {
        (res.body).should.be.a('object');
        done();
      });
  });
});
