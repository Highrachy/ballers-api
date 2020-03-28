import bcrypt from 'bcryptjs';
import { expect, sinon } from '../config';
import { hashPassword } from '../../server/services/user.service';

describe('User Service', () => {
  describe('#hashPassword', () => {
    it('should return a hashed password asynchronously', async () => {
      const password = 'my_password';
      const hash = await hashPassword(password);
      expect(hash).to.length(60);
      expect(hash).to.not.eql(password);
    });

    context('when genSalt fails', () => {
      it('throws an error', async () => {
        const expectedError = new Error('sample error');
        sinon.stub(bcrypt, 'genSalt').throws(expectedError);

        const password = 'my_password';
        try {
          await hashPassword(password);
        } catch (err) {
          sinon.assert.threw(bcrypt.genSalt, expectedError);
        }

        bcrypt.genSalt.restore();
      });
    });

    context('when hashing fails', () => {
      it('throws an error', async () => {
        const expectedError = new Error('sample error');
        sinon.stub(bcrypt, 'hash').throws(expectedError);

        const password = 'my_password';
        try {
          await hashPassword(password);
        } catch (err) {
          sinon.assert.threw(bcrypt.hash, expectedError);
        }

        bcrypt.hash.restore();
      });
    });
  });
});
