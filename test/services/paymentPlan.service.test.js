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
import PropertyFactory from '../factories/property.factory';
import UserFactory from '../factories/user.factory';
import { USER_ROLE } from '../../server/helpers/constants';
import { addUser } from '../../server/services/user.service';
import { addProperty } from '../../server/services/property.service';

useDatabase();

describe('PaymentPlan Service', () => {
  const vendor = UserFactory.build({ role: USER_ROLE.VENDOR }, { generateId: true });
  const admin = UserFactory.build({ role: USER_ROLE.ADMIN }, { generateId: true });

  beforeEach(async () => {
    await addUser(vendor);
    await addUser(admin);
  });

  describe('#getPaymentPlanById', () => {
    const paymentPlan = PaymentPlanFactory.build({ addedBy: admin._id }, { generateId: true });

    before(async () => {
      await addPaymentPlan(paymentPlan);
    });

    it('returns a valid payment plan by Id', async () => {
      const plan = await getPaymentPlanById(paymentPlan._id);
      expect(plan.id).to.be.eql(paymentPlan._id.toString());
    });
  });

  describe('#addPaymentPlan', () => {
    let countedPlans;
    const paymentPlan = PaymentPlanFactory.build({ addedBy: admin._id }, { generateId: true });

    beforeEach(async () => {
      countedPlans = await PaymentPlan.countDocuments({});
    });

    context('when a valid payment plan is entered', () => {
      beforeEach(async () => {
        await addPaymentPlan(paymentPlan);
      });

      it('adds a new payment plan', async () => {
        const currentCountedPlans = await PaymentPlan.countDocuments({});
        expect(currentCountedPlans).to.eql(countedPlans + 1);
      });
    });

    context('when an invalid data is entered', () => {
      it('throws an error', async () => {
        try {
          const invalidPaymentPlan = PaymentPlanFactory.build({ name: '', addedBy: admin._id });
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
    const paymentPlans = PaymentPlanFactory.buildList(
      18,
      { addedBy: admin._id },
      { generateId: true },
    );
    const paymentPlan = PaymentPlanFactory.build({ addedBy: admin._id });

    beforeEach(async () => {
      await PaymentPlan.insertMany(paymentPlans);
    });
    context('when payment plan added is valid', () => {
      it('returns 18 payment plans', async () => {
        const plan = await getAllPaymentPlans();
        expect(plan).to.be.an('array');
        expect(plan.length).to.be.eql(18);
      });
    });
    context('when new payment plan is added', () => {
      before(async () => {
        await addPaymentPlan(paymentPlan);
      });
      it('returns 19 payment plans', async () => {
        const plan = await getAllPaymentPlans();
        expect(plan).to.be.an('array');
        expect(plan.length).to.be.eql(19);
      });
    });
  });

  describe('#deletePaymentPlan', () => {
    const paymentPlan = PaymentPlanFactory.build({ addedBy: admin._id }, { generateId: true });
    const property = PropertyFactory.build(
      {
        addedBy: vendor._id,
        updatedBy: vendor._id,
        paymentPlan: [paymentPlan._id],
      },
      { generateId: true },
    );

    beforeEach(async () => {
      await PaymentPlan.create(paymentPlan);
    });

    describe('when payment plan has been assigned to a property', () => {
      beforeEach(async () => {
        await addProperty(property);
      });
      context('when payment plan has been assigned to a property', () => {
        it('returns unable to delete payment plan', async () => {
          try {
            await deletePaymentPlan(paymentPlan._id);
          } catch (err) {
            expect(err.statusCode).to.eql(412);
            expect(err.message).to.be.eql(
              'Payment plan cannot be deleted as it is currently assigned to 1 property',
            );
          }
        });
      });
    });

    context('when payment plan is deleted', () => {
      it('payment plan id returns error', async () => {
        await deletePaymentPlan(paymentPlan._id);
        const plan = await getPaymentPlanById(paymentPlan._id);
        expect(plan).to.eql(null);
      });
    });

    context('when getPaymentPlanById fails', () => {
      it('throws an error', async () => {
        sinon.stub(PaymentPlan, 'findById').throws(new Error('error msg'));
        try {
          await deletePaymentPlan(paymentPlan._id);
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
          await deletePaymentPlan(paymentPlan._id);
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
    const paymentPlan = PaymentPlanFactory.build(
      { name: 'test monthly plan', description: 'test monthly description', addedBy: admin._id },
      { generateId: true },
    );
    const paymentPlanToUpdate = {
      id: paymentPlan._id,
      name: 'updated monthly plan name',
      description: 'updated monthly description',
    };
    before(async () => {
      await addPaymentPlan(paymentPlan);
    });

    context('when paymentPlan is updated', () => {
      it('returns a valid updated user', async () => {
        const updatedPlan = updatePaymentPlan(paymentPlanToUpdate);
        const plan = getPaymentPlanById(paymentPlanToUpdate.id);
        expect(plan.name).to.eql(updatedPlan.name);
        expect(plan.description).to.eql(updatedPlan.description);
      });
    });

    context('when getPaymentPlanById fails', () => {
      it('throws an error', async () => {
        sinon.stub(PaymentPlan, 'findById').throws(new Error('error msg'));
        try {
          await updatePaymentPlan(paymentPlanToUpdate);
        } catch (err) {
          expect(err.statusCode).to.eql(500);
          expect(err.error.message).to.be.eql('error msg');
          expect(err.message).to.be.eql('Internal Server Error');
        }
        PaymentPlan.findById.restore();
      });
    });

    context('when findByIdAndUpdate fails', () => {
      it('throws an error', async () => {
        sinon.stub(PaymentPlan, 'findByIdAndUpdate').throws(new Error('error msg'));
        try {
          await updatePaymentPlan(paymentPlanToUpdate);
        } catch (err) {
          expect(err.statusCode).to.eql(400);
          expect(err.error.message).to.be.eql("Cannot read property 'id' of null");
          expect(err.message).to.be.eql('Error updating payment plan');
        }
        PaymentPlan.findByIdAndUpdate.restore();
      });
    });
  });
});
