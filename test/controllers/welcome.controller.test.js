import { expect, request } from '../config';

describe('Welcome Route', () => {
  it('should have status 200', (done) => {
    request()
      .get('/api/v1/')
      .end((err, res) => {
        expect(res).to.have.status(200);
        done();
      });
  });

  it('should return a valid object', (done) => {
    request()
      .get('/api/v1/')
      .end((err, res) => {
        expect(res.body).to.eql({
          success: true,
          message: 'Welcome to Ballers API endpoint',
        });
        done();
      });
  });
});
