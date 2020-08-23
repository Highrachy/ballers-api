import mongoose from 'mongoose';
import { expect, request, sinon, useDatabase } from '../config';
import PaymentPlan from '../../server/models/paymentPlan.model';
import User from '../../server/models/user.model';
import PaymentPlanFactory from '../factories/paymentPlan.factory';
import UserFactory from '../factories/user.factory';
import { addUser } from '../../server/services/user.service';
import { addPaymentPlan } from '../../server/services/paymentPlan.service';

useDatabase();

let adminToken;
let userToken;
const _id = mongoose.Types.ObjectId();
const adminUser = UserFactory.build({ _id, role: 0, activated: true });
const regualarUser = UserFactory.build({ role: 1, activated: true });

beforeEach(async () => {
  adminToken = await addUser(adminUser);
  userToken = await addUser(regualarUser);
});

describe('Add Payment Plan Route', () => {
  context('with valid data', () => {
    it('returns successful payment plan', (done) => {
      const plan = PaymentPlanFactory.build();
      request()
        .post('/api/v1/payment-plan/add')
        .set('authorization', adminToken)
        .send(plan)
        .end((err, res) => {
          expect(res).to.have.status(201);
          expect(res.body.success).to.be.eql(true);
          expect(res.body.message).to.be.eql('Plan added');
          expect(res.body).to.have.property('plan');
          done();
        });
    });
  });

  context('when user token is used', () => {
    beforeEach(async () => {
      await User.findByIdAndDelete(_id);
    });
    it('returns token error', (done) => {
      const plan = PaymentPlanFactory.build();
      request()
        .post('/api/v1/payment-plan/add')
        .set('authorization', adminToken)
        .send(plan)
        .end((err, res) => {
          expect(res).to.have.status(404);
          expect(res.body.success).to.be.eql(false);
          expect(res.body.message).to.be.eql('Invalid token');
          done();
        });
    });
  });

  context('with invalid data', () => {
    context('when plan name is empty', () => {
      it('returns an error', (done) => {
        const plan = PaymentPlanFactory.build({ name: '' });
        request()
          .post('/api/v1/payment-plan/add')
          .set('authorization', adminToken)
          .send(plan)
          .end((err, res) => {
            expect(res).to.have.status(412);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Validation Error');
            expect(res.body.error).to.be.eql('"Plan Name" is not allowed to be empty');
            done();
          });
      });
    });
    context('when plan description is empty', () => {
      it('returns an error', (done) => {
        const plan = PaymentPlanFactory.build({ description: '' });
        request()
          .post('/api/v1/payment-plan/add')
          .set('authorization', adminToken)
          .send(plan)
          .end((err, res) => {
            expect(res).to.have.status(412);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Validation Error');
            expect(res.body.error).to.be.eql('"Plan Description" is not allowed to be empty');
            done();
          });
      });
    });
    context('when payment frequency is empty', () => {
      it('returns an error', (done) => {
        const plan = PaymentPlanFactory.build({ paymentFrequency: '' });
        request()
          .post('/api/v1/payment-plan/add')
          .set('authorization', adminToken)
          .send(plan)
          .end((err, res) => {
            expect(res).to.have.status(412);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Validation Error');
            expect(res.body.error).to.be.eql('"Plan Payment Frequency" must be a number');
            done();
          });
      });
    });
  });
});

describe('Get all payment plans', () => {
  const plan = PaymentPlanFactory.build({ addedBy: _id });

  context('when no payment plan is found', () => {
    it('returns empty array of payment plans', (done) => {
      request()
        .get('/api/v1/payment-plan/all')
        .set('authorization', adminToken)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.success).to.be.eql(true);
          expect(res.body).to.have.property('plans');
          done();
        });
    });
  });

  describe('when payment plan exist in db', () => {
    beforeEach(async () => {
      await addPaymentPlan(plan);
    });

    context('with a valid token & id', async () => {
      it('returns successful payload', (done) => {
        request()
          .get('/api/v1/payment-plan/all')
          .set('authorization', adminToken)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body).to.have.property('plans');
            done();
          });
      });
    });

    context('without token', () => {
      it('returns error', (done) => {
        request()
          .get('/api/v1/payment-plan/all')
          .end((err, res) => {
            expect(res).to.have.status(403);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Token needed to access resources');
            done();
          });
      });
    });

    context('when user token is user token', () => {
      it('returns forbidden error', (done) => {
        request()
          .get('/api/v1/payment-plan/all')
          .set('authorization', userToken)
          .end((err, res) => {
            expect(res).to.have.status(403);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('You are not permitted to perform this action');
            done();
          });
      });
    });
  });
});

describe('Delete Payment Plan', () => {
  const id = mongoose.Types.ObjectId();
  const plan = PaymentPlanFactory.build({ _id: id, addedBy: _id });

  beforeEach(async () => {
    await addPaymentPlan(plan);
  });

  context('with valid data & token', () => {
    it('deletes payment plan', (done) => {
      request()
        .delete(`/api/v1/payment-plan/delete/${id}`)
        .set('authorization', adminToken)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.success).to.be.eql(true);
          expect(res.body.message).to.be.eql('Plan deleted');
          done();
        });
    });
  });

  context('without token', () => {
    it('returns error', (done) => {
      request()
        .delete(`/api/v1/payment-plan/delete/${id}`)
        .end((err, res) => {
          expect(res).to.have.status(403);
          expect(res.body.success).to.be.eql(false);
          expect(res.body.message).to.be.eql('Token needed to access resources');
          done();
        });
    });
  });

  context('when delete payment plan service returns an error', () => {
    it('returns the error', (done) => {
      sinon.stub(PaymentPlan, 'findByIdAndDelete').throws(new Error('Type Error'));
      request()
        .delete(`/api/v1/payment-plan/delete/${id}`)
        .set('authorization', adminToken)
        .end((err, res) => {
          expect(res).to.have.status(400);
          expect(res.body.success).to.be.eql(false);
          done();
          PaymentPlan.findByIdAndDelete.restore();
        });
    });
  });

  context('with invalid id supplied', () => {
    context('when payment plan id is invalid', () => {
      it('returns an error', (done) => {
        request()
          .delete(`/api/v1/payment-plan/delete/${id}s`)
          .set('authorization', adminToken)
          .end((err, res) => {
            expect(res).to.have.status(412);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Invalid Id supplied');
            done();
          });
      });
    });
  });
});

describe('Update Payment Plan', () => {
  const id = mongoose.Types.ObjectId();
  const paymentPlan = PaymentPlanFactory.build({
    _id: id,
    name: 'Test payment plan',
    description: 'test plan description',
    addedBy: _id,
  });
  const newPaymentPlan = {
    id,
    name: 'Updated payment plan',
    description: 'Updated plan description',
  };

  beforeEach(async () => {
    await addPaymentPlan(paymentPlan);
  });

  context('with valid data & token', () => {
    it('returns a updated paymentPlan', (done) => {
      request()
        .put('/api/v1/payment-plan/update')
        .set('authorization', adminToken)
        .send(newPaymentPlan)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.success).to.be.eql(true);
          expect(res.body).to.have.property('plan');
          expect(res.body.plan.name).to.be.eql(newPaymentPlan.name);
          expect(res.body.plan.description).to.be.eql(newPaymentPlan.description);
          done();
        });
    });
  });

  context('without token', () => {
    it('returns error', (done) => {
      request()
        .put('/api/v1/payment-plan/update')
        .send(newPaymentPlan)
        .end((err, res) => {
          expect(res).to.have.status(403);
          expect(res.body.success).to.be.eql(false);
          expect(res.body.message).to.be.eql('Token needed to access resources');
          done();
        });
    });
  });

  context('when user token is used', () => {
    beforeEach(async () => {
      await User.findByIdAndDelete(_id);
    });
    it('returns token error', (done) => {
      request()
        .put('/api/v1/payment-plan/update')
        .set('authorization', adminToken)
        .send(newPaymentPlan)
        .end((err, res) => {
          expect(res).to.have.status(404);
          expect(res.body.success).to.be.eql(false);
          expect(res.body.message).to.be.eql('Invalid token');
          done();
        });
    });
  });

  context('with invalid paymentPlan', () => {
    it('returns a updated user', (done) => {
      request()
        .put('/api/v1/payment-plan/update')
        .set('authorization', adminToken)
        .send()
        .end((err, res) => {
          expect(res).to.have.status(412);
          expect(res.body.success).to.be.eql(false);
          expect(res.body.message).to.be.eql('Validation Error');
          done();
        });
    });
  });

  context('when update service returns an error', () => {
    it('returns the error', (done) => {
      sinon.stub(PaymentPlan, 'findByIdAndUpdate').throws(new Error('Type Error'));
      request()
        .put('/api/v1/payment-plan/update')
        .set('authorization', adminToken)
        .send(newPaymentPlan)
        .end((err, res) => {
          expect(res).to.have.status(400);
          expect(res.body.success).to.be.eql(false);
          done();
          PaymentPlan.findByIdAndUpdate.restore();
        });
    });
  });

  context('with invalid data', () => {
    context('when plan name is empty', () => {
      it('returns an error', (done) => {
        const invalidPaymentPlan = PaymentPlanFactory.build({ id, name: '' });
        request()
          .put('/api/v1/payment-plan/update')
          .set('authorization', adminToken)
          .send(invalidPaymentPlan)
          .end((err, res) => {
            expect(res).to.have.status(412);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Validation Error');
            expect(res.body.error).to.be.eql('"Plan Name" is not allowed to be empty');
            done();
          });
      });
    });
    context('when plan description is empty', () => {
      it('returns an error', (done) => {
        const invalidPaymentPlan = PaymentPlanFactory.build({ id, description: '' });
        request()
          .put('/api/v1/payment-plan/update')
          .set('authorization', adminToken)
          .send(invalidPaymentPlan)
          .end((err, res) => {
            expect(res).to.have.status(412);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Validation Error');
            expect(res.body.error).to.be.eql('"Plan Description" is not allowed to be empty');
            done();
          });
      });
    });
  });
});
