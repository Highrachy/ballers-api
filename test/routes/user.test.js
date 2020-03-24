import { expect, request } from '../config';

describe('User Route', () => {
  it('should have be of type object', done => {
    request()
      .get('/api/v1/user/register')
      .end((err, res) => {
        expect(res.body).to.be.an('object');
        done();
      });
  });
});
