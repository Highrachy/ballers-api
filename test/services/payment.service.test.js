// import axios from 'axios';
import moxios from 'moxios';
import { expect } from '../config';
import { initiatePaystackPayment, PAYSTACK_URL } from '../../server/services/payment.service';

describe.only('Payment Service', () => {
  describe('#initiatePaystackPayment', () => {
    beforeEach(() => {
      // import and pass your custom axios instance to this method
      moxios.install();
    });

    afterEach(() => {
      // import and pass your custom axios instance to this method
      moxios.uninstall();
    });
    describe('MyService save', () => {
      // it('should parse and return the response data', async () => {
      //   const stubHeader = {
      //     headers: { authorization: '123456', 'content-type': 'application/json' },
      //   };
      //   const stubBody = { amount: 100, email: 'test-email@mail.com' };
      //   const stubResponse = { status: 200, statusText: 'OK', data: { data: 1 } };
      //   const stubPost = sinon
      //     .stub(Axios, 'post')
      //     .withArgs(PAYSTACK_URL.INITIALIZE, stubBody, stubHeader)
      //     .returns(Promise.resolve(stubResponse));

      //   const response = await initiatePaystackPayment(stubBody);

      //   console.log('initiatePaystackPayment(stubBody)', response);

      //   expect(initiatePaystackPayment(stubBody)).to.eq(200);
      //   stubPost.restore();
      // });

      beforeEach(() => {
        moxios.install();
        moxios.stubRequest(PAYSTACK_URL.INITIALIZE, {
          status: 200,
          response: { data: 123, productName: 'blah blah', customerId: 456 },
        });
      });

      afterEach(() => {
        moxios.uninstall();
      });

      it('can fetch an order', (done) => {
        moxios.wait(async () => {
          const response = await initiatePaystackPayment(100, 'me@you.com');
          console.log('response', response);
          expect(response).to.eql(123);
          done();
        });
      });

      // it('just for a single spec', async (done) => {
      //   moxios.withMock(() => {
      //     const onFulfilled = sinon.spy();
      //     axios.post(PAYSTACK_URL.INITIALIZE).then(onFulfilled);

      //     const response = await initiatePaystackPayment({
      //       amount: 100,
      //       email: 'me@yaou.com',
      //     });

      //     moxios.wait(function () {
      //       const request = moxios.requests.mostRecent();
      //       request
      //         .respondWith({
      //           status: 200,
      //           response: {
      //             id: 12345,
      //             firstName: 'Fred',
      //             lastName: 'Flintstone',
      //           },
      //         })
      //         .then(async () => {
      //           // equal(onFulfilled.called, true)
      //           expect(response.data.data).to.eq('testing');
      //           done();
      //         });
      //     });
      //   });
      // });

      // it('stub response for any matching request URL', (done) => {
      //   // Match against an exact URL value
      //   moxios.stubRequest(PAYSTACK_URL.INITIALIZE, {
      //     status: 200,
      //     responseText: { data: 'testing' },
      //   });

      //   const onFulfilled = sinon.spy();

      //   moxios.wait(async () => {
      //     const response = await initiatePaystackPayment({ amount: 100, email: 'me@yaou.com' });

      //     console.log('initiatePaystackPayment(stubBody)', response);

      //     expect(response.data.data).to.eq('testing');
      //     done();
      //   });
      // });
    });
  });
});
