import mongoose from 'mongoose';
import { expect, request, sinon, useDatabase } from '../config';
import Offer from '../../server/models/offer.model';
import User from '../../server/models/user.model';
import OfferFactory from '../factories/offer.factory';
import EnquiryFactory from '../factories/enquiry.factory';
import UserFactory from '../factories/user.factory';
import PropertyFactory from '../factories/property.factory';
import { createOffer } from '../../server/services/offer.service';
import { addEnquiry, getEnquiryById } from '../../server/services/enquiry.service';
import { addUser } from '../../server/services/user.service';
import { addProperty } from '../../server/services/property.service';
import { OFFER_STATUS } from '../../server/helpers/constants';
import {
  getTodaysDateShortCode,
  getTodaysDateStandard,
  getTodaysDateInWords,
} from '../../server/helpers/dates';
import * as MailService from '../../server/services/mailer.service';
import EMAIL_CONTENT from '../../mailer';

useDatabase();

let sendMailSpy;
const sandbox = sinon.createSandbox();

let adminToken;
let userToken;
const userId = mongoose.Types.ObjectId();
const adminId = mongoose.Types.ObjectId();
const adminUser = UserFactory.build({ _id: adminId, role: 0, activated: true, vendorCode: 'HIG' });
const regularUser = UserFactory.build({ _id: userId, role: 1, activated: true });
const propertyId1 = mongoose.Types.ObjectId();
const propertyId2 = mongoose.Types.ObjectId();
const propertyId3 = mongoose.Types.ObjectId();
const property1 = PropertyFactory.build({ _id: propertyId1, addedBy: adminId, updatedBy: adminId });
const property2 = PropertyFactory.build({ _id: propertyId2, addedBy: adminId, updatedBy: adminId });
const property3 = PropertyFactory.build({ _id: propertyId3, addedBy: adminId, updatedBy: adminId });

describe('Offer Controller', () => {
  beforeEach(() => {
    sendMailSpy = sandbox.spy(MailService, 'sendMail');
  });

  afterEach(() => {
    sandbox.restore();
  });

  beforeEach(async () => {
    adminToken = await addUser(adminUser);
    userToken = await addUser(regularUser);
    await addProperty(property1);
    await addProperty(property2);
    await addProperty(property3);
  });

  describe('Create Offer Route', () => {
    const enquiryId = mongoose.Types.ObjectId();
    const createPropertyId = mongoose.Types.ObjectId();
    const enquiry = EnquiryFactory.build({
      _id: enquiryId,
      userId: adminId,
      propertyId: createPropertyId,
    });
    const newProperty = PropertyFactory.build({
      _id: createPropertyId,
      name: 'Lekki Ville Estate',
      houseType: 'Maisonette',
      addedBy: adminId,
      updatedBy: adminId,
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
          .set('authorization', adminToken)
          .send(offer)
          .end((err, res) => {
            expect(res).to.have.status(201);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.message).to.be.eql('Offer created');
            expect(res.body.offer).to.have.property('userInfo');
            expect(res.body.offer.vendorInfo._id).to.be.eql(adminId.toString());
            expect(res.body.offer.vendorInfo._id).to.be.eql(adminId.toString());
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
        await User.findByIdAndDelete(adminId);
      });
      it('returns token error', (done) => {
        const offer = OfferFactory.build({ enquiryId });
        request()
          .post('/api/v1/offer/create')
          .set('authorization', adminToken)
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
            .set('authorization', adminToken)
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
            .set('authorization', adminToken)
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
            .set('authorization', adminToken)
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
            .set('authorization', adminToken)
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
            .set('authorization', adminToken)
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
            .set('authorization', adminToken)
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
            .set('authorization', adminToken)
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
            .set('authorization', adminToken)
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
            .set('authorization', adminToken)
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
            .set('authorization', adminToken)
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
            .set('authorization', adminToken)
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
            .set('authorization', adminToken)
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
            .set('authorization', adminToken)
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
            .set('authorization', adminToken)
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
      userId,
      propertyId: propertyId1,
    });
    const offer = OfferFactory.build({ _id: offerId, enquiryId, vendorId: adminId });
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
            expect(res.body.offer.propertyInfo._id).to.be.eql(propertyId1.toString());
            expect(sendMailSpy.callCount).to.eq(2);
            expect(sendMailSpy).to.have.be.calledWith(EMAIL_CONTENT.OFFER_RESPONSE_VENDOR);
            expect(sendMailSpy).to.have.be.calledWith(EMAIL_CONTENT.OFFER_RESPONSE_USER);
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
            expect(sendMailSpy.callCount).to.eq(0);
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
            expect(sendMailSpy.callCount).to.eq(0);
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
            expect(sendMailSpy.callCount).to.eq(0);
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
              expect(sendMailSpy.callCount).to.eq(0);
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
              expect(sendMailSpy.callCount).to.eq(0);
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
      userId: adminId,
      propertyId: propertyId1,
    });
    const offer = OfferFactory.build({
      _id: offerId,
      enquiryId,
      vendorId: adminId,
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
          .set('authorization', adminToken)
          .send(toAssignDetails)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.message).to.be.eql('Offer assigned');
            expect(res.body).to.have.property('offer');
            expect(res.body.offer._id).to.be.eql(offerId.toString());
            expect(res.body.offer.status).to.be.eql('Assigned');
            expect(res.body.offer.signature).to.be.eql(toAssignDetails.signature);
            expect(res.body.offer.vendorInfo._id).to.be.eql(adminId.toString());
            expect(res.body.offer.enquiryInfo._id).to.be.eql(enquiryId.toString());
            expect(res.body.offer.propertyInfo._id).to.be.eql(propertyId1.toString());
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
          .set('authorization', adminToken)
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
            .set('authorization', adminToken)
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
      userId: adminId,
      propertyId: propertyId1,
    });
    const offer1 = OfferFactory.build({ _id: offerId1, enquiryId: enquiryId1, vendorId: adminId });
    const toCancelDetails = {
      offerId: offerId1,
    };

    const offerId2 = mongoose.Types.ObjectId();
    const enquiryId2 = mongoose.Types.ObjectId();
    const enquiry2 = EnquiryFactory.build({
      _id: enquiryId2,
      userId: adminId,
      propertyId: propertyId2,
    });
    const offer2 = OfferFactory.build({
      _id: offerId2,
      enquiryId: enquiryId2,
      vendorId: adminId,
      status: OFFER_STATUS.INTERESTED,
    });

    const offerId3 = mongoose.Types.ObjectId();
    const enquiryId3 = mongoose.Types.ObjectId();
    const enquiry3 = EnquiryFactory.build({
      _id: enquiryId3,
      userId: adminId,
      propertyId: propertyId3,
    });
    const offer3 = OfferFactory.build({
      _id: offerId3,
      enquiryId: enquiryId3,
      vendorId: adminId,
      status: OFFER_STATUS.ASSIGNED,
    });

    const offerId4 = mongoose.Types.ObjectId();
    const enquiryId4 = mongoose.Types.ObjectId();
    const enquiry4 = EnquiryFactory.build({
      _id: enquiryId4,
      userId,
      propertyId: propertyId3,
    });
    const offer4 = OfferFactory.build({
      _id: offerId4,
      enquiryId: enquiryId4,
      vendorId: adminId,
      status: OFFER_STATUS.ALLOCATED,
    });

    beforeEach(async () => {
      unauthorizedVendorToken = await addUser(unauthorizedVendor);
      await addEnquiry(enquiry1);
      await addEnquiry(enquiry2);
      await addEnquiry(enquiry3);
      await addEnquiry(enquiry4);
      await createOffer(offer1);
      await createOffer(offer2);
      await createOffer(offer3);
      await createOffer(offer4);
    });

    context('with valid data & token', () => {
      it('returns cancelled offer', (done) => {
        request()
          .put('/api/v1/offer/cancel')
          .set('authorization', adminToken)
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

    context('when offer has been accepted', () => {
      it('returns error', (done) => {
        request()
          .put('/api/v1/offer/cancel')
          .set('authorization', adminToken)
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
          .set('authorization', adminToken)
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
          .set('authorization', adminToken)
          .send({ offerId: offerId4 })
          .end((err, res) => {
            expect(res).to.have.status(412);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('You cannot cancel an accepted offer');
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
          .set('authorization', adminToken)
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
            .set('authorization', adminToken)
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

  describe('Get all user owned offers', () => {
    const enquiryId1 = mongoose.Types.ObjectId();
    const enquiry1 = EnquiryFactory.build({ _id: enquiryId1, userId, propertyId: propertyId1 });
    const offer1 = OfferFactory.build({ enquiryId: enquiryId1, vendorId: adminId, userId });

    const enquiryId2 = mongoose.Types.ObjectId();
    const enquiry2 = EnquiryFactory.build({
      _id: enquiryId2,
      userId: adminId,
      propertyId: propertyId2,
    });
    const offer2 = OfferFactory.build({
      enquiryId: enquiryId2,
      vendorId: adminId,
      userId: adminId,
    });

    const enquiryId3 = mongoose.Types.ObjectId();
    const enquiry3 = EnquiryFactory.build({ _id: enquiryId3, userId, propertyId: propertyId3 });
    const offer3 = OfferFactory.build({ enquiryId: enquiryId3, vendorId: adminId, userId });

    context('when no offer is found', () => {
      it('returns empty array of offers', (done) => {
        request()
          .get('/api/v1/offer/user/all')
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

      context('with a valid token & id', async () => {
        it('returns successful payload', (done) => {
          request()
            .get('/api/v1/offer/user/all')
            .set('authorization', userToken)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body).to.have.property('offers');
              expect(res.body.offers.length).to.be.eql(2);
              expect(res.body.offers[0].userId).to.be.eql(userId.toString());
              expect(res.body.offers[0].enquiryInfo._id).to.be.eql(enquiryId1.toString());
              expect(res.body.offers[0].propertyInfo._id).to.be.eql(propertyId1.toString());
              done();
            });
        });
      });

      context('without token', () => {
        it('returns error', (done) => {
          request()
            .get('/api/v1/offer/user/all')
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
            .get('/api/v1/offer/user/all')
            .set('authorization', userToken)
            .end((err, res) => {
              expect(res).to.have.status(500);
              done();
              Offer.aggregate.restore();
            });
        });
      });
    });
  });

  describe('Get all admin owned offers', () => {
    const enquiryId1 = mongoose.Types.ObjectId();
    const enquiry1 = EnquiryFactory.build({ _id: enquiryId1, userId, propertyId: propertyId1 });
    const offer1 = OfferFactory.build({ enquiryId: enquiryId1, vendorId: adminId, userId });

    const enquiryId2 = mongoose.Types.ObjectId();
    const enquiry2 = EnquiryFactory.build({ _id: enquiryId2, userId, propertyId: propertyId2 });
    const offer2 = OfferFactory.build({ enquiryId: enquiryId2, vendorId: userId, userId });

    const enquiryId3 = mongoose.Types.ObjectId();
    const enquiry3 = EnquiryFactory.build({ _id: enquiryId3, userId, propertyId: propertyId3 });
    const offer3 = OfferFactory.build({ enquiryId: enquiryId3, vendorId: adminId, userId });

    context('when no offer is found', () => {
      it('returns empty array of offers', (done) => {
        request()
          .get('/api/v1/offer/admin/all')
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
            .get('/api/v1/offer/admin/all')
            .set('authorization', adminToken)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body).to.have.property('offers');
              expect(res.body.offers.length).to.be.eql(2);
              expect(res.body.offers[0].vendorId).to.be.eql(adminId.toString());
              expect(res.body.offers[0].enquiryInfo._id).to.be.eql(enquiryId1.toString());
              expect(res.body.offers[0].propertyInfo._id).to.be.eql(propertyId1.toString());
              done();
            });
        });
      });

      context('without token', () => {
        it('returns error', (done) => {
          request()
            .get('/api/v1/offer/admin/all')
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
            .get('/api/v1/offer/admin/all')
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

  describe('Get one offer', () => {
    const offerId = mongoose.Types.ObjectId();
    const enquiryId = mongoose.Types.ObjectId();
    const enquiry = EnquiryFactory.build({
      _id: enquiryId,
      userId: adminId,
      propertyId: propertyId1,
    });
    const offer = OfferFactory.build({ _id: offerId, enquiryId, vendorId: adminId });

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
            expect(res.body.offer._id).to.be.eql(offerId.toString());
            done();
          });
      });
    });

    context('when user token is used', () => {
      beforeEach(async () => {
        await User.findByIdAndDelete(userId);
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
    const enquiry1 = EnquiryFactory.build({ _id: enquiryId1, userId, propertyId: propertyId1 });
    const offer1 = OfferFactory.build({ enquiryId: enquiryId1, vendorId: adminId });

    const enquiryId2 = mongoose.Types.ObjectId();
    const enquiry2 = EnquiryFactory.build({
      _id: enquiryId2,
      userId: adminId,
      propertyId: propertyId2,
    });
    const offer2 = OfferFactory.build({ enquiryId: enquiryId2, vendorId: adminId });

    const enquiryId3 = mongoose.Types.ObjectId();
    const enquiry3 = EnquiryFactory.build({
      _id: enquiryId3,
      userId: adminId,
      propertyId: propertyId3,
    });
    const offer3 = OfferFactory.build({ enquiryId: enquiryId3, vendorId: adminId });

    context('when no offer is found', () => {
      it('returns empty array of offers', (done) => {
        request()
          .get(`/api/v1/offer/user/${userId}`)
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
            .get(`/api/v1/offer/user/${userId}`)
            .set('authorization', adminToken)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body).to.have.property('offers');
              expect(res.body.offers.length).to.be.eql(1);
              expect(res.body.offers[0].vendorInfo._id).to.be.eql(adminId.toString());
              expect(res.body.offers[0].enquiryInfo._id).to.be.eql(enquiryId1.toString());
              expect(res.body.offers[0].propertyInfo._id).to.be.eql(propertyId1.toString());
              done();
            });
        });
      });

      context('without token', () => {
        it('returns error', (done) => {
          request()
            .get(`/api/v1/offer/user/${userId}`)
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
            .get(`/api/v1/offer/user/${userId}`)
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
      userId: adminId,
      propertyId: propertyId1,
    });
    const offer1 = OfferFactory.build({
      enquiryId: enquiryId1,
      vendorId: adminId,
      status: OFFER_STATUS.GENERATED,
    });

    const enquiryId2 = mongoose.Types.ObjectId();
    const enquiry2 = EnquiryFactory.build({
      _id: enquiryId2,
      userId: adminId,
      propertyId: propertyId2,
    });
    const offer2 = OfferFactory.build({
      enquiryId: enquiryId2,
      vendorId: adminId,
      status: OFFER_STATUS.INTERESTED,
    });

    const enquiryId3 = mongoose.Types.ObjectId();
    const enquiry3 = EnquiryFactory.build({
      _id: enquiryId3,
      userId: adminId,
      propertyId: propertyId3,
    });
    const offer3 = OfferFactory.build({
      enquiryId: enquiryId3,
      vendorId: adminId,
      status: OFFER_STATUS.NEGLECTED,
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
              expect(res.body.offers.length).to.be.eql(2);
              expect(res.body.offers[0].vendorInfo._id).to.be.eql(adminId.toString());
              expect(res.body.offers[0].enquiryInfo._id).to.be.eql(enquiryId1.toString());
              expect(res.body.offers[0].propertyInfo._id).to.be.eql(propertyId1.toString());
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
});
