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

useDatabase();

let adminToken;
let userToken;
const userId = mongoose.Types.ObjectId();
const adminId = mongoose.Types.ObjectId();
const adminUser = UserFactory.build({ _id: adminId, role: 0, activated: true });
const regualarUser = UserFactory.build({ _id: userId, role: 1, activated: true });

const enquiryId = mongoose.Types.ObjectId();
const propertyId = mongoose.Types.ObjectId();
const property = PropertyFactory.build({ _id: propertyId, addedBy: adminId, updatedBy: adminId });
const enquiry = EnquiryFactory.build({ _id: enquiryId, userId: adminId });

beforeEach(async () => {
  adminToken = await addUser(adminUser);
  userToken = await addUser(regualarUser);
  await addProperty(property);
  await addEnquiry(enquiry);
});

describe('Create Offer Route', () => {
  context('with valid data', () => {
    it('returns successful offer', (done) => {
      const offer = OfferFactory.build({ userId, enquiryId, propertyId });
      request()
        .post('/api/v1/offer/create')
        .set('authorization', adminToken)
        .send(offer)
        .end((err, res) => {
          expect(res).to.have.status(201);
          expect(res.body.success).to.be.eql(true);
          expect(res.body.message).to.be.eql('Offer created');
          expect(res.body.offer).to.have.property('vendorInfo');
          expect(res.body.offer).to.have.property('enquiryInfo');
          expect(res.body.offer).to.have.property('propertyInfo');
          expect(res.body.offer).to.have.property('userInfo');
          done();
        });
    });
  });

  context('when user token is used', () => {
    beforeEach(async () => {
      await User.findByIdAndDelete(adminId);
    });
    it('returns token error', (done) => {
      const offer = OfferFactory.build({ userId, enquiryId, propertyId });
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
      const offer = OfferFactory.build({ userId, enquiryId, propertyId });
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
    context('when userId is empty', () => {
      it('returns an error', (done) => {
        const offer = OfferFactory.build({ userId: '' });
        request()
          .post('/api/v1/offer/create')
          .set('authorization', adminToken)
          .send(offer)
          .end((err, res) => {
            expect(res).to.have.status(412);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Validation Error');
            expect(res.body.error).to.be.eql('"User ID" is not allowed to be empty');
            done();
          });
      });
    });

    context('when user id is empty', () => {
      it('returns an error', (done) => {
        const offer = OfferFactory.build({ userId: '' });
        request()
          .post('/api/v1/offer/create')
          .set('authorization', adminToken)
          .send(offer)
          .end((err, res) => {
            expect(res).to.have.status(412);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Validation Error');
            expect(res.body.error).to.be.eql('"User ID" is not allowed to be empty');
            done();
          });
      });
    });
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
    context('when property id is empty', () => {
      it('returns an error', (done) => {
        const offer = OfferFactory.build({ propertyId: '' });
        request()
          .post('/api/v1/offer/create')
          .set('authorization', adminToken)
          .send(offer)
          .end((err, res) => {
            expect(res).to.have.status(412);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Validation Error');
            expect(res.body.error).to.be.eql('"Property ID" is not allowed to be empty');
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
    context('when expires is empty', () => {
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
            expect(res.body.error).to.be.eql('"Expires" must be a valid date');
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
  const offer = OfferFactory.build({
    _id: offerId,
    userId,
    enquiryId,
    propertyId,
    vendorId: adminId,
  });
  const acceptanceInfo = {
    offerId,
    signature: 'http://ballers.ng/signature.png',
  };

  beforeEach(async () => {
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
  const offer = OfferFactory.build({
    _id: offerId,
    userId,
    enquiryId,
    propertyId,
    vendorId: adminId,
  });
  const toAssignDetails = {
    offerId,
  };

  beforeEach(async () => {
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

  context('when accept service returns an error', () => {
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

describe('Get all offers', () => {
  const offer = OfferFactory.build({
    userId,
    enquiryId,
    propertyId,
    vendorId: adminId,
  });

  context('when no offer is found', () => {
    it('returns empty array of offers', (done) => {
      request()
        .get('/api/v1/offer/all')
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
      await createOffer(offer);
      await createOffer(offer);
      await createOffer(offer);
    });

    context('with a valid token & id', async () => {
      it('returns successful payload', (done) => {
        request()
          .get('/api/v1/offer/all')
          .set('authorization', adminToken)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body).to.have.property('offers');
            expect(res.body.offers.length).to.be.eql(3);
            expect(res.body.offers[0].vendorInfo._id).to.be.eql(adminId.toString());
            expect(res.body.offers[0].enquiryInfo._id).to.be.eql(enquiryId.toString());
            expect(res.body.offers[0].propertyInfo._id).to.be.eql(propertyId.toString());
            done();
          });
      });
    });

    context('without token', () => {
      it('returns error', (done) => {
        request()
          .get('/api/v1/offer/all')
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
          .get('/api/v1/offer/all')
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
  const offer = OfferFactory.build({
    _id: offerId,
    userId,
    enquiryId,
    propertyId,
    vendorId: adminId,
  });

  beforeEach(async () => {
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
