import mongoose from 'mongoose';
import { expect, request, sinon, useDatabase } from '../config';
import Offer from '../../server/models/offer.model';
import User from '../../server/models/user.model';
import OfferFactory from '../factories/offer.factory';
import EnquiryFactory from '../factories/enquiry.factory';
import UserFactory from '../factories/user.factory';
import PropertyFactory from '../factories/property.factory';
import { createOffer, raiseConcern } from '../../server/services/offer.service';
import { addEnquiry, getEnquiryById } from '../../server/services/enquiry.service';
import { addUser } from '../../server/services/user.service';
import { addProperty } from '../../server/services/property.service';
import { OFFER_STATUS, CONCERN_STATUS, USER_ROLE } from '../../server/helpers/constants';
import {
  getTodaysDateShortCode,
  getTodaysDateStandard,
  getTodaysDateInWords,
} from '../../server/helpers/dates';
import * as MailService from '../../server/services/mailer.service';
import EMAIL_CONTENT from '../../mailer';
import { itReturnsForbiddenForNoToken, itReturnsAnErrorWhenServiceFails } from '../helpers';

useDatabase();

let sendMailStub;
const sandbox = sinon.createSandbox();

let adminToken;
let userToken;
let vendorToken;

const regularUser = UserFactory.build(
  { role: USER_ROLE.USER, activated: true },
  { generateId: true },
);
const adminUser = UserFactory.build(
  {
    role: USER_ROLE.ADMIN,
    activated: true,
  },
  { generateId: true },
);
const vendorUser = UserFactory.build(
  {
    role: USER_ROLE.VENDOR,
    activated: true,
    vendor: { companyName: 'Highrachy Investment' },
  },
  { generateId: true },
);

const property1 = PropertyFactory.build(
  {
    addedBy: vendorUser._id,
    updatedBy: vendorUser._id,
  },
  { generateId: true },
);
const property2 = PropertyFactory.build(
  {
    addedBy: vendorUser._id,
    updatedBy: vendorUser._id,
  },
  { generateId: true },
);
const property3 = PropertyFactory.build(
  {
    addedBy: vendorUser._id,
    updatedBy: vendorUser._id,
  },
  { generateId: true },
);

describe('Offer Controller', () => {
  beforeEach(() => {
    sendMailStub = sandbox.stub(MailService, 'sendMail');
  });

  afterEach(() => {
    sandbox.restore();
  });

  beforeEach(async () => {
    adminToken = await addUser(adminUser);
    userToken = await addUser(regularUser);
    vendorToken = await addUser(vendorUser);
    await addProperty(property1);
    await addProperty(property2);
    await addProperty(property3);
  });

  describe('Create Offer Route', () => {
    const enquiryId = mongoose.Types.ObjectId();
    const createPropertyId = mongoose.Types.ObjectId();

    const enquiry = EnquiryFactory.build({
      _id: enquiryId,
      userId: regularUser._id,
      propertyId: createPropertyId,
    });

    const newProperty = PropertyFactory.build({
      _id: createPropertyId,
      name: 'Lekki Ville Estate',
      houseType: 'Maisonette',
      addedBy: vendorUser._id,
      updatedBy: vendorUser._id,
    });

    beforeEach(async () => {
      await addProperty(newProperty);
      await addEnquiry(enquiry);
    });

    context('with valid data', () => {
      it('returns successful offer', (done) => {
        const offer = OfferFactory.build({ enquiryId });
        request()
          .post('/api/v1/offer/create')
          .set('authorization', vendorToken)
          .send(offer)
          .end((err, res) => {
            expect(res).to.have.status(201);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.message).to.be.eql('Offer created');
            expect(res.body.offer).to.have.property('userInfo');
            expect(res.body.offer.vendorInfo._id).to.be.eql(vendorUser._id.toString());
            expect(res.body.offer.propertyInfo._id).to.be.eql(createPropertyId.toString());
            expect(res.body.offer.referenceCode).to.be.eql(
              `HIG/LVE/OLM/01/${getTodaysDateShortCode()}`,
            );
            done();
          });
      });
    });

    context('when an invalid token is used', () => {
      beforeEach(async () => {
        await User.findByIdAndDelete(vendorUser._id);
      });
      it('returns token error', (done) => {
        const offer = OfferFactory.build({ enquiryId });
        request()
          .post('/api/v1/offer/create')
          .set('authorization', vendorToken)
          .send(offer)
          .end((err, res) => {
            expect(res).to.have.status(404);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Invalid token');
            done();
          });
      });
    });

    context('with unauthorized user access token', () => {
      it('returns an error', (done) => {
        const offer = OfferFactory.build({ enquiryId });
        request()
          .post('/api/v1/offer/create')
          .set('authorization', userToken)
          .send(offer)
          .end((err, res) => {
            expect(res).to.have.status(403);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('You are not permitted to perform this action');
            done();
          });
      });
    });

    context('with invalid data', () => {
      context('when enquiry id is empty', () => {
        it('returns an error', (done) => {
          const offer = OfferFactory.build({ enquiryId: '' });
          request()
            .post('/api/v1/offer/create')
            .set('authorization', vendorToken)
            .send(offer)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Enquiry ID" is not allowed to be empty');
              done();
            });
        });
      });

      context('when hand over date is empty', () => {
        it('returns an error', (done) => {
          const offer = OfferFactory.build({ handOverDate: '' });
          request()
            .post('/api/v1/offer/create')
            .set('authorization', vendorToken)
            .send(offer)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Handover Date" must be a valid date');
              done();
            });
        });
      });

      context('when hand over date is todays date', () => {
        it('returns an error', (done) => {
          const offer = OfferFactory.build({ handOverDate: getTodaysDateStandard() });
          request()
            .post('/api/v1/offer/create')
            .set('authorization', vendorToken)
            .send(offer)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql(
                `"Handover Date" should a date later than ${getTodaysDateInWords()}`,
              );
              done();
            });
        });
      });

      context('when delivery state is empty', () => {
        it('returns an error', (done) => {
          const offer = OfferFactory.build({ deliveryState: '' });
          request()
            .post('/api/v1/offer/create')
            .set('authorization', vendorToken)
            .send(offer)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Delivery State" is not allowed to be empty');
              done();
            });
        });
      });

      context('when total amount payable is empty', () => {
        it('returns an error', (done) => {
          const offer = OfferFactory.build({ totalAmountPayable: '' });
          request()
            .post('/api/v1/offer/create')
            .set('authorization', vendorToken)
            .send(offer)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Total Amount Payable" must be a number');
              done();
            });
        });
      });

      context('when allocation in percentage is empty', () => {
        it('returns an error', (done) => {
          const offer = OfferFactory.build({ allocationInPercentage: '' });
          request()
            .post('/api/v1/offer/create')
            .set('authorization', vendorToken)
            .send(offer)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Allocation In Percentage" must be a number');
              done();
            });
        });
      });

      context('when allocation in percentage is less than 1', () => {
        it('returns an error', (done) => {
          const offer = OfferFactory.build({ allocationInPercentage: 0 });
          request()
            .post('/api/v1/offer/create')
            .set('authorization', vendorToken)
            .send(offer)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql(
                '"Allocation In Percentage" must be larger than or equal to 1',
              );
              done();
            });
        });
      });

      context('when allocation in percentage is greater than 100', () => {
        it('returns an error', (done) => {
          const offer = OfferFactory.build({ allocationInPercentage: 101 });
          request()
            .post('/api/v1/offer/create')
            .set('authorization', vendorToken)
            .send(offer)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql(
                '"Allocation In Percentage" must be less than or equal to 100',
              );
              done();
            });
        });
      });

      context('when title is empty', () => {
        it('returns an error', (done) => {
          const offer = OfferFactory.build({ title: '' });
          request()
            .post('/api/v1/offer/create')
            .set('authorization', vendorToken)
            .send(offer)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Title" is not allowed to be empty');
              done();
            });
        });
      });

      context('when expiry date is empty', () => {
        it('returns an error', (done) => {
          const offer = OfferFactory.build({ expires: '' });
          request()
            .post('/api/v1/offer/create')
            .set('authorization', vendorToken)
            .send(offer)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Expiry Date" must be a valid date');
              done();
            });
        });
      });
      context('when expiry date is todays date', () => {
        it('returns an error', (done) => {
          const offer = OfferFactory.build({ expires: getTodaysDateStandard() });
          request()
            .post('/api/v1/offer/create')
            .set('authorization', vendorToken)
            .send(offer)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql(
                `"Expiry Date" should a date later than ${getTodaysDateInWords()}`,
              );
              done();
            });
        });
      });
      context('when initial payment is empty', () => {
        it('returns an error', (done) => {
          const offer = OfferFactory.build({ initialPayment: '' });
          request()
            .post('/api/v1/offer/create')
            .set('authorization', vendorToken)
            .send(offer)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Initial Payment" must be a number');
              done();
            });
        });
      });
      context('when monthly payment is empty', () => {
        it('returns an error', (done) => {
          const offer = OfferFactory.build({ monthlyPayment: '' });
          request()
            .post('/api/v1/offer/create')
            .set('authorization', vendorToken)
            .send(offer)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Monthly Payment" must be a number');
              done();
            });
        });
      });
      context('when payment frequency is empty', () => {
        it('returns an error', (done) => {
          const offer = OfferFactory.build({ paymentFrequency: '' });
          request()
            .post('/api/v1/offer/create')
            .set('authorization', vendorToken)
            .send(offer)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Payment Frequency" must be a number');
              done();
            });
        });
      });
    });
  });

  describe('Accept Offer', () => {
    const offerId = mongoose.Types.ObjectId();
    const enquiryId = mongoose.Types.ObjectId();
    const enquiry = EnquiryFactory.build({
      _id: enquiryId,
      userId: regularUser._id,
      propertyId: property1._id,
    });
    const offer = OfferFactory.build({ _id: offerId, enquiryId, vendorId: vendorUser._id });
    const acceptanceInfo = {
      offerId,
      signature: 'http://ballers.ng/signature.png',
    };

    beforeEach(async () => {
      await addEnquiry(enquiry);
      await createOffer(offer);
    });

    context('with valid data & token', () => {
      it('returns accepted offer', (done) => {
        request()
          .put('/api/v1/offer/accept')
          .set('authorization', userToken)
          .send(acceptanceInfo)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.message).to.be.eql('Offer accepted');
            expect(res.body).to.have.property('offer');
            expect(res.body.offer._id).to.be.eql(offerId.toString());
            expect(res.body.offer.status).to.be.eql('Interested');
            expect(res.body.offer.signature).to.be.eql(acceptanceInfo.signature);
            expect(res.body.offer.enquiryInfo._id).to.be.eql(enquiryId.toString());
            expect(res.body.offer.propertyInfo._id).to.be.eql(property1._id.toString());
            expect(sendMailStub.callCount).to.eq(2);
            expect(sendMailStub).to.have.be.calledWith(EMAIL_CONTENT.OFFER_RESPONSE_VENDOR);
            expect(sendMailStub).to.have.be.calledWith(EMAIL_CONTENT.OFFER_RESPONSE_USER);
            done();
          });
      });
    });

    context('when offer is accepted by another user ', () => {
      it('returns error', (done) => {
        request()
          .put('/api/v1/offer/accept')
          .set('authorization', adminToken)
          .send(acceptanceInfo)
          .end((err, res) => {
            expect(res).to.have.status(412);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('You cannot accept offer of another user');
            expect(sendMailStub.callCount).to.eq(0);
            done();
          });
      });
    });

    context('without token', () => {
      it('returns error', (done) => {
        request()
          .put('/api/v1/offer/accept')
          .send(acceptanceInfo)
          .end((err, res) => {
            expect(res).to.have.status(403);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Token needed to access resources');
            expect(sendMailStub.callCount).to.eq(0);
            done();
          });
      });
    });

    context('when accept service returns an error', () => {
      it('returns the error', (done) => {
        sinon.stub(Offer, 'findByIdAndUpdate').throws(new Error('Type Error'));
        request()
          .put('/api/v1/offer/accept')
          .set('authorization', userToken)
          .send(acceptanceInfo)
          .end((err, res) => {
            expect(res).to.have.status(400);
            expect(res.body.success).to.be.eql(false);
            expect(sendMailStub.callCount).to.eq(0);
            done();
            Offer.findByIdAndUpdate.restore();
          });
      });
    });

    context('with invalid data', () => {
      context('when offer id is empty', () => {
        it('returns an error', (done) => {
          const invalidData = { offerId: '', signature: 'http://ballers.ng/signature.png' };
          request()
            .put('/api/v1/offer/accept')
            .set('authorization', userToken)
            .send(invalidData)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Offer Id" is not allowed to be empty');
              expect(sendMailStub.callCount).to.eq(0);
              done();
            });
        });
      });
      context('when signature is empty', () => {
        it('returns an error', (done) => {
          const invalidData = { offerId, signature: '' };
          request()
            .put('/api/v1/offer/accept')
            .set('authorization', userToken)
            .send(invalidData)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Signature" is not allowed to be empty');
              expect(sendMailStub.callCount).to.eq(0);
              done();
            });
        });
      });
    });
  });

  describe('Assign Offer', () => {
    const offerId = mongoose.Types.ObjectId();
    const enquiryId = mongoose.Types.ObjectId();
    const enquiry = EnquiryFactory.build({
      _id: enquiryId,
      userId: regularUser._id,
      propertyId: property1._id,
    });
    const offer = OfferFactory.build({
      _id: offerId,
      enquiryId,
      vendorId: vendorUser._id,
      status: OFFER_STATUS.INTERESTED,
    });
    const toAssignDetails = {
      offerId,
    };

    beforeEach(async () => {
      await addEnquiry(enquiry);
      await createOffer(offer);
    });

    context('with valid data & token', () => {
      it('returns assigned offer', (done) => {
        request()
          .put('/api/v1/offer/assign')
          .set('authorization', vendorToken)
          .send(toAssignDetails)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.message).to.be.eql('Offer assigned');
            expect(res.body).to.have.property('offer');
            expect(res.body.offer._id).to.be.eql(offerId.toString());
            expect(res.body.offer.status).to.be.eql('Assigned');
            expect(res.body.offer.signature).to.be.eql(toAssignDetails.signature);
            expect(res.body.offer.vendorInfo._id).to.be.eql(vendorUser._id.toString());
            expect(res.body.offer.enquiryInfo._id).to.be.eql(enquiryId.toString());
            expect(res.body.offer.propertyInfo._id).to.be.eql(property1._id.toString());
            done();
          });
      });
    });

    context('without token', () => {
      it('returns error', (done) => {
        request()
          .put('/api/v1/offer/assign')
          .send(toAssignDetails)
          .end((err, res) => {
            expect(res).to.have.status(403);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Token needed to access resources');
            done();
          });
      });
    });

    context('with unauthorized user access token', () => {
      it('returns error', (done) => {
        request()
          .put('/api/v1/offer/assign')
          .set('authorization', userToken)
          .send(toAssignDetails)
          .end((err, res) => {
            expect(res).to.have.status(403);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('You are not permitted to perform this action');
            done();
          });
      });
    });

    context('when assign service returns an error', () => {
      it('returns the error', (done) => {
        sinon.stub(Offer, 'findByIdAndUpdate').throws(new Error('Type Error'));
        request()
          .put('/api/v1/offer/assign')
          .set('authorization', vendorToken)
          .send(toAssignDetails)
          .end((err, res) => {
            expect(res).to.have.status(400);
            expect(res.body.success).to.be.eql(false);
            done();
            Offer.findByIdAndUpdate.restore();
          });
      });
    });

    context('with invalid data', () => {
      context('when offer id is empty', () => {
        it('returns an error', (done) => {
          const invalidData = { offerId: '' };
          request()
            .put('/api/v1/offer/assign')
            .set('authorization', vendorToken)
            .send(invalidData)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Offer Id" is not allowed to be empty');
              done();
            });
        });
      });
    });
  });

  describe('Cancel Offer', () => {
    let unauthorizedVendorToken;
    const unauthorizedVendorId = mongoose.Types.ObjectId();
    const unauthorizedVendor = UserFactory.build({
      _id: unauthorizedVendorId,
      role: 0,
      activated: true,
    });
    const offerId1 = mongoose.Types.ObjectId();
    const enquiryId1 = mongoose.Types.ObjectId();
    const enquiry1 = EnquiryFactory.build({
      _id: enquiryId1,
      userId: regularUser._id,
      propertyId: property1._id,
    });
    const offer1 = OfferFactory.build({
      _id: offerId1,
      enquiryId: enquiryId1,
      vendorId: vendorUser._id,
    });
    const toCancelDetails = {
      offerId: offerId1,
    };

    const offerId2 = mongoose.Types.ObjectId();
    const enquiryId2 = mongoose.Types.ObjectId();
    const enquiry2 = EnquiryFactory.build({
      _id: enquiryId2,
      userId: regularUser._id,
      propertyId: property2._id,
    });
    const offer2 = OfferFactory.build({
      _id: offerId2,
      enquiryId: enquiryId2,
      vendorId: vendorUser._id,
      status: OFFER_STATUS.INTERESTED,
    });

    const offerId3 = mongoose.Types.ObjectId();
    const enquiryId3 = mongoose.Types.ObjectId();
    const enquiry3 = EnquiryFactory.build({
      _id: enquiryId3,
      userId: regularUser._id,
      propertyId: property3._id,
    });
    const offer3 = OfferFactory.build({
      _id: offerId3,
      enquiryId: enquiryId3,
      vendorId: vendorUser._id,
      status: OFFER_STATUS.ASSIGNED,
    });

    const offerId4 = mongoose.Types.ObjectId();
    const enquiryId4 = mongoose.Types.ObjectId();
    const enquiry4 = EnquiryFactory.build({
      _id: enquiryId4,
      userId: adminUser._id,
      propertyId: property3._id,
    });
    const offer4 = OfferFactory.build({
      _id: offerId4,
      enquiryId: enquiryId4,
      vendorId: vendorUser._id,
      status: OFFER_STATUS.ALLOCATED,
    });

    const offerId5 = mongoose.Types.ObjectId();
    const enquiryId5 = mongoose.Types.ObjectId();
    const enquiry5 = EnquiryFactory.build({
      _id: enquiryId5,
      userId: adminUser._id,
      propertyId: property1._id,
    });
    const offer5 = OfferFactory.build({
      _id: offerId5,
      enquiryId: enquiryId5,
      vendorId: vendorUser._id,
      status: OFFER_STATUS.REJECTED,
    });

    const offerId6 = mongoose.Types.ObjectId();
    const enquiryId6 = mongoose.Types.ObjectId();
    const enquiry6 = EnquiryFactory.build({
      _id: enquiryId6,
      userId: adminUser._id,
      propertyId: property2._id,
    });
    const offer6 = OfferFactory.build({
      _id: offerId6,
      enquiryId: enquiryId6,
      vendorId: vendorUser._id,
      status: OFFER_STATUS.CANCELLED,
    });

    beforeEach(async () => {
      unauthorizedVendorToken = await addUser(unauthorizedVendor);
      await addEnquiry(enquiry1);
      await addEnquiry(enquiry2);
      await addEnquiry(enquiry3);
      await addEnquiry(enquiry4);
      await addEnquiry(enquiry5);
      await addEnquiry(enquiry6);
      await createOffer(offer1);
      await createOffer(offer2);
      await createOffer(offer3);
      await createOffer(offer4);
      await createOffer(offer5);
      await createOffer(offer6);
    });

    context('with valid data & token', () => {
      it('returns cancelled offer', (done) => {
        request()
          .put('/api/v1/offer/cancel')
          .set('authorization', vendorToken)
          .send(toCancelDetails)
          .end(async (err, res) => {
            const enquiry = await getEnquiryById(enquiryId1);
            expect(enquiry.approved).to.be.eql(false);
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.message).to.be.eql('Offer cancelled');
            done();
          });
      });
    });

    context('when offer is cancelled by unauthorized vendor', () => {
      it('returns forbidden error', (done) => {
        request()
          .put('/api/v1/offer/cancel')
          .set('authorization', unauthorizedVendorToken)
          .send(toCancelDetails)
          .end((err, res) => {
            expect(res).to.have.status(403);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('You are not permitted to perform this action');
            done();
          });
      });
    });

    context('when an offer is canceled by a user', () => {
      it('returns forbidden error', (done) => {
        request()
          .put('/api/v1/offer/cancel')
          .set('authorization', userToken)
          .send(toCancelDetails)
          .end((err, res) => {
            expect(res).to.have.status(403);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('You are not permitted to perform this action');
            done();
          });
      });
    });

    context('when offer has been accepted', () => {
      it('returns error', (done) => {
        request()
          .put('/api/v1/offer/cancel')
          .set('authorization', vendorToken)
          .send({ offerId: offerId2 })
          .end((err, res) => {
            expect(res).to.have.status(412);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('You cannot cancel an accepted offer');
            done();
          });
      });
    });

    context('when offer has been assigned', () => {
      it('returns error', (done) => {
        request()
          .put('/api/v1/offer/cancel')
          .set('authorization', vendorToken)
          .send({ offerId: offerId3 })
          .end((err, res) => {
            expect(res).to.have.status(412);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('You cannot cancel an accepted offer');
            done();
          });
      });
    });

    context('when offer has been allocated', () => {
      it('returns error', (done) => {
        request()
          .put('/api/v1/offer/cancel')
          .set('authorization', vendorToken)
          .send({ offerId: offerId4 })
          .end((err, res) => {
            expect(res).to.have.status(412);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('You cannot cancel an accepted offer');
            done();
          });
      });
    });

    context('when an offer has been rejected', () => {
      it('returns cancelled offer', (done) => {
        request()
          .put('/api/v1/offer/cancel')
          .set('authorization', vendorToken)
          .send({ offerId: offerId5 })
          .end(async (err, res) => {
            const enquiry = await getEnquiryById(enquiryId5);
            expect(enquiry.approved).to.be.eql(false);
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.message).to.be.eql('Offer cancelled');
            done();
          });
      });
    });

    context('when an offer has been cancelled', () => {
      it('returns cancelled offer', (done) => {
        request()
          .put('/api/v1/offer/cancel')
          .set('authorization', vendorToken)
          .send({ offerId: offerId6 })
          .end(async (err, res) => {
            const enquiry = await getEnquiryById(enquiryId6);
            expect(enquiry.approved).to.be.eql(false);
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.message).to.be.eql('Offer cancelled');
            done();
          });
      });
    });

    context('without token', () => {
      it('returns error', (done) => {
        request()
          .put('/api/v1/offer/cancel')
          .send(toCancelDetails)
          .end((err, res) => {
            expect(res).to.have.status(403);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Token needed to access resources');
            done();
          });
      });
    });

    context('when cancel service returns an error', () => {
      it('returns the error', (done) => {
        sinon.stub(Offer, 'findByIdAndUpdate').throws(new Error('Type Error'));
        request()
          .put('/api/v1/offer/cancel')
          .set('authorization', vendorToken)
          .send(toCancelDetails)
          .end((err, res) => {
            expect(res).to.have.status(400);
            expect(res.body.success).to.be.eql(false);
            done();
            Offer.findByIdAndUpdate.restore();
          });
      });
    });

    context('with invalid data', () => {
      context('when offer id is empty', () => {
        it('returns an error', (done) => {
          const invalidData = { offerId: '' };
          request()
            .put('/api/v1/offer/cancel')
            .set('authorization', vendorToken)
            .send(invalidData)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Offer Id" is not allowed to be empty');
              done();
            });
        });
      });
    });
  });

  describe('Get all owned offers', () => {
    const endpoint = '/api/v1/offer/all';
    const method = 'get';

    const enquiryId1 = mongoose.Types.ObjectId();
    const enquiry1 = EnquiryFactory.build({
      _id: enquiryId1,
      userId: regularUser._id,
      propertyId: property1._id,
    });
    const offer1 = OfferFactory.build({
      enquiryId: enquiryId1,
      vendorId: vendorUser._id,
      userId: regularUser._id,
    });

    const enquiryId2 = mongoose.Types.ObjectId();
    const enquiry2 = EnquiryFactory.build({
      _id: enquiryId2,
      userId: regularUser._id,
      propertyId: property2._id,
    });
    const offer2 = OfferFactory.build({
      enquiryId: enquiryId2,
      vendorId: vendorUser._id,
      userId: regularUser._id,
    });

    const enquiryId3 = mongoose.Types.ObjectId();
    const enquiry3 = EnquiryFactory.build({
      _id: enquiryId3,
      userId: adminUser._id,
      propertyId: property3._id,
    });
    const offer3 = OfferFactory.build({
      enquiryId: enquiryId3,
      vendorId: vendorUser._id,
      userId: adminUser._id,
    });

    const demoVendorUser = UserFactory.build({ role: USER_ROLE.VENDOR, activated: true });

    context('when no offer is found', () => {
      it('returns empty array of offers', (done) => {
        request()
          [method](endpoint)
          .set('authorization', userToken)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body).to.have.property('offers');
            expect(res.body.offers.length).to.be.eql(0);
            done();
          });
      });
    });

    describe('when offers exist in db', () => {
      beforeEach(async () => {
        await addEnquiry(enquiry1);
        await createOffer(offer1);
        await addEnquiry(enquiry2);
        await createOffer(offer2);
        await addEnquiry(enquiry3);
        await createOffer(offer3);
      });

      context('with a valid user token & id', async () => {
        it('returns 2 offers', (done) => {
          request()
            [method](endpoint)
            .set('authorization', userToken)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body).to.have.property('offers');
              expect(res.body.offers[0].concern.length).to.be.eql(0);
              expect(res.body.offers[1].concern.length).to.be.eql(0);
              expect(res.body.offers.length).to.be.eql(2);
              expect(res.body.offers[0].userId).to.be.eql(regularUser._id.toString());
              expect(res.body.offers[0].enquiryInfo._id).to.be.eql(enquiryId1.toString());
              expect(res.body.offers[0].propertyInfo._id).to.be.eql(property1._id.toString());
              done();
            });
        });
      });

      context('with a valid vendor token & id', async () => {
        it('returns 3 offers', (done) => {
          request()
            [method](endpoint)
            .set('authorization', vendorToken)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body.offers.length).to.be.eql(3);
              expect(res.body.offers[0].vendorId).to.be.eql(vendorUser._id.toString());
              done();
            });
        });
      });

      itReturnsForbiddenForNoToken({ endpoint, method });

      itReturnsAnErrorWhenServiceFails({
        endpoint,
        method,
        user: demoVendorUser,
        model: Offer,
        modelMethod: 'aggregate',
      });
    });
  });

  describe('Get one offer', () => {
    const offerId = mongoose.Types.ObjectId();
    const enquiryId = mongoose.Types.ObjectId();
    const enquiry = EnquiryFactory.build({
      _id: enquiryId,
      userId: regularUser._id,
      propertyId: property1._id,
    });
    const offer = OfferFactory.build({ _id: offerId, enquiryId, vendorId: vendorUser._id });

    beforeEach(async () => {
      await addEnquiry(enquiry);
      await createOffer(offer);
    });

    context('with a valid token & id', () => {
      it('returns successful payload', (done) => {
        request()
          .get(`/api/v1/offer/${offerId}`)
          .set('authorization', userToken)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body).to.have.property('offer');
            expect(res.body.offer.concern.length).to.be.eql(0);
            expect(res.body.offer._id).to.be.eql(offerId.toString());
            done();
          });
      });
    });

    context('when user token is used', () => {
      beforeEach(async () => {
        await User.findByIdAndDelete(regularUser._id);
      });
      it('returns token error', (done) => {
        request()
          .get(`/api/v1/offer/${offerId}`)
          .set('authorization', userToken)
          .end((err, res) => {
            expect(res).to.have.status(404);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Invalid token');
            done();
          });
      });
    });

    context('with an invalid offer id', () => {
      const invalidId = mongoose.Types.ObjectId();
      it('returns not found', (done) => {
        request()
          .get(`/api/v1/offer/${invalidId}`)
          .set('authorization', userToken)
          .end((err, res) => {
            expect(res).to.have.status(404);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Offer not found');
            done();
          });
      });
    });

    context('without token', () => {
      it('returns error', (done) => {
        request()
          .get(`/api/v1/offer/${offerId}`)
          .end((err, res) => {
            expect(res).to.have.status(403);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Token needed to access resources');
            done();
          });
      });
    });

    context('when getOffer service fails', () => {
      it('returns the error', (done) => {
        sinon.stub(Offer, 'aggregate').throws(new Error('Type Error'));
        request()
          .get(`/api/v1/offer/${offerId}`)
          .set('authorization', userToken)
          .end((err, res) => {
            expect(res).to.have.status(500);
            done();
            Offer.aggregate.restore();
          });
      });
    });
  });

  describe('Get all offers of a user', () => {
    const enquiryId1 = mongoose.Types.ObjectId();
    const enquiry1 = EnquiryFactory.build({
      _id: enquiryId1,
      userId: adminUser._id,
      propertyId: property1._id,
    });
    const offer1 = OfferFactory.build({ enquiryId: enquiryId1, vendorId: vendorUser._id });

    const enquiryId2 = mongoose.Types.ObjectId();
    const enquiry2 = EnquiryFactory.build({
      _id: enquiryId2,
      userId: adminUser._id,
      propertyId: property2._id,
    });
    const offer2 = OfferFactory.build({ enquiryId: enquiryId2, vendorId: vendorUser._id });

    const enquiryId3 = mongoose.Types.ObjectId();
    const enquiry3 = EnquiryFactory.build({
      _id: enquiryId3,
      userId: regularUser._id,
      propertyId: property3._id,
    });
    const offer3 = OfferFactory.build({ enquiryId: enquiryId3, vendorId: vendorUser._id });

    context('when no offer is found', () => {
      it('returns empty array of offers', (done) => {
        request()
          .get(`/api/v1/offer/user/${regularUser._id}`)
          .set('authorization', adminToken)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body).to.have.property('offers');
            expect(res.body.offers.length).to.be.eql(0);
            done();
          });
      });
    });

    describe('when offers exist in db', () => {
      beforeEach(async () => {
        await addEnquiry(enquiry1);
        await createOffer(offer1);
        await addEnquiry(enquiry2);
        await createOffer(offer2);
        await addEnquiry(enquiry3);
        await createOffer(offer3);
      });

      context('with a valid token & id', async () => {
        it('returns successful payload', (done) => {
          request()
            .get(`/api/v1/offer/user/${regularUser._id}`)
            .set('authorization', adminToken)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body).to.have.property('offers');
              expect(res.body.offers.length).to.be.eql(1);
              expect(res.body.offers[0].vendorInfo._id).to.be.eql(vendorUser._id.toString());
              expect(res.body.offers[0].enquiryInfo._id).to.be.eql(enquiryId3.toString());
              expect(res.body.offers[0].propertyInfo._id).to.be.eql(property3._id.toString());
              done();
            });
        });
      });

      context('without token', () => {
        it('returns error', (done) => {
          request()
            .get(`/api/v1/offer/user/${regularUser._id}`)
            .end((err, res) => {
              expect(res).to.have.status(403);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Token needed to access resources');
              done();
            });
        });
      });

      context('when getAllOffers service fails', () => {
        it('returns the error', (done) => {
          sinon.stub(Offer, 'aggregate').throws(new Error('Type Error'));
          request()
            .get(`/api/v1/offer/user/${regularUser._id}`)
            .set('authorization', adminToken)
            .end((err, res) => {
              expect(res).to.have.status(500);
              done();
              Offer.aggregate.restore();
            });
        });
      });
    });
  });

  describe('Get all active offers', () => {
    const enquiryId1 = mongoose.Types.ObjectId();
    const enquiry1 = EnquiryFactory.build({
      _id: enquiryId1,
      userId: adminUser._id,
      propertyId: property1._id,
    });
    const offer1 = OfferFactory.build({
      enquiryId: enquiryId1,
      vendorId: vendorUser._id,
      status: OFFER_STATUS.GENERATED,
    });

    const enquiryId2 = mongoose.Types.ObjectId();
    const enquiry2 = EnquiryFactory.build({
      _id: enquiryId2,
      userId: adminUser._id,
      propertyId: property2._id,
    });
    const offer2 = OfferFactory.build({
      enquiryId: enquiryId2,
      vendorId: vendorUser._id,
      expires: '2005-11-12T00:00:00.000Z',
      status: OFFER_STATUS.INTERESTED,
    });

    const enquiryId3 = mongoose.Types.ObjectId();
    const enquiry3 = EnquiryFactory.build({
      _id: enquiryId3,
      userId: adminUser._id,
      propertyId: property3._id,
    });
    const offer3 = OfferFactory.build({
      enquiryId: enquiryId3,
      vendorId: vendorUser._id,
      status: OFFER_STATUS.NEGLECTED,
    });

    const enquiryId4 = mongoose.Types.ObjectId();
    const enquiry4 = EnquiryFactory.build({
      _id: enquiryId4,
      userId: regularUser._id,
      propertyId: property1._id,
    });
    const offerId4 = mongoose.Types.ObjectId();
    const offer4 = OfferFactory.build({
      _id: offerId4,
      enquiryId: enquiryId4,
      vendorId: vendorUser._id,
      expires: '2030-02-12T00:00:00.000Z',
      status: OFFER_STATUS.INTERESTED,
    });

    const enquiryId5 = mongoose.Types.ObjectId();
    const enquiry5 = EnquiryFactory.build({
      _id: enquiryId5,
      userId: regularUser._id,
      propertyId: property2._id,
    });
    const offerId5 = mongoose.Types.ObjectId();
    const offer5 = OfferFactory.build({
      _id: offerId5,
      enquiryId: enquiryId5,
      vendorId: vendorUser._id,
      expires: '2030-11-21T00:00:00.000Z',
      status: OFFER_STATUS.ASSIGNED,
    });

    const enquiryId6 = mongoose.Types.ObjectId();
    const enquiry6 = EnquiryFactory.build({
      _id: enquiryId6,
      userId: regularUser._id,
      propertyId: property3._id,
    });
    const offerId6 = mongoose.Types.ObjectId();
    const offer6 = OfferFactory.build({
      _id: offerId6,
      enquiryId: enquiryId6,
      vendorId: vendorUser._id,
      expires: '2030-05-02T00:00:00.000Z',
      status: OFFER_STATUS.ALLOCATED,
    });

    context('when no offer is found', () => {
      it('returns empty array of offers', (done) => {
        request()
          .get('/api/v1/offer/active')
          .set('authorization', adminToken)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body).to.have.property('offers');
            expect(res.body.offers.length).to.be.eql(0);
            done();
          });
      });
    });

    describe('when offers exist in db', () => {
      beforeEach(async () => {
        await addEnquiry(enquiry1);
        await createOffer(offer1);
        await addEnquiry(enquiry2);
        await createOffer(offer2);
        await addEnquiry(enquiry3);
        await createOffer(offer3);
        await addEnquiry(enquiry4);
        await createOffer(offer4);
        await addEnquiry(enquiry5);
        await createOffer(offer5);
        await addEnquiry(enquiry6);
        await createOffer(offer6);
      });

      context('with a valid token & id', async () => {
        it('returns successful payload', (done) => {
          request()
            .get('/api/v1/offer/active')
            .set('authorization', adminToken)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body).to.have.property('offers');
              expect(res.body.offers.length).to.be.eql(1);
              expect(res.body.offers[0].concern.length).to.be.eql(0);
              expect(res.body.offers[0].vendorInfo._id).to.be.eql(vendorUser._id.toString());
              expect(res.body.offers[0].enquiryInfo._id).to.be.eql(enquiryId1.toString());
              expect(res.body.offers[0].propertyInfo._id).to.be.eql(property1._id.toString());
              done();
            });
        });
      });

      context('with a valid token & id', async () => {
        it('returns sorted offers', (done) => {
          request()
            .get('/api/v1/offer/active')
            .set('authorization', userToken)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body).to.have.property('offers');
              expect(res.body.offers.length).to.be.eql(3);
              expect(res.body.offers[0]._id).to.be.eql(offerId4.toString());
              expect(res.body.offers[1]._id).to.be.eql(offerId6.toString());
              expect(res.body.offers[2]._id).to.be.eql(offerId5.toString());
              done();
            });
        });
      });

      context('without token', () => {
        it('returns error', (done) => {
          request()
            .get('/api/v1/offer/active')
            .end((err, res) => {
              expect(res).to.have.status(403);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Token needed to access resources');
              done();
            });
        });
      });

      context('when getActiveOffers service fails', () => {
        it('returns the error', (done) => {
          sinon.stub(Offer, 'aggregate').throws(new Error('Type Error'));
          request()
            .get('/api/v1/offer/active')
            .set('authorization', adminToken)
            .end((err, res) => {
              expect(res).to.have.status(500);
              done();
              Offer.aggregate.restore();
            });
        });
      });
    });
  });

  describe('Raise a concern', () => {
    const enquiryId = mongoose.Types.ObjectId();
    const enquiry = EnquiryFactory.build({
      _id: enquiryId,
      userId: regularUser._id,
      propertyId: property1._id,
    });
    const offerId = mongoose.Types.ObjectId();
    const offer = OfferFactory.build({
      _id: offerId,
      enquiryId,
      vendorId: vendorUser._id,
    });
    const concern = {
      offerId,
      question: 'Are all rooms ensuite',
    };

    describe('when offers exist in db', () => {
      beforeEach(async () => {
        await addEnquiry(enquiry);
        await createOffer(offer);
      });

      context('with a valid token & id', async () => {
        it('returns successful payload', (done) => {
          request()
            .put('/api/v1/offer/raise-concern')
            .set('authorization', userToken)
            .send(concern)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body).to.have.property('offer');
              expect(res.body.offer.concern.length).to.be.eql(1);
              expect(res.body.offer.concern[0].status).to.be.eql('Pending');
              expect(res.body.offer.concern[0].question).to.be.eql(concern.question);
              expect(sendMailStub.callCount).to.eq(1);
              expect(sendMailStub).to.have.be.calledWith(EMAIL_CONTENT.RAISE_CONCERN);
              done();
            });
        });
      });

      context('when a concern has been raised previously on offer', async () => {
        const firstConcern = {
          offerId,
          userId: regularUser._id,
          question: 'Can you send me the house plan',
        };
        beforeEach(async () => {
          await raiseConcern(firstConcern);
        });
        it('returns successful payload', (done) => {
          request()
            .put('/api/v1/offer/raise-concern')
            .set('authorization', userToken)
            .send(concern)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body).to.have.property('offer');
              expect(res.body.offer.concern.length).to.be.eql(2);
              expect(res.body.offer.concern[1].status).to.be.eql('Pending');
              expect(res.body.offer.concern[0].question).to.be.eql(firstConcern.question);
              expect(res.body.offer.concern[1].question).to.be.eql(concern.question);
              expect(sendMailStub.callCount).to.eq(1);
              expect(sendMailStub).to.have.be.calledWith(EMAIL_CONTENT.RAISE_CONCERN);
              done();
            });
        });
      });

      context('with invalid data', () => {
        context('when offer id is empty', () => {
          it('returns an error', (done) => {
            request()
              .put('/api/v1/offer/raise-concern')
              .set('authorization', userToken)
              .send({ offerId: '', question: 'Are all rooms ensuite' })
              .end((err, res) => {
                expect(res).to.have.status(412);
                expect(res.body.success).to.be.eql(false);
                expect(res.body.message).to.be.eql('Validation Error');
                expect(res.body.error).to.be.eql('"Offer Id" is not allowed to be empty');
                expect(sendMailStub.callCount).to.eq(0);
                done();
              });
          });
        });

        context('when question is empty', () => {
          it('returns an error', (done) => {
            request()
              .put('/api/v1/offer/raise-concern')
              .set('authorization', userToken)
              .send({ offerId, question: '' })
              .end((err, res) => {
                expect(res).to.have.status(412);
                expect(res.body.success).to.be.eql(false);
                expect(res.body.message).to.be.eql('Validation Error');
                expect(res.body.error).to.be.eql('"Question" is not allowed to be empty');
                expect(sendMailStub.callCount).to.eq(0);
                done();
              });
          });
        });
      });

      context('without token', () => {
        it('returns error', (done) => {
          request()
            .put('/api/v1/offer/raise-concern')
            .send(concern)
            .end((err, res) => {
              expect(res).to.have.status(403);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Token needed to access resources');
              expect(sendMailStub.callCount).to.eq(0);
              done();
            });
        });
      });

      context('when getActiveOffers service fails', () => {
        it('returns the error', (done) => {
          sinon.stub(Offer, 'findByIdAndUpdate').throws(new Error('Type Error'));
          request()
            .put('/api/v1/offer/raise-concern')
            .set('authorization', userToken)
            .send(concern)
            .end((err, res) => {
              expect(res).to.have.status(400);
              expect(sendMailStub.callCount).to.eq(0);
              done();
              Offer.findByIdAndUpdate.restore();
            });
        });
      });
    });
  });

  describe('Resolve a concern', () => {
    const enquiryId = mongoose.Types.ObjectId();
    const enquiry = EnquiryFactory.build({
      _id: enquiryId,
      userId: regularUser._id,
      propertyId: property1._id,
    });
    const offerId = mongoose.Types.ObjectId();
    const concernId = mongoose.Types.ObjectId();
    const offer = OfferFactory.build({
      _id: offerId,
      enquiryId,
      vendorId: vendorUser._id,
      concern: [
        {
          _id: concernId,
          question: 'Are all rooms ensuite',
          status: CONCERN_STATUS.PENDING,
        },
      ],
    });

    const concern = {
      offerId,
      concernId,
      response: 'Yes all rooms are',
    };

    describe('when an offer exist in db', () => {
      beforeEach(async () => {
        await addEnquiry(enquiry);
        await createOffer(offer);
      });

      context('with a valid token & id', async () => {
        it('resolves the right concern', (done) => {
          request()
            .put('/api/v1/offer/resolve-concern')
            .set('authorization', vendorToken)
            .send(concern)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body).to.have.property('offer');
              expect(res.body.offer.concern.length).to.be.eql(1);
              expect(res.body.offer.concern[0].status).to.be.eql('Resolved');
              expect(res.body.offer.concern[0].question).to.be.eql(offer.concern[0].question);
              expect(res.body.offer.concern[0].response).to.be.eql(concern.response);
              expect(sendMailStub.callCount).to.eq(1);
              expect(sendMailStub).to.have.be.calledWith(EMAIL_CONTENT.RESOLVE_CONCERN);
              done();
            });
        });
      });

      context('with invalid data', () => {
        context('when offer id is empty', () => {
          it('returns an error', (done) => {
            request()
              .put('/api/v1/offer/resolve-concern')
              .set('authorization', vendorToken)
              .send({ offerId: '', concernId, question: 'Are all rooms ensuite' })
              .end((err, res) => {
                expect(res).to.have.status(412);
                expect(res.body.success).to.be.eql(false);
                expect(res.body.message).to.be.eql('Validation Error');
                expect(res.body.error).to.be.eql('"Offer Id" is not allowed to be empty');
                expect(sendMailStub.callCount).to.eq(0);
                done();
              });
          });
        });

        context('when concern id is empty', () => {
          it('returns an error', (done) => {
            request()
              .put('/api/v1/offer/resolve-concern')
              .set('authorization', vendorToken)
              .send({ concernId: '', offerId, question: 'Are all rooms ensuite' })
              .end((err, res) => {
                expect(res).to.have.status(412);
                expect(res.body.success).to.be.eql(false);
                expect(res.body.message).to.be.eql('Validation Error');
                expect(res.body.error).to.be.eql('"Concern Id" is not allowed to be empty');
                expect(sendMailStub.callCount).to.eq(0);
                done();
              });
          });
        });

        context('when response is empty', () => {
          it('returns an error', (done) => {
            request()
              .put('/api/v1/offer/resolve-concern')
              .set('authorization', vendorToken)
              .send({ offerId, concernId, response: '' })
              .end((err, res) => {
                expect(res).to.have.status(412);
                expect(res.body.success).to.be.eql(false);
                expect(res.body.message).to.be.eql('Validation Error');
                expect(res.body.error).to.be.eql('"Response" is not allowed to be empty');
                expect(sendMailStub.callCount).to.eq(0);
                done();
              });
          });
        });
      });

      context('with unauthorized user access token', () => {
        it('returns an error', (done) => {
          request()
            .put('/api/v1/offer/resolve-concern')
            .set('authorization', userToken)
            .send(concern)
            .end((err, res) => {
              expect(res).to.have.status(403);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('You are not permitted to perform this action');
              expect(sendMailStub.callCount).to.eq(0);
              done();
            });
        });
      });

      context('without token', () => {
        it('returns error', (done) => {
          request()
            .put('/api/v1/offer/resolve-concern')
            .send(concern)
            .end((err, res) => {
              expect(res).to.have.status(403);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Token needed to access resources');
              expect(sendMailStub.callCount).to.eq(0);
              done();
            });
        });
      });

      context('when getActiveOffers service fails', () => {
        it('returns the error', (done) => {
          sinon.stub(Offer, 'findOneAndUpdate').throws(new Error('Type Error'));
          request()
            .put('/api/v1/offer/resolve-concern')
            .set('authorization', vendorToken)
            .send(concern)
            .end((err, res) => {
              expect(res).to.have.status(400);
              expect(sendMailStub.callCount).to.eq(0);
              done();
              Offer.findOneAndUpdate.restore();
            });
        });
      });
    });
  });
});
