import mongoose from 'mongoose';
import { expect, request, sinon, useDatabase } from '../config';
import Offer from '../../server/models/offer.model';
import User from '../../server/models/user.model';
import OfferFactory from '../factories/offer.factory';
import EnquiryFactory from '../factories/enquiry.factory';
import UserFactory from '../factories/user.factory';
import PropertyFactory from '../factories/property.factory';
import { createOffer } from '../../server/services/offer.service';
import { addEnquiry } from '../../server/services/enquiry.service';
import { addUser } from '../../server/services/user.service';
import { addProperty } from '../../server/services/property.service';
import { OFFER_STATUS } from '../../server/helpers/constants';
import { TODAY_DDMMYY } from '../../server/helpers/dates';

useDatabase();

let adminToken;
let userToken;
const userId = mongoose.Types.ObjectId();
const adminId = mongoose.Types.ObjectId();
const adminUser = UserFactory.build({ _id: adminId, role: 0, activated: true });
const regularUser = UserFactory.build({ _id: userId, role: 1, activated: true });
const propertyId = mongoose.Types.ObjectId();
const property = PropertyFactory.build({ _id: propertyId, addedBy: adminId, updatedBy: adminId });

describe('Offer Controller', () => {
  beforeEach(async () => {
    adminToken = await addUser(adminUser);
    userToken = await addUser(regularUser);
    await addProperty(property);
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
            expect(res.body.offer.referenceCode).to.be.eql(`LVE/OLM/01${TODAY_DDMMYY}`);
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
    const enquiry = EnquiryFactory.build({ _id: enquiryId, userId: adminId, propertyId });
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
            expect(res.body.offer.propertyInfo._id).to.be.eql(propertyId.toString());
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
              done();
            });
        });
      });
    });
  });

  describe('Assign Offer', () => {
    const offerId = mongoose.Types.ObjectId();
    const enquiryId = mongoose.Types.ObjectId();
    const enquiry = EnquiryFactory.build({ _id: enquiryId, userId: adminId, propertyId });
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
            expect(res.body.offer.propertyInfo._id).to.be.eql(propertyId.toString());
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
    const offerId = mongoose.Types.ObjectId();
    const enquiryId = mongoose.Types.ObjectId();
    const enquiry = EnquiryFactory.build({ _id: enquiryId, userId: adminId, propertyId });
    const offer = OfferFactory.build({ _id: offerId, enquiryId, vendorId: adminId });
    const toCancelDetails = {
      offerId,
    };

    beforeEach(async () => {
      await addEnquiry(enquiry);
      await createOffer(offer);
    });

    context('with valid data & token', () => {
      it('returns cancelled offer', (done) => {
        request()
          .put('/api/v1/offer/cancel')
          .set('authorization', adminToken)
          .send(toCancelDetails)
          .end((err, res) => {
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
    const enquiry1 = EnquiryFactory.build({ _id: enquiryId1, userId, propertyId });
    const offer1 = OfferFactory.build({ enquiryId: enquiryId1, vendorId: adminId, userId });

    const enquiryId2 = mongoose.Types.ObjectId();
    const enquiry2 = EnquiryFactory.build({ _id: enquiryId2, userId: adminId, propertyId });
    const offer2 = OfferFactory.build({
      enquiryId: enquiryId2,
      vendorId: adminId,
      userId: adminId,
    });

    const enquiryId3 = mongoose.Types.ObjectId();
    const enquiry3 = EnquiryFactory.build({ _id: enquiryId3, userId, propertyId });
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
              expect(res.body.offers[0].propertyInfo._id).to.be.eql(propertyId.toString());
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
    const enquiry1 = EnquiryFactory.build({ _id: enquiryId1, userId, propertyId });
    const offer1 = OfferFactory.build({ enquiryId: enquiryId1, vendorId: adminId, userId });

    const enquiryId2 = mongoose.Types.ObjectId();
    const enquiry2 = EnquiryFactory.build({ _id: enquiryId2, userId, propertyId });
    const offer2 = OfferFactory.build({ enquiryId: enquiryId2, vendorId: userId, userId });

    const enquiryId3 = mongoose.Types.ObjectId();
    const enquiry3 = EnquiryFactory.build({ _id: enquiryId3, userId, propertyId });
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
              expect(res.body.offers[0].propertyInfo._id).to.be.eql(propertyId.toString());
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
    const enquiry = EnquiryFactory.build({ _id: enquiryId, userId: adminId, propertyId });
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
    const enquiry1 = EnquiryFactory.build({ _id: enquiryId1, userId, propertyId });
    const offer1 = OfferFactory.build({ enquiryId: enquiryId1, vendorId: adminId });

    const enquiryId2 = mongoose.Types.ObjectId();
    const enquiry2 = EnquiryFactory.build({ _id: enquiryId2, userId: adminId, propertyId });
    const offer2 = OfferFactory.build({ enquiryId: enquiryId2, vendorId: adminId });

    const enquiryId3 = mongoose.Types.ObjectId();
    const enquiry3 = EnquiryFactory.build({ _id: enquiryId3, userId: adminId, propertyId });
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
              expect(res.body.offers[0].propertyInfo._id).to.be.eql(propertyId.toString());
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
    const enquiry1 = EnquiryFactory.build({ _id: enquiryId1, userId: adminId, propertyId });
    const offer1 = OfferFactory.build({
      enquiryId: enquiryId1,
      vendorId: adminId,
      status: OFFER_STATUS.GENERATED,
    });

    const enquiryId2 = mongoose.Types.ObjectId();
    const enquiry2 = EnquiryFactory.build({ _id: enquiryId2, userId: adminId, propertyId });
    const offer2 = OfferFactory.build({
      enquiryId: enquiryId2,
      vendorId: adminId,
      status: OFFER_STATUS.INTERESTED,
    });

    const enquiryId3 = mongoose.Types.ObjectId();
    const enquiry3 = EnquiryFactory.build({ _id: enquiryId3, userId: adminId, propertyId });
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
              expect(res.body.offers[0].propertyInfo._id).to.be.eql(propertyId.toString());
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
