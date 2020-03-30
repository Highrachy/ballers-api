import bcrypt from 'bcryptjs';
import { expect, sinon } from '../config';
import { hashPassword } from '../../../server/services/user.service';

// TODO:
describe('User Model', () => {
  describe('Hash Password', () => {
    it('should return a hashed password asynchronously', async () => {
      const password = 'my_password';
      const hash = await hashPassword(password);
      expect(hash).to.length(60);
      expect(hash).to.not.eql(password);
    });
    it('should return a hashed password asynchronously', async () => {
      const expectedError = new Error('sample error');
      sinon.stub(bcrypt, 'genSalt').throws(expectedError);

      const password = 'my_password';
      try {
        await hashPassword(password);
      } catch (err) {
        sinon.assert.threw(bcrypt.genSalt, expectedError);
      }

      // Remember to restore!
      bcrypt.genSalt.restore();
    });
  });
});
