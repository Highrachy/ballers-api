import mongoose from 'mongoose';
import { expect, sinon, useDatabase } from '../config';
import Offer from '../../server/models/offer.model';
import {
  getOfferById,
  createOffer,
  getAllOffers,
  getOffer,
  acceptOffer,
  assignOffer,
} from '../../server/services/offer.service';
import OfferFactory from '../factories/offer.factory';
import { addProperty } from '../../server/services/property.service';
import PropertyFactory from '../factories/property.factory';
import { addEnquiry } from '../../server/services/enquiry.service';
import EnquiryFactory from '../factories/enquiry.factory';
import { addUser } from '../../server/services/user.service';
import UserFactory from '../factories/user.factory';

useDatabase();

describe('Offer Service', () => {
  describe('#getOfferById', () => {
    const _id = mongoose.Types.ObjectId();

    before(async () => {
      await createOffer(OfferFactory.build({ _id, vendorId: _id }));
    });

    it('returns a valid offer by Id', async () => {
      const offer = await getOfferById(_id);
      expect(offer._id).to.eql(_id);
    });
  });

  describe('#createOffer', () => {
    let countedOffers;
    const vendorId = mongoose.Types.ObjectId();
    const offer = OfferFactory.build({ vendorId });

    beforeEach(async () => {
      countedOffers = await Offer.countDocuments({});
    });

    context('when a valid offer is entered', () => {
      beforeEach(async () => {
        await createOffer(offer);
      });

      it('adds a new offer', async () => {
        const currentCountedOffers = await Offer.countDocuments({});
        expect(currentCountedOffers).to.eql(countedOffers + 1);
      });
    });

    context('when an invalid data is entered', () => {
      it('throws an error', async () => {
        try {
          const invalidOffer = OfferFactory.build();
          await createOffer(invalidOffer);
        } catch (err) {
          const currentCountedOffers = await Offer.countDocuments({});
          expect(err.statusCode).to.eql(400);
          expect(err.error.name).to.be.eql('ValidationError');
          expect(err.message).to.be.eql('Error creating offer');
          expect(currentCountedOffers).to.eql(countedOffers);
        }
      });
    });
  });

  describe('#getAllOffers', () => {
    const userId = mongoose.Types.ObjectId();
    const propertyId = mongoose.Types.ObjectId();
    const enquiryId = mongoose.Types.ObjectId();
    const user = UserFactory.build({ _id: userId });
    const property = PropertyFactory.build({ _id: propertyId, addedBy: userId, updatedBy: userId });
    const enquiry = EnquiryFactory.build({ _id: enquiryId, userId });
    const offer = OfferFactory.build({ userId, enquiryId, propertyId, vendorId: userId });

    beforeEach(async () => {
      await addUser(user);
      await addProperty(property);
      await addEnquiry(enquiry);
      await createOffer(offer);
      await createOffer(offer);
    });

    context('when offers added are valid', () => {
      it('returns 2 offers', async () => {
        const offers = await getAllOffers(userId);
        expect(offers).to.be.an('array');
        expect(offers.length).to.be.eql(2);
      });
    });
    context('when new enquiry is added', () => {
      before(async () => {
        await createOffer(offer);
      });
      it('returns 3 enquiries', async () => {
        const offers = await getAllOffers(userId);
        expect(offers).to.be.an('array');
        expect(offers.length).to.be.eql(3);
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
    const enquiry = EnquiryFactory.build({ _id: enquiryId, userId });
    const offer = OfferFactory.build({
      _id: offerId,
      userId,
      enquiryId,
      propertyId,
      vendorId: userId,
    });

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
    const enquiry = EnquiryFactory.build({ _id: enquiryId, userId });
    const offer = OfferFactory.build({
      _id: offerId,
      userId,
      enquiryId,
      propertyId,
      vendorId: userId,
    });
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
          await assignOffer(offerId);
        } catch (err) {
          expect(err.statusCode).to.eql(500);
          expect(err.error).to.be.an('Error');
          expect(err.message).to.be.eql('Internal Server Error');
        }
        Offer.findById.restore();
      });
    });

    context('when findByIdAndUpdate fails', () => {
      it('throws an error', async () => {
        sinon.stub(Offer, 'findByIdAndUpdate').throws(new Error('error msg'));
        try {
          await acceptOffer(toAccept);
        } catch (err) {
          expect(err.statusCode).to.eql(400);
          expect(err.error).to.be.an('Error');
          expect(err.message).to.be.eql('Error responding to offer');
        }
        Offer.findByIdAndUpdate.restore();
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
    const enquiry = EnquiryFactory.build({ _id: enquiryId, userId });
    const offer = OfferFactory.build({
      _id: offerId,
      userId,
      enquiryId,
      propertyId,
      vendorId: userId,
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

    context('when findByIdAndUpdate fails', () => {
      it('throws an error', async () => {
        sinon.stub(Offer, 'findByIdAndUpdate').throws(new Error('error msg'));
        try {
          await assignOffer(offerId);
        } catch (err) {
          expect(err.statusCode).to.eql(400);
          expect(err.error).to.be.an('Error');
          expect(err.message).to.be.eql('Error assigning offer');
        }
        Offer.findByIdAndUpdate.restore();
      });
    });
  });
});
