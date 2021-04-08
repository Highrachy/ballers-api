import mongoose from 'mongoose';
import querystring from 'querystring';
import { expect, request, sinon } from '../config';
import Property from '../../server/models/property.model';
import User from '../../server/models/user.model';
import Transaction from '../../server/models/transaction.model';
import Offer from '../../server/models/offer.model';
import PropertyFactory from '../factories/property.factory';
import UserFactory from '../factories/user.factory';
import { addUser, assignPropertyToUser } from '../../server/services/user.service';
import OfferFactory from '../factories/offer.factory';
import EnquiryFactory from '../factories/enquiry.factory';
import TransactionFactory from '../factories/transaction.factory';
import { addProperty } from '../../server/services/property.service';
import { createOffer, acceptOffer } from '../../server/services/offer.service';
import { addEnquiry } from '../../server/services/enquiry.service';
import { addTransaction } from '../../server/services/transaction.service';
import { OFFER_STATUS, USER_ROLE } from '../../server/helpers/constants';
import Enquiry from '../../server/models/enquiry.model';
import {
  itReturnsErrorForUnverifiedVendor,
  expectResponseToExcludeSensitiveUserData,
  expectResponseToContainNecessaryVendorData,
  itReturnsForbiddenForNoToken,
  itReturnsForbiddenForTokenWithInvalidAccess,
  itReturnsTheRightPaginationValue,
  itReturnsEmptyValuesWhenNoItemExistInDatabase,
  expectsPaginationToReturnTheRightValues,
  defaultPaginationResult,
  expectResponseToContainNecessaryPropertyData,
  itReturnsNotFoundForInvalidToken,
  filterTestForSingleParameter,
  futureDate,
  itReturnsNoResultWhenNoFilterParameterIsMatched,
  itReturnAllResultsWhenAnUnknownFilterIsUsed,
  itReturnsAnErrorWhenServiceFails,
} from '../helpers';
import VendorFactory from '../factories/vendor.factory';
import AddressFactory from '../factories/address.factory';
import VisitationFactory from '../factories/visitation.factory';
import { scheduleVisitation } from '../../server/services/visitation.service';
import { PROPERTY_FILTERS } from '../../server/helpers/filters';
import ReportedProperty from '../../server/models/reportedProperty.model';
import ReportedPropertyFactory from '../factories/reportedProperty.factory';
import { reportProperty } from '../../server/services/reportedProperty.service';
import * as MailService from '../../server/services/mailer.service';
import EMAIL_CONTENT from '../../mailer';
import { generateNextPaymentDate } from '../../server/services/nextPayment.service';
import NextPayment from '../../server/models/nextPayment.model';
import NextPaymentFactory from '../factories/nextPayment.factory';

let adminToken;
let vendorToken;
let userToken;
let newVendorToken;
let newUserToken;
let sendMailStub;
const sandbox = sinon.createSandbox();

const adminUser = UserFactory.build(
  { role: USER_ROLE.ADMIN, activated: true },
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
const invalidVendorUser = UserFactory.build(
  {
    role: USER_ROLE.VENDOR,
    activated: true,
    vendor: {
      verified: true,
    },
  },
  { generateId: true },
);
const regularUser = UserFactory.build(
  { role: USER_ROLE.USER, activated: true },
  { generateId: true },
);

const invalidUser = UserFactory.build(
  { role: USER_ROLE.USER, activated: true },
  { generateId: true },
);

describe('Property Controller', () => {
  beforeEach(() => {
    sendMailStub = sandbox.stub(MailService, 'sendMail');
  });

  afterEach(() => {
    sandbox.restore();
  });

  beforeEach(async () => {
    adminToken = await addUser(adminUser);
    vendorToken = await addUser(vendorUser);
    newVendorToken = await addUser(invalidVendorUser);
    newUserToken = await addUser(invalidUser);
    userToken = await addUser(regularUser);
  });

  describe('Add Property Route', () => {
    const endpoint = '/api/v1/property/add';
    const method = 'post';
    context('with valid data', () => {
      it('returns successful property', (done) => {
        const property = PropertyFactory.build();
        request()
          .post('/api/v1/property/add')
          .set('authorization', vendorToken)
          .send(property)
          .end((err, res) => {
            expect(res).to.have.status(201);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.message).to.be.eql('Property added');
            expect(res.body).to.have.property('property');
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

    context('with unauthorized user access token', () => {
      [...new Array(2)].map((_, index) =>
        it('returns forbidden', (done) => {
          const property = PropertyFactory.build();
          request()
            .post('/api/v1/property/add')
            .set('authorization', [userToken, adminToken][index])
            .send(property)
            .end((err, res) => {
              expect(res).to.have.status(403);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('You are not permitted to perform this action');
              done();
            });
        }),
      );
    });

    context('when token is used', () => {
      beforeEach(async () => {
        await User.findByIdAndDelete(vendorUser._id);
      });
      it('returns token error', (done) => {
        const property = PropertyFactory.build();
        request()
          .post('/api/v1/property/add')
          .set('authorization', vendorToken)
          .send(property)
          .end((err, res) => {
            expect(res).to.have.status(404);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Invalid token');
            done();
          });
      });
    });

    context('with invalid data', () => {
      context('when name is empty', () => {
        it('returns an error', (done) => {
          const property = PropertyFactory.build({ name: '' });
          request()
            .post('/api/v1/property/add')
            .set('authorization', vendorToken)
            .send(property)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Property name" is not allowed to be empty');
              done();
            });
        });
      });
      context('when title document is empty', () => {
        it('returns successful property', (done) => {
          const property = PropertyFactory.build({ titleDocument: '' });
          request()
            .post('/api/v1/property/add')
            .set('authorization', vendorToken)
            .send(property)
            .end((err, res) => {
              expect(res).to.have.status(201);
              expect(res.body.success).to.be.eql(true);
              expect(res.body.message).to.be.eql('Property added');
              expect(res.body).to.have.property('property');
              done();
            });
        });
      });
      context('when street1 is empty', () => {
        it('returns an error', (done) => {
          const property = PropertyFactory.build({
            address: {
              street1: '',
              street2: 'miracle street',
              city: 'ilorin',
              state: 'kwara',
              country: 'nigeria',
            },
          });
          request()
            .post('/api/v1/property/add')
            .set('authorization', vendorToken)
            .send(property)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Street 1" is not allowed to be empty');
              done();
            });
        });
      });
      context('when street2 is empty', () => {
        it('returns an error', (done) => {
          const property = PropertyFactory.build({
            address: {
              street1: 'sesame street',
              street2: '',
              city: 'ilorin',
              state: 'kwara',
              country: 'nigeria',
            },
          });
          request()
            .post('/api/v1/property/add')
            .set('authorization', vendorToken)
            .send(property)
            .end((err, res) => {
              expect(res).to.have.status(201);
              expect(res.body.success).to.be.eql(true);
              expect(res.body.message).to.be.eql('Property added');
              expect(res.body).to.have.property('property');
              done();
            });
        });
      });
      context('when city is empty', () => {
        it('returns an error', (done) => {
          const property = PropertyFactory.build({
            address: {
              street1: 'sesame street',
              street2: 'miracle street',
              city: '',
              state: 'kwara',
              country: 'nigeria',
            },
          });
          request()
            .post('/api/v1/property/add')
            .set('authorization', vendorToken)
            .send(property)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"City" is not allowed to be empty');
              done();
            });
        });
      });
      context('when state is empty', () => {
        it('returns an error', (done) => {
          const property = PropertyFactory.build({
            address: {
              street1: 'sesame street',
              street2: 'miracle street',
              city: 'ilorin',
              state: '',
              country: 'nigeria',
            },
          });
          request()
            .post('/api/v1/property/add')
            .set('authorization', vendorToken)
            .send(property)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"State" is not allowed to be empty');
              done();
            });
        });
      });
      context('when country is empty', () => {
        it('returns an error', (done) => {
          const property = PropertyFactory.build({
            address: {
              street1: 'sesame street',
              street2: 'miracle street',
              city: 'ilorin',
              state: 'kwara',
              country: '',
            },
          });
          request()
            .post('/api/v1/property/add')
            .set('authorization', vendorToken)
            .send(property)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Country" is not allowed to be empty');
              done();
            });
        });
      });
      context('when price is empty', () => {
        it('returns an error', (done) => {
          const property = PropertyFactory.build({ price: '' });
          request()
            .post('/api/v1/property/add')
            .set('authorization', vendorToken)
            .send(property)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Property price" must be a number');
              done();
            });
        });
      });
      context('when units is empty', () => {
        it('returns an error', (done) => {
          const property = PropertyFactory.build({ units: '' });
          request()
            .post('/api/v1/property/add')
            .set('authorization', vendorToken)
            .send(property)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Property units" must be a number');
              done();
            });
        });
      });
      context('when houseType is empty', () => {
        it('returns an error', (done) => {
          const property = PropertyFactory.build({ houseType: '' });
          request()
            .post('/api/v1/property/add')
            .set('authorization', vendorToken)
            .send(property)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Property type" is not allowed to be empty');
              done();
            });
        });
      });
      context('when bedrooms is empty', () => {
        it('returns an error', (done) => {
          const property = PropertyFactory.build({ bedrooms: '' });
          request()
            .post('/api/v1/property/add')
            .set('authorization', vendorToken)
            .send(property)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Bedroom number" must be a number');
              done();
            });
        });
      });
      context('when toilets is empty', () => {
        it('returns an error', (done) => {
          const property = PropertyFactory.build({ toilets: '' });
          request()
            .post('/api/v1/property/add')
            .set('authorization', vendorToken)
            .send(property)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Toilet number" must be a number');
              done();
            });
        });
      });
      context('when bathrooms is empty', () => {
        it('returns an error', (done) => {
          const property = PropertyFactory.build({ bathrooms: '' });
          request()
            .post('/api/v1/property/add')
            .set('authorization', vendorToken)
            .send(property)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Bathroom number" must be a number');
              done();
            });
        });
      });
      context('when description is empty', () => {
        it('returns an error', (done) => {
          const property = PropertyFactory.build({ description: '' });
          request()
            .post('/api/v1/property/add')
            .set('authorization', vendorToken)
            .send(property)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Property description" is not allowed to be empty');
              done();
            });
        });
      });
      context('when floorPlans is empty', () => {
        it('returns an error', (done) => {
          const property = PropertyFactory.build({ floorPlans: '' });
          request()
            .post('/api/v1/property/add')
            .set('authorization', vendorToken)
            .send(property)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Property floor plans" must be an array');
              done();
            });
        });
      });
      context('when neighborhood is empty', () => {
        it('returns an error', (done) => {
          const property = PropertyFactory.build({ neighborhood: '' });
          request()
            .post('/api/v1/property/add')
            .set('authorization', vendorToken)
            .send(property)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Property neighborhood" must be of type object');
              done();
            });
        });
      });
      context('when neighborhood is an empty object', () => {
        it('returns successful property', (done) => {
          const property = PropertyFactory.build({ neighborhood: {} });
          request()
            .post('/api/v1/property/add')
            .set('authorization', vendorToken)
            .send(property)
            .end((err, res) => {
              expect(res).to.have.status(201);
              expect(res.body.success).to.be.eql(true);
              expect(res.body.message).to.be.eql('Property added');
              expect(res.body).to.have.property('property');
              done();
            });
        });
      });
      context('when mainImage is empty', () => {
        it('returns added property', (done) => {
          const property = PropertyFactory.build({ mainImage: '' });
          request()
            .post('/api/v1/property/add')
            .set('authorization', vendorToken)
            .send(property)
            .end((err, res) => {
              expect(res).to.have.status(201);
              expect(res.body.success).to.be.eql(true);
              expect(res.body.message).to.be.eql('Property added');
              expect(res.body).to.have.property('property');
              done();
            });
        });
      });
      context('when features is empty', () => {
        it('returns added property', (done) => {
          const property = PropertyFactory.build({ features: [] });
          request()
            .post('/api/v1/property/add')
            .set('authorization', vendorToken)
            .send(property)
            .end((err, res) => {
              expect(res).to.have.status(201);
              expect(res.body.success).to.be.eql(true);
              expect(res.body.message).to.be.eql('Property added');
              expect(res.body).to.have.property('property');
              done();
            });
        });
      });
      context('when gallery is empty', () => {
        it('returns an error', (done) => {
          const property = PropertyFactory.build({ gallery: '' });
          request()
            .post('/api/v1/property/add')
            .set('authorization', vendorToken)
            .send(property)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Property gallery" must be an array');
              done();
            });
        });
      });
      context('when gallery is empty array', () => {
        it('returns successful property', (done) => {
          const property = PropertyFactory.build({ gallery: [] });
          request()
            .post('/api/v1/property/add')
            .set('authorization', vendorToken)
            .send(property)
            .end((err, res) => {
              expect(res).to.have.status(201);
              expect(res.body.success).to.be.eql(true);
              expect(res.body.message).to.be.eql('Property added');
              expect(res.body).to.have.property('property');
              done();
            });
        });
      });
      context('when mapLocation.longitude is empty', () => {
        it('returns added property', (done) => {
          const property = PropertyFactory.build({ mapLocation: { longitude: '' } });
          request()
            .post('/api/v1/property/add')
            .set('authorization', vendorToken)
            .send(property)
            .end((err, res) => {
              expect(res).to.have.status(201);
              expect(res.body.success).to.be.eql(true);
              expect(res.body.message).to.be.eql('Property added');
              expect(res.body).to.have.property('property');
              done();
            });
        });
      });
      context('when mapLocation.latitude is empty', () => {
        it('returns added property', (done) => {
          const property = PropertyFactory.build({ mapLocation: { latitude: '' } });
          request()
            .post('/api/v1/property/add')
            .set('authorization', vendorToken)
            .send(property)
            .end((err, res) => {
              expect(res).to.have.status(201);
              expect(res.body.success).to.be.eql(true);
              expect(res.body.message).to.be.eql('Property added');
              expect(res.body).to.have.property('property');
              done();
            });
        });
      });
    });
  });

  describe('Update Property', () => {
    const property = PropertyFactory.build(
      {
        addedBy: vendorUser._id,
        updatedBy: vendorUser._id,
      },
      { generateId: true },
    );
    const newProperty = {
      id: property._id,
      price: 30200000,
      units: 87,
      floorPlans: [
        {
          name: 'ground floor',
          plan: 'http://linktoplan.ng',
        },
      ],
    };

    beforeEach(async () => {
      await addProperty(property);
    });

    const endpoint = '/api/v1/property/update';
    const method = 'put';
    itReturnsErrorForUnverifiedVendor({
      endpoint,
      method,
      user: vendorUser,
      useExistingUser: true,
    });

    context('with valid data & token', () => {
      it('returns a updated property', (done) => {
        request()
          .put('/api/v1/property/update')
          .set('authorization', vendorToken)
          .send(newProperty)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body).to.have.property('property');
            expect(res.body.property.price).to.be.eql(newProperty.price);
            expect(res.body.property.units).to.be.eql(newProperty.units);
            expect(res.body.property.floorPlans[0].name).to.be.eql(newProperty.floorPlans[0].name);
            expect(res.body.property.floorPlans[0].plan).to.be.eql(newProperty.floorPlans[0].plan);
            done();
          });
      });
    });

    context('with vendor token of another vendor', () => {
      it('returns forbidden', (done) => {
        request()
          .put('/api/v1/property/update')
          .set('authorization', newVendorToken)
          .send(newProperty)
          .end((err, res) => {
            expect(res).to.have.status(400);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.error.message).to.be.eql(
              'You are not permitted to perform this action',
            );
            done();
          });
      });
    });

    context('with unauthorized user access token', () => {
      [...new Array(2)].map((_, index) =>
        it('returns forbidden', (done) => {
          request()
            .put('/api/v1/property/update')
            .set('authorization', [userToken, adminToken][index])
            .send(newProperty)
            .end((err, res) => {
              expect(res).to.have.status(403);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('You are not permitted to perform this action');
              done();
            });
        }),
      );
    });

    context('without token', () => {
      it('returns error', (done) => {
        request()
          .put('/api/v1/property/update')
          .send(newProperty)
          .end((err, res) => {
            expect(res).to.have.status(403);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Token needed to access resources');
            done();
          });
      });
    });

    context('when user token is used', () => {
      beforeEach(async () => {
        await User.findByIdAndDelete(vendorUser._id);
      });
      it('returns token error', (done) => {
        request()
          .put('/api/v1/property/update')
          .set('authorization', vendorToken)
          .send(newProperty)
          .end((err, res) => {
            expect(res).to.have.status(404);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Invalid token');
            done();
          });
      });
    });

    context('with invalid body', () => {
      it('returns error', (done) => {
        request()
          .put('/api/v1/property/update')
          .set('authorization', vendorToken)
          .send()
          .end((err, res) => {
            expect(res).to.have.status(412);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Validation Error');
            done();
          });
      });
    });

    context('when update service returns an error', () => {
      it('returns the error', (done) => {
        sinon.stub(Property, 'findByIdAndUpdate').throws(new Error('Type Error'));
        request()
          .put('/api/v1/property/update')
          .set('authorization', vendorToken)
          .send(newProperty)
          .end((err, res) => {
            expect(res).to.have.status(400);
            expect(res.body.success).to.be.eql(false);
            done();
            Property.findByIdAndUpdate.restore();
          });
      });
    });

    context('with invalid data', () => {
      context('when name is empty', () => {
        it('returns an error', (done) => {
          const invalidProperty = PropertyFactory.build({ id: property._id, name: '' });
          request()
            .put('/api/v1/property/update')
            .set('authorization', vendorToken)
            .send(invalidProperty)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Property name" is not allowed to be empty');
              done();
            });
        });
      });

      context('when address.street1 is empty', () => {
        it('returns an error', (done) => {
          const invalidProperty = PropertyFactory.build({
            id: property._id,
            address: { street1: '' },
          });
          request()
            .put('/api/v1/property/update')
            .set('authorization', vendorToken)
            .send(invalidProperty)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Street 1" is not allowed to be empty');
              done();
            });
        });
      });
      context('when address.street2 is empty', () => {
        it('returns updated property', (done) => {
          request()
            .put('/api/v1/property/update')
            .set('authorization', vendorToken)
            .send({ ...newProperty, address: { street2: '' } })
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body).to.have.property('property');
              expect(res.body.property.price).to.be.eql(newProperty.price);
              expect(res.body.property.units).to.be.eql(newProperty.units);
              done();
            });
        });
      });
      context('when address.city is empty', () => {
        it('returns an error', (done) => {
          const invalidProperty = PropertyFactory.build({
            id: property._id,
            address: { city: '' },
          });
          request()
            .put('/api/v1/property/update')
            .set('authorization', vendorToken)
            .send(invalidProperty)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"City" is not allowed to be empty');
              done();
            });
        });
      });
      context('when address.state is empty', () => {
        it('returns an error', (done) => {
          const invalidProperty = PropertyFactory.build({
            id: property._id,
            address: { state: '' },
          });
          request()
            .put('/api/v1/property/update')
            .set('authorization', vendorToken)
            .send(invalidProperty)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"State" is not allowed to be empty');
              done();
            });
        });
      });
      context('when address.country is empty', () => {
        it('returns an error', (done) => {
          const invalidProperty = PropertyFactory.build({
            id: property._id,
            address: { country: '' },
          });
          request()
            .put('/api/v1/property/update')
            .set('authorization', vendorToken)
            .send(invalidProperty)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Country" is not allowed to be empty');
              done();
            });
        });
      });
      context('when price is empty', () => {
        it('returns an error', (done) => {
          const invalidProperty = PropertyFactory.build({ id: property._id, price: '' });
          request()
            .put('/api/v1/property/update')
            .set('authorization', vendorToken)
            .send(invalidProperty)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Property price" must be a number');
              done();
            });
        });
      });
      context('when units is empty', () => {
        it('returns an error', (done) => {
          const invalidProperty = PropertyFactory.build({ id: property._id, units: '' });
          request()
            .put('/api/v1/property/update')
            .set('authorization', vendorToken)
            .send(invalidProperty)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Property units" must be a number');
              done();
            });
        });
      });
      context('when houseType is empty', () => {
        it('returns an error', (done) => {
          const invalidProperty = PropertyFactory.build({ id: property._id, houseType: '' });
          request()
            .put('/api/v1/property/update')
            .set('authorization', vendorToken)
            .send(invalidProperty)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Property type" is not allowed to be empty');
              done();
            });
        });
      });
      context('when bedrooms is empty', () => {
        it('returns an error', (done) => {
          const invalidProperty = PropertyFactory.build({ id: property._id, bedrooms: '' });
          request()
            .put('/api/v1/property/update')
            .set('authorization', vendorToken)
            .send(invalidProperty)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Bedroom number" must be a number');
              done();
            });
        });
      });
      context('when toilets is empty', () => {
        it('returns an error', (done) => {
          const invalidProperty = PropertyFactory.build({ id: property._id, toilets: '' });
          request()
            .put('/api/v1/property/update')
            .set('authorization', vendorToken)
            .send(invalidProperty)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Toilet number" must be a number');
              done();
            });
        });
      });
      context('when bathrooms is empty', () => {
        it('returns an error', (done) => {
          const invalidProperty = PropertyFactory.build({ id: property._id, bathrooms: '' });
          request()
            .put('/api/v1/property/update')
            .set('authorization', vendorToken)
            .send(invalidProperty)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Bathroom number" must be a number');
              done();
            });
        });
      });
      context('when description is empty', () => {
        it('returns an error', (done) => {
          const invalidProperty = PropertyFactory.build({ id: property._id, description: '' });
          request()
            .put('/api/v1/property/update')
            .set('authorization', vendorToken)
            .send(invalidProperty)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Property description" is not allowed to be empty');
              done();
            });
        });
      });
      context('when floorPlans is empty', () => {
        it('returns an error', (done) => {
          const invalidProperty = PropertyFactory.build({ id: property._id, floorPlans: '' });
          request()
            .put('/api/v1/property/update')
            .set('authorization', vendorToken)
            .send(invalidProperty)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Property floor plans" must be an array');
              done();
            });
        });
      });
      context('when neighborhood is empty', () => {
        it('returns an error', (done) => {
          const invalidProperty = PropertyFactory.build({ id: property._id, neighborhood: '' });
          request()
            .put('/api/v1/property/update')
            .set('authorization', vendorToken)
            .send(invalidProperty)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Property neighborhood" must be of type object');
              done();
            });
        });
      });
      context('when neighborhood is empty object', () => {
        it('returns updated property', (done) => {
          const invalidProperty = PropertyFactory.build({ id: property._id, neighborhood: {} });
          request()
            .put('/api/v1/property/update')
            .set('authorization', vendorToken)
            .send(invalidProperty)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body).to.have.property('property');
              expect(res.body.property.neighborhood).to.be.eql({
                entertainments: [],
                hospitals: [],
                restaurantsAndBars: [],
                schools: [],
                shoppingMalls: [],
                pointsOfInterest: [],
              });
              done();
            });
        });
      });
      context('when mainImage is empty', () => {
        it('returns updated property', (done) => {
          const invalidProperty = PropertyFactory.build({ id: property._id, mainImage: '' });
          request()
            .put('/api/v1/property/update')
            .set('authorization', vendorToken)
            .send(invalidProperty)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body).to.have.property('property');
              done();
            });
        });
      });
      context('when features is empty', () => {
        it('returns updated property', (done) => {
          const invalidProperty = PropertyFactory.build({ id: property._id, features: [] });
          request()
            .put('/api/v1/property/update')
            .set('authorization', vendorToken)
            .send(invalidProperty)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body).to.have.property('property');
              done();
            });
        });
      });
      context('when gallery is empty', () => {
        it('returns an error', (done) => {
          const invalidProperty = PropertyFactory.build({ id: property._id, gallery: '' });
          request()
            .put('/api/v1/property/update')
            .set('authorization', vendorToken)
            .send(invalidProperty)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Property gallery" must be an array');
              done();
            });
        });
      });
      context('when gallery is empty array', () => {
        it('returns updated property', (done) => {
          const invalidProperty = PropertyFactory.build({ id: property._id, gallery: [] });
          request()
            .put('/api/v1/property/update')
            .set('authorization', vendorToken)
            .send(invalidProperty)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body).to.have.property('property');
              expect(res.body.property.gallery).to.be.eql(invalidProperty.gallery);
              done();
            });
        });
      });
      context('when mapLocation.longitude is empty', () => {
        it('returns updated property', (done) => {
          const invalidProperty = PropertyFactory.build({
            id: property._id,
            mapLocation: { longitude: '' },
          });
          request()
            .put('/api/v1/property/update')
            .set('authorization', vendorToken)
            .send(invalidProperty)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body).to.have.property('property');
              done();
            });
        });
      });
      context('when mapLocation.latitude is empty', () => {
        it('returns updated property', (done) => {
          const invalidProperty = PropertyFactory.build({
            id: property._id,
            mapLocation: { latitude: '' },
          });
          request()
            .put('/api/v1/property/update')
            .set('authorization', vendorToken)
            .send(invalidProperty)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body).to.have.property('property');
              done();
            });
        });
      });
    });
  });

  describe('Delete property', () => {
    const invalidPropertyId = mongoose.Types.ObjectId();
    const property = PropertyFactory.build(
      { addedBy: vendorUser._id, updatedBy: vendorUser._id },
      { generateId: true },
    );

    beforeEach(async () => {
      await addProperty(property);
    });

    context('with a valid token & id', () => {
      [...new Array(2)].map((_, index) =>
        it('successfully deletes property', (done) => {
          request()
            .delete(`/api/v1/property/delete/${property._id}`)
            .set('authorization', [vendorToken, adminToken][index])
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body.message).to.be.eql('Property deleted');
              done();
            });
        }),
      );
    });

    context('with user access token', () => {
      it('returns forbidden', (done) => {
        request()
          .delete(`/api/v1/property/delete/${property._id}`)
          .set('authorization', userToken)
          .end((err, res) => {
            expect(res).to.have.status(403);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('You are not permitted to perform this action');
            done();
          });
      });
    });

    context('with invalid vendor access token', () => {
      it('returns forbidden', (done) => {
        request()
          .delete(`/api/v1/property/delete/${property._id}`)
          .set('authorization', newVendorToken)
          .end((err, res) => {
            expect(res).to.have.status(400);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.error.message).to.be.eql(
              'You are not permitted to perform this action',
            );
            done();
          });
      });
    });

    const endpoint = `/api/v1/property/delete/${property._id}`;
    const method = 'delete';
    itReturnsErrorForUnverifiedVendor({
      endpoint,
      method,
      user: vendorUser,
      useExistingUser: true,
    });

    context('when token is used', () => {
      beforeEach(async () => {
        await User.findByIdAndDelete(vendorUser._id);
      });
      it('returns token error', (done) => {
        request()
          .delete(`/api/v1/property/delete/${property._id}`)
          .set('authorization', vendorToken)
          .end((err, res) => {
            expect(res).to.have.status(404);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Invalid token');
            done();
          });
      });
    });

    context('with an invalid property id', () => {
      it('returns an error', (done) => {
        request()
          .delete(`/api/v1/property/delete/${invalidPropertyId}`)
          .set('authorization', vendorToken)
          .end((err, res) => {
            expect(res).to.have.status(400);
            expect(res.body.success).to.be.eql(false);
            done();
          });
      });
    });

    context('without token', () => {
      it('returns error', (done) => {
        request()
          .delete(`/api/v1/property/delete/${property._id}`)
          .end((err, res) => {
            expect(res).to.have.status(403);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Token needed to access resources');
            done();
          });
      });
    });
  });

  describe('Get one property', () => {
    const invalidPropertyId = mongoose.Types.ObjectId();
    const property = PropertyFactory.build(
      { addedBy: vendorUser._id, updatedBy: vendorUser._id },
      { generateId: true },
    );

    beforeEach(async () => {
      await addProperty(property);
    });

    context('with a valid token & id', () => {
      [...new Array(2)].map((_, index) =>
        it('successfully returns property', (done) => {
          request()
            .get(`/api/v1/property/${property._id}`)
            .set('authorization', [vendorToken, adminToken][index])
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body.property._id).to.be.eql(property._id.toString());
              expect(res.body.property).to.not.have.property('assignedTo');
              expect(res.body.property).to.not.have.property('enquiryInfo');
              expect(res.body.property).to.not.have.property('visitationInfo');
              expectResponseToExcludeSensitiveUserData(res.body.property.vendorInfo);
              expectResponseToContainNecessaryVendorData(res.body.property.vendorInfo);
              done();
            });
        }),
      );
    });

    context('when request is made by a user', () => {
      const visitation = VisitationFactory.build(
        {
          propertyId: property._id,
          userId: regularUser._id,
        },
        { generateId: true },
      );
      const enquiry = EnquiryFactory.build(
        {
          propertyId: property._id,
          userId: regularUser._id,
        },
        { generateId: true },
      );
      context('with an enquiry and visitation for the property', () => {
        beforeEach(async () => {
          await scheduleVisitation(visitation);
          await addEnquiry(enquiry);
        });
        it('returns property with enquiry and visitation info', (done) => {
          request()
            .get(`/api/v1/property/${property._id}`)
            .set('authorization', userToken)
            .send(property)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body.property._id).to.be.eql(property._id.toString());
              expect(res.body.property.enquiryInfo._id).to.be.eql(enquiry._id.toString());
              expect(res.body.property.enquiryInfo.propertyId).to.be.eql(property._id.toString());
              expect(res.body.property.enquiryInfo.userId).to.be.eql(regularUser._id.toString());
              expect(res.body.property.visitationInfo[0]._id).to.be.eql(visitation._id.toString());
              expect(res.body.property.visitationInfo[0].userId).to.be.eql(
                regularUser._id.toString(),
              );
              expect(res.body.property.visitationInfo[0].propertyId).to.be.eql(
                property._id.toString(),
              );
              expectResponseToExcludeSensitiveUserData(res.body.property.vendorInfo);
              expectResponseToContainNecessaryVendorData(res.body.property.vendorInfo);
              done();
            });
        });
      });

      context('without an enquiry and visitation for the property', () => {
        it('returns property without enquiry and visitation info', (done) => {
          request()
            .get(`/api/v1/property/${property._id}`)
            .set('authorization', userToken)
            .send(property)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body.property._id).to.be.eql(property._id.toString());
              expect(res.body.property).to.not.have.property('enquiryInfo');
              expect(res.body.property.visitationInfo.length).to.be.eql(0);
              expectResponseToExcludeSensitiveUserData(res.body.property.vendorInfo);
              expectResponseToContainNecessaryVendorData(res.body.property.vendorInfo);
              done();
            });
        });
      });
    });

    context('when token is invalid', () => {
      beforeEach(async () => {
        await User.findByIdAndDelete(vendorUser._id);
      });
      it('returns not found', (done) => {
        request()
          .get(`/api/v1/property/${property._id}`)
          .set('authorization', vendorToken)
          .send(property)
          .end((err, res) => {
            expect(res).to.have.status(404);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Invalid token');
            done();
          });
      });
    });

    context('when property is flagged', () => {
      beforeEach(async () => {
        await Property.findByIdAndUpdate(property._id, { 'flagged.status': true });
      });

      context('request sent by vendor or admin', () => {
        [...new Array(2)].map((_, index) =>
          it('successfully returns property', (done) => {
            request()
              .get(`/api/v1/property/${property._id}`)
              .set('authorization', [vendorToken, adminToken][index])
              .end((err, res) => {
                expect(res).to.have.status(200);
                expect(res.body.success).to.be.eql(true);
                expect(res.body.property._id).to.be.eql(property._id.toString());
                expect(res.body.property).to.not.have.property('assignedTo');
                expect(res.body.property).to.not.have.property('enquiryInfo');
                expect(res.body.property).to.not.have.property('visitationInfo');
                expectResponseToExcludeSensitiveUserData(res.body.property.vendorInfo);
                expectResponseToContainNecessaryVendorData(res.body.property.vendorInfo);
                done();
              });
          }),
        );
      });

      context('request sent by user or another vendor', () => {
        [...new Array(2)].map((_, index) =>
          it('returns not found', (done) => {
            request()
              .get(`/api/v1/property/${property._id}`)
              .set('authorization', [userToken, newVendorToken][index])
              .end((err, res) => {
                expect(res).to.have.status(404);
                expect(res.body.success).to.be.eql(false);
                expect(res.body.message).to.be.eql('Property not found');
                done();
              });
          }),
        );
      });
    });

    context('with an invalid property id', () => {
      it('returns not found', (done) => {
        request()
          .get(`/api/v1/property/${invalidPropertyId}`)
          .set('authorization', adminToken)
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
          .get(`/api/v1/property/${property._id}`)
          .end((err, res) => {
            expect(res).to.have.status(403);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Token needed to access resources');
            done();
          });
      });
    });

    context('when getOneProperty service fails', () => {
      it('returns the error', (done) => {
        sinon.stub(Property, 'aggregate').throws(new Error('Type Error'));
        request()
          .get(`/api/v1/property/${property._id}`)
          .set('authorization', adminToken)
          .end((err, res) => {
            expect(res).to.have.status(500);
            done();
            Property.aggregate.restore();
          });
      });
    });
  });

  describe('Get all properties', () => {
    const endpoint = '/api/v1/property/all';
    const method = 'get';

    const vendorUser2 = UserFactory.build(
      { role: USER_ROLE.VENDOR, activated: true, vendor: VendorFactory.build() },
      { generateId: true },
    );
    const vendorProperties = PropertyFactory.buildList(12, {
      addedBy: vendorUser._id,
      updatedBy: vendorUser._id,
      createdAt: new Date(),
      flagged: {
        status: false,
      },
    });
    const vendor2Properties = PropertyFactory.buildList(5, {
      addedBy: vendorUser2._id,
      updatedBy: vendorUser2._id,
      createdAt: new Date(),
    });
    const vendorProperty = PropertyFactory.build(
      {
        address: {
          street1: 'miracle street',
          street2: 'sesame street',
          city: 'ilorin',
          state: 'kwara',
          country: 'ghana',
        },
        addedBy: vendorUser._id,
        bathrooms: 1,
        bedrooms: 1,
        createdAt: futureDate,
        features: ['swimming pool', 'tiled roads', 'electricity'],
        houseType: 'penthouse apartment',
        name: 'penthouse apartment',
        price: 12500000,
        toilets: 1,
        units: 1,
        updatedBy: vendorUser._id,
        flagged: {
          status: true,
        },
      },
      { generateId: true },
    );
    const editorUser = UserFactory.build({ role: USER_ROLE.EDITOR, activated: true });

    describe('Property Pagination', () => {
      context('when no property exists in db', () => {
        [adminUser, vendorUser].map((user) =>
          itReturnsEmptyValuesWhenNoItemExistInDatabase({
            endpoint,
            method,
            user,
            useExistingUser: true,
          }),
        );
      });

      describe('when properties exist in db', () => {
        beforeEach(async () => {
          await addUser(vendorUser2);
          await addUser(editorUser);
          await Property.insertMany([...vendorProperties, ...vendor2Properties]);
          await addProperty(vendorProperty);
        });

        itReturnsTheRightPaginationValue({
          endpoint,
          method,
          user: adminUser,
          useExistingUser: true,
        });

        context('with a admin token & id', () => {
          it('returns all properties', (done) => {
            request()
              [method](endpoint)
              .set('authorization', adminToken)
              .end((err, res) => {
                expectsPaginationToReturnTheRightValues(res, defaultPaginationResult);
                expectResponseToContainNecessaryPropertyData(
                  res.body.result[0],
                  vendorProperties[0],
                );
                expectResponseToExcludeSensitiveUserData(res.body.result[0].vendorInfo);
                expectResponseToContainNecessaryVendorData(res.body.result[0].vendorInfo);
                done();
              });
          });
        });

        context('with vendor1 token & id', () => {
          it('returns all properties', (done) => {
            request()
              [method](endpoint)
              .set('authorization', vendorToken)
              .end((err, res) => {
                expectsPaginationToReturnTheRightValues(res, {
                  ...defaultPaginationResult,
                  total: 13,
                  result: 10,
                  totalPage: 2,
                });
                expectResponseToContainNecessaryPropertyData(
                  res.body.result[0],
                  vendorProperties[0],
                );
                expectResponseToExcludeSensitiveUserData(res.body.result[0].vendorInfo);
                expectResponseToContainNecessaryVendorData(res.body.result[0].vendorInfo);
                done();
              });
          });
        });

        context('with a vendor token not attached to any property', () => {
          it('returns no property', (done) => {
            request()
              [method](endpoint)
              .set('authorization', newVendorToken)
              .end((err, res) => {
                expectsPaginationToReturnTheRightValues(res, {
                  ...defaultPaginationResult,
                  total: 0,
                  result: 0,
                  totalPage: 0,
                });
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

        context('when user has invalid access token', () => {
          [regularUser, editorUser].map((user) =>
            itReturnsForbiddenForTokenWithInvalidAccess({
              endpoint,
              method,
              user,
              useExistingUser: true,
            }),
          );
        });

        itReturnsForbiddenForNoToken({ endpoint, method });

        itReturnsNotFoundForInvalidToken({
          endpoint,
          method,
          user: adminUser,
          userId: adminUser._id,
          useExistingUser: true,
        });

        context('when getAllUserProperties service fails', () => {
          it('returns the error', (done) => {
            sinon.stub(Property, 'aggregate').throws(new Error('Type Error'));
            request()
              [method](endpoint)
              .set('authorization', adminToken)
              .end((err, res) => {
                expect(res).to.have.status(500);
                done();
                Property.aggregate.restore();
              });
          });
        });
      });
    });

    describe('Property Filter', () => {
      beforeEach(async () => {
        await addUser(vendorUser2);
        await addUser(editorUser);
        await Property.insertMany(vendor2Properties);
        await addProperty(vendorProperty);
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
            total: 6,
            result: 6,
            totalPage: 1,
          },
          useExistingUser: true,
        });

        itReturnAllResultsWhenAnUnknownFilterIsUsed({
          filter: unknownFilter,
          method,
          endpoint,
          user: vendorUser2,
          expectedPagination: {
            ...defaultPaginationResult,
            total: 5,
            result: 5,
            totalPage: 1,
          },
          useExistingUser: true,
        });
      });

      context('when multiple filters are used', () => {
        const multiplePropertyDetails = {
          bathrooms: vendorProperty.bathrooms,
          bedrooms: vendorProperty.bedrooms,
          price: vendorProperty.price,
          units: vendorProperty.units,
          country: vendorProperty.address.country,
        };
        const filteredParams = querystring.stringify(multiplePropertyDetails);

        it('returns matched property', (done) => {
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
              expect(res.body.result[0]._id).to.be.eql(vendorProperty._id.toString());
              expect(res.body.result[0].bathrooms).to.be.eql(multiplePropertyDetails.bathrooms);
              expect(res.body.result[0].bedrooms).to.be.eql(multiplePropertyDetails.bedrooms);
              expect(res.body.result[0].price).to.be.eql(multiplePropertyDetails.price);
              expect(res.body.result[0].units).to.be.eql(multiplePropertyDetails.units);
              expect(res.body.result[0].address.country).to.be.eql(multiplePropertyDetails.country);
              done();
            });
        });
      });

      context('when no parameter is matched', () => {
        const nonMatchingFilters = {
          bathrooms: 13,
          bedrooms: 1,
          price: 1500,
          units: 22,
          country: 'italy',
        };

        itReturnsNoResultWhenNoFilterParameterIsMatched({
          filter: nonMatchingFilters,
          method,
          endpoint,
          user: adminUser,
          useExistingUser: true,
        });
      });

      filterTestForSingleParameter({
        filter: PROPERTY_FILTERS,
        method,
        endpoint,
        user: adminUser,
        dataObject: vendorProperty,
        useExistingUser: true,
      });
    });
  });

  describe('Array filters', () => {
    const addedBy = vendorUser._id;
    const updatedBy = vendorUser._id;

    const property1 = PropertyFactory.build({
      features: null,
      addedBy,
      updatedBy,
    });
    const property2 = PropertyFactory.build({
      features: ['electricity'],
      addedBy,
      updatedBy,
    });
    const property3 = PropertyFactory.build({
      features: ['swimming pool', 'electricity', 'tile roads'],
      addedBy,
      updatedBy,
    });

    beforeEach(async () => {
      await addProperty(property1);
      await addProperty(property2);
      await addProperty(property3);
    });

    context('when a single entry is used', () => {
      it('returns matched properties', (done) => {
        request()
          .get(`/api/v1/property/all?features=electricity`)
          .set('authorization', adminToken)
          .end((err, res) => {
            expect(res.body.result.length).to.be.eql(2);
            expect(res.body.result[0].features).to.be.eql(property2.features);
            expect(res.body.result[1].features).to.be.eql(property3.features);
            done();
          });
      });
    });

    context('when a multiple entries are used', () => {
      it('returns matched property', (done) => {
        request()
          .get(`/api/v1/property/all?features=electricity,swimming pool`)
          .set('authorization', adminToken)
          .end((err, res) => {
            expect(res.body.result.length).to.be.eql(1);
            expect(res.body.result[0].features).to.be.eql(property3.features);
            done();
          });
      });
    });
  });

  describe('Get all properties added by an vendor', () => {
    const properties = PropertyFactory.buildList(18, {
      addedBy: vendorUser._id,
      updatedBy: vendorUser._id,
    });

    context('when no property is found', () => {
      it('returns not found', (done) => {
        request()
          .get(`/api/v1/property/added-by/${vendorUser._id}`)
          .set('authorization', adminToken)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.properties.length).to.be.eql(0);
            done();
          });
      });
    });

    describe('when properties exist in db', () => {
      beforeEach(async () => {
        await Property.insertMany(properties);
      });

      context('with a valid token & id', () => {
        it('returns successful payload', (done) => {
          request()
            .get(`/api/v1/property/added-by/${vendorUser._id}`)
            .set('authorization', adminToken)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body.properties.length).to.be.eql(18);
              expect(res.body).to.have.property('properties');
              done();
            });
        });
      });

      context('with unauthorized user access token', () => {
        [...new Array(2)].map((_, index) =>
          it('successfully returns property', (done) => {
            request()
              .get(`/api/v1/property/added-by/${vendorUser._id}`)
              .set('authorization', [vendorToken, userToken][index])
              .end((err, res) => {
                expect(res).to.have.status(403);
                expect(res.body.success).to.be.eql(false);
                expect(res.body.message).to.be.eql('You are not permitted to perform this action');
                done();
              });
          }),
        );
      });

      context('with id is not a valid mongo id', () => {
        it('returns successful payload', (done) => {
          request()
            .get(`/api/v1/property/added-by/${vendorUser._id}a`)
            .set('authorization', adminToken)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Invalid Id supplied');
              done();
            });
        });
      });

      context('without token', () => {
        it('returns error', (done) => {
          request()
            .get(`/api/v1/property/added-by/${vendorUser._id}`)
            .end((err, res) => {
              expect(res).to.have.status(403);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Token needed to access resources');
              done();
            });
        });
      });

      context('when token is used', () => {
        beforeEach(async () => {
          await User.findByIdAndDelete(adminUser._id);
        });
        it('returns token error', (done) => {
          request()
            .get(`/api/v1/property/added-by/${vendorUser._id}`)
            .set('authorization', adminToken)
            .end((err, res) => {
              expect(res).to.have.status(404);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Invalid token');
              done();
            });
        });
      });

      context('when getAllPropertiesAddedByVendor service fails', () => {
        it('returns the error', (done) => {
          sinon.stub(Property, 'aggregate').throws(new Error('Type Error'));
          request()
            .get(`/api/v1/property/added-by/${vendorUser._id}`)
            .set('authorization', adminToken)
            .end((err, res) => {
              expect(res).to.have.status(500);
              done();
              Property.aggregate.restore();
            });
        });
      });
    });
  });

  describe('Search Through Properties', () => {
    const property1 = PropertyFactory.build(
      {
        addedBy: vendorUser._id,
        updatedBy: vendorUser._id,
        houseType: '3 bedroom duplex',
        address: {
          state: 'lagos',
          city: 'lekki',
        },
      },
      { generateId: true },
    );
    const property2 = PropertyFactory.build(
      {
        addedBy: vendorUser._id,
        updatedBy: vendorUser._id,
        houseType: '4 bedroom detatched duplex',
        address: {
          state: 'lagos',
          city: 'epe',
        },
      },
      { generateId: true },
    );
    const property3 = PropertyFactory.build(
      {
        addedBy: vendorUser._id,
        updatedBy: vendorUser._id,
        houseType: '3 bedroom duplex',
        address: {
          state: 'ogun',
          city: 'ajah',
        },
      },
      { generateId: true },
    );

    const filter = {
      houseType: '3 bedroom duplex',
      state: 'lagos',
      city: 'lekki',
    };

    context('when no property is found', () => {
      it('returns no property', (done) => {
        request()
          .post('/api/v1/property/search')
          .set('authorization', userToken)
          .send(filter)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.properties.length).to.be.eql(0);
            done();
          });
      });
    });

    describe('when properties exist in db', () => {
      beforeEach(async () => {
        await addProperty(property1);
        await addProperty(property2);
        await addProperty(property3);
      });

      context('with a valid token & id', () => {
        it('returns a valid search result', (done) => {
          request()
            .post('/api/v1/property/search')
            .set('authorization', userToken)
            .send(filter)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body).to.have.property('properties');
              expect(res.body.properties[0]).to.have.property('name');
              expect(res.body.properties[0]).to.have.property('address');
              expect(res.body.properties[0]).to.have.property('mainImage');
              expect(res.body.properties[0]).to.have.property('features');
              expect(res.body.properties[0]).to.have.property('gallery');
              expect(res.body.properties[0]).to.have.property('price');
              expect(res.body.properties[0]).to.have.property('houseType');
              expect(res.body.properties[0]).to.have.property('description');
              expect(res.body.properties[0]).to.not.have.property('assignedTo');
              expect(res.body.properties[0]._id).to.be.eql(property1._id.toString());
              expect(res.body.properties[0].assignedUsers).to.not.include(
                regularUser._id.toString(),
              );
              expectResponseToExcludeSensitiveUserData(res.body.properties[0].assignedUsers);
              expectResponseToExcludeSensitiveUserData(res.body.properties[0].vendorInfo);
              expectResponseToContainNecessaryVendorData(res.body.properties[0].vendorInfo);

              done();
            });
        });
      });

      context('when filter is empty', () => {
        context('when no data is sent', () => {
          it('returns all properties', (done) => {
            request()
              .post('/api/v1/property/search')
              .set('authorization', userToken)
              .send({})
              .end((err, res) => {
                expect(res).to.have.status(200);
                expect(res.body.success).to.be.eql(true);
                expect(res.body).to.have.property('properties');
                expect(res.body.properties[0]._id).to.be.eql(property1._id.toString());
                expect(res.body.properties.length).to.be.eql(3);
                done();
              });
          });
        });

        context('when one property is flagged', () => {
          beforeEach(async () => {
            await Property.findByIdAndUpdate(property1._id, { 'flagged.status': true });
          });
          it('returns 2 properties', (done) => {
            request()
              .post('/api/v1/property/search')
              .set('authorization', userToken)
              .send({})
              .end((err, res) => {
                expect(res).to.have.status(200);
                expect(res.body.success).to.be.eql(true);
                expect(res.body).to.have.property('properties');
                expect(res.body.properties[0]._id).to.be.eql(property2._id.toString());
                expect(res.body.properties.length).to.be.eql(2);
                done();
              });
          });
        });
      });

      context('when only state is sent', () => {
        it('returns similar properties', (done) => {
          request()
            .post('/api/v1/property/search')
            .set('authorization', userToken)
            .send({ state: filter.state })
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body).to.have.property('properties');
              expect(res.body.properties[0]._id).to.be.eql(property1._id.toString());
              done();
            });
        });
      });

      context('when only house type is sent', () => {
        it('returns similar properties', (done) => {
          request()
            .post('/api/v1/property/search')
            .set('authorization', userToken)
            .send({ houseType: filter.houseType })
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body).to.have.property('properties');
              expect(res.body.properties[0]._id).to.be.eql(property1._id.toString());
              done();
            });
        });
      });

      context('when only city is sent', () => {
        it('returns similar properties', (done) => {
          request()
            .post('/api/v1/property/search')
            .set('authorization', userToken)
            .send({ city: filter.city })
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body).to.have.property('properties');
              expect(res.body.properties[0]._id).to.be.eql(property1._id.toString());
              done();
            });
        });
      });

      context('without token', () => {
        it('returns error', (done) => {
          request()
            .post('/api/v1/property/search')
            .send(filter)
            .end((err, res) => {
              expect(res).to.have.status(403);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Token needed to access resources');
              done();
            });
        });
      });

      context('when state is lagos', () => {
        it('returns properties 1 & 2', (done) => {
          request()
            .post('/api/v1/property/search')
            .set('authorization', userToken)
            .send({ state: 'lagos' })
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body).to.have.property('properties');
              expect(res.body.properties.length).to.be.eql(2);
              expect(res.body.properties[0]._id).to.be.eql(property1._id.toString());
              expect(res.body.properties[1].houseType).to.be.eql(property2.houseType);
              done();
            });
        });
      });

      context('when searchThroughProperties service fails', () => {
        it('returns the error', (done) => {
          sinon.stub(Property, 'aggregate').throws(new Error('Type Error'));
          request()
            .post('/api/v1/property/search')
            .set('authorization', userToken)
            .send(filter)
            .end((err, res) => {
              expect(res).to.have.status(500);
              done();
              Property.aggregate.restore();
            });
        });
      });

      context('when all properties have been assigned to user', () => {
        beforeEach(async () => {
          await assignPropertyToUser({
            userId: regularUser._id,
            propertyId: property1._id,
            vendor: vendorUser,
          });
          await assignPropertyToUser({
            userId: regularUser._id,
            propertyId: property2._id,
            vendor: vendorUser,
          });
          await assignPropertyToUser({
            userId: regularUser._id,
            propertyId: property3._id,
            vendor: vendorUser,
          });
        });
        it('returns no property', (done) => {
          request()
            .post('/api/v1/property/search')
            .set('authorization', userToken)
            .send({})
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body).to.have.property('properties');
              expect(res.body.properties.length).to.be.eql(0);
              done();
            });
        });
      });

      context('when no property has been assigned to user', () => {
        it('returns all properties', (done) => {
          request()
            .post('/api/v1/property/search')
            .set('authorization', userToken)
            .send({})
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body).to.have.property('properties');
              expect(res.body.properties.length).to.be.eql(3);
              done();
            });
        });
      });

      context('when 2 properties have been assigned to user', () => {
        beforeEach(async () => {
          await assignPropertyToUser({
            userId: regularUser._id,
            propertyId: property1._id,
            vendor: vendorUser,
          });
          await assignPropertyToUser({
            userId: regularUser._id,
            propertyId: property2._id,
            vendor: vendorUser,
          });
        });
        it('returns one property', (done) => {
          request()
            .post('/api/v1/property/search')
            .set('authorization', userToken)
            .send({})
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body).to.have.property('properties');
              expect(res.body.properties.length).to.be.eql(1);
              expect(res.body.properties[0]._id).to.be.eql(property3._id.toString());
              done();
            });
        });
      });
    });
  });

  describe('Get distinct property states & types', () => {
    const property1 = PropertyFactory.build({
      houseType: '2 bedroom apartment',
      address: { state: 'taraba' },
      addedBy: vendorUser._id,
      updatedBy: vendorUser._id,
    });
    const property2 = PropertyFactory.build({
      houseType: '4 bedroom semi-detatched',
      address: { state: 'taraba' },
      addedBy: vendorUser._id,
      updatedBy: vendorUser._id,
    });
    const property3 = PropertyFactory.build({
      houseType: '4 bedroom semi-detatched',
      address: { state: 'kano' },
      addedBy: vendorUser._id,
      updatedBy: vendorUser._id,
    });

    describe('when properties exist in db', () => {
      beforeEach(async () => {
        await addProperty(property1);
        await addProperty(property2);
        await addProperty(property3);
      });

      context('with a valid token & id', () => {
        it('returns successful payload', (done) => {
          request()
            .get('/api/v1/property/available-options')
            .set('authorization', userToken)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body).to.have.property('availableFields');
              expect(res.body.availableFields.houseTypes.length).to.be.eql(2);
              expect(res.body.availableFields.states.length).to.be.eql(2);
              expect(res.body.availableFields.houseTypes)
                .to.be.an('array')
                .that.includes('4 bedroom semi-detatched');
              expect(res.body.availableFields.houseTypes)
                .to.be.an('array')
                .that.includes('2 bedroom apartment');
              expect(res.body.availableFields.states).to.be.an('array').that.includes('taraba');
              expect(res.body.availableFields.states).to.be.an('array').that.includes('kano');
              done();
            });
        });
      });

      context('without token', () => {
        it('returns error', (done) => {
          request()
            .get('/api/v1/property/available-options')
            .end((err, res) => {
              expect(res).to.have.status(403);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Token needed to access resources');
              done();
            });
        });
      });

      context('when getAvailablePropertyOptions service fails', () => {
        it('returns the error', (done) => {
          sinon.stub(Property, 'aggregate').throws(new Error('Type Error'));
          request()
            .get('/api/v1/property/available-options')
            .set('authorization', userToken)
            .end((err, res) => {
              expect(res).to.have.status(500);
              done();
              Property.aggregate.restore();
            });
        });
      });
    });
  });

  describe('Get One Portfolio', () => {
    const property = PropertyFactory.build(
      {
        addedBy: vendorUser._id,
        updatedBy: vendorUser._id,
      },
      { generateId: true },
    );

    const enquiry = EnquiryFactory.build(
      {
        propertyId: property._id,
        userId: regularUser._id,
      },
      { generateId: true },
    );

    const offer = OfferFactory.build(
      {
        enquiryId: enquiry._id,
        userId: regularUser._id,
        vendorId: vendorUser._id,
        totalAmountPayable: 1_000_000,
        initialPayment: 500_000,
        periodicPayment: 100_000,
        paymentFrequency: 30,
        initialPaymentDate: new Date('2020-03-01'),
      },
      { generateId: true },
    );

    const transaction1 = TransactionFactory.build(
      {
        propertyId: property._id,
        offerId: offer._id,
        userId: regularUser._id,
        addedBy: adminUser._id,
        updatedBy: adminUser._id,
        amount: 100_000,
      },
      { generateId: true },
    );

    const transaction2 = TransactionFactory.build(
      {
        propertyId: property._id,
        offerId: offer._id,
        userId: regularUser._id,
        addedBy: adminUser._id,
        updatedBy: adminUser._id,
        amount: 250_000,
      },
      { generateId: true },
    );

    const transaction3 = TransactionFactory.build(
      {
        propertyId: property._id,
        offerId: offer._id,
        userId: regularUser._id,
        addedBy: adminUser._id,
        updatedBy: adminUser._id,
        amount: 650_000,
      },
      { generateId: true },
    );

    const acceptOfferData = {
      offerId: offer._id,
      signature: 'http://www.ballers.ng/signature.png',
      user: regularUser._id,
    };

    let fakeDate;

    afterEach(() => {
      fakeDate.restore();
    });

    beforeEach(async () => {
      await addProperty(property);
      await addEnquiry(enquiry);
      await createOffer(offer);
      await acceptOffer(acceptOfferData);
    });

    context('when payment has been made', () => {
      beforeEach(async () => {
        await addTransaction(transaction1);
        await addTransaction(transaction2);
      });

      context('when payment is in second cycle', () => {
        beforeEach(async () => {
          fakeDate = sinon.useFakeTimers({
            now: new Date('2020-03-21'),
          });
        });

        beforeEach(async () => {
          await generateNextPaymentDate({ offerId: offer._id });
        });

        [...new Array(3)].map((_, index) =>
          it('returns portfolio', (done) => {
            request()
              .get(`/api/v1/property/portfolio/${offer._id}`)
              .set('authorization', [userToken, adminToken, vendorToken][index])
              .end((err, res) => {
                expect(res).to.have.status(200);
                expect(res.body.success).to.be.eql(true);
                expect(res.body.portfolio._id).to.be.eql(offer._id.toString());
                expect(res.body.portfolio.propertyInfo._id).to.be.eql(property._id.toString());
                expect(res.body.portfolio.totalAmountPayable).to.be.eql(offer.totalAmountPayable);
                expect(res.body.portfolio.amountContributed).to.be.eql(
                  transaction1.amount + transaction2.amount,
                );
                expect(res.body.portfolio.nextPaymentInfo[0].expectedAmount).to.be.eql(250_000);
                expect(res.body.portfolio.nextPaymentInfo[0].expiresOn).to.have.string(
                  '2020-03-01',
                );
                done();
              });
          }),
        );
      });

      context('when user has completed payment', () => {
        beforeEach(async () => {
          await addTransaction(transaction3);
        });
        it('does not return next payment', (done) => {
          request()
            .get(`/api/v1/property/portfolio/${offer._id}`)
            .set('authorization', userToken)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body.portfolio._id).to.be.eql(offer._id.toString());
              expect(res.body.portfolio.propertyInfo._id).to.be.eql(property._id.toString());
              expect(res.body.portfolio.amountContributed).to.be.eql(
                transaction1.amount + transaction2.amount + transaction3.amount,
              );
              expect(res.body.portfolio.nextPaymentInfo.length).to.be.eql(0);
              done();
            });
        });
      });
    });

    context('when no payment has been made', () => {
      beforeEach(async () => {
        fakeDate = sinon.useFakeTimers({
          now: new Date('2020-03-21'),
        });
        await generateNextPaymentDate({ offerId: offer._id });
      });

      it('returns pending next payment', (done) => {
        request()
          .get(`/api/v1/property/portfolio/${offer._id}`)
          .set('authorization', userToken)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.portfolio._id).to.be.eql(offer._id.toString());
            expect(res.body.portfolio.propertyInfo._id).to.be.eql(property._id.toString());
            expect(res.body.portfolio.totalAmountPayable).to.be.eql(offer.totalAmountPayable);
            expect(res.body.portfolio.amountContributed).to.be.eql(0);
            expect(res.body.portfolio.nextPaymentInfo[0].expectedAmount).to.be.eql(600_000);
            expect(res.body.portfolio.nextPaymentInfo[0].expiresOn).to.have.string('2020-03-01');
            done();
          });
      });
    });

    context('with invalid offer id', () => {
      it('returns not found', (done) => {
        request()
          .get(`/api/v1/property/portfolio/${mongoose.Types.ObjectId()}`)
          .set('authorization', userToken)
          .end((err, res) => {
            expect(res).to.have.status(404);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Portfolio not found');
            done();
          });
      });
    });

    context('with a different user', () => {
      [...new Array(2)].map((_, index) =>
        it('does not return the portfolio', (done) => {
          request()
            .get(`/api/v1/property/portfolio/${offer._id}`)
            .set('authorization', [newVendorToken, newUserToken][index])
            .end((err, res) => {
              expect(res).to.have.status(404);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Portfolio not found');
              done();
            });
        }),
      );
    });

    context('without token', () => {
      it('returns error', (done) => {
        request()
          .get(`/api/v1/property/portfolio/${offer._id}`)
          .end((err, res) => {
            expect(res).to.have.status(403);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Token needed to access resources');
            done();
          });
      });
    });

    context('when getTotalAmountPaidForProperty service fails', () => {
      it('returns the error', (done) => {
        sinon.stub(Transaction, 'aggregate').throws(new Error('Type Error'));
        request()
          .get(`/api/v1/property/portfolio/${offer._id}`)
          .set('authorization', userToken)
          .end((err, res) => {
            expect(res).to.have.status(500);
            done();
            Transaction.aggregate.restore();
          });
      });
    });

    context('when getPortfolio service fails', () => {
      it('returns the error', (done) => {
        sinon.stub(Offer, 'aggregate').throws(new Error('Type Error'));
        request()
          .get(`/api/v1/property/portfolio/${offer._id}`)
          .set('authorization', userToken)
          .end((err, res) => {
            expect(res).to.have.status(500);
            done();
            Offer.aggregate.restore();
          });
      });
    });
  });

  describe('Get All Portfolios', () => {
    const method = 'get';
    const endpoint = '/api/v1/property/portfolio/all';
    const offerStatus = Object.keys(OFFER_STATUS);
    const allOfferStatus = [
      ...offerStatus,
      ...offerStatus,
      ...offerStatus,
      ...offerStatus,
      offerStatus[1],
    ];
    const properties = allOfferStatus.map(() =>
      PropertyFactory.build(
        {
          addedBy: vendorUser._id,
          updatedBy: vendorUser._id,
        },
        { generateId: true },
      ),
    );
    const property = PropertyFactory.build(
      {
        addedBy: vendorUser._id,
        updatedBy: vendorUser._id,
      },
      { generateId: true },
    );

    const enquiries = allOfferStatus.map((_, index) =>
      EnquiryFactory.build(
        {
          propertyId: properties[index]._id,
          userId: regularUser._id,
          vendorId: properties[index].addedBy,
        },
        { generateId: true },
      ),
    );
    const enquiry = EnquiryFactory.build(
      {
        propertyId: property._id,
        userId: regularUser._id,
        vendorId: property.addedBy,
      },
      { generateId: true },
    );

    const offers = allOfferStatus.map((_, index) =>
      OfferFactory.build(
        {
          propertyId: properties[index]._id,
          enquiryId: enquiries[index]._id,
          userId: regularUser._id,
          vendorId: vendorUser._id,
          status: OFFER_STATUS[allOfferStatus[index]],
          referenceCode: '123456XXX',
        },
        { generateId: true },
      ),
    );

    const offer = OfferFactory.build(
      {
        propertyId: property._id,
        enquiryId: enquiry._id,
        userId: regularUser._id,
        vendorId: vendorUser._id,
        status: OFFER_STATUS.RESOLVED,
        referenceCode: '123456XXX',
      },
      { generateId: true },
    );

    const resolvedNextPayments = NextPaymentFactory.buildList(3, {
      offerId: offer._id,
      userId: regularUser._id,
      vendorId: vendorUser._id,
      expectedAmount: 300_000,
      resolved: true,
    });

    const unResolvedNextPayment = NextPaymentFactory.build({
      offerId: offer._id,
      userId: regularUser._id,
      vendorId: vendorUser._id,
      expectedAmount: 100_000,
      resolved: false,
    });

    describe('Portfolio Pagination', () => {
      context('when no portfolio exists in db', () => {
        [adminUser, vendorUser, regularUser].map((user) =>
          itReturnsEmptyValuesWhenNoItemExistInDatabase({
            endpoint,
            method,
            user,
            useExistingUser: true,
          }),
        );
      });

      describe('when portfolio exist in db', () => {
        beforeEach(async () => {
          await Property.insertMany([property, ...properties]);
          await Enquiry.insertMany([enquiry, ...enquiries]);
          await Offer.insertMany([offer, ...offers]);
          await NextPayment.insertMany([...resolvedNextPayments, unResolvedNextPayment]);
        });

        itReturnsTheRightPaginationValue({
          endpoint,
          method,
          user: adminUser,
          useExistingUser: true,
        });

        context('with a valid token & id', () => {
          [...new Array(3)].map((_, index) =>
            it('returns successful payload', (done) => {
              request()
                .get('/api/v1/property/portfolio/all')
                .set('authorization', [userToken, vendorToken, adminToken][index])
                .end((err, res) => {
                  expect(res).to.have.status(200);
                  expect(res.body.success).to.be.eql(true);
                  expect(res.body.pagination.total).to.be.eql(18);
                  expect(res.body.result[0].nextPaymentInfo.length).to.be.eql(1);
                  expect(res.body.result[0].nextPaymentInfo[0].resolved).to.be.eql(false);
                  expect(res.body.result[0].nextPaymentInfo[0].expectedAmount).to.be.eql(
                    unResolvedNextPayment.expectedAmount,
                  );
                  expect(res.body.result[0].nextPaymentInfo[0].offerId).to.be.eql(
                    offer._id.toString(),
                  );
                  res.body.result.forEach((portfolio) => {
                    expect(portfolio.userId).to.be.eql(regularUser._id.toString());
                    expect(portfolio.vendorId).to.be.eql(vendorUser._id.toString());
                    expect(portfolio.vendorInfo._id).to.be.eql(vendorUser._id.toString());
                    expect(portfolio.userInfo._id).to.be.eql(regularUser._id.toString());
                  });
                  done();
                });
            }),
          );
        });

        context('with a vendor token not attached to any portfolio', () => {
          it('returns no portfolio', (done) => {
            request()
              [method](endpoint)
              .set('authorization', newVendorToken)
              .end((err, res) => {
                expectsPaginationToReturnTheRightValues(res, {
                  ...defaultPaginationResult,
                  total: 0,
                  result: 0,
                  totalPage: 0,
                });
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

        itReturnsForbiddenForNoToken({ endpoint, method });

        itReturnsNotFoundForInvalidToken({
          endpoint,
          method,
          user: adminUser,
          userId: adminUser._id,
          useExistingUser: true,
        });

        itReturnsAnErrorWhenServiceFails({
          endpoint,
          method,
          user: regularUser,
          model: Offer,
          modelMethod: 'aggregate',
          useExistingUser: true,
        });
      });
    });
  });

  describe('Add Neighborhood to property', () => {
    const property = PropertyFactory.build(
      {
        neighborhood: {
          schools: [
            {
              name: 'covenant university',
              distance: 5,
              mapLocation: {
                longitude: 123.22,
                latitude: 123.11,
              },
            },
            {
              name: 'babcock university',
              distance: 15,
              mapLocation: {
                longitude: 123.22,
                latitude: 123.11,
              },
            },
          ],
        },
        addedBy: vendorUser._id,
        updatedBy: vendorUser._id,
      },
      { generateId: true },
    );
    const endpoint = `/api/v1/property/${property._id}/neighborhood`;
    const method = 'post';

    const data = {
      type: 'schools',
      neighborhood: {
        name: 'bingham university',
        distance: 5,
        mapLocation: {
          longitude: 123.22,
          latitude: 123.11,
        },
      },
    };

    beforeEach(async () => {
      await addProperty(property);
    });

    context('with a valid token & id', () => {
      it('returns successful payload', (done) => {
        request()
          [method](endpoint)
          .set('authorization', vendorToken)
          .send(data)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.message).to.be.eql('Neighborhood added');
            expect(res.body.property.neighborhood.schools.length).to.be.eql(3);
            expect(res.body.property.neighborhood.schools[0].name).to.be.eql(
              property.neighborhood.schools[0].name,
            );
            expect(res.body.property.neighborhood.schools[1].name).to.be.eql(
              property.neighborhood.schools[1].name,
            );
            expect(res.body.property.neighborhood.schools[2].name).to.be.eql(
              data.neighborhood.name,
            );
            done();
          });
      });
    });

    context('when property id is invalid', () => {
      const invalidPropertyId = mongoose.Types.ObjectId();
      it('returns successful payload', (done) => {
        request()
          [method](`/api/v1/property/${invalidPropertyId}/neighborhood`)
          .set('authorization', vendorToken)
          .send(data)
          .end((err, res) => {
            expect(res).to.have.status(404);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Invalid property');
            done();
          });
      });
    });

    context('when request is made by another vendor', () => {
      it('returns successful payload', (done) => {
        request()
          [method](endpoint)
          .set('authorization', newVendorToken)
          .send(data)
          .end((err, res) => {
            expect(res).to.have.status(403);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('You are not permitted to perform this action');
            done();
          });
      });
    });

    context('when user has invalid access token', () => {
      [regularUser, adminUser].map((user) =>
        itReturnsForbiddenForTokenWithInvalidAccess({
          endpoint,
          method,
          user,
          data,
          useExistingUser: true,
        }),
      );
    });

    itReturnsForbiddenForNoToken({ endpoint, method });

    itReturnsNotFoundForInvalidToken({
      endpoint,
      method,
      user: vendorUser,
      userId: vendorUser._id,
      data,
      useExistingUser: true,
    });

    context('when update service returns an error', () => {
      it('returns the error', (done) => {
        sinon.stub(Property, 'findByIdAndUpdate').throws(new Error('Type Error'));
        request()
          [method](endpoint)
          .set('authorization', vendorToken)
          .send(data)
          .end((err, res) => {
            expect(res).to.have.status(400);
            expect(res.body.success).to.be.eql(false);
            done();
            Property.findByIdAndUpdate.restore();
          });
      });
    });
  });

  describe('Update Neighborhood', () => {
    const property = PropertyFactory.build(
      {
        neighborhood: {
          schools: [
            {
              _id: mongoose.Types.ObjectId(),
              name: 'covenant university',
              distance: 5,
              mapLocation: {
                longitude: 123.22,
                latitude: 123.11,
              },
            },
            {
              _id: mongoose.Types.ObjectId(),
              name: 'babcock university',
              distance: 15,
              mapLocation: {
                longitude: 123.22,
                latitude: 123.11,
              },
            },
            {
              _id: mongoose.Types.ObjectId(),
              name: 'bingham university',
              distance: 5,
              mapLocation: {
                longitude: 123.22,
                latitude: 123.11,
              },
            },
          ],
          hospitals: [
            {
              _id: mongoose.Types.ObjectId(),
              name: 'Reddington Hospital',
              distance: 5,
              mapLocation: {
                longitude: 123.22,
                latitude: 123.11,
              },
            },
            {
              _id: mongoose.Types.ObjectId(),
              name: 'Primrose General',
              distance: 15,
              mapLocation: {
                longitude: 123.22,
                latitude: 123.11,
              },
            },
          ],
        },
        addedBy: vendorUser._id,
        updatedBy: vendorUser._id,
      },
      { generateId: true },
    );
    const endpoint = `/api/v1/property/${property._id}/neighborhood`;
    const method = 'put';

    const data = {
      type: 'schools',
      typeId: property.neighborhood.schools[0]._id,
      neighborhood: {
        name: 'unilorin',
        distance: 15,
        mapLocation: {
          longitude: 105.22,
          latitude: 105.11,
        },
      },
    };

    beforeEach(async () => {
      await addProperty(property);
    });

    context('with a valid token & id', () => {
      it('returns successful payload', (done) => {
        request()
          [method](endpoint)
          .set('authorization', vendorToken)
          .send(data)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.message).to.be.eql('Neighborhood updated');
            expect(res.body.property.neighborhood.schools[0]._id).to.be.eql(data.typeId.toString());
            expect(res.body.property.neighborhood.schools[0].name).to.be.eql(
              data.neighborhood.name,
            );
            expect(res.body.property.neighborhood.schools[0].distance).to.be.eql(
              data.neighborhood.distance,
            );
            expect(res.body.property.neighborhood.schools[0].mapLocation).to.be.eql(
              data.neighborhood.mapLocation,
            );
            expect(res.body.property.neighborhood.schools[1].name).to.be.eql(
              property.neighborhood.schools[1].name,
            );
            expect(res.body.property.neighborhood.schools[2].name).to.be.eql(
              property.neighborhood.schools[2].name,
            );
            expect(res.body.property.neighborhood.hospitals[0].name).to.be.eql(
              property.neighborhood.hospitals[0].name,
            );
            expect(res.body.property.neighborhood.hospitals[1].name).to.be.eql(
              property.neighborhood.hospitals[1].name,
            );
            done();
          });
      });
    });

    context('when property id is invalid', () => {
      const invalidPropertyId = mongoose.Types.ObjectId();
      it('returns successful payload', (done) => {
        request()
          [method](`/api/v1/property/${invalidPropertyId}/neighborhood`)
          .set('authorization', vendorToken)
          .send(data)
          .end((err, res) => {
            expect(res).to.have.status(404);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Invalid property');
            done();
          });
      });
    });

    context('when request is made by another vendor', () => {
      it('returns successful payload', (done) => {
        request()
          [method](endpoint)
          .set('authorization', newVendorToken)
          .send(data)
          .end((err, res) => {
            expect(res).to.have.status(403);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('You are not permitted to perform this action');
            done();
          });
      });
    });

    context('when user has invalid access token', () => {
      [regularUser, adminUser].map((user) =>
        itReturnsForbiddenForTokenWithInvalidAccess({
          endpoint,
          method,
          user,
          data,
          useExistingUser: true,
        }),
      );
    });

    itReturnsForbiddenForNoToken({ endpoint, method });

    itReturnsNotFoundForInvalidToken({
      endpoint,
      method,
      user: vendorUser,
      userId: vendorUser._id,
      data,
      useExistingUser: true,
    });

    context('when update service returns an error', () => {
      it('returns the error', (done) => {
        sinon.stub(Property, 'findOneAndUpdate').throws(new Error('Type Error'));
        request()
          [method](endpoint)
          .set('authorization', vendorToken)
          .send(data)
          .end((err, res) => {
            expect(res).to.have.status(400);
            expect(res.body.success).to.be.eql(false);
            done();
            Property.findOneAndUpdate.restore();
          });
      });
    });
  });

  describe('Delete Neighborhood', () => {
    const property = PropertyFactory.build(
      {
        neighborhood: {
          hospitals: [
            {
              _id: mongoose.Types.ObjectId(),
              name: 'Reddington Hospital',
              distance: 5,
              mapLocation: {
                longitude: 123.22,
                latitude: 123.11,
              },
            },
            {
              _id: mongoose.Types.ObjectId(),
              name: 'Primrose General',
              distance: 15,
              mapLocation: {
                longitude: 123.22,
                latitude: 123.11,
              },
            },
          ],
        },
        addedBy: vendorUser._id,
        updatedBy: vendorUser._id,
      },
      { generateId: true },
    );
    const endpoint = `/api/v1/property/${property._id}/neighborhood`;
    const method = 'delete';

    const data = {
      type: 'hospitals',
      typeId: property.neighborhood.hospitals[1]._id,
    };

    beforeEach(async () => {
      await addProperty(property);
    });

    context('with a valid token & id', () => {
      it('returns successful payload', (done) => {
        request()
          [method](endpoint)
          .set('authorization', vendorToken)
          .send(data)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.message).to.be.eql('Neighborhood deleted');
            expect(res.body.property.neighborhood.hospitals.length).to.be.eql(1);
            expect(res.body.property.neighborhood.hospitals[0]._id).to.be.eql(
              property.neighborhood.hospitals[0]._id.toString(),
            );
            expect(res.body.property.neighborhood.hospitals[0].name).to.be.eql(
              property.neighborhood.hospitals[0].name,
            );
            expect(res.body.property.neighborhood.hospitals[0].distance).to.be.eql(
              property.neighborhood.hospitals[0].distance,
            );
            expect(res.body.property.neighborhood.hospitals[0].mapLocation).to.be.eql(
              property.neighborhood.hospitals[0].mapLocation,
            );

            done();
          });
      });
    });

    context('when property id is invalid', () => {
      const invalidPropertyId = mongoose.Types.ObjectId();
      it('returns successful payload', (done) => {
        request()
          [method](`/api/v1/property/${invalidPropertyId}/neighborhood`)
          .set('authorization', vendorToken)
          .send(data)
          .end((err, res) => {
            expect(res).to.have.status(404);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Invalid property');
            done();
          });
      });
    });

    context('when request is made by another vendor', () => {
      it('returns successful payload', (done) => {
        request()
          [method](endpoint)
          .set('authorization', newVendorToken)
          .send(data)
          .end((err, res) => {
            expect(res).to.have.status(403);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('You are not permitted to perform this action');
            done();
          });
      });
    });

    context('when user has invalid access token', () => {
      [regularUser, adminUser].map((user) =>
        itReturnsForbiddenForTokenWithInvalidAccess({
          endpoint,
          method,
          user,
          data,
          useExistingUser: true,
        }),
      );
    });

    itReturnsForbiddenForNoToken({ endpoint, method });

    itReturnsNotFoundForInvalidToken({
      endpoint,
      method,
      user: vendorUser,
      userId: vendorUser._id,
      data,
      useExistingUser: true,
    });

    context('when update service returns an error', () => {
      it('returns the error', (done) => {
        sinon.stub(Property, 'findByIdAndUpdate').throws(new Error('Type Error'));
        request()
          [method](endpoint)
          .set('authorization', vendorToken)
          .send(data)
          .end((err, res) => {
            expect(res).to.have.status(400);
            expect(res.body.success).to.be.eql(false);
            done();
            Property.findByIdAndUpdate.restore();
          });
      });
    });
  });

  describe('Add Floor plan to property', () => {
    const property = PropertyFactory.build(
      {
        floorPlans: [
          {
            name: 'first floor',
            plan: 'https://ballers.ng/firstfloor.png',
          },
        ],
        addedBy: vendorUser._id,
        updatedBy: vendorUser._id,
      },
      { generateId: true },
    );
    const endpoint = `/api/v1/property/${property._id}/floorplan`;
    const method = 'post';

    const data = {
      name: 'second floor',
      plan: 'https://ballers.ng/secondfloor.png',
    };

    beforeEach(async () => {
      await addProperty(property);
    });

    context('with a valid token & id', () => {
      it('returns successful payload', (done) => {
        request()
          [method](endpoint)
          .set('authorization', vendorToken)
          .send(data)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.message).to.be.eql('Floor Plan added');
            expect(res.body.property.floorPlans.length).to.be.eql(2);
            expect(res.body.property.floorPlans[0].plan).to.be.eql(property.floorPlans[0].plan);
            expect(res.body.property.floorPlans[0].name).to.be.eql(property.floorPlans[0].name);
            expect(res.body.property.floorPlans[1].plan).to.be.eql(data.plan);
            expect(res.body.property.floorPlans[1].name).to.be.eql(data.name);
            done();
          });
      });
    });

    context('when property id is invalid', () => {
      const invalidPropertyId = mongoose.Types.ObjectId();
      it('returns successful payload', (done) => {
        request()
          [method](`/api/v1/property/${invalidPropertyId}/floorplan`)
          .set('authorization', vendorToken)
          .send(data)
          .end((err, res) => {
            expect(res).to.have.status(404);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Invalid property');
            done();
          });
      });
    });

    context('when request is made by another vendor', () => {
      it('returns successful payload', (done) => {
        request()
          [method](endpoint)
          .set('authorization', newVendorToken)
          .send(data)
          .end((err, res) => {
            expect(res).to.have.status(403);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('You are not permitted to perform this action');
            done();
          });
      });
    });

    context('when user has invalid access token', () => {
      [regularUser, adminUser].map((user) =>
        itReturnsForbiddenForTokenWithInvalidAccess({
          endpoint,
          method,
          user,
          data,
          useExistingUser: true,
        }),
      );
    });

    itReturnsForbiddenForNoToken({ endpoint, method });

    itReturnsNotFoundForInvalidToken({
      endpoint,
      method,
      user: vendorUser,
      userId: vendorUser._id,
      data,
      useExistingUser: true,
    });

    context('when update service returns an error', () => {
      it('returns the error', (done) => {
        sinon.stub(Property, 'findByIdAndUpdate').throws(new Error('Type Error'));
        request()
          [method](endpoint)
          .set('authorization', vendorToken)
          .send(data)
          .end((err, res) => {
            expect(res).to.have.status(400);
            expect(res.body.success).to.be.eql(false);
            done();
            Property.findByIdAndUpdate.restore();
          });
      });
    });
  });

  describe('Update Floor plan', () => {
    const property = PropertyFactory.build(
      {
        floorPlans: [
          {
            _id: mongoose.Types.ObjectId(),
            name: 'ground floor',
            plan: 'https://ballers.ng/groundfloor.png',
          },
          {
            _id: mongoose.Types.ObjectId(),
            name: 'second floor',
            plan: 'https://ballers.ng/secondfloor.png',
          },
        ],
        addedBy: vendorUser._id,
        updatedBy: vendorUser._id,
      },
      { generateId: true },
    );
    const endpoint = `/api/v1/property/${property._id}/floorplan`;
    const method = 'put';

    const data = {
      name: 'bottom floor',
      plan: 'https://ballers.ng/bottomfloor.png',
      floorPlanId: property.floorPlans[1]._id,
    };

    beforeEach(async () => {
      await addProperty(property);
    });

    context('with a valid token & id', () => {
      it('returns successful payload', (done) => {
        request()
          [method](endpoint)
          .set('authorization', vendorToken)
          .send(data)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.message).to.be.eql('Floor Plan updated');
            expect(res.body.property.floorPlans[0].plan).to.be.eql(property.floorPlans[0].plan);
            expect(res.body.property.floorPlans[0].name).to.be.eql(property.floorPlans[0].name);
            expect(res.body.property.floorPlans[1]._id).to.be.eql(data.floorPlanId.toString());
            expect(res.body.property.floorPlans[1].plan).to.be.eql(data.plan);
            expect(res.body.property.floorPlans[1].name).to.be.eql(data.name);
            done();
          });
      });
    });

    context('when property id is invalid', () => {
      const invalidPropertyId = mongoose.Types.ObjectId();
      it('returns successful payload', (done) => {
        request()
          [method](`/api/v1/property/${invalidPropertyId}/floorplan`)
          .set('authorization', vendorToken)
          .send(data)
          .end((err, res) => {
            expect(res).to.have.status(404);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Invalid property');
            done();
          });
      });
    });

    context('when request is made by another vendor', () => {
      it('returns successful payload', (done) => {
        request()
          [method](endpoint)
          .set('authorization', newVendorToken)
          .send(data)
          .end((err, res) => {
            expect(res).to.have.status(403);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('You are not permitted to perform this action');
            done();
          });
      });
    });

    context('when user has invalid access token', () => {
      [regularUser, adminUser].map((user) =>
        itReturnsForbiddenForTokenWithInvalidAccess({
          endpoint,
          method,
          user,
          data,
          useExistingUser: true,
        }),
      );
    });

    itReturnsForbiddenForNoToken({ endpoint, method });

    itReturnsNotFoundForInvalidToken({
      endpoint,
      method,
      user: vendorUser,
      userId: vendorUser._id,
      data,
      useExistingUser: true,
    });

    context('when update service returns an error', () => {
      it('returns the error', (done) => {
        sinon.stub(Property, 'findOneAndUpdate').throws(new Error('Type Error'));
        request()
          [method](endpoint)
          .set('authorization', vendorToken)
          .send(data)
          .end((err, res) => {
            expect(res).to.have.status(400);
            expect(res.body.success).to.be.eql(false);
            done();
            Property.findOneAndUpdate.restore();
          });
      });
    });
  });

  describe('Delete Floor plan', () => {
    const property = PropertyFactory.build(
      {
        floorPlans: [
          {
            _id: mongoose.Types.ObjectId(),
            name: 'ground floor',
            plan: 'https://ballers.ng/groundfloor.png',
          },
          {
            _id: mongoose.Types.ObjectId(),
            name: 'second floor',
            plan: 'https://ballers.ng/secondfloor.png',
          },
        ],
        addedBy: vendorUser._id,
        updatedBy: vendorUser._id,
      },
      { generateId: true },
    );
    const endpoint = `/api/v1/property/${property._id}/floorplan`;
    const method = 'delete';

    const data = {
      floorPlanId: property.floorPlans[0]._id,
    };

    beforeEach(async () => {
      await addProperty(property);
    });

    context('with a valid token & id', () => {
      it('returns successful payload', (done) => {
        request()
          [method](endpoint)
          .set('authorization', vendorToken)
          .send(data)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.message).to.be.eql('Floor Plan deleted');
            expect(res.body.property.floorPlans.length).to.be.eql(1);
            expect(res.body.property.floorPlans[0].plan).to.be.eql(property.floorPlans[1].plan);
            expect(res.body.property.floorPlans[0].name).to.be.eql(property.floorPlans[1].name);
            done();
          });
      });
    });

    context('when property id is invalid', () => {
      const invalidPropertyId = mongoose.Types.ObjectId();
      it('returns successful payload', (done) => {
        request()
          [method](`/api/v1/property/${invalidPropertyId}/floorplan`)
          .set('authorization', vendorToken)
          .send(data)
          .end((err, res) => {
            expect(res).to.have.status(404);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Invalid property');
            done();
          });
      });
    });

    context('when request is made by another vendor', () => {
      it('returns successful payload', (done) => {
        request()
          [method](endpoint)
          .set('authorization', newVendorToken)
          .send(data)
          .end((err, res) => {
            expect(res).to.have.status(403);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('You are not permitted to perform this action');
            done();
          });
      });
    });

    context('when user has invalid access token', () => {
      [regularUser, adminUser].map((user) =>
        itReturnsForbiddenForTokenWithInvalidAccess({
          endpoint,
          method,
          user,
          data,
          useExistingUser: true,
        }),
      );
    });

    itReturnsForbiddenForNoToken({ endpoint, method });

    itReturnsNotFoundForInvalidToken({
      endpoint,
      method,
      user: vendorUser,
      userId: vendorUser._id,
      data,
      useExistingUser: true,
    });

    context('when update service returns an error', () => {
      it('returns the error', (done) => {
        sinon.stub(Property, 'findByIdAndUpdate').throws(new Error('Type Error'));
        request()
          [method](endpoint)
          .set('authorization', vendorToken)
          .send(data)
          .end((err, res) => {
            expect(res).to.have.status(400);
            expect(res.body.success).to.be.eql(false);
            done();
            Property.findByIdAndUpdate.restore();
          });
      });
    });
  });

  describe('Add Image to property gallery', () => {
    const property = PropertyFactory.build(
      {
        gallery: [
          {
            title: 'first image',
            url: 'https://ballers.ng/firstimage.png',
          },
        ],
        addedBy: vendorUser._id,
        updatedBy: vendorUser._id,
      },
      { generateId: true },
    );
    const endpoint = `/api/v1/property/${property._id}/gallery`;
    const method = 'post';

    const data = {
      title: 'second image',
      url: 'https://ballers.ng/secondimage.png',
    };

    beforeEach(async () => {
      await addProperty(property);
    });

    context('with a valid token & id', () => {
      it('returns successful payload', (done) => {
        request()
          [method](endpoint)
          .set('authorization', vendorToken)
          .send(data)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.message).to.be.eql('Image added');
            expect(res.body.property.gallery.length).to.be.eql(2);
            expect(res.body.property.gallery[0].title).to.be.eql(property.gallery[0].title);
            expect(res.body.property.gallery[0].url).to.be.eql(property.gallery[0].url);
            expect(res.body.property.gallery[1].title).to.be.eql(data.title);
            expect(res.body.property.gallery[1].url).to.be.eql(data.url);
            done();
          });
      });
    });

    context('when property id is invalid', () => {
      const invalidPropertyId = mongoose.Types.ObjectId();
      it('returns successful payload', (done) => {
        request()
          [method](`/api/v1/property/${invalidPropertyId}/gallery`)
          .set('authorization', vendorToken)
          .send(data)
          .end((err, res) => {
            expect(res).to.have.status(404);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Invalid property');
            done();
          });
      });
    });

    context('when request is made by another vendor', () => {
      it('returns successful payload', (done) => {
        request()
          [method](endpoint)
          .set('authorization', newVendorToken)
          .send(data)
          .end((err, res) => {
            expect(res).to.have.status(403);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('You are not permitted to perform this action');
            done();
          });
      });
    });

    context('when image with same title already exists', () => {
      it('returns error', (done) => {
        request()
          [method](endpoint)
          .set('authorization', vendorToken)
          .send({
            title: property.gallery[0].title,
            url: 'https://ballers.ng/randomimage.png',
          })
          .end((err, res) => {
            expect(res).to.have.status(412);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Image with title already exists');
            done();
          });
      });
    });

    context('when user has invalid access token', () => {
      [regularUser, adminUser].map((user) =>
        itReturnsForbiddenForTokenWithInvalidAccess({
          endpoint,
          method,
          user,
          data,
          useExistingUser: true,
        }),
      );
    });

    itReturnsForbiddenForNoToken({ endpoint, method });

    itReturnsNotFoundForInvalidToken({
      endpoint,
      method,
      user: vendorUser,
      userId: vendorUser._id,
      data,
      useExistingUser: true,
    });

    context('when update service returns an error', () => {
      it('returns the error', (done) => {
        sinon.stub(Property, 'findByIdAndUpdate').throws(new Error('Type Error'));
        request()
          [method](endpoint)
          .set('authorization', vendorToken)
          .send(data)
          .end((err, res) => {
            expect(res).to.have.status(400);
            expect(res.body.success).to.be.eql(false);
            done();
            Property.findByIdAndUpdate.restore();
          });
      });
    });
  });

  describe('Update Image in gallery', () => {
    const property = PropertyFactory.build(
      {
        gallery: [
          {
            _id: mongoose.Types.ObjectId(),
            title: 'front view',
            url: 'https://ballers.ng/frontview.png',
          },
          {
            _id: mongoose.Types.ObjectId(),
            title: 'back view',
            url: 'https://ballers.ng/backview.png',
          },
        ],
        addedBy: vendorUser._id,
        updatedBy: vendorUser._id,
      },
      { generateId: true },
    );
    const endpoint = `/api/v1/property/${property._id}/gallery`;
    const method = 'put';

    const data = {
      title: 'new view',
      url: 'https://ballers.ng/newview.png',
      imageId: property.gallery[1]._id,
    };

    beforeEach(async () => {
      await addProperty(property);
    });

    context('with a valid token & id', () => {
      it('returns successful payload', (done) => {
        request()
          [method](endpoint)
          .set('authorization', vendorToken)
          .send(data)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.message).to.be.eql('Image updated');
            expect(res.body.property.gallery[0].title).to.be.eql(property.gallery[0].title);
            expect(res.body.property.gallery[0].url).to.be.eql(property.gallery[0].url);
            expect(res.body.property.gallery[1]._id).to.be.eql(data.imageId.toString());
            expect(res.body.property.gallery[1].title).to.be.eql(data.title);
            expect(res.body.property.gallery[1].url).to.be.eql(data.url);
            done();
          });
      });
    });

    context('when property id is invalid', () => {
      const invalidPropertyId = mongoose.Types.ObjectId();
      it('returns successful payload', (done) => {
        request()
          [method](`/api/v1/property/${invalidPropertyId}/gallery`)
          .set('authorization', vendorToken)
          .send(data)
          .end((err, res) => {
            expect(res).to.have.status(404);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Invalid property');
            done();
          });
      });
    });

    context('when request is made by another vendor', () => {
      it('returns successful payload', (done) => {
        request()
          [method](endpoint)
          .set('authorization', newVendorToken)
          .send(data)
          .end((err, res) => {
            expect(res).to.have.status(403);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('You are not permitted to perform this action');
            done();
          });
      });
    });

    context('when image with same title exists', () => {
      context('with different image id', () => {
        it('returns error', (done) => {
          request()
            [method](endpoint)
            .set('authorization', vendorToken)
            .send({
              imageId: property.gallery[1]._id,
              title: property.gallery[0].title,
              url: 'https://ballers.ng/randomimage.png',
            })
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Image with title already exists');
              done();
            });
        });
      });

      context('with same image id', () => {
        it('updates image', (done) => {
          request()
            [method](endpoint)
            .set('authorization', vendorToken)
            .send({
              imageId: property.gallery[0]._id,
              title: property.gallery[0].title,
              url: 'https://ballers.ng/randomimage.png',
            })
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body.message).to.be.eql('Image updated');
              done();
            });
        });
      });
    });

    context('when user has invalid access token', () => {
      [regularUser, adminUser].map((user) =>
        itReturnsForbiddenForTokenWithInvalidAccess({
          endpoint,
          method,
          user,
          data,
          useExistingUser: true,
        }),
      );
    });

    itReturnsForbiddenForNoToken({ endpoint, method });

    itReturnsNotFoundForInvalidToken({
      endpoint,
      method,
      user: vendorUser,
      userId: vendorUser._id,
      data,
      useExistingUser: true,
    });

    context('when update service returns an error', () => {
      it('returns the error', (done) => {
        sinon.stub(Property, 'findOneAndUpdate').throws(new Error('Type Error'));
        request()
          [method](endpoint)
          .set('authorization', vendorToken)
          .send(data)
          .end((err, res) => {
            expect(res).to.have.status(400);
            expect(res.body.success).to.be.eql(false);
            done();
            Property.findOneAndUpdate.restore();
          });
      });
    });
  });

  describe('Delete Image from gallery', () => {
    const property = PropertyFactory.build(
      {
        gallery: [
          {
            _id: mongoose.Types.ObjectId(),
            title: 'front view',
            url: 'https://ballers.ng/frontview.png',
          },
          {
            _id: mongoose.Types.ObjectId(),
            title: 'back view',
            url: 'https://ballers.ng/backview.png',
          },
        ],
        addedBy: vendorUser._id,
        updatedBy: vendorUser._id,
      },
      { generateId: true },
    );
    const endpoint = `/api/v1/property/${property._id}/gallery`;
    const method = 'delete';

    const data = {
      imageId: property.gallery[0]._id,
    };

    beforeEach(async () => {
      await addProperty(property);
    });

    context('with a valid token & id', () => {
      it('returns successful payload', (done) => {
        request()
          [method](endpoint)
          .set('authorization', vendorToken)
          .send(data)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.message).to.be.eql('Image deleted');
            expect(res.body.property.gallery.length).to.be.eql(1);
            expect(res.body.property.gallery[0].title).to.be.eql(property.gallery[1].title);
            expect(res.body.property.gallery[0].url).to.be.eql(property.gallery[1].url);
            done();
          });
      });
    });

    context('when property id is invalid', () => {
      const invalidPropertyId = mongoose.Types.ObjectId();
      it('returns successful payload', (done) => {
        request()
          [method](`/api/v1/property/${invalidPropertyId}/gallery`)
          .set('authorization', vendorToken)
          .send(data)
          .end((err, res) => {
            expect(res).to.have.status(404);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Invalid property');
            done();
          });
      });
    });

    context('when request is made by another vendor', () => {
      it('returns successful payload', (done) => {
        request()
          [method](endpoint)
          .set('authorization', newVendorToken)
          .send(data)
          .end((err, res) => {
            expect(res).to.have.status(403);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('You are not permitted to perform this action');
            done();
          });
      });
    });

    context('when user has invalid access token', () => {
      [regularUser, adminUser].map((user) =>
        itReturnsForbiddenForTokenWithInvalidAccess({
          endpoint,
          method,
          user,
          data,
          useExistingUser: true,
        }),
      );
    });

    itReturnsForbiddenForNoToken({ endpoint, method });

    itReturnsNotFoundForInvalidToken({
      endpoint,
      method,
      user: vendorUser,
      userId: vendorUser._id,
      data,
      useExistingUser: true,
    });

    context('when update service returns an error', () => {
      it('returns the error', (done) => {
        sinon.stub(Property, 'findByIdAndUpdate').throws(new Error('Type Error'));
        request()
          [method](endpoint)
          .set('authorization', vendorToken)
          .send(data)
          .end((err, res) => {
            expect(res).to.have.status(400);
            expect(res.body.success).to.be.eql(false);
            done();
            Property.findByIdAndUpdate.restore();
          });
      });
    });
  });

  describe('Flag property', () => {
    const endpoint = '/api/v1/property/flag';
    const method = 'put';

    const property = PropertyFactory.build(
      {
        flagged: {
          status: false,
        },
        addedBy: vendorUser._id,
        updatedBy: vendorUser._id,
      },
      { generateId: true },
    );

    const report = ReportedPropertyFactory.build(
      {
        propertyId: property._id,
        reason: 'fraudulent vendor',
        reportedBy: regularUser._id,
        resolved: {
          status: false,
        },
      },
      { generateId: true },
    );

    const data = {
      propertyId: property._id,
      reportId: report._id,
      reason: 'fraudulent property flagged',
    };

    beforeEach(async () => {
      await addProperty(property);
      await reportProperty(report);
    });

    context('with a valid token & id', () => {
      it('returns successful payload', (done) => {
        request()
          [method](endpoint)
          .set('authorization', adminToken)
          .send(data)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.message).to.be.eql('Property flagged');
            expect(res.body.property.flagged.status).to.be.eql(true);
            expect(res.body.property.flagged.case[0].flaggedBy).to.be.eql(adminUser._id.toString());
            expect(res.body.property.flagged.case[0].flaggedReason).to.be.eql(data.reason);
            expect(sendMailStub.callCount).to.eq(1);
            expect(sendMailStub).to.have.be.calledWith(EMAIL_CONTENT.FLAG_PROPERTY);
            done();
          });
      });
    });

    context('when data is invalid', () => {
      context('when propertyId is empty', () => {
        it('returns an error', (done) => {
          request()
            [method](endpoint)
            .set('authorization', adminToken)
            .send({ ...data, propertyId: '' })
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Property id" is not allowed to be empty');
              expect(sendMailStub.callCount).to.eq(0);
              done();
            });
        });
      });

      context('when reportId is empty', () => {
        it('returns an error', (done) => {
          request()
            [method](endpoint)
            .set('authorization', adminToken)
            .send({ ...data, reportId: '' })
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Report id" is not allowed to be empty');
              expect(sendMailStub.callCount).to.eq(0);
              done();
            });
        });
      });

      context('when reportId is missing', () => {
        it('property is flagged', (done) => {
          request()
            [method](endpoint)
            .set('authorization', adminToken)
            .send({ propertyId: property._id, reason: 'fraudulent property flagged' })
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body.message).to.be.eql('Property flagged');
              expect(res.body.property.flagged.status).to.be.eql(true);
              expect(res.body.property.flagged.case[0].flaggedBy).to.be.eql(
                adminUser._id.toString(),
              );
              expect(res.body.property.flagged.case[0].flaggedReason).to.be.eql(data.reason);
              expect(sendMailStub.callCount).to.eq(1);
              expect(sendMailStub).to.have.be.calledWith(EMAIL_CONTENT.FLAG_PROPERTY);
              done();
            });
        });
      });

      context('when property id is invalid', () => {
        it('returns anerror', (done) => {
          request()
            [method](endpoint)
            .set('authorization', adminToken)
            .send({ ...data, propertyId: mongoose.Types.ObjectId() })
            .end((err, res) => {
              expect(res).to.have.status(404);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Invalid property');
              expect(sendMailStub.callCount).to.eq(0);
              done();
            });
        });
      });

      context('when report id is invalid', () => {
        it('returns an error', (done) => {
          request()
            [method](endpoint)
            .set('authorization', adminToken)
            .send({ ...data, reportId: mongoose.Types.ObjectId() })
            .end((err, res) => {
              expect(res).to.have.status(404);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Invalid report');
              expect(sendMailStub.callCount).to.eq(0);
              done();
            });
        });
      });
    });

    context('when user has invalid access token', () => {
      [regularUser, vendorUser].map((user) =>
        itReturnsForbiddenForTokenWithInvalidAccess({
          endpoint,
          method,
          user,
          data,
          useExistingUser: true,
        }),
      );
    });

    itReturnsForbiddenForNoToken({ endpoint, method });

    itReturnsNotFoundForInvalidToken({
      endpoint,
      method,
      user: adminUser,
      userId: adminUser._id,
      data,
      useExistingUser: true,
    });

    context('when update service returns an error', () => {
      it('returns the error', (done) => {
        sinon.stub(Property, 'findByIdAndUpdate').throws(new Error('Type Error'));
        request()
          [method](endpoint)
          .set('authorization', adminToken)
          .send(data)
          .end((err, res) => {
            expect(res).to.have.status(400);
            expect(res.body.success).to.be.eql(false);
            expect(sendMailStub.callCount).to.eq(0);
            done();
            Property.findByIdAndUpdate.restore();
          });
      });
    });

    context('when report service returns an error', () => {
      it('returns the error', (done) => {
        sinon.stub(ReportedProperty, 'findByIdAndUpdate').throws(new Error('Type Error'));
        request()
          [method](endpoint)
          .set('authorization', adminToken)
          .send(data)
          .end((err, res) => {
            expect(res).to.have.status(500);
            expect(res.body.success).to.be.eql(false);
            expect(sendMailStub.callCount).to.eq(0);
            done();
            ReportedProperty.findByIdAndUpdate.restore();
          });
      });
    });
  });

  describe('Unflag property', () => {
    const endpoint = '/api/v1/property/unflag';
    const method = 'put';

    const property = PropertyFactory.build(
      {
        addedBy: vendorUser._id,
        updatedBy: vendorUser._id,
        flagged: {
          status: true,
          case: [
            {
              _id: mongoose.Types.ObjectId(),
              flaggedBy: adminUser._id,
              flaggedReason: 'suspicious activity',
            },
          ],
        },
      },
      { generateId: true },
    );

    const data = {
      propertyId: property._id,
      caseId: property.flagged.case[0]._id,
      reason: 'case resolved',
    };

    beforeEach(async () => {
      await addProperty(property);
    });

    context('with a valid token & id', () => {
      it('returns successful payload', (done) => {
        request()
          [method](endpoint)
          .set('authorization', adminToken)
          .send(data)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.message).to.be.eql('Property unflagged');
            expect(res.body.property.flagged.status).to.be.eql(false);
            expect(res.body.property.flagged.case[0].unflaggedBy).to.be.eql(
              adminUser._id.toString(),
            );
            expect(res.body.property.flagged.case[0].unflaggedReason).to.be.eql(data.reason);
            expect(sendMailStub.callCount).to.eq(1);
            expect(sendMailStub).to.have.be.calledWith(EMAIL_CONTENT.UNFLAG_PROPERTY);
            done();
          });
      });
    });

    context('when data is invalid', () => {
      context('when propertyId is empty', () => {
        it('returns an error', (done) => {
          request()
            [method](endpoint)
            .set('authorization', adminToken)
            .send({ ...data, propertyId: '' })
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Property id" is not allowed to be empty');
              expect(sendMailStub.callCount).to.eq(0);
              done();
            });
        });
      });

      context('when caseId is empty', () => {
        it('returns an error', (done) => {
          request()
            [method](endpoint)
            .set('authorization', adminToken)
            .send({ ...data, caseId: '' })
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Case id" is not allowed to be empty');
              expect(sendMailStub.callCount).to.eq(0);
              done();
            });
        });
      });

      context('when property id is invalid', () => {
        it('returns anerror', (done) => {
          request()
            [method](endpoint)
            .set('authorization', adminToken)
            .send({ ...data, propertyId: mongoose.Types.ObjectId() })
            .end((err, res) => {
              expect(res).to.have.status(404);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Invalid property');
              expect(sendMailStub.callCount).to.eq(0);
              done();
            });
        });
      });
    });

    context('when user has invalid access token', () => {
      [regularUser, vendorUser].map((user) =>
        itReturnsForbiddenForTokenWithInvalidAccess({
          endpoint,
          method,
          user,
          data,
          useExistingUser: true,
        }),
      );
    });

    itReturnsForbiddenForNoToken({ endpoint, method });

    itReturnsNotFoundForInvalidToken({
      endpoint,
      method,
      user: adminUser,
      userId: adminUser._id,
      data,
      useExistingUser: true,
    });

    context('when update service returns an error', () => {
      it('returns the error', (done) => {
        sinon.stub(Property, 'findByIdAndUpdate').throws(new Error('Type Error'));
        request()
          [method](endpoint)
          .set('authorization', adminToken)
          .send(data)
          .end((err, res) => {
            expect(res).to.have.status(400);
            expect(res.body.success).to.be.eql(false);
            expect(sendMailStub.callCount).to.eq(0);
            done();
            Property.findByIdAndUpdate.restore();
          });
      });
    });
  });
});
