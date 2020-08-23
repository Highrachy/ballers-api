import mongoose from 'mongoose';
import { expect, sinon, useDatabase } from '../config';
import {
  getPaymentPlanById,
  addPaymentPlan,
  deletePaymentPlan,
  getAllPaymentPlans,
  updatePaymentPlan,
} from '../../server/services/paymentPlan.service';
import PaymentPlanFactory from '../factories/paymentPlan.factory';
import PaymentPlan from '../../server/models/paymentPlan.model';

useDatabase();

describe('PaymentPlan Service', () => {
  describe('#getPaymentPlanById', () => {
    const _id = mongoose.Types.ObjectId();

    before(async () => {
      await PaymentPlan.create(PaymentPlanFactory.build({ _id, addedBy: _id }));
    });

    it('returns a valid payment plan by Id', async () => {
      const paymentPlan = await getPaymentPlanById(_id);
      expect(paymentPlan.id).to.be.eql(_id.toString());
    });
  });

  describe('#addPaymentPlan', () => {
    let countedPlans;
    const id = mongoose.Types.ObjectId();
    const plan = PaymentPlanFactory.build({ _id: id, addedBy: id });

    beforeEach(async () => {
      countedPlans = await PaymentPlan.countDocuments({});
    });

    context('when a valid payment plan is entered', () => {
      beforeEach(async () => {
        await addPaymentPlan(plan);
      });

      it('adds a new payment plan', async () => {
        const currentCountedPlans = await PaymentPlan.countDocuments({});
        expect(currentCountedPlans).to.eql(countedPlans + 1);
      });
    });

    context('when an invalid data is entered', () => {
      it('throws an error', async () => {
        try {
          const invalidPaymentPlan = PaymentPlanFactory.build({ name: '', addedBy: id });
          await addPaymentPlan(invalidPaymentPlan);
        } catch (err) {
          const currentCountedPlans = await PaymentPlan.countDocuments({});
          expect(err.statusCode).to.eql(400);
          expect(err.error.name).to.be.eql('ValidationError');
          expect(err.message).to.be.eql('Error adding payment plan');
          expect(currentCountedPlans).to.eql(countedPlans);
        }
      });
    });
  });

  describe('#getAllPaymentPlans', () => {
    const id = mongoose.Types.ObjectId();
    const planToAdd = PaymentPlanFactory.build({ addedBy: id });

    beforeEach(async () => {
      await PaymentPlan.create(planToAdd);
      await PaymentPlan.create(planToAdd);
    });
    context('when payment plan added is valid', () => {
      it('returns 2 payment plans', async () => {
        const plan = await getAllPaymentPlans();
        expect(plan).to.be.an('array');
        expect(plan.length).to.be.eql(2);
      });
    });
    context('when new payment plan is added', () => {
      before(async () => {
        await PaymentPlan.create(planToAdd);
      });
      it('returns 3 payment plans', async () => {
        const plan = await getAllPaymentPlans();
        expect(plan).to.be.an('array');
        expect(plan.length).to.be.eql(3);
      });
    });
  });

  describe('#deletePaymentPlan', () => {
    const id = mongoose.Types.ObjectId();
    beforeEach(async () => {
      await addPaymentPlan(PaymentPlanFactory.build({ _id: id, addedBy: id }));
    });

    context('when payment plan is deleted', () => {
      it('payment plan id returns error', async () => {
        await deletePaymentPlan(id);
        const paymentPlan = await getPaymentPlanById(id);
        expect(paymentPlan).to.eql(null);
      });
    });

    context('when getPaymentPlanById fails', () => {
      it('throws an error', async () => {
        sinon.stub(PaymentPlan, 'findById').throws(new Error('error msg'));
        try {
          await deletePaymentPlan(id);
        } catch (err) {
          expect(err.statusCode).to.eql(500);
          expect(err.error).to.be.an('Error');
          expect(err.message).to.be.eql('Internal Server Error');
        }
        PaymentPlan.findById.restore();
      });
    });

    context('when findByIdAndDelete fails', () => {
      it('throws an error', async () => {
        sinon.stub(PaymentPlan, 'findByIdAndDelete').throws(new Error('error msg'));
        try {
          await deletePaymentPlan(id);
        } catch (err) {
          expect(err.statusCode).to.eql(400);
          expect(err.error).to.be.an('Error');
          expect(err.message).to.be.eql('Error deleting payment plan');
        }
        PaymentPlan.findByIdAndDelete.restore();
      });
    });
  });

  describe('#updatePaymentPlan', () => {
    const _id = mongoose.Types.ObjectId();
    const updatedPaymentPlan = {
      id: _id,
      name: 'updated monthly plan name',
      description: 'updated monthly description',
    };
    before(async () => {
      await PaymentPlan.create(
        PaymentPlanFactory.build({
          _id,
          name: 'test monthly plan',
          description: 'test monthly description',
          addedBy: _id,
        }),
      );
    });

    context('when paymentPlan is updated', () => {
      it('returns a valid updated user', async () => {
        const updatedProperty = updatePaymentPlan(updatedPaymentPlan);
        const paymentPlan = getPaymentPlanById(updatedPaymentPlan.id);
        expect(paymentPlan.name).to.eql(updatedProperty.name);
        expect(paymentPlan.description).to.eql(updatedProperty.description);
      });
    });

    context('when getPaymentPlanById fails', () => {
      it('throws an error', async () => {
        sinon.stub(PaymentPlan, 'findById').throws(new Error('error msg'));
        try {
          await updatePaymentPlan(updatedPaymentPlan);
        } catch (err) {
          expect(err.statusCode).to.eql(500);
          expect(err.error).to.be.an('Error');
          expect(err.message).to.be.eql('Internal Server Error');
        }
        PaymentPlan.findById.restore();
      });
    });

    context('when findByIdAndUpdate fails', () => {
      it('throws an error', async () => {
        sinon.stub(PaymentPlan, 'findByIdAndUpdate').throws(new Error('error msg'));
        try {
          await updatePaymentPlan(updatedPaymentPlan);
        } catch (err) {
          expect(err.statusCode).to.eql(400);
          expect(err.error).to.be.an('Error');
          expect(err.message).to.be.eql('Error updating payment plan');
        }
        PaymentPlan.findByIdAndUpdate.restore();
      });
    });
  });
});
