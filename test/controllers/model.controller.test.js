import mongoose from 'mongoose';
import { expect, request } from '../config';
import Enquiry from '../../server/models/enquiry.model';
import Offer from '../../server/models/offer.model';
import OfflinePayment from '../../server/models/offlinePayment.model';
import Property from '../../server/models/property.model';
import Referral from '../../server/models/referral.model';
import ReportedProperty from '../../server/models/reportedProperty.model';
import Transaction from '../../server/models/transaction.model';
import Visitation from '../../server/models/visitation.model';
import EnquiryFactory from '../factories/enquiry.factory';
import OfferFactory from '../factories/offer.factory';
import OfflinePaymentFactory from '../factories/offlinePayment.factory';
import PropertyFactory from '../factories/property.factory';
import ReferralFactory from '../factories/referral.factory';
import ReportedPropertyFactory from '../factories/reportedProperty.factory';
import TransactionFactory from '../factories/transaction.factory';
import UserFactory from '../factories/user.factory';
import VendorFactory from '../factories/vendor.factory';
import VisitationFactory from '../factories/visitation.factory';
import { addUser } from '../../server/services/user.service';
import { VISITATION_STATUS, USER_ROLE } from '../../server/helpers/constants';
import {
  itReturnsForbiddenForNoToken,
  itReturnsForbiddenForTokenWithInvalidAccess,
  itReturnsNotFoundForInvalidToken,
  pastDate,
} from '../helpers';

let adminToken;
let userToken;
let vendorToken;

const adminUser = UserFactory.build(
  { role: USER_ROLE.ADMIN, activated: true },
  { generateId: true },
);
const vendorUser = UserFactory.build(
  {
    role: USER_ROLE.VENDOR,
    activated: true,
    vendor: VendorFactory.build({ verified: true }),
  },
  { generateId: true },
);
const regularUser = UserFactory.build(
  { role: USER_ROLE.USER, activated: true },
  { generateId: true },
);
const editorUser = UserFactory.build(
  { role: USER_ROLE.EDITOR, activated: true },
  { generateId: true },
);

describe('Model Controller', () => {
  beforeEach(async () => {
    adminToken = await addUser(adminUser);
    userToken = await addUser(regularUser);
    vendorToken = await addUser(vendorUser);
  });

  describe('Get All Models', () => {
    const method = 'get';
    const endpoint = '/api/v1/all';

    const properties = PropertyFactory.buildList(
      7,
      { addedBy: vendorUser._id },
      { generateId: true },
    );

    const properties2 = PropertyFactory.buildList(
      3,
      { addedBy: mongoose.Types.ObjectId() },
      { generateId: true },
    );

    const enquiries = properties.map((_, index) =>
      EnquiryFactory.build(
        {
          propertyId: properties[index]._id,
          userId: regularUser._id,
          vendorId: properties[index].addedBy,
        },
        { generateId: true },
      ),
    );

    const offers = properties.map((_, index) =>
      OfferFactory.build(
        {
          propertyId: properties[index]._id,
          enquiryId: enquiries[index]._id,
          userId: regularUser._id,
          vendorId: vendorUser._id,
          referenceCode: 'GOO/123/456/XXX',
        },
        { generateId: true },
      ),
    );

    const offlinePayments = OfflinePaymentFactory.buildList(
      9,
      {
        offerId: mongoose.Types.ObjectId(),
        userId: mongoose.Types.ObjectId(),
        amount: 10_000,
        bank: 'GTB',
        dateOfPayment: '2020-01-21',
        type: 'bank transfer',
        resolved: { status: false },
      },
      { generateId: true },
    );

    const referrals = ReferralFactory.buildList(2, { referrerId: regularUser._id });

    const reportedProperties = properties2.map((_, index) =>
      ReportedPropertyFactory.build(
        {
          propertyId: properties2[index]._id,
          reason: 'fraudulent vendor',
          reportedBy: regularUser._id,
          resolved: {
            status: false,
          },
        },
        { generateId: true },
      ),
    );

    const transactions = TransactionFactory.buildList(
      8,
      {
        propertyId: offers[0].propertyId,
        offerId: offers[0]._id,
        userId: regularUser._id,
        vendorId: vendorUser._id,
        addedBy: adminUser._id,
        updatedBy: adminUser._id,
        remittance: {
          amount: 50_000,
          by: adminUser._id,
          percentage: 14,
          date: '2002-11-11',
        },
        createdAt: pastDate,
      },
      { generateId: true },
    );

    const visitations = [...new Array(4)].map((_, index) =>
      VisitationFactory.build(
        {
          propertyId: properties[index]._id,
          userId: mongoose.Types.ObjectId(),
          vendorId: properties[index].addedBy,
          status: VISITATION_STATUS.PENDING,
        },
        { generateId: true },
      ),
    );

    beforeEach(async () => {
      await Property.insertMany([...properties, ...properties2]);
      await Visitation.insertMany(visitations);
      await Enquiry.insertMany(enquiries);
      await Offer.insertMany(offers);
      await OfflinePayment.insertMany(offlinePayments);
      await Referral.insertMany(referrals);
      await ReportedProperty.insertMany(reportedProperties);
      await Transaction.insertMany(transactions);
    });

    context('when request is sent by admin', () => {
      it('returns all data', (done) => {
        request()
          [method](endpoint)
          .set('authorization', adminToken)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.models.enquiries).to.be.eql(7);
            expect(res.body.models.offers).to.be.eql(7);
            expect(res.body.models.offlinePayments).to.be.eql(9);
            expect(res.body.models.properties).to.be.eql(10);
            expect(res.body.models.referrals).to.be.eql(2);
            expect(res.body.models.reportedProperties).to.be.eql(3);
            expect(res.body.models.scheduledVisitations).to.be.eql(4);
            expect(res.body.models.transactions).to.be.eql(8);
            expect(res.body.models.users).to.be.eql(3);
            done();
          });
      });
    });

    context('when request is sent by user', () => {
      it('returns only user related data', (done) => {
        request()
          [method](endpoint)
          .set('authorization', userToken)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.models.enquiries).to.be.eql(7);
            expect(res.body.models.offers).to.be.eql(7);
            expect(res.body.models.offlinePayments).to.be.eql(0);
            expect(res.body.models.properties).to.be.eql(0);
            expect(res.body.models.referrals).to.be.eql(2);
            expect(res.body.models.reportedProperties).to.be.eql(3);
            expect(res.body.models.scheduledVisitations).to.be.eql(0);
            expect(res.body.models.transactions).to.be.eql(8);
            expect(res.body.models).to.not.have.property('users');
            done();
          });
      });
    });

    context('when request is sent by vendor', () => {
      it('returns only vendor related data', (done) => {
        request()
          [method](endpoint)
          .set('authorization', vendorToken)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.models.enquiries).to.be.eql(7);
            expect(res.body.models.offers).to.be.eql(7);
            expect(res.body.models.properties).to.be.eql(7);
            expect(res.body.models.referrals).to.be.eql(0);
            expect(res.body.models.scheduledVisitations).to.be.eql(4);
            expect(res.body.models.transactions).to.be.eql(8);
            expect(res.body.models).to.not.have.property('users');
            expect(res.body.models).to.not.have.property('reportedProperties');
            expect(res.body.models).to.not.have.property('offlinePayments');
            done();
          });
      });
    });

    itReturnsForbiddenForNoToken({ endpoint, method });

    itReturnsNotFoundForInvalidToken({
      endpoint,
      method,
      user: regularUser,
      userId: regularUser._id,
      useExistingUser: true,
    });

    itReturnsForbiddenForTokenWithInvalidAccess({
      endpoint,
      method,
      user: editorUser,
    });
  });
});
