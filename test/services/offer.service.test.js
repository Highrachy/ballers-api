import mongoose from 'mongoose';
import { expect, sinon } from '../config';
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
  generatePaymentSchedules,
  reactivateOffer,
} from '../../server/services/offer.service';
import OfferFactory from '../factories/offer.factory';
import { addProperty } from '../../server/services/property.service';
import PropertyFactory from '../factories/property.factory';
import { addEnquiry } from '../../server/services/enquiry.service';
import EnquiryFactory from '../factories/enquiry.factory';
import { addUser } from '../../server/services/user.service';
import UserFactory from '../factories/user.factory';
import {
  OFFER_STATUS,
  USER_ROLE,
  REWARD_STATUS,
  REFERRAL_STATUS,
} from '../../server/helpers/constants';
import { getTodaysDateShortCode } from '../../server/helpers/dates';
import { futureDate, expectNewNotificationToBeAdded } from '../helpers';
import NOTIFICATIONS from '../../server/helpers/notifications';
import { getFormattedName } from '../../server/helpers/funtions';
import ReferralFactory from '../factories/referral.factory';
import { addReferral } from '../../server/services/referral.service';
import Referral from '../../server/models/referral.model';

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
    const property = PropertyFactory.build({ addedBy: vendor._id }, { generateId: true });
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
  });

  describe('#createOffer', () => {
    let countedOffers;
    const property = PropertyFactory.build({ addedBy: vendor._id }, { generateId: true });
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

      context('when new notification is added', () => {
        beforeEach(async () => {
          await createOffer(offer);
        });
        const description = `You have received an offer for ${getFormattedName(property.name)}`;
        expectNewNotificationToBeAdded(NOTIFICATIONS.OFFER_CREATED, user._id, {
          description,
          actionId: offer._id,
        });
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
      7,
      { addedBy: vendor._id },
      { generateId: true },
    );

    const user2Properties = PropertyFactory.buildList(
      8,
      { addedBy: vendor2._id },
      { generateId: true },
    );

    const userEnquiries = userProperties.map((_, index) =>
      EnquiryFactory.build(
        {
          propertyId: userProperties[index]._id,
          vendorId: userProperties[index].addedBy,
          userId: user._id,
        },
        { generateId: true },
      ),
    );

    const user2Enquiries = user2Properties.map((_, index) =>
      EnquiryFactory.build(
        {
          propertyId: user2Properties[index]._id,
          vendorId: user2Properties[index].addedBy,
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
      it('returns 7 offers', async () => {
        const offers = await getAllOffers(user._id);
        expect(offers.pagination.currentPage).to.be.eql(1);
        expect(offers.pagination.total).to.be.eql(7);
        expect(offers.result.length).to.be.eql(7);
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
      it('returns 7 offers', async () => {
        const vendorOffers = await getAllOffers(vendor._id);
        expect(vendorOffers.pagination.currentPage).to.be.eql(1);
        expect(vendorOffers.pagination.total).to.be.eql(7);
        expect(vendorOffers.result.length).to.be.eql(7);
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
      it('returns 7 offers', async () => {
        const vendorOffers = await getAllOffers(admin._id);
        expect(vendorOffers.pagination.currentPage).to.be.eql(1);
        expect(vendorOffers.pagination.total).to.be.eql(7);
        expect(vendorOffers.result.length).to.be.eql(7);
      });
    });

    context('when new offer is added', () => {
      beforeEach(async () => {
        await Offer.insertMany(user2Offers);
      });

      context('when user token is used', () => {
        it('returns 7 offers', async () => {
          const offers = await getAllOffers(user._id);
          expect(offers.pagination.currentPage).to.be.eql(1);
          expect(offers.pagination.total).to.be.eql(7);
          expect(offers.result.length).to.be.eql(7);
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
        it('returns 7 offers', async () => {
          const vendorOffers = await getAllOffers(vendor._id);
          expect(vendorOffers.pagination.currentPage).to.be.eql(1);
          expect(vendorOffers.pagination.total).to.be.eql(7);
          expect(vendorOffers.result.length).to.be.eql(7);
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
          expect(vendorOffers.pagination.total).to.be.eql(15);
          expect(vendorOffers.result.length).to.be.eql(10);
        });
      });
    });
  });

  describe('#getOffer', () => {
    const property = PropertyFactory.build({ addedBy: vendor._id }, { generateId: true });
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
        const gottenOffer = await getOffer(offer._id, vendor);
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
        const gottenOffer = await getOffer(invalidOfferId, vendor);
        expect(gottenOffer.length).to.eql(0);
      });
    });
  });

  describe('#acceptOffer', () => {
    const user1 = UserFactory.build({ role: USER_ROLE.USER }, { generateId: true });
    const user2 = UserFactory.build({ role: USER_ROLE.USER }, { generateId: true });
    const property = PropertyFactory.build(
      { addedBy: vendor._id, price: 20000000 },
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
        totalAmountPayable: 18_000_000,
      },
      { generateId: true },
    );
    const offer2 = OfferFactory.build(
      {
        enquiryId: enquiry2._id,
        vendorId: vendor._id,
        totalAmountPayable: 28_000_000,
      },
      { generateId: true },
    );
    const toAcceptValid = {
      offerId: offer1._id,
      signature: 'http://www.ballers.ng/signature.png',
      user: user1,
    };
    const toAcceptInvalid = {
      offerId: offer2._id,
      signature: 'http://www.ballers.ng/signature.png',
      user: user2,
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

    describe('when user is not referred', () => {
      context('when all is valid', () => {
        it('returns a valid accepted offer', async () => {
          const acceptedOffer = await acceptOffer(toAcceptValid);
          expect(acceptedOffer.status).to.eql('Interested');
          expect(acceptedOffer.contributionReward).to.eql(2_000_000);
          expect(acceptedOffer.signature).to.eql(toAcceptValid.signature);
        });

        context('when new notification is added', () => {
          beforeEach(async () => {
            await acceptOffer(toAcceptValid);
          });
          const descriptionVendor = `Your offer for ${getFormattedName(
            property.name,
          )} has been accepted`;
          expectNewNotificationToBeAdded(NOTIFICATIONS.OFFER_RESPONSE_VENDOR, vendor._id, {
            description: descriptionVendor,
            actionId: offer1._id,
          });

          const descriptionUser = `Congratulations on signing your offer for ${getFormattedName(
            property.name,
          )}`;
          expectNewNotificationToBeAdded(NOTIFICATIONS.OFFER_RESPONSE_USER, user1._id, {
            description: descriptionUser,
            actionId: offer1._id,
          });
        });
      });

      context('when offer price is higher than property price', () => {
        it('returns a valid accepted offer', async () => {
          const acceptedOffer = await acceptOffer(toAcceptInvalid);
          expect(acceptedOffer.status).to.eql('Interested');
          expect(acceptedOffer.contributionReward).to.eql(0);
          expect(acceptedOffer.signature).to.eql(toAcceptInvalid.signature);
        });
      });
    });

    describe('when user was referred', () => {
      const referral = ReferralFactory.build(
        {
          referrerId: user2._id,
          userId: user1._id,
          status: REFERRAL_STATUS.REGISTERED,
          'reward.status': REWARD_STATUS.PENDING,
        },
        { generateId: true },
      );

      beforeEach(async () => {
        await addReferral(referral);
      });

      context('when the reward status is pending', () => {
        it('returns a valid accepted offer', async () => {
          const acceptedOffer = await acceptOffer(toAcceptValid);
          const updatedReferral = await Referral.findById(referral._id).select();
          expect(acceptedOffer.status).to.eql('Interested');
          expect(acceptedOffer.contributionReward).to.eql(2_000_000);
          expect(acceptedOffer.signature).to.eql(toAcceptValid.signature);
          expect(updatedReferral.userId).to.eql(user1._id);
          expect(updatedReferral.referrerId).to.eql(user2._id);
          expect(updatedReferral.offerId).to.eql(offer1._id);
          expect(updatedReferral.reward.status).to.eql(REWARD_STATUS.STARTED);
          expect(updatedReferral.reward.amount).to.eql(270_000);
        });
      });

      context('when the reward status has started', () => {
        const startedReferralStatuses = Object.keys(REWARD_STATUS).filter(
          (reward) => reward !== 'PENDING',
        );

        startedReferralStatuses.map((status) =>
          context(`when the reward status is ${REWARD_STATUS[status]}`, () => {
            beforeEach(async () => {
              await Referral.findByIdAndUpdate(referral._id, {
                $set: { 'reward.status': REWARD_STATUS[status] },
              });
            });

            it('does not update referral', async () => {
              const acceptedOffer = await acceptOffer(toAcceptValid);
              const updatedReferral = await Referral.findById(referral._id).select();
              expect(acceptedOffer.status).to.eql('Interested');
              expect(acceptedOffer.contributionReward).to.eql(2_000_000);
              expect(acceptedOffer.signature).to.eql(toAcceptValid.signature);
              expect(updatedReferral.userId).to.eql(user1._id);
              expect(updatedReferral.referrerId).to.eql(user2._id);
              expect(updatedReferral.reward.status).to.eql(REWARD_STATUS[status]);
              expect(updatedReferral.reward.amount).to.eql(0);
              expect(updatedReferral.offerId).to.not.eql(offer1._id);
            });
          }),
        );
      });

      describe('when referral status is not registered', () => {
        const referralStatuses = Object.keys(REFERRAL_STATUS).filter(
          (reward) => reward !== 'REGISTERED',
        );

        referralStatuses.map((status) =>
          context(`when the referral is ${REFERRAL_STATUS[status]}`, () => {
            beforeEach(async () => {
              await Referral.findByIdAndUpdate(referral._id, {
                $set: { status: REFERRAL_STATUS[status] },
              });
            });

            it('does not update referral', async () => {
              const acceptedOffer = await acceptOffer(toAcceptValid);
              const updatedReferral = await Referral.findById(referral._id).select();
              expect(acceptedOffer.status).to.eql('Interested');
              expect(acceptedOffer.contributionReward).to.eql(2_000_000);
              expect(acceptedOffer.signature).to.eql(toAcceptValid.signature);
              expect(updatedReferral.userId).to.eql(user1._id);
              expect(updatedReferral.referrerId).to.eql(user2._id);
              expect(updatedReferral.status).to.eql(REFERRAL_STATUS[status]);
              expect(updatedReferral.reward.amount).to.eql(0);
              expect(updatedReferral.offerId).to.not.eql(offer1._id);
            });
          }),
        );
      });
    });
  });

  describe('#assignOffer', () => {
    const property = PropertyFactory.build({ addedBy: vendor._id }, { generateId: true });
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
        const assignedOffer = await assignOffer(offer._id, vendor);
        expect(assignedOffer[0].status).to.eql('Assigned');
      });
    });

    context('when getOfferById fails', () => {
      it('throws an error', async () => {
        sinon.stub(Offer, 'findById').throws(new Error('error msg'));
        try {
          await assignOffer(offer._id, vendor);
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
    const property = PropertyFactory.build({ addedBy: vendor._id }, { generateId: true });
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
      PropertyFactory.build({ addedBy: vendor._id }, { generateId: true }),
    );

    const enquiries = allOfferStatus.map((_, index) =>
      EnquiryFactory.build(
        {
          propertyId: properties[index]._id,
          vendorId: properties[index].addedBy,
          userId: user._id,
        },
        { generateId: true },
      ),
    );

    const offers = allOfferStatus.map((_, index) =>
      OfferFactory.build(
        {
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

  describe('#generatePaymentSchedules', () => {
    context('when totalAmountPayable is greater than initial payment', () => {
      const offer = OfferFactory.build(
        {
          totalAmountPayable: 100000,
          initialPayment: 50000,
          periodicPayment: 10000,
          paymentFrequency: 30,
          initialPaymentDate: new Date('2021-03-01'),
        },
        { generateId: true },
      );
      it('returns a valid accepted offer', async () => {
        const paymentDates = generatePaymentSchedules(offer);
        expect(paymentDates.length).to.eql(6);
        expect(paymentDates[0].amount).to.eql(50000);
        expect(paymentDates[1].amount).to.eql(10000);
        expect(paymentDates[2].amount).to.eql(10000);
        expect(paymentDates[3].amount).to.eql(10000);
        expect(paymentDates[4].amount).to.eql(10000);
        expect(paymentDates[5].amount).to.eql(10000);
        expect(paymentDates[0].date).to.eql(new Date('2021-03-01'));
        expect(paymentDates[1].date).to.eql(new Date('2021-03-31'));
        expect(paymentDates[2].date).to.eql(new Date('2021-04-30'));
        expect(paymentDates[3].date).to.eql(new Date('2021-05-30'));
        expect(paymentDates[4].date).to.eql(new Date('2021-06-29'));
        expect(paymentDates[5].date).to.eql(new Date('2021-07-29'));
      });
    });

    context('when totalAmountPayable is equal to initial payment', () => {
      const offer = OfferFactory.build(
        {
          totalAmountPayable: 100000,
          initialPayment: 100000,
          periodicPayment: 10000,
          paymentFrequency: 30,
          initialPaymentDate: new Date('2021-03-01'),
        },
        { generateId: true },
      );
      it('returns a valid accepted offer', async () => {
        const paymentDates = generatePaymentSchedules(offer);
        expect(paymentDates.length).to.eql(1);
        expect(paymentDates[0].amount).to.eql(100000);
        expect(paymentDates[0].date).to.eql(new Date('2021-03-01'));
      });
    });

    context('when  totalAmountPayable is slightly bigger than initial payment', () => {
      const offer = OfferFactory.build(
        {
          totalAmountPayable: 100000,
          initialPayment: 75000,
          periodicPayment: 10000,
          paymentFrequency: 14,
          initialPaymentDate: new Date('2021-03-01'),
        },
        { generateId: true },
      );
      it('returns a valid accepted offer', async () => {
        const paymentDates = generatePaymentSchedules(offer);
        expect(paymentDates.length).to.eql(4);
        expect(paymentDates[0].amount).to.eql(75000);
        expect(paymentDates[1].amount).to.eql(10000);
        expect(paymentDates[2].amount).to.eql(10000);
        expect(paymentDates[3].amount).to.eql(5000);
        expect(paymentDates[0].date).to.eql(new Date('2021-03-01'));
        expect(paymentDates[1].date).to.eql(new Date('2021-03-15'));
        expect(paymentDates[2].date).to.eql(new Date('2021-03-29'));
        expect(paymentDates[3].date).to.eql(new Date('2021-04-12'));
      });
    });
  });

  describe('#reactivateOffer', () => {
    const property = PropertyFactory.build({ addedBy: vendor._id }, { generateId: true });
    const enquiry = EnquiryFactory.build(
      { userId: user._id, propertyId: property._id },
      { generateId: true },
    );
    const offer = OfferFactory.build(
      { enquiryId: enquiry._id, vendorId: vendor._id, expires: '2020-12-11T00:00:00.000+00:00' },
      { generateId: true },
    );

    const offerInfo = {
      offerId: offer._id,
      initialPaymentDate: futureDate,
      expires: futureDate,
      vendorId: vendor._id,
    };

    beforeEach(async () => {
      await addProperty(property);
      await addEnquiry(enquiry);
      await createOffer(offer);
    });

    context('when offer is valid', () => {
      it('returns reactivated offer', async () => {
        const reactivatedOffer = await reactivateOffer(offerInfo);
        const oldOffer = await getOfferById(offer._id);
        expect(oldOffer.status).to.eql(OFFER_STATUS.REACTIVATED);
        expect(oldOffer._id).to.eql(offer._id);
        expect(reactivatedOffer._id).to.not.equal(offer._id);
        expect(reactivatedOffer.propertyId).to.eql(property._id);
        expect(reactivatedOffer.enquiryId).to.eql(enquiry._id);
        expect(reactivatedOffer.status).to.eql(OFFER_STATUS.GENERATED);
      });

      context('when new notification is added', () => {
        beforeEach(async () => {
          await reactivateOffer(offerInfo);
        });
        const description = `Your offer for ${getFormattedName(
          property.name,
        )} has been reactivated`;
        expectNewNotificationToBeAdded(NOTIFICATIONS.OFFER_REACTIVATED, user._id, {
          description,
          actionId: offer._id,
        });
      });
    });
  });
});
