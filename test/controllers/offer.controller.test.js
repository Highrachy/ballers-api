import mongoose from 'mongoose';
import querystring from 'querystring';
import { expect, request, sinon } from '../config';
import Offer from '../../server/models/offer.model';
import Enquiry from '../../server/models/enquiry.model';
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
import {
  itReturnsForbiddenForNoToken,
  itReturnsForbiddenForTokenWithInvalidAccess,
  itReturnsNotFoundForInvalidToken,
  itReturnsErrorForEmptyFields,
  itReturnsTheRightPaginationValue,
  itReturnsEmptyValuesWhenNoItemExistInDatabase,
  itReturnsErrorForUnverifiedVendor,
  expectResponseToExcludeSensitiveUserData,
  expectResponseToContainNecessaryVendorData,
  expectsPaginationToReturnTheRightValues,
  defaultPaginationResult,
  futureDate,
  filterTestForSingleParameter,
  itReturnsNoResultWhenNoFilterParameterIsMatched,
  itReturnAllResultsWhenAnUnknownFilterIsUsed,
} from '../helpers';
import Property from '../../server/models/property.model';
import AddressFactory from '../factories/address.factory';
import VendorFactory from '../factories/vendor.factory';
import { OFFER_FILTERS } from '../../server/helpers/filters';
import NextPayment from '../../server/models/nextPayment.model';

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
    address: AddressFactory.build(),
    vendor: VendorFactory.build({
      directors: [
        {
          name: 'John Doe',
          isSignatory: true,
          signature: 'signature.jpg',
          phone: '08012345678',
        },
      ],
    }),
  },
  { generateId: true },
);

const testUser = UserFactory.build({ role: USER_ROLE.USER, activated: true }, { generateId: true });
const testVendor = UserFactory.build(
  {
    role: USER_ROLE.VENDOR,
    activated: true,
    vendor: { verified: true },
  },
  { generateId: true },
);

const properties = PropertyFactory.buildList(18, { addedBy: vendorUser._id }, { generateId: true });

describe('Offer Controller', () => {
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
      await addProperty(properties[0]);
      await addProperty(properties[1]);
      await addProperty(properties[2]);
    });

    describe('Create Offer Route', () => {
      const endpoint = '/api/v1/offer/create';
      const method = 'post';

      const newProperty = PropertyFactory.build(
        {
          name: 'Lekki Ville Estate',
          houseType: 'Maisonette',
          addedBy: vendorUser._id,
        },
        { generateId: true },
      );

      const enquiry = EnquiryFactory.build(
        {
          userId: regularUser._id,
          propertyId: newProperty._id,
        },
        { generateId: true },
      );

      beforeEach(async () => {
        await addProperty(newProperty);
        await addEnquiry(enquiry);
      });

      context('with valid data', () => {
        it('returns successful offer', (done) => {
          const offer = OfferFactory.build({ enquiryId: enquiry._id });
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
              expect(res.body.offer.propertyInfo._id).to.be.eql(newProperty._id.toString());
              expect(res.body.offer.referenceCode).to.be.eql(
                `HIG/LVE/OLM/01/${getTodaysDateShortCode()}`,
              );
              done();
            });
        });
      });

      itReturnsNotFoundForInvalidToken({
        endpoint,
        method,
        user: testVendor,
        userId: testVendor._id,
        data: OfferFactory.build({ enquiryId: enquiry._id }),
      });

      itReturnsForbiddenForTokenWithInvalidAccess({ endpoint, method, user: testUser });
      itReturnsForbiddenForNoToken({ endpoint, method });

      itReturnsErrorForUnverifiedVendor({
        endpoint,
        method,
        user: vendorUser,
        useExistingUser: true,
      });

      context('with invalid data', () => {
        const invalidEmptyData = {
          enquiryId: '"Enquiry ID" is not allowed to be empty',
          handOverDate: '"Handover Date" must be a valid date',
          deliveryState: '"Delivery State" is not allowed to be empty',
          totalAmountPayable: '"Total Amount Payable" must be a number',
          allocationInPercentage: '"Allocation In Percentage" must be a number',
          title: '"Title" is not allowed to be empty',
          expires: '"Expiry Date" must be a valid date',
          initialPayment: '"Initial Payment" must be a number',
          periodicPayment: '"Periodic Payment" must be a number',
          paymentFrequency: '"Payment Frequency" must be a number',
        };

        itReturnsErrorForEmptyFields({
          endpoint,
          method,
          user: testVendor,
          data: invalidEmptyData,
          factory: OfferFactory,
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
      });
    });

    describe('Accept Offer', () => {
      const endpoint = '/api/v1/offer/accept';
      const method = 'put';

      const enquiry = EnquiryFactory.build(
        {
          userId: regularUser._id,
          propertyId: properties[0]._id,
        },
        { generateId: true },
      );
      const offer = OfferFactory.build(
        {
          enquiryId: enquiry._id,
          vendorId: vendorUser._id,
          totalAmountPayable: 100000,
          initialPayment: 50000,
          periodicPayment: 10000,
          paymentFrequency: 30,
          initialPaymentDate: new Date('2021-03-01'),
        },
        { generateId: true },
      );
      const acceptanceInfo = {
        offerId: offer._id,
        signature: 'http://ballers.ng/signature.png',
      };

      context('when offer is valid', () => {
        beforeEach(async () => {
          await addEnquiry(enquiry);
          await createOffer(offer);
        });

        context('with valid data & token', () => {
          it('returns accepted offer', (done) => {
            request()
              .put(endpoint)
              .set('authorization', userToken)
              .send(acceptanceInfo)
              .end((err, res) => {
                expect(res).to.have.status(200);
                expect(res.body.success).to.be.eql(true);
                expect(res.body.message).to.be.eql('Offer accepted');
                expect(res.body).to.have.property('offer');
                expect(res.body.offer._id).to.be.eql(offer._id.toString());
                expect(res.body.offer.status).to.be.eql('Interested');
                expect(res.body.offer.signature).to.be.eql(acceptanceInfo.signature);
                expect(res.body.offer.enquiryInfo._id).to.be.eql(enquiry._id.toString());
                expect(res.body.offer.propertyInfo._id).to.be.eql(properties[0]._id.toString());
                expect(res.body.offer.paymentSchedule.length).to.be.eql(6);
                expect(res.body.offer.paymentSchedule[0].amount).to.be.eql(offer.initialPayment);
                expect(res.body.offer.paymentSchedule[0].date).to.be.eql(
                  '2021-03-01T00:00:00.000Z',
                );
                expect(res.body.offer.paymentSchedule[1].amount).to.be.eql(offer.periodicPayment);
                expect(res.body.offer.paymentSchedule[1].date).to.be.eql(
                  '2021-03-31T00:00:00.000Z',
                );
                expect(sendMailStub.callCount).to.eq(2);
                expect(sendMailStub).to.have.be.calledWith(EMAIL_CONTENT.OFFER_RESPONSE_VENDOR);
                expect(sendMailStub).to.have.be.calledWith(EMAIL_CONTENT.OFFER_RESPONSE_USER);
                done();
              });
          });
        });

        context('when next payment fails to save', () => {
          it('returns the error', (done) => {
            sinon.stub(NextPayment.prototype, 'save').throws(new Error('Type Error'));
            request()
              .put(endpoint)
              .set('authorization', userToken)
              .send(acceptanceInfo)
              .end((err, res) => {
                expect(res).to.have.status(400);
                expect(res.body.success).to.be.eql(false);
                expect(res.body.error.message).to.be.eql('Error adding next payment');
                expect(sendMailStub.callCount).to.eq(0);
                done();
                NextPayment.prototype.save.restore();
              });
          });
        });

        context('when offer is accepted by another user ', () => {
          it('returns error', (done) => {
            request()
              .put(endpoint)
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

        context('when offer id is invalid', () => {
          it('returns error', (done) => {
            request()
              .put(endpoint)
              .set('authorization', adminToken)
              .send({ ...acceptanceInfo, offerId: mongoose.Types.ObjectId() })
              .end((err, res) => {
                expect(res).to.have.status(412);
                expect(res.body.success).to.be.eql(false);
                expect(res.body.message).to.be.eql('Invalid offer');
                expect(sendMailStub.callCount).to.eq(0);
                done();
              });
          });
        });

        itReturnsForbiddenForNoToken({ endpoint, method, data: acceptanceInfo });

        context('when accept service returns an error', () => {
          it('returns the error', (done) => {
            sinon.stub(Offer, 'findByIdAndUpdate').throws(new Error('Type Error'));
            request()
              .put(endpoint)
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
                .put(endpoint)
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
              const invalidData = { offerId: offer._id, signature: '' };
              request()
                .put(endpoint)
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

      context('when offer is expired', () => {
        const expiredOffer = OfferFactory.build(
          { enquiryId: enquiry._id, vendorId: vendorUser._id, expires: '2003-10-11' },
          { generateId: true },
        );
        beforeEach(async () => {
          await addEnquiry(enquiry);
          await createOffer(expiredOffer);
        });

        it('returns an error', (done) => {
          const invalidData = {
            offerId: expiredOffer._id,
            signature: 'http://ballers.ng/signature.png',
          };
          request()
            .put(endpoint)
            .set('authorization', userToken)
            .send(invalidData)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Offer has expired');
              expect(sendMailStub.callCount).to.eq(0);
              done();
            });
        });
      });
    });

    describe('Assign Offer', () => {
      const endpoint = '/api/v1/offer/assign';
      const method = 'put';

      const enquiry = EnquiryFactory.build(
        {
          userId: regularUser._id,
          propertyId: properties[0]._id,
        },
        { generateId: true },
      );
      const offer = OfferFactory.build(
        {
          enquiryId: enquiry._id,
          vendorId: vendorUser._id,
          status: OFFER_STATUS.INTERESTED,
        },
        { generateId: true },
      );
      const toAssignDetails = {
        offerId: offer._id,
      };

      beforeEach(async () => {
        await addEnquiry(enquiry);
        await createOffer(offer);
      });

      itReturnsErrorForUnverifiedVendor({
        endpoint,
        method,
        user: vendorUser,
        useExistingUser: true,
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
              expect(res.body.offer._id).to.be.eql(offer._id.toString());
              expect(res.body.offer.status).to.be.eql('Assigned');
              expect(res.body.offer.signature).to.be.eql(toAssignDetails.signature);
              expect(res.body.offer.vendorInfo._id).to.be.eql(vendorUser._id.toString());
              expect(res.body.offer.enquiryInfo._id).to.be.eql(enquiry._id.toString());
              expect(res.body.offer.propertyInfo._id).to.be.eql(properties[0]._id.toString());
              done();
            });
        });
      });

      itReturnsForbiddenForNoToken({ endpoint, method, data: toAssignDetails });

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
      const endpoint = '/api/v1/offer/cancel';
      const method = 'put';
      let unauthorizedVendorToken;
      const unauthorizedVendor = UserFactory.build(
        {
          role: USER_ROLE.VENDOR,
          activated: true,
        },
        { generateId: true },
      );
      const enquiry1 = EnquiryFactory.build(
        {
          userId: regularUser._id,
          propertyId: properties[0]._id,
        },
        { generateId: true },
      );
      const offer1 = OfferFactory.build(
        {
          enquiryId: enquiry1._id,
          vendorId: vendorUser._id,
        },
        { generateId: true },
      );
      const toCancelDetails = {
        offerId: offer1._id,
      };

      const enquiry2 = EnquiryFactory.build(
        {
          userId: regularUser._id,
          propertyId: properties[1]._id,
        },
        { generateId: true },
      );
      const offer2 = OfferFactory.build(
        {
          enquiryId: enquiry2._id,
          vendorId: vendorUser._id,
          status: OFFER_STATUS.INTERESTED,
        },
        { generateId: true },
      );

      const enquiry3 = EnquiryFactory.build(
        {
          userId: regularUser._id,
          propertyId: properties[2]._id,
        },
        { generateId: true },
      );
      const offer3 = OfferFactory.build(
        {
          enquiryId: enquiry3._id,
          vendorId: vendorUser._id,
          status: OFFER_STATUS.ASSIGNED,
        },
        { generateId: true },
      );

      const enquiry4 = EnquiryFactory.build(
        {
          userId: adminUser._id,
          propertyId: properties[2]._id,
        },
        { generateId: true },
      );
      const offer4 = OfferFactory.build(
        {
          enquiryId: enquiry4._id,
          vendorId: vendorUser._id,
          status: OFFER_STATUS.ALLOCATED,
        },
        { generateId: true },
      );

      const enquiry5 = EnquiryFactory.build(
        {
          userId: adminUser._id,
          propertyId: properties[0]._id,
        },
        { generateId: true },
      );
      const offer5 = OfferFactory.build(
        {
          enquiryId: enquiry5._id,
          vendorId: vendorUser._id,
          status: OFFER_STATUS.REJECTED,
        },
        { generateId: true },
      );

      const enquiry6 = EnquiryFactory.build(
        {
          userId: adminUser._id,
          propertyId: properties[1]._id,
        },
        { generateId: true },
      );
      const offer6 = OfferFactory.build(
        {
          enquiryId: enquiry6._id,
          vendorId: vendorUser._id,
          status: OFFER_STATUS.CANCELLED,
        },
        { generateId: true },
      );

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
              const enquiry = await getEnquiryById(enquiry1._id);
              expect(enquiry.approved).to.be.eql(false);
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body.message).to.be.eql('Offer cancelled');
              done();
            });
        });
      });

      itReturnsErrorForUnverifiedVendor({
        endpoint,
        method,
        user: vendorUser,
        useExistingUser: true,
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
            .send({ offerId: offer2._id })
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
            .send({ offerId: offer3._id })
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
            .send({ offerId: offer4._id })
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
            .send({ offerId: offer5._id })
            .end(async (err, res) => {
              const enquiry = await getEnquiryById(enquiry5._id);
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
            .send({ offerId: offer6._id })
            .end(async (err, res) => {
              const enquiry = await getEnquiryById(enquiry6._id);
              expect(enquiry.approved).to.be.eql(false);
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body.message).to.be.eql('Offer cancelled');
              done();
            });
        });
      });

      itReturnsForbiddenForNoToken({ endpoint, method });

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

    describe('Get one offer', () => {
      const enquiry = EnquiryFactory.build(
        {
          userId: regularUser._id,
          propertyId: properties[0]._id,
        },
        { generateId: true },
      );
      const offer = OfferFactory.build(
        { enquiryId: enquiry._id, vendorId: vendorUser._id },
        { generateId: true },
      );

      const method = 'get';
      const endpoint = `/api/v1/offer/${offer._id}`;

      beforeEach(async () => {
        await addEnquiry(enquiry);
        await createOffer(offer);
      });

      context('with a valid token & id', () => {
        [...new Array(3)].map((_, index) =>
          it('returns successful payload', (done) => {
            const property = PropertyFactory.build();
            request()
              .get(`/api/v1/offer/${offer._id}`)
              .set('authorization', [userToken, adminToken, vendorToken][index])
              .send(property)
              .end((err, res) => {
                expect(res).to.have.status(200);
                expect(res.body.success).to.be.eql(true);
                expect(res.body).to.have.property('offer');
                expect(res.body.offer.concern.length).to.be.eql(0);
                expect(res.body.offer._id).to.be.eql(offer._id.toString());
                expect(res.body.offer.propertyInfo).to.not.have.property('assignedTo');
                expectResponseToExcludeSensitiveUserData(res.body.offer.vendorInfo);
                expectResponseToContainNecessaryVendorData(res.body.offer.vendorInfo);
                done();
              });
          }),
        );
      });

      itReturnsNotFoundForInvalidToken({
        endpoint,
        method,
        user: testUser,
        userId: testUser._id,
      });

      itReturnsForbiddenForNoToken({ endpoint, method });

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

      context('when getOffer service fails', () => {
        it('returns the error', (done) => {
          sinon.stub(Offer, 'aggregate').throws(new Error('Type Error'));
          request()
            .get(`/api/v1/offer/${offer._id}`)
            .set('authorization', userToken)
            .end((err, res) => {
              expect(res).to.have.status(500);
              done();
              Offer.aggregate.restore();
            });
        });
      });
    });

    describe('Get all active offers', () => {
      const endpoint = '/api/v1/offer/active';
      const method = 'get';

      const enquiry1 = EnquiryFactory.build(
        {
          userId: adminUser._id,
          propertyId: properties[0]._id,
        },
        { generateId: true },
      );
      const offer1 = OfferFactory.build(
        {
          enquiryId: enquiry1._id,
          vendorId: vendorUser._id,
          status: OFFER_STATUS.GENERATED,
        },
        { generateId: true },
      );

      const enquiry2 = EnquiryFactory.build(
        {
          userId: adminUser._id,
          propertyId: properties[1]._id,
        },
        { generateId: true },
      );
      const offer2 = OfferFactory.build(
        {
          enquiryId: enquiry2._id,
          vendorId: vendorUser._id,
          expires: '2005-11-12T00:00:00.000Z',
          status: OFFER_STATUS.INTERESTED,
        },
        { generateId: true },
      );

      const enquiry3 = EnquiryFactory.build(
        {
          userId: adminUser._id,
          propertyId: properties[2]._id,
        },
        { generateId: true },
      );
      const offer3 = OfferFactory.build(
        {
          enquiryId: enquiry3._id,
          vendorId: vendorUser._id,
          status: OFFER_STATUS.REACTIVATED,
        },
        { generateId: true },
      );

      const enquiry4 = EnquiryFactory.build(
        {
          userId: regularUser._id,
          propertyId: properties[0]._id,
        },
        { generateId: true },
      );
      const offer4 = OfferFactory.build(
        {
          enquiryId: enquiry4._id,
          vendorId: vendorUser._id,
          expires: '2030-02-12T00:00:00.000Z',
          status: OFFER_STATUS.INTERESTED,
        },
        { generateId: true },
      );

      const enquiry5 = EnquiryFactory.build(
        {
          userId: regularUser._id,
          propertyId: properties[1]._id,
        },
        { generateId: true },
      );
      const offer5 = OfferFactory.build(
        {
          enquiryId: enquiry5._id,
          vendorId: vendorUser._id,
          expires: '2030-11-21T00:00:00.000Z',
          status: OFFER_STATUS.ASSIGNED,
        },
        { generateId: true },
      );

      const enquiry6 = EnquiryFactory.build(
        {
          userId: regularUser._id,
          propertyId: properties[2]._id,
        },
        { generateId: true },
      );
      const offer6 = OfferFactory.build(
        {
          enquiryId: enquiry6._id,
          vendorId: vendorUser._id,
          expires: '2030-05-02T00:00:00.000Z',
          status: OFFER_STATUS.ALLOCATED,
        },
        { generateId: true },
      );

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
                expect(res.body.offers[0].enquiryInfo._id).to.be.eql(enquiry1._id.toString());
                expect(res.body.offers[0].propertyInfo._id).to.be.eql(properties[0]._id.toString());
                expect(res.body.offers[0].propertyInfo).to.not.have.property('assignedTo');
                expectResponseToExcludeSensitiveUserData(res.body.offers[0].vendorInfo);
                expectResponseToContainNecessaryVendorData(res.body.offers[0].vendorInfo);
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
                expect(res.body.offers[0]._id).to.be.eql(offer4._id.toString());
                expect(res.body.offers[1]._id).to.be.eql(offer6._id.toString());
                expect(res.body.offers[2]._id).to.be.eql(offer5._id.toString());
                done();
              });
          });
        });

        itReturnsForbiddenForNoToken({ endpoint, method });

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
      const method = 'put';
      const endpoint = '/api/v1/offer/raise-concern';

      const enquiry = EnquiryFactory.build(
        {
          userId: regularUser._id,
          propertyId: properties[0]._id,
        },
        { generateId: true },
      );
      const offer = OfferFactory.build(
        {
          enquiryId: enquiry._id,
          vendorId: vendorUser._id,
        },
        { generateId: true },
      );
      const concern = {
        offerId: offer._id,
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
            offerId: offer._id,
            userId: regularUser._id,
            question: 'Can you send me the house plan',
            user: regularUser,
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
                .send({ offerId: offer._id, question: '' })
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

        itReturnsForbiddenForNoToken({ endpoint, method });

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
      const endpoint = '/api/v1/offer/resolve-concern';
      const method = 'put';

      const concernId = mongoose.Types.ObjectId();
      const enquiry = EnquiryFactory.build(
        {
          userId: regularUser._id,
          propertyId: properties[0]._id,
        },
        { generateId: true },
      );
      const offer = OfferFactory.build(
        {
          enquiryId: enquiry._id,
          vendorId: vendorUser._id,
          concern: [
            {
              _id: concernId,
              question: 'Are all rooms ensuite',
              status: CONCERN_STATUS.PENDING,
            },
          ],
        },
        { generateId: true },
      );

      const concern = {
        offerId: offer._id,
        concernId,
        response: 'Yes all rooms are',
      };

      describe('when an offer exist in db', () => {
        beforeEach(async () => {
          await addEnquiry(enquiry);
          await createOffer(offer);
        });

        itReturnsErrorForUnverifiedVendor({
          endpoint,
          method,
          user: vendorUser,
          useExistingUser: true,
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
                .send({ concernId: '', offerId: offer._id, question: 'Are all rooms ensuite' })
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
                .send({ offerId: offer._id, concernId, response: '' })
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

        itReturnsForbiddenForNoToken({ endpoint, method, data: concern });

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

  describe('Get all offers', () => {
    const endpoint = '/api/v1/offer/all';
    const method = 'get';
    let user2Token;
    let vendor2Token;

    const user2 = UserFactory.build(
      { role: USER_ROLE.USER, activated: true },
      { generateId: true },
    );

    const vendor2 = UserFactory.build(
      {
        role: USER_ROLE.VENDOR,
        activated: true,
        vendor: {
          verified: true,
        },
      },
      { generateId: true },
    );

    const editorUser = UserFactory.build({ role: USER_ROLE.EDITOR, activated: true });

    const userProperties = PropertyFactory.buildList(
      17,
      { addedBy: vendorUser._id },
      { generateId: true },
    );

    const userProperty = PropertyFactory.build({ addedBy: vendorUser._id }, { generateId: true });

    const user2Properties = PropertyFactory.buildList(
      8,
      { addedBy: vendor2._id },
      { generateId: true },
    );

    const userEnquiries = userProperties.map((_, index) =>
      EnquiryFactory.build(
        {
          propertyId: userProperties[index]._id,
          userId: regularUser._id,
          vendorId: userProperties[index].addedBy,
        },
        { generateId: true },
      ),
    );

    const userEnquiry = EnquiryFactory.build(
      {
        propertyId: userProperty._id,
        userId: regularUser._id,
        vendorId: userProperty.addedBy,
      },
      { generateId: true },
    );

    const user2Enquiries = user2Properties.map((_, index) =>
      EnquiryFactory.build(
        {
          propertyId: user2Properties[index]._id,
          userId: user2._id,
          vendorId: user2Properties[index].addedBy,
        },
        { generateId: true },
      ),
    );

    const userOffers = userProperties.map((_, index) =>
      OfferFactory.build(
        {
          propertyId: userProperties[index]._id,
          enquiryId: userEnquiries[index]._id,
          userId: regularUser._id,
          vendorId: vendorUser._id,
          referenceCode: 'GOO/123/456/XXX',
        },
        { generateId: true },
      ),
    );

    const userOffer = OfferFactory.build(
      {
        propertyId: userProperty._id,
        enquiryId: userEnquiry._id,
        userId: regularUser._id,
        vendorId: vendorUser._id,
        referenceCode: 'HIG/DCB/A1/234',
        allocationInPercentage: 10,
        contributionReward: 12,
        createdAt: futureDate,
        deliveryState: 'incomplete',
        expires: futureDate,
        handOverDate: futureDate,
        initialPayment: 10000,
        periodicPayment: 5000,
        paymentFrequency: 4,
        status: OFFER_STATUS.ASSIGNED,
        title: 'User offer',
        totalAmountPayable: 12309870,
      },
      { generateId: true },
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
      adminToken = await addUser(adminUser);
      userToken = await addUser(regularUser);
      vendorToken = await addUser(vendorUser);
      user2Token = await addUser(user2);
      vendor2Token = await addUser(vendor2);
    });

    describe('Offer Pagination', () => {
      context('when no offers exists in db', () => {
        [adminUser, regularUser, vendorUser].map((user) =>
          itReturnsEmptyValuesWhenNoItemExistInDatabase({
            endpoint,
            method,
            user,
            useExistingUser: true,
          }),
        );
      });
      describe('when offers exist in db', () => {
        beforeEach(async () => {
          await Property.insertMany([...userProperties, ...user2Properties]);
          await Enquiry.insertMany([...userEnquiries, ...user2Enquiries]);
          await addProperty(userProperty);
          await addEnquiry(userEnquiry);
          await Offer.insertMany([...userOffers, ...user2Offers, userOffer]);
        });

        itReturnsTheRightPaginationValue({
          endpoint,
          method,
          user: regularUser,
          useExistingUser: true,
        });

        itReturnsForbiddenForTokenWithInvalidAccess({ endpoint, method, user: editorUser });

        itReturnsForbiddenForNoToken({ endpoint, method });

        context('when request is sent by admin token', () => {
          it('returns 26 offers', (done) => {
            request()
              [method](endpoint)
              .set('authorization', adminToken)
              .end((err, res) => {
                expect(res).to.have.status(200);
                expect(res.body.success).to.be.eql(true);
                expect(res.body.pagination.currentPage).to.be.eql(1);
                expect(res.body.pagination.limit).to.be.eql(10);
                expect(res.body.pagination.total).to.be.eql(26);
                expect(res.body.pagination.offset).to.be.eql(0);
                expect(res.body.result.length).to.be.eql(10);
                expect(res.body.result[0]._id).to.be.eql(userOffers[0]._id.toString());
                expect(res.body.result[0].enquiryId).to.be.eql(userEnquiries[0]._id.toString());
                expect(res.body.result[0].propertyId).to.be.eql(userProperties[0]._id.toString());
                expect(res.body.result[0].vendorId).to.be.eql(vendorUser._id.toString());
                expect(res.body.result[0].userId).to.be.eql(regularUser._id.toString());
                expect(res.body.result[0].vendorInfo._id).to.be.eql(vendorUser._id.toString());
                expectResponseToExcludeSensitiveUserData(res.body.result[0].vendorInfo);
                expectResponseToContainNecessaryVendorData(res.body.result[0].vendorInfo);
                done();
              });
          });
        });

        context('when request is sent by vendor2 token', () => {
          it('returns vendor2 offers', (done) => {
            request()
              [method](endpoint)
              .set('authorization', vendor2Token)
              .end((err, res) => {
                expect(res).to.have.status(200);
                expect(res.body.success).to.be.eql(true);
                expect(res.body.pagination.currentPage).to.be.eql(1);
                expect(res.body.pagination.limit).to.be.eql(10);
                expect(res.body.pagination.total).to.be.eql(8);
                expect(res.body.pagination.offset).to.be.eql(0);
                expect(res.body.result.length).to.be.eql(8);
                done();
              });
          });
        });

        context('when request is sent by user2', () => {
          it('returns user2 offers', (done) => {
            request()
              [method](endpoint)
              .set('authorization', user2Token)
              .end((err, res) => {
                expect(res).to.have.status(200);
                expect(res.body.success).to.be.eql(true);
                expect(res.body.pagination.currentPage).to.be.eql(1);
                expect(res.body.pagination.limit).to.be.eql(10);
                expect(res.body.pagination.total).to.be.eql(user2Offers.length);
                expect(res.body.pagination.offset).to.be.eql(0);
                expect(res.body.result.length).to.be.eql(8);
                done();
              });
          });
        });
      });
    });

    describe('Offer Filter', () => {
      beforeEach(async () => {
        await Property.insertMany(user2Properties);
        await Enquiry.insertMany(user2Enquiries);
        await addProperty(userProperty);
        await addEnquiry(userEnquiry);
        await Offer.insertMany([...user2Offers, userOffer]);
      });

      describe('Unknown Filters', () => {
        const unknownFilter = {
          dob: '1993-02-01',
        };

        itReturnAllResultsWhenAnUnknownFilterIsUsed({
          filter: unknownFilter,
          method,
          endpoint,
          user: adminUser,
          expectedPagination: {
            ...defaultPaginationResult,
            total: 9,
            result: 9,
            totalPage: 1,
          },
          useExistingUser: true,
        });

        itReturnAllResultsWhenAnUnknownFilterIsUsed({
          filter: unknownFilter,
          method,
          endpoint,
          user: adminUser,
          expectedPagination: {
            ...defaultPaginationResult,
            total: 9,
            result: 9,
            totalPage: 1,
          },
          useExistingUser: true,
        });

        [regularUser, vendorUser].map((user) =>
          itReturnAllResultsWhenAnUnknownFilterIsUsed({
            filter: unknownFilter,
            method,
            endpoint,
            user,
            expectedPagination: {
              ...defaultPaginationResult,
              total: 1,
              result: 1,
              totalPage: 1,
            },
            useExistingUser: true,
          }),
        );
      });

      context('when multiple filters are used', () => {
        const multipleOfferDetails = {
          title: userOffer.title,
          referenceCode: userOffer.referenceCode,
          expires: userOffer.expires,
          periodicPayment: userOffer.periodicPayment,
          status: userOffer.status,
        };
        const filteredParams = querystring.stringify(multipleOfferDetails);

        it('returns matched user', (done) => {
          request()
            [method](`${endpoint}?${filteredParams}`)
            .set('authorization', adminToken)
            .end((err, res) => {
              expectsPaginationToReturnTheRightValues(res, {
                currentPage: 1,
                limit: 10,
                offset: 0,
                result: 1,
                total: 1,
                totalPage: 1,
              });
              expect(res.body.result[0]._id).to.be.eql(userOffer._id.toString());
              expect(res.body.result[0].status).to.be.eql(multipleOfferDetails.status);
              expect(res.body.result[0].periodicPayment).to.be.eql(
                multipleOfferDetails.periodicPayment,
              );
              expect(res.body.result[0].expires).to.have.string(multipleOfferDetails.expires);
              expect(res.body.result[0].title).to.be.eql(multipleOfferDetails.title);
              expect(res.body.result[0].referenceCode).to.be.eql(
                multipleOfferDetails.referenceCode,
              );
              done();
            });
        });
      });

      context('when no parameter is matched', () => {
        const nonMatchingOfferFilters = {
          title: 'old title',
          referenceCode: 'QWERTY',
          expires: '2001-11-12',
          periodicPayment: 1,
          status: 'Upgraded',
        };

        itReturnsNoResultWhenNoFilterParameterIsMatched({
          filter: nonMatchingOfferFilters,
          method,
          endpoint,
          user: adminUser,
          useExistingUser: true,
        });
      });

      filterTestForSingleParameter({
        filter: OFFER_FILTERS,
        method,
        endpoint,
        user: adminUser,
        dataObject: userOffer,
        useExistingUser: true,
      });
    });
  });

  describe('Get all offers of a user', () => {
    let vendor2Token;
    const method = 'get';
    const endpoint = `/api/v1/offer/user/${regularUser._id}`;

    const vendor2 = UserFactory.build(
      {
        role: USER_ROLE.VENDOR,
        activated: true,
        vendor: {
          verified: true,
        },
      },
      { generateId: true },
    );

    const vendorProperties = PropertyFactory.buildList(
      10,
      { addedBy: vendorUser._id },
      { generateId: true },
    );

    const vendor2Properties = PropertyFactory.buildList(
      8,
      { addedBy: vendor2._id },
      { generateId: true },
    );

    const vendorEnquiries = vendorProperties.map((_, index) =>
      EnquiryFactory.build(
        {
          propertyId: vendorProperties[index]._id,
          userId: regularUser._id,
          vendorId: vendorProperties[index].addedBy,
        },
        { generateId: true },
      ),
    );

    const vendor2Enquiries = vendor2Properties.map((_, index) =>
      EnquiryFactory.build(
        {
          propertyId: vendor2Properties[index]._id,
          userId: regularUser._id,
          vendorId: vendor2Properties[index].addedBy,
        },
        { generateId: true },
      ),
    );

    const vendorOffers = vendorProperties.map((_, index) =>
      OfferFactory.build(
        {
          propertyId: vendorProperties[index]._id,
          enquiryId: vendorEnquiries[index]._id,
          userId: regularUser._id,
          vendorId: vendorUser._id,
          referenceCode: '123456XXX',
        },
        { generateId: true },
      ),
    );

    const vendor2Offers = vendor2Properties.map((_, index) =>
      OfferFactory.build(
        {
          propertyId: vendor2Properties[index]._id,
          enquiryId: vendor2Enquiries[index]._id,
          userId: regularUser._id,
          vendorId: vendor2._id,
          referenceCode: '123456XXX',
        },
        { generateId: true },
      ),
    );

    beforeEach(async () => {
      adminToken = await addUser(adminUser);
      userToken = await addUser(regularUser);
      vendorToken = await addUser(vendorUser);
      vendor2Token = await addUser(vendor2);
    });

    itReturnsEmptyValuesWhenNoItemExistInDatabase({
      endpoint,
      method,
      user: adminUser,
      useExistingUser: true,
    });

    itReturnsEmptyValuesWhenNoItemExistInDatabase({
      endpoint,
      method,
      user: vendorUser,
      useExistingUser: true,
    });

    describe('when offers exist in db', () => {
      beforeEach(async () => {
        await Property.insertMany([...vendorProperties, ...vendor2Properties]);
        await Enquiry.insertMany([...vendorEnquiries, ...vendor2Enquiries]);
        await Offer.insertMany([...vendorOffers, ...vendor2Offers]);
      });

      context('when no offers exists in db', () => {
        [adminUser, regularUser].map((user) =>
          itReturnsTheRightPaginationValue({
            endpoint,
            method,
            user,
            useExistingUser: true,
          }),
        );
      });

      itReturnsForbiddenForNoToken({ endpoint, method });

      context('when vendor token is sent', () => {
        it('returns 10 offers', (done) => {
          request()
            [method](endpoint)
            .set('authorization', vendorToken)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body.pagination.currentPage).to.be.eql(1);
              expect(res.body.pagination.limit).to.be.eql(10);
              expect(res.body.pagination.total).to.be.eql(10);
              expect(res.body.pagination.offset).to.be.eql(0);
              expect(res.body.result.length).to.be.eql(10);
              expect(res.body.result[0].vendorInfo._id).to.be.eql(vendorUser._id.toString());
              expectResponseToExcludeSensitiveUserData(res.body.result[0].vendorInfo);
              expectResponseToContainNecessaryVendorData(res.body.result[0].vendorInfo);
              done();
            });
        });
      });

      context('when vendor 2 token is sent', () => {
        it('returns vendor2 offers', (done) => {
          request()
            [method](endpoint)
            .set('authorization', vendor2Token)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body.pagination.currentPage).to.be.eql(1);
              expect(res.body.pagination.limit).to.be.eql(10);
              expect(res.body.pagination.total).to.be.eql(8);
              expect(res.body.pagination.offset).to.be.eql(0);
              expect(res.body.result.length).to.be.eql(8);
              done();
            });
        });
      });

      context('when invalid user id is sent', () => {
        const invalidId = mongoose.Types.ObjectId();
        it('returns not found', (done) => {
          request()
            [method](`/api/v1/offer/user/${invalidId}`)
            .set('authorization', adminToken)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body.pagination.currentPage).to.be.eql(1);
              expect(res.body.pagination.limit).to.be.eql(10);
              expect(res.body.pagination.total).to.be.eql(0);
              expect(res.body.pagination.offset).to.be.eql(0);
              expect(res.body.result.length).to.be.eql(0);
              done();
            });
        });
      });
    });
  });
});
