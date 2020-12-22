import mongoose from 'mongoose';
import { expect, sinon, useDatabase } from '../config';
import Offer from '../../server/models/offer.model';
import Enquiry from '../../server/models/enquiry.model';
import Property from '../../server/models/property.model';
import {
  getOfferById,
  generateReferenceCode,
  createOffer,
  getAllOffers,
  getOffer,
  acceptOffer,
  assignOffer,
  getActiveOffers,
  cancelOffer,
  getPropertyInitials,
} from '../../server/services/offer.service';
import OfferFactory from '../factories/offer.factory';
import { addProperty } from '../../server/services/property.service';
import PropertyFactory from '../factories/property.factory';
import { addEnquiry } from '../../server/services/enquiry.service';
import EnquiryFactory from '../factories/enquiry.factory';
import { addUser } from '../../server/services/user.service';
import UserFactory from '../factories/user.factory';
import { OFFER_STATUS, USER_ROLE } from '../../server/helpers/constants';
import { getTodaysDateShortCode } from '../../server/helpers/dates';

useDatabase();

describe('Offer Service', () => {
  const user = UserFactory.build({ role: USER_ROLE.USER }, { generateId: true });
  const vendor = UserFactory.build({ role: USER_ROLE.VENDOR }, { generateId: true });
  const admin = UserFactory.build({ role: USER_ROLE.ADMIN }, { generateId: true });

  beforeEach(async () => {
    await addUser(user);
    await addUser(vendor);
    await addUser(admin);
  });

  describe('#getOfferById', () => {
    const property = PropertyFactory.build(
      { addedBy: vendor._id, updatedBy: vendor._id },
      { generateId: true },
    );
    const enquiry = EnquiryFactory.build(
      { userId: user._id, propertyId: property._id },
      { generateId: true },
    );
    const offer = OfferFactory.build(
      { enquiryId: enquiry._id, vendorId: vendor._id },
      { generateId: true },
    );

    beforeEach(async () => {
      await addProperty(property);
      await addEnquiry(enquiry);
      await createOffer(offer);
    });

    it('returns a valid offer by Id', async () => {
      const offerInfo = await getOfferById(offer._id);
      expect(offerInfo._id).to.eql(offer._id);
    });
  });

  describe('#getPropertyInitials', () => {
    it('returns a valid offer by Id', async () => {
      const propertyname = 'Lekki ville estate';
      const initials = await getPropertyInitials(propertyname);
      expect(initials).to.eql('LVE');
    });
  });

  describe('#generateReferenceCode', () => {
    const user1 = UserFactory.build({ role: USER_ROLE.USER }, { generateId: true });
    const user2 = UserFactory.build({ role: USER_ROLE.USER }, { generateId: true });
    const property = PropertyFactory.build(
      {
        name: 'Lekki Ville Estate',
        houseType: 'Maisonette',
        addedBy: vendor._id,
        updatedBy: vendor._id,
      },
      { generateId: true },
    );
    const enquiry1 = EnquiryFactory.build(
      { userId: user1._id, propertyId: property._id },
      { generateId: true },
    );
    const enquiry2 = EnquiryFactory.build(
      { userId: user2._id, propertyId: property._id },
      { generateId: true },
    );
    const offer = OfferFactory.build(
      { enquiryId: enquiry1._id, vendorId: vendor._id },
      { generateId: true },
    );

    beforeEach(async () => {
      await addUser(user1);
      await addUser(user2);
      await addProperty(property);
      await addEnquiry(enquiry1);
      await addEnquiry(enquiry2);
    });

    context('when no property has been sold previously', () => {
      it('returns a valid offer by Id', async () => {
        const referenceCode = await generateReferenceCode(property._id);
        expect(referenceCode).to.eql(`HIG/LVE/OLM/01/${getTodaysDateShortCode()}`);
      });
    });

    context('when one property has been sold previously', () => {
      it('returns a valid offer by Id', async () => {
        await createOffer(offer);
        const referenceCode = await generateReferenceCode(property._id);
        expect(referenceCode).to.eql(`HIG/LVE/OLM/02/${getTodaysDateShortCode()}`);
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
    const property = PropertyFactory.build(
      { addedBy: vendor._id, updatedBy: vendor._id },
      { generateId: true },
    );
    const enquiry = EnquiryFactory.build(
      { userId: user._id, propertyId: property._id },
      { generateId: true },
    );
    const offer = OfferFactory.build(
      { enquiryId: enquiry._id, vendorId: vendor._id },
      { generateId: true },
    );

    beforeEach(async () => {
      await addProperty(property);
      await addEnquiry(enquiry);
      countedOffers = await Offer.countDocuments({});
    });

    context('when a valid offer is entered', () => {
      it('adds a new offer', async () => {
        const newOffer = await createOffer(offer);
        const currentCountedOffers = await Offer.countDocuments({});
        expect(currentCountedOffers).to.eql(countedOffers + 1);
        expect(newOffer.propertyId).to.eql(property._id);
        expect(newOffer.enquiryId).to.eql(enquiry._id);
        expect(newOffer.userId).to.eql(user._id);
        expect(newOffer.propertyInfo._id).to.eql(property._id);
        expect(newOffer.enquiryInfo._id).to.eql(enquiry._id);
        expect(newOffer.vendorInfo._id).to.eql(vendor._id);
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

  describe('#getAllOffers', () => {
    const user2 = UserFactory.build({ role: USER_ROLE.USER }, { generateId: true });
    const vendor2 = UserFactory.build({ role: USER_ROLE.VENDOR }, { generateId: true });

    const userProperties = PropertyFactory.buildList(
      10,
      { addedBy: vendor._id, updatedBy: vendor._id },
      { generateId: true },
    );

    const user2Properties = PropertyFactory.buildList(
      8,
      { addedBy: vendor2._id, updatedBy: vendor2._id },
      { generateId: true },
    );

    const userEnquiries = userProperties.map((_, index) =>
      EnquiryFactory.build(
        {
          propertyId: userProperties[index]._id,
          userId: user._id,
        },
        { generateId: true },
      ),
    );

    const user2Enquiries = user2Properties.map((_, index) =>
      EnquiryFactory.build(
        {
          propertyId: user2Properties[index]._id,
          userId: user2._id,
        },
        { generateId: true },
      ),
    );

    const userOffers = userProperties.map((_, index) =>
      OfferFactory.build(
        {
          propertyId: userProperties[index]._id,
          enquiryId: userEnquiries[index]._id,
          userId: user._id,
          vendorId: vendor._id,
          referenceCode: '123456XXX',
        },
        { generateId: true },
      ),
    );

    const user2Offers = user2Properties.map((_, index) =>
      OfferFactory.build(
        {
          propertyId: user2Properties[index]._id,
          enquiryId: user2Enquiries[index]._id,
          userId: user2._id,
          vendorId: vendor2._id,
          referenceCode: '123456XXX',
        },
        { generateId: true },
      ),
    );

    beforeEach(async () => {
      await addUser(user2);
      await addUser(vendor2);
      await Property.insertMany(userProperties);
      await Property.insertMany(user2Properties);
      await Enquiry.insertMany(userEnquiries);
      await Enquiry.insertMany(user2Enquiries);
      await Offer.insertMany(userOffers);
    });

    context('when user token is used', () => {
      it('returns 10 offers', async () => {
        const offers = await getAllOffers(user._id);
        expect(offers.pagination.currentPage).to.be.eql(1);
        expect(offers.pagination.total).to.be.eql(10);
        expect(offers.result.length).to.be.eql(10);
        expect(offers.result[0].userId).to.be.eql(user._id);
      });
    });

    context('when user2 token is used', () => {
      it('returns 0 offers', async () => {
        const offers = await getAllOffers(user2._id);
        expect(offers.pagination.currentPage).to.be.eql(1);
        expect(offers.pagination.total).to.be.eql(0);
        expect(offers.result.length).to.be.eql(0);
      });
    });

    context('when vendor token is used', () => {
      it('returns 10 offers', async () => {
        const vendorOffers = await getAllOffers(vendor._id);
        expect(vendorOffers.pagination.currentPage).to.be.eql(1);
        expect(vendorOffers.pagination.total).to.be.eql(10);
        expect(vendorOffers.result.length).to.be.eql(10);
        expect(vendorOffers.result[0].vendorId).to.be.eql(vendor._id);
      });
    });

    context('when vendor2 token is used', () => {
      it('returns 0 offers', async () => {
        const vendorOffers = await getAllOffers(vendor2._id);
        expect(vendorOffers.pagination.currentPage).to.be.eql(1);
        expect(vendorOffers.pagination.total).to.be.eql(0);
        expect(vendorOffers.result.length).to.be.eql(0);
      });
    });

    context('when admin token is used', () => {
      it('returns 10 offers', async () => {
        const vendorOffers = await getAllOffers(admin._id);
        expect(vendorOffers.pagination.currentPage).to.be.eql(1);
        expect(vendorOffers.pagination.total).to.be.eql(10);
        expect(vendorOffers.result.length).to.be.eql(10);
      });
    });

    context('when new offer is added', () => {
      beforeEach(async () => {
        await Offer.insertMany(user2Offers);
      });

      context('when user token is used', () => {
        it('returns 10 offers', async () => {
          const offers = await getAllOffers(user._id);
          expect(offers.pagination.currentPage).to.be.eql(1);
          expect(offers.pagination.total).to.be.eql(10);
          expect(offers.result.length).to.be.eql(10);
          expect(offers.result[0].userId).to.be.eql(user._id);
        });
      });

      context('when user2 token is used', () => {
        it('returns 0 offers', async () => {
          const offers = await getAllOffers(user2._id);
          expect(offers.pagination.currentPage).to.be.eql(1);
          expect(offers.pagination.total).to.be.eql(8);
          expect(offers.result.length).to.be.eql(8);
        });
      });

      context('when vendor token is used', () => {
        it('returns 10 offers', async () => {
          const vendorOffers = await getAllOffers(vendor._id);
          expect(vendorOffers.pagination.currentPage).to.be.eql(1);
          expect(vendorOffers.pagination.total).to.be.eql(10);
          expect(vendorOffers.result.length).to.be.eql(10);
          expect(vendorOffers.result[0].vendorId).to.be.eql(vendor._id);
        });
      });

      context('when vendor2 token is used', () => {
        it('returns 8 offers', async () => {
          const vendorOffers = await getAllOffers(vendor2._id);
          expect(vendorOffers.pagination.currentPage).to.be.eql(1);
          expect(vendorOffers.pagination.total).to.be.eql(8);
          expect(vendorOffers.result.length).to.be.eql(8);
          expect(vendorOffers.result[0].vendorId).to.be.eql(vendor2._id);
        });
      });

      context('when admin token is used', () => {
        it('returns 18 offers', async () => {
          const vendorOffers = await getAllOffers(admin._id);
          expect(vendorOffers.pagination.currentPage).to.be.eql(1);
          expect(vendorOffers.pagination.total).to.be.eql(18);
          expect(vendorOffers.result.length).to.be.eql(10);
        });
      });
    });
  });

  describe('#getOffer', () => {
    const property = PropertyFactory.build(
      { addedBy: vendor._id, updatedBy: vendor._id },
      { generateId: true },
    );
    const enquiry = EnquiryFactory.build(
      { userId: user._id, propertyId: property._id },
      { generateId: true },
    );
    const offer = OfferFactory.build(
      { enquiryId: enquiry._id, vendorId: vendor._id },
      { generateId: true },
    );

    beforeEach(async () => {
      await addProperty(property);
      await addEnquiry(enquiry);
      await createOffer(offer);
    });

    context('when offer exists', () => {
      it('returns a valid offer', async () => {
        const gottenOffer = await getOffer(offer._id);
        expect(gottenOffer[0]._id).to.eql(offer._id);
        expect(gottenOffer[0].propertyId).to.eql(property._id);
        expect(gottenOffer[0].enquiryId).to.eql(enquiry._id);
        expect(gottenOffer[0].userId).to.eql(user._id);
        expect(gottenOffer[0].propertyInfo._id).to.eql(property._id);
        expect(gottenOffer[0].enquiryInfo._id).to.eql(enquiry._id);
        expect(gottenOffer[0].vendorInfo._id).to.eql(vendor._id);
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
    const user1 = UserFactory.build({ role: USER_ROLE.USER }, { generateId: true });
    const user2 = UserFactory.build({ role: USER_ROLE.USER }, { generateId: true });
    const property = PropertyFactory.build(
      {
        addedBy: vendor._id,
        updatedBy: vendor._id,
        price: 20000000,
      },
      { generateId: true },
    );
    const enquiry1 = EnquiryFactory.build(
      { userId: user1._id, propertyId: property._id },
      { generateId: true },
    );
    const enquiry2 = EnquiryFactory.build(
      { userId: user2._id, propertyId: property._id },
      { generateId: true },
    );
    const offer1 = OfferFactory.build(
      {
        enquiryId: enquiry1._id,
        vendorId: vendor._id,
        totalAmountPayable: 18000000,
      },
      { generateId: true },
    );
    const offer2 = OfferFactory.build(
      {
        enquiryId: enquiry2._id,
        vendorId: vendor._id,
        totalAmountPayable: 28000000,
      },
      { generateId: true },
    );
    const toAcceptValid = {
      offerId: offer1._id,
      signature: 'http://www.ballers.ng/signature.png',
      userId: user1._id,
    };
    const toAcceptInvalid = {
      offerId: offer2._id,
      signature: 'http://www.ballers.ng/signature.png',
      userId: user2._id,
    };

    beforeEach(async () => {
      await addUser(user1);
      await addUser(user2);
      await addProperty(property);
      await addEnquiry(enquiry1);
      await addEnquiry(enquiry2);
      await createOffer(offer1);
      await createOffer(offer2);
    });

    context('when all is valid', () => {
      it('returns a valid accepted offer', async () => {
        const acceptedOffer = await acceptOffer(toAcceptValid);
        expect(acceptedOffer[0].status).to.eql('Interested');
        expect(acceptedOffer[0].contributionReward).to.eql(2000000);
        expect(acceptedOffer[0].signature).to.eql(toAcceptValid.signature);
      });
    });

    context('when offer price is higher than property price', () => {
      it('returns a valid accepted offer', async () => {
        const acceptedOffer = await acceptOffer(toAcceptInvalid);
        expect(acceptedOffer[0].status).to.eql('Interested');
        expect(acceptedOffer[0].contributionReward).to.eql(0);
        expect(acceptedOffer[0].signature).to.eql(toAcceptInvalid.signature);
      });
    });
  });

  describe('#assignOffer', () => {
    const property = PropertyFactory.build(
      { addedBy: vendor._id, updatedBy: vendor._id },
      { generateId: true },
    );
    const enquiry = EnquiryFactory.build(
      { userId: user._id, propertyId: property._id },
      { generateId: true },
    );
    const offer = OfferFactory.build(
      {
        enquiryId: enquiry._id,
        vendorId: vendor._id,
        status: OFFER_STATUS.INTERESTED,
      },
      { generateId: true },
    );

    beforeEach(async () => {
      await addProperty(property);
      await addEnquiry(enquiry);
      await createOffer(offer);
    });

    context('when all is valid', () => {
      it('returns a valid assigned offer', async () => {
        const assignedOffer = await assignOffer(offer._id);
        expect(assignedOffer[0].status).to.eql('Assigned');
      });
    });

    context('when getOfferById fails', () => {
      it('throws an error', async () => {
        sinon.stub(Offer, 'findById').throws(new Error('error msg'));
        try {
          await assignOffer(offer._id);
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
    const property = PropertyFactory.build(
      { addedBy: vendor._id, updatedBy: vendor._id },
      { generateId: true },
    );
    const enquiry = EnquiryFactory.build(
      { userId: user._id, propertyId: property._id },
      { generateId: true },
    );
    const offer = OfferFactory.build(
      { enquiryId: enquiry._id, vendorId: vendor._id },
      { generateId: true },
    );

    beforeEach(async () => {
      await addProperty(property);
      await addEnquiry(enquiry);
      await createOffer(offer);
    });

    context('when all is valid', () => {
      it('returns a valid cancelled offer', async () => {
        const rejectedOffer = await cancelOffer({ offerId: offer._id, vendorId: vendor._id });
        expect(rejectedOffer.status).to.eql('Cancelled');
      });
    });

    context('when getOfferById fails', () => {
      it('throws an error', async () => {
        sinon.stub(Offer, 'findById').throws(new Error('error msg'));
        try {
          await cancelOffer({ offerId: offer._id, vendorId: vendor._id });
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
    const allOfferStatus = Object.keys(OFFER_STATUS);
    const properties = allOfferStatus.map(() =>
      PropertyFactory.build(
        {
          addedBy: vendor._id,
          updatedBy: vendor._id,
        },
        { generateId: true },
      ),
    );

    const enquiries = allOfferStatus.map((_, index) =>
      EnquiryFactory.build(
        {
          propertyId: properties[index]._id,
          userId: user._id,
        },
        { generateId: true },
      ),
    );

    const offers = allOfferStatus.map((_, index) =>
      OfferFactory.build(
        {
          // userId: user._id,
          // propertyId: properties[index]._id,
          enquiryId: enquiries[index]._id,
          vendorId: vendor._id,
          status: OFFER_STATUS[allOfferStatus[index]],
        },
        { generateId: true },
      ),
    );

    beforeEach(async () => {
      await Property.insertMany(properties);
      await Enquiry.insertMany(enquiries);
      await createOffer(offers[2]);
      await createOffer(offers[3]);
      await createOffer(offers[4]);
    });

    context('when offers added are valid', () => {
      it('returns 2 offers', async () => {
        const validOffers = await getActiveOffers(user._id);
        expect(validOffers).to.be.an('array');
        expect(validOffers.length).to.be.eql(2);
      });
    });
    context('when new enquiry is added', () => {
      it('returns 3 enquiries', async () => {
        await createOffer(offers[1]);
        await createOffer(offers[5]);
        const validOffers = await getActiveOffers(user._id);
        expect(validOffers).to.be.an('array');
        expect(validOffers.length).to.be.eql(3);
      });
    });
  });
});
