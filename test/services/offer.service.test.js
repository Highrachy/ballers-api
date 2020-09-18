import mongoose from 'mongoose';
import { expect, sinon, useDatabase } from '../config';
import Offer from '../../server/models/offer.model';
import {
  getOfferById,
  generateReferenceCode,
  createOffer,
  getAllOffersUser,
  getAllOffersAdmin,
  getOffer,
  acceptOffer,
  assignOffer,
  getActiveOffers,
  cancelOffer,
} from '../../server/services/offer.service';
import OfferFactory from '../factories/offer.factory';
import { addProperty } from '../../server/services/property.service';
import PropertyFactory from '../factories/property.factory';
import { addEnquiry } from '../../server/services/enquiry.service';
import EnquiryFactory from '../factories/enquiry.factory';
import { addUser } from '../../server/services/user.service';
import UserFactory from '../factories/user.factory';
import { OFFER_STATUS } from '../../server/helpers/constants';
import { TODAY_DDMMYY } from '../../server/helpers/dates';

useDatabase();

describe('Offer Service', () => {
  describe('#getOfferById', () => {
    const _id = mongoose.Types.ObjectId();
    const userId = mongoose.Types.ObjectId();
    const propertyId = mongoose.Types.ObjectId();
    const enquiryId = mongoose.Types.ObjectId();
    const user = UserFactory.build({ _id: userId });
    const property = PropertyFactory.build({ _id: propertyId, addedBy: userId, updatedBy: userId });
    const enquiry = EnquiryFactory.build({ _id: enquiryId, userId, propertyId });
    const offer = OfferFactory.build({ _id, enquiryId, vendorId: userId });

    before(async () => {
      await addUser(user);
      await addProperty(property);
      await addEnquiry(enquiry);
      await createOffer(offer);
    });

    it('returns a valid offer by Id', async () => {
      const offerInfo = await getOfferById(_id);
      expect(offerInfo._id).to.eql(_id);
    });
  });

  describe('#generateReferenceCode', () => {
    const userId = mongoose.Types.ObjectId();
    const propertyId = mongoose.Types.ObjectId();
    const enquiryId1 = mongoose.Types.ObjectId();
    const enquiryId2 = mongoose.Types.ObjectId();
    const offerId = mongoose.Types.ObjectId();

    const user = UserFactory.build({ _id: userId });
    const property = PropertyFactory.build({
      _id: propertyId,
      name: 'Lekki Ville Estate',
      houseType: 'Maisonette',
      addedBy: userId,
      updatedBy: userId,
    });
    const enquiry1 = EnquiryFactory.build({ _id: enquiryId1, userId, propertyId });
    const enquiry2 = EnquiryFactory.build({ _id: enquiryId2, userId, propertyId });
    const offer = OfferFactory.build({ _id: offerId, enquiryId: enquiryId1, vendorId: userId });

    beforeEach(async () => {
      await addUser(user);
      await addProperty(property);
      await addEnquiry(enquiry1);
      await addEnquiry(enquiry2);
    });

    context('when no property has been sold previously', () => {
      it('returns a valid offer by Id', async () => {
        const referenceCode = await generateReferenceCode(propertyId);
        expect(referenceCode).to.eql(`LVE/OLM/01${TODAY_DDMMYY}`);
      });
    });

    context('when one property has been sold previously', () => {
      it('returns a valid offer by Id', async () => {
        await createOffer(offer);
        const referenceCode = await generateReferenceCode(propertyId);
        expect(referenceCode).to.eql(`LVE/OLM/02${TODAY_DDMMYY}`);
      });
    });

    context('when date class fails', () => {
      it('throws an error', async () => {
        sinon.stub(Date, 'now').throws(new Error('Date Error'));
        try {
          await createOffer(offer);
        } catch (err) {
          expect(err.statusCode).to.eql(500);
          expect(err.error).to.be.an('Error');
          expect(err.message).to.be.eql('Internal Server Error');
        }
        Date.now.restore();
      });
    });
  });

  describe('#createOffer', () => {
    let countedOffers;
    const userId = mongoose.Types.ObjectId();
    const propertyId = mongoose.Types.ObjectId();
    const enquiryId = mongoose.Types.ObjectId();
    const user = UserFactory.build({ _id: userId });
    const property = PropertyFactory.build({ _id: propertyId, addedBy: userId, updatedBy: userId });
    const enquiry = EnquiryFactory.build({ _id: enquiryId, userId, propertyId });
    const offer = OfferFactory.build({ enquiryId, vendorId: userId });

    beforeEach(async () => {
      await addUser(user);
      await addProperty(property);
      await addEnquiry(enquiry);
      countedOffers = await Offer.countDocuments({});
    });

    context('when a valid offer is entered', () => {
      it('adds a new offer', async () => {
        const newOffer = await createOffer(offer);
        const currentCountedOffers = await Offer.countDocuments({});
        expect(currentCountedOffers).to.eql(countedOffers + 1);
        expect(newOffer.propertyId).to.eql(propertyId);
        expect(newOffer.enquiryId).to.eql(enquiryId);
        expect(newOffer.userId).to.eql(userId);
        expect(newOffer.propertyInfo._id).to.eql(propertyId);
        expect(newOffer.enquiryInfo._id).to.eql(enquiryId);
        expect(newOffer.vendorInfo._id).to.eql(userId);
        expect(newOffer).to.have.property('userInfo');
        expect(newOffer.propertyInfo).to.not.have.property('assignedTo');
        expect(newOffer.vendorInfo).to.not.have.property('assignedProperties');
        expect(newOffer.vendorInfo).to.not.have.property('password');
        expect(newOffer.vendorInfo).to.not.have.property('referralCode');
      });
    });

    context('when an invalid enquiry id is entered', () => {
      it('throws an error', async () => {
        try {
          const invalidOffer = OfferFactory.build();
          await createOffer(invalidOffer);
        } catch (err) {
          const currentCountedOffers = await Offer.countDocuments({});
          expect(err.statusCode).to.eql(412);
          expect(err.message).to.be.eql('Invalid enquiry');
          expect(currentCountedOffers).to.eql(countedOffers);
        }
      });
    });
  });

  describe('#getAllOffersUser', () => {
    const userId = mongoose.Types.ObjectId();
    const vendorId = mongoose.Types.ObjectId();
    const propertyId = mongoose.Types.ObjectId();
    const user = UserFactory.build({ _id: userId });
    const vendor = UserFactory.build({ _id: vendorId });
    const property = PropertyFactory.build({
      _id: propertyId,
      addedBy: vendorId,
      updatedBy: vendorId,
    });

    const enquiryId1 = mongoose.Types.ObjectId();
    const enquiry1 = EnquiryFactory.build({ _id: enquiryId1, userId, propertyId });
    const offer1 = OfferFactory.build({ enquiryId: enquiryId1, vendorId, userId });

    const enquiryId2 = mongoose.Types.ObjectId();
    const enquiry2 = EnquiryFactory.build({ _id: enquiryId2, userId: vendorId, propertyId });
    const offer2 = OfferFactory.build({ enquiryId: enquiryId2, vendorId, userId: vendorId });

    const enquiryId3 = mongoose.Types.ObjectId();
    const enquiry3 = EnquiryFactory.build({ _id: enquiryId3, userId, propertyId });
    const offer3 = OfferFactory.build({ enquiryId: enquiryId3, vendorId, userId });

    beforeEach(async () => {
      await addUser(user);
      await addUser(vendor);
      await addProperty(property);
      await addEnquiry(enquiry1);
      await addEnquiry(enquiry2);
      await addEnquiry(enquiry3);
      await createOffer(offer1);
      await createOffer(offer2);
    });

    context('when offers added are valid', () => {
      it('returns 1 offer', async () => {
        const offers = await getAllOffersUser(userId);
        expect(offers).to.be.an('array');
        expect(offers.length).to.be.eql(1);
        expect(offers[0].userId).to.be.eql(userId);
      });
    });
    context('when new offer is added', () => {
      it('returns 2 offers', async () => {
        await createOffer(offer3);
        const offers = await getAllOffersUser(userId);
        expect(offers).to.be.an('array');
        expect(offers.length).to.be.eql(2);
        expect(offers[0].userId).to.be.eql(userId);
      });
    });
  });

  describe('#getAllOffersAdmin', () => {
    const userId = mongoose.Types.ObjectId();
    const vendorId = mongoose.Types.ObjectId();
    const propertyId = mongoose.Types.ObjectId();
    const user = UserFactory.build({ _id: userId });
    const vendor = UserFactory.build({ _id: vendorId });
    const property = PropertyFactory.build({
      _id: propertyId,
      addedBy: vendorId,
      updatedBy: vendorId,
    });

    const enquiryId1 = mongoose.Types.ObjectId();
    const enquiry1 = EnquiryFactory.build({ _id: enquiryId1, userId, propertyId });
    const offer1 = OfferFactory.build({ enquiryId: enquiryId1, vendorId, userId });

    const enquiryId2 = mongoose.Types.ObjectId();
    const enquiry2 = EnquiryFactory.build({ _id: enquiryId2, userId, propertyId });
    const offer2 = OfferFactory.build({ enquiryId: enquiryId2, vendorId: userId, userId });

    const enquiryId3 = mongoose.Types.ObjectId();
    const enquiry3 = EnquiryFactory.build({ _id: enquiryId3, userId, propertyId });
    const offer3 = OfferFactory.build({ enquiryId: enquiryId3, vendorId, userId });

    beforeEach(async () => {
      await addUser(user);
      await addUser(vendor);
      await addProperty(property);
      await addEnquiry(enquiry1);
      await addEnquiry(enquiry2);
      await addEnquiry(enquiry3);
      await createOffer(offer1);
      await createOffer(offer2);
    });

    context('when offers added are valid', () => {
      it('returns 1 offer', async () => {
        const offers = await getAllOffersAdmin(vendorId);
        expect(offers).to.be.an('array');
        expect(offers.length).to.be.eql(1);
        expect(offers[0].vendorId).to.be.eql(vendorId);
      });
    });
    context('when new enquiry is added', () => {
      it('returns 2 offers', async () => {
        await createOffer(offer3);
        const offers = await getAllOffersAdmin(vendorId);
        expect(offers).to.be.an('array');
        expect(offers.length).to.be.eql(2);
        expect(offers[0].vendorId).to.be.eql(vendorId);
      });
    });
  });

  describe('#getOffer', () => {
    const userId = mongoose.Types.ObjectId();
    const propertyId = mongoose.Types.ObjectId();
    const enquiryId = mongoose.Types.ObjectId();
    const offerId = mongoose.Types.ObjectId();
    const user = UserFactory.build({ _id: userId });
    const property = PropertyFactory.build({ _id: propertyId, addedBy: userId, updatedBy: userId });
    const enquiry = EnquiryFactory.build({ _id: enquiryId, userId, propertyId });
    const offer = OfferFactory.build({ _id: offerId, enquiryId, vendorId: userId });

    beforeEach(async () => {
      await addUser(user);
      await addProperty(property);
      await addEnquiry(enquiry);
      await createOffer(offer);
    });

    context('when offer exists', () => {
      it('returns a valid offer', async () => {
        const gottenOffer = await getOffer(offerId);
        expect(gottenOffer[0]._id).to.eql(offerId);
        expect(gottenOffer[0].propertyId).to.eql(propertyId);
        expect(gottenOffer[0].enquiryId).to.eql(enquiryId);
        expect(gottenOffer[0].userId).to.eql(userId);
        expect(gottenOffer[0].propertyInfo._id).to.eql(propertyId);
        expect(gottenOffer[0].enquiryInfo._id).to.eql(enquiryId);
        expect(gottenOffer[0].vendorInfo._id).to.eql(userId);
        expect(gottenOffer[0].propertyInfo).to.not.have.property('assignedTo');
        expect(gottenOffer[0].vendorInfo).to.not.have.property('assignedProperties');
        expect(gottenOffer[0].vendorInfo).to.not.have.property('password');
        expect(gottenOffer[0].vendorInfo).to.not.have.property('referralCode');
      });
    });

    context('when an invalid id is used', () => {
      it('returns an error', async () => {
        const invalidOfferId = mongoose.Types.ObjectId();
        const gottenOffer = await getOffer(invalidOfferId);
        expect(gottenOffer.length).to.eql(0);
      });
    });
  });

  describe('#acceptOffer', () => {
    const userId = mongoose.Types.ObjectId();
    const propertyId = mongoose.Types.ObjectId();
    const enquiryId = mongoose.Types.ObjectId();
    const offerId = mongoose.Types.ObjectId();
    const user = UserFactory.build({ _id: userId });
    const property = PropertyFactory.build({ _id: propertyId, addedBy: userId, updatedBy: userId });
    const enquiry = EnquiryFactory.build({ _id: enquiryId, userId, propertyId });
    const offer = OfferFactory.build({ _id: offerId, enquiryId, vendorId: userId });
    const toAccept = {
      offerId,
      signature: 'http://www.ballers.ng/signature.png',
    };

    beforeEach(async () => {
      await addUser(user);
      await addProperty(property);
      await addEnquiry(enquiry);
      await createOffer(offer);
    });

    context('when all is valid', () => {
      it('returns a valid accepted offer', async () => {
        const acceptedOffer = await acceptOffer(toAccept);
        expect(acceptedOffer[0].status).to.eql('Interested');
        expect(acceptedOffer[0].signature).to.eql(toAccept.signature);
      });
    });

    context('when getOfferById fails', () => {
      it('throws an error', async () => {
        sinon.stub(Offer, 'findById').throws(new Error('error msg'));
        try {
          await acceptOffer(toAccept);
        } catch (err) {
          expect(err.statusCode).to.eql(500);
          expect(err.error).to.be.an('Error');
          expect(err.message).to.be.eql('Internal Server Error');
        }
        Offer.findById.restore();
      });
    });
  });

  describe('#assignOffer', () => {
    const userId = mongoose.Types.ObjectId();
    const propertyId = mongoose.Types.ObjectId();
    const enquiryId = mongoose.Types.ObjectId();
    const offerId = mongoose.Types.ObjectId();
    const user = UserFactory.build({ _id: userId });
    const property = PropertyFactory.build({ _id: propertyId, addedBy: userId, updatedBy: userId });
    const enquiry = EnquiryFactory.build({ _id: enquiryId, userId, propertyId });
    const offer = OfferFactory.build({
      _id: offerId,
      enquiryId,
      vendorId: userId,
      status: OFFER_STATUS.INTERESTED,
    });

    beforeEach(async () => {
      await addUser(user);
      await addProperty(property);
      await addEnquiry(enquiry);
      await createOffer(offer);
    });

    context('when all is valid', () => {
      it('returns a valid assigned offer', async () => {
        const assignedOffer = await assignOffer(offerId);
        expect(assignedOffer[0].status).to.eql('Assigned');
      });
    });

    context('when getOfferById fails', () => {
      it('throws an error', async () => {
        sinon.stub(Offer, 'findById').throws(new Error('error msg'));
        try {
          await assignOffer(offerId);
        } catch (err) {
          expect(err.statusCode).to.eql(500);
          expect(err.error).to.be.an('Error');
          expect(err.message).to.be.eql('Internal Server Error');
        }
        Offer.findById.restore();
      });
    });
  });

  describe('#cancelOffer', () => {
    const userId = mongoose.Types.ObjectId();
    const propertyId = mongoose.Types.ObjectId();
    const enquiryId = mongoose.Types.ObjectId();
    const offerId = mongoose.Types.ObjectId();
    const user = UserFactory.build({ _id: userId });
    const property = PropertyFactory.build({ _id: propertyId, addedBy: userId, updatedBy: userId });
    const enquiry = EnquiryFactory.build({ _id: enquiryId, userId, propertyId });
    const offer = OfferFactory.build({ _id: offerId, enquiryId, vendorId: userId });

    beforeEach(async () => {
      await addUser(user);
      await addProperty(property);
      await addEnquiry(enquiry);
      await createOffer(offer);
    });

    context('when all is valid', () => {
      it('returns a valid cancelled offer', async () => {
        const rejectedOffer = await cancelOffer(offerId);
        expect(rejectedOffer.status).to.eql('Cancelled');
      });
    });

    context('when getOfferById fails', () => {
      it('throws an error', async () => {
        sinon.stub(Offer, 'findById').throws(new Error('error msg'));
        try {
          await cancelOffer(offerId);
        } catch (err) {
          expect(err.statusCode).to.eql(500);
          expect(err.error).to.be.an('Error');
          expect(err.message).to.be.eql('Internal Server Error');
        }
        Offer.findById.restore();
      });
    });
  });

  describe('#getActiveOffers', () => {
    const userId = mongoose.Types.ObjectId();
    const propertyId = mongoose.Types.ObjectId();
    const user = UserFactory.build({ _id: userId });
    const property = PropertyFactory.build({ _id: propertyId, addedBy: userId, updatedBy: userId });

    const enquiryId1 = mongoose.Types.ObjectId();
    const enquiry1 = EnquiryFactory.build({ _id: enquiryId1, userId, propertyId });
    const offer1 = OfferFactory.build({
      enquiryId: enquiryId1,
      vendorId: userId,
      status: OFFER_STATUS.ASSIGNED,
    });

    const enquiryId2 = mongoose.Types.ObjectId();
    const enquiry2 = EnquiryFactory.build({ _id: enquiryId2, userId, propertyId });
    const offer2 = OfferFactory.build({
      enquiryId: enquiryId2,
      vendorId: userId,
      status: OFFER_STATUS.ALLOCATED,
    });

    const enquiryId3 = mongoose.Types.ObjectId();
    const enquiry3 = EnquiryFactory.build({ _id: enquiryId3, userId, propertyId });
    const offer3 = OfferFactory.build({
      enquiryId: enquiryId3,
      vendorId: userId,
      status: OFFER_STATUS.REJECTED,
    });

    const enquiryId4 = mongoose.Types.ObjectId();
    const enquiry4 = EnquiryFactory.build({ _id: enquiryId4, userId, propertyId });
    const offer4 = OfferFactory.build({
      enquiryId: enquiryId4,
      vendorId: userId,
      status: OFFER_STATUS.INTERESTED,
    });

    const enquiryId5 = mongoose.Types.ObjectId();
    const enquiry5 = EnquiryFactory.build({ _id: enquiryId5, userId, propertyId });
    const offer5 = OfferFactory.build({
      enquiryId: enquiryId5,
      vendorId: userId,
      status: OFFER_STATUS.NEGLECTED,
    });

    beforeEach(async () => {
      await addUser(user);
      await addProperty(property);
      await addEnquiry(enquiry1);
      await addEnquiry(enquiry2);
      await addEnquiry(enquiry3);
      await addEnquiry(enquiry4);
      await addEnquiry(enquiry5);
      await createOffer(offer1);
      await createOffer(offer2);
      await createOffer(offer3);
    });

    context('when offers added are valid', () => {
      it('returns 2 offers', async () => {
        const offers = await getActiveOffers(userId);
        expect(offers).to.be.an('array');
        expect(offers.length).to.be.eql(2);
      });
    });
    context('when new enquiry is added', () => {
      it('returns 3 enquiries', async () => {
        await createOffer(offer4);
        await createOffer(offer5);
        const offers = await getActiveOffers(userId);
        expect(offers).to.be.an('array');
        expect(offers.length).to.be.eql(3);
      });
    });
  });
});
