import mongoose from 'mongoose';
import { expect, request, sinon } from '../config';
import Enquiry from '../../server/models/enquiry.model';
import User from '../../server/models/user.model';
import Property from '../../server/models/property.model';
import EnquiryFactory from '../factories/enquiry.factory';
import UserFactory from '../factories/user.factory';
import PropertyFactory from '../factories/property.factory';
import { addUser, loginUser } from '../../server/services/user.service';
import { addEnquiry } from '../../server/services/enquiry.service';
import { addProperty } from '../../server/services/property.service';
import { USER_ROLE } from '../../server/helpers/constants';
import {
  itReturnsForbiddenForNoToken,
  itReturnsTheRightPaginationValue,
  itReturnsEmptyValuesWhenNoItemExistInDatabase,
} from '../helpers';

let adminToken;
let userToken;
let vendorToken;
const adminUser = UserFactory.build(
  { role: USER_ROLE.ADMIN, activated: true },
  { generateId: true },
);
const vendorUser = UserFactory.build(
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
const property = PropertyFactory.build(
  { addedBy: vendorUser._id, updatedBy: vendorUser._id },
  { generateId: true },
);

describe('Enquiry Controller', () => {
  beforeEach(async () => {
    adminToken = await addUser(adminUser);
    vendorToken = await addUser(vendorUser);
    userToken = await addUser(regularUser);
    await addProperty(property);
  });

  describe('Add Enquiry Route', () => {
    context('with valid data', () => {
      it('returns successful enquiry', (done) => {
        const enquiry = EnquiryFactory.build({
          propertyId: property._id,
        });
        request()
          .post('/api/v1/enquiry/add')
          .set('authorization', userToken)
          .send(enquiry)
          .end((err, res) => {
            expect(res).to.have.status(201);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.message).to.be.eql('Enquiry added');
            expect(res.body).to.have.property('enquiry');
            done();
          });
      });
    });

    context('when an enquiry by the user for the property exists', () => {
      const enquiry = EnquiryFactory.build({
        propertyId: property._id,
      });
      beforeEach(async () => {
        await addEnquiry(
          EnquiryFactory.build({
            propertyId: property._id,
            userId: regularUser._id,
            addedBy: regularUser._id,
            updatedBy: regularUser._id,
          }),
        );
      });
      it('returns token error', (done) => {
        request()
          .post('/api/v1/enquiry/add')
          .set('authorization', userToken)
          .send(enquiry)
          .end((err, res) => {
            expect(res).to.have.status(412);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('You can only make one enquiry for this property');
            done();
          });
      });
    });

    context('when user token is used', () => {
      beforeEach(async () => {
        await User.findByIdAndDelete(regularUser._id);
      });
      it('returns token error', (done) => {
        const enquiry = EnquiryFactory.build();
        request()
          .post('/api/v1/enquiry/add')
          .set('authorization', userToken)
          .send(enquiry)
          .end((err, res) => {
            expect(res).to.have.status(404);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Invalid token');
            done();
          });
      });
    });

    context('with invalid data', () => {
      context('when title is empty', () => {
        it('returns an error', (done) => {
          const enquiry = EnquiryFactory.build({ title: '' });
          request()
            .post('/api/v1/enquiry/add')
            .set('authorization', userToken)
            .send(enquiry)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Title" is not allowed to be empty');
              done();
            });
        });
      });
      context('when property Id is empty', () => {
        it('returns an error', (done) => {
          const enquiry = EnquiryFactory.build({ propertyId: '' });
          request()
            .post('/api/v1/enquiry/add')
            .set('authorization', userToken)
            .send(enquiry)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Property ID" is not allowed to be empty');
              done();
            });
        });
      });
      context('when firstname is empty', () => {
        it('returns an error', (done) => {
          const enquiry = EnquiryFactory.build({ firstName: '' });
          request()
            .post('/api/v1/enquiry/add')
            .set('authorization', userToken)
            .send(enquiry)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"First Name" is not allowed to be empty');
              done();
            });
        });
      });
      context('when othername is empty', () => {
        it('returns enquiry', (done) => {
          const enquiry = EnquiryFactory.build({ propertyId: property._id, otherName: '' });
          request()
            .post('/api/v1/enquiry/add')
            .set('authorization', userToken)
            .send(enquiry)
            .end((err, res) => {
              expect(res).to.have.status(201);
              expect(res.body.success).to.be.eql(true);
              expect(res.body.message).to.be.eql('Enquiry added');
              expect(res.body).to.have.property('enquiry');
              done();
            });
        });
      });
      context('when lastname is empty', () => {
        it('returns an error', (done) => {
          const enquiry = EnquiryFactory.build({ lastName: '' });
          request()
            .post('/api/v1/enquiry/add')
            .set('authorization', userToken)
            .send(enquiry)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Last Name" is not allowed to be empty');
              done();
            });
        });
      });
      context('when address is empty string ', () => {
        it('returns an error', (done) => {
          const enquiry = EnquiryFactory.build({ address: '' });
          request()
            .post('/api/v1/enquiry/add')
            .set('authorization', userToken)
            .send(enquiry)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"address" must be of type object');
              done();
            });
        });
      });
      context('when address is empty object', () => {
        it('returns an error', (done) => {
          const enquiry = EnquiryFactory.build({ address: {} });
          request()
            .post('/api/v1/enquiry/add')
            .set('authorization', userToken)
            .send(enquiry)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Street 1" is required');
              done();
            });
        });
      });
      context('when street 1 is empty', () => {
        it('returns an error', (done) => {
          const enquiry = EnquiryFactory.build({
            address: {
              street1: '',
              street2: 'sesame street',
              city: 'Ikeja',
              state: 'Lagos',
              country: 'Nigeria',
            },
          });
          request()
            .post('/api/v1/enquiry/add')
            .set('authorization', userToken)
            .send(enquiry)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Street 1" is not allowed to be empty');
              done();
            });
        });
      });
      context('when street 2 is empty', () => {
        it('returns enquiry', (done) => {
          const enquiry = EnquiryFactory.build({
            propertyId: property._id,
            address: {
              street1: 'opebi street',
              street2: '',
              city: 'Ikeja',
              state: 'Lagos',
              country: 'Nigeria',
            },
          });
          request()
            .post('/api/v1/enquiry/add')
            .set('authorization', userToken)
            .send(enquiry)
            .end((err, res) => {
              expect(res).to.have.status(201);
              expect(res.body.success).to.be.eql(true);
              expect(res.body.message).to.be.eql('Enquiry added');
              expect(res.body).to.have.property('enquiry');
              done();
            });
        });
      });
      context('when street 2 is not sent', () => {
        it('returns enquiry', (done) => {
          const enquiry = EnquiryFactory.build({
            propertyId: property._id,
            address: {
              street1: 'opebi street',
              city: 'Ikeja',
              state: 'Lagos',
              country: 'Nigeria',
            },
          });
          request()
            .post('/api/v1/enquiry/add')
            .set('authorization', userToken)
            .send(enquiry)
            .end((err, res) => {
              expect(res).to.have.status(201);
              expect(res.body.success).to.be.eql(true);
              expect(res.body.message).to.be.eql('Enquiry added');
              expect(res.body).to.have.property('enquiry');
              done();
            });
        });
      });
      context('when city is empty', () => {
        it('returns an error', (done) => {
          const enquiry = EnquiryFactory.build({
            address: {
              street1: 'opebi street',
              street2: 'sesame street',
              city: '',
              state: 'Lagos',
              country: 'Nigeria',
            },
          });
          request()
            .post('/api/v1/enquiry/add')
            .set('authorization', userToken)
            .send(enquiry)
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
          const enquiry = EnquiryFactory.build({
            address: {
              street1: 'opebi street',
              street2: 'sesame street',
              city: 'Ikeja',
              state: '',
              country: 'Nigeria',
            },
          });
          request()
            .post('/api/v1/enquiry/add')
            .set('authorization', userToken)
            .send(enquiry)
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
          const enquiry = EnquiryFactory.build({
            address: {
              street1: 'opebi street',
              street2: 'sesame street',
              city: 'Ikeja',
              state: 'Lagos',
              country: '',
            },
          });
          request()
            .post('/api/v1/enquiry/add')
            .set('authorization', userToken)
            .send(enquiry)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Country" is not allowed to be empty');
              done();
            });
        });
      });
      context('when occupation is empty', () => {
        it('returns an error', (done) => {
          const enquiry = EnquiryFactory.build({ occupation: '' });
          request()
            .post('/api/v1/enquiry/add')
            .set('authorization', userToken)
            .send(enquiry)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Occupation" is not allowed to be empty');
              done();
            });
        });
      });
      context('when phone is empty', () => {
        it('returns an error', (done) => {
          const enquiry = EnquiryFactory.build({ phone: '' });
          request()
            .post('/api/v1/enquiry/add')
            .set('authorization', userToken)
            .send(enquiry)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Phone" is not allowed to be empty');
              done();
            });
        });
      });
      context('when email is empty', () => {
        it('returns an error', (done) => {
          const enquiry = EnquiryFactory.build({ email: '' });
          request()
            .post('/api/v1/enquiry/add')
            .set('authorization', userToken)
            .send(enquiry)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Email Address" is not allowed to be empty');
              done();
            });
        });
      });
      context('when name on title document is empty', () => {
        it('returns an error', (done) => {
          const enquiry = EnquiryFactory.build({ nameOnTitleDocument: '' });
          request()
            .post('/api/v1/enquiry/add')
            .set('authorization', userToken)
            .send(enquiry)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql(
                '"Name on Title Document" is not allowed to be empty',
              );
              done();
            });
        });
      });
      context('when investment frequency is empty', () => {
        it('returns an error', (done) => {
          const enquiry = EnquiryFactory.build({ investmentFrequency: '' });
          request()
            .post('/api/v1/enquiry/add')
            .set('authorization', userToken)
            .send(enquiry)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Investment Frequency" is not allowed to be empty');
              done();
            });
        });
      });
      context('when initial investment amount is empty', () => {
        it('returns an error', (done) => {
          const enquiry = EnquiryFactory.build({ initialInvestmentAmount: '' });
          request()
            .post('/api/v1/enquiry/add')
            .set('authorization', userToken)
            .send(enquiry)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Initial Investment Amount" must be a number');
              done();
            });
        });
      });
      context('when periodic investment amount is empty', () => {
        it('returns an error', (done) => {
          const enquiry = EnquiryFactory.build({ periodicInvestmentAmount: '' });
          request()
            .post('/api/v1/enquiry/add')
            .set('authorization', userToken)
            .send(enquiry)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Periodic Investment Amount" must be a number');
              done();
            });
        });
      });
      context('when investment start date is empty', () => {
        it('returns an error', (done) => {
          const enquiry = EnquiryFactory.build({ investmentStartDate: '' });
          request()
            .post('/api/v1/enquiry/add')
            .set('authorization', userToken)
            .send(enquiry)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Investment Start Date" must be a valid date');
              done();
            });
        });
      });
    });
  });

  describe('Approve Enquiry', () => {
    let vendor2Token;
    const vendorUser2 = UserFactory.build(
      {
        role: USER_ROLE.VENDOR,
        activated: true,
        vendor: {
          verified: true,
        },
      },
      { generateId: true },
    );
    const enquiry = EnquiryFactory.build(
      {
        userId: regularUser._id,
        propertyId: property._id,
        addedBy: regularUser._id,
        updatedBy: regularUser._id,
      },
      { generateId: true },
    );
    const approvedEnquiry = {
      enquiryId: enquiry._id,
    };

    beforeEach(async () => {
      vendor2Token = await addUser(vendorUser2);
      await addEnquiry(enquiry);
    });

    context('with valid data & token', () => {
      it('returns an approved enquiry', (done) => {
        request()
          .put('/api/v1/enquiry/approve')
          .set('authorization', vendorToken)
          .send(approvedEnquiry)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.message).to.be.eql('Enquiry approved');
            expect(res.body).to.have.property('enquiry');
            expect(res.body.enquiry._id).to.be.eql(approvedEnquiry.enquiryId.toString());
            expect(res.body.enquiry.approved).to.be.eql(true);
            done();
          });
      });
    });

    context('with token of another vendor', () => {
      it('returns forbidden error', (done) => {
        request()
          .put('/api/v1/enquiry/approve')
          .set('authorization', vendor2Token)
          .send(approvedEnquiry)
          .end((err, res) => {
            expect(res).to.have.status(400);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.error.statusCode).to.be.eql(403);
            expect(res.body.error.message).to.be.eql(
              'You are not permitted to perform this action',
            );
            done();
          });
      });
    });

    context('without token', () => {
      it('returns error', (done) => {
        request()
          .put('/api/v1/enquiry/approve')
          .send(approvedEnquiry)
          .end((err, res) => {
            expect(res).to.have.status(403);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Token needed to access resources');
            done();
          });
      });
    });

    context('when approve service returns an error', () => {
      it('returns the error', (done) => {
        sinon.stub(Enquiry, 'findOneAndUpdate').throws(new Error('Type Error'));
        request()
          .put('/api/v1/enquiry/approve')
          .set('authorization', vendorToken)
          .send(approvedEnquiry)
          .end((err, res) => {
            expect(res).to.have.status(400);
            expect(res.body.success).to.be.eql(false);
            done();
            Enquiry.findOneAndUpdate.restore();
          });
      });
    });

    context('with invalid data', () => {
      context('when enquiry id is empty', () => {
        it('returns an error', (done) => {
          const invalidEnquiry = { enquiryId: '' };
          request()
            .put('/api/v1/enquiry/approve')
            .set('authorization', vendorToken)
            .send(invalidEnquiry)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Enquiry Id" is not allowed to be empty');
              done();
            });
        });
      });
    });
  });

  describe('Get one enquiry', () => {
    const vendorUser2 = UserFactory.build(
      {
        role: USER_ROLE.VENDOR,
        activated: true,
        vendor: {
          verified: true,
        },
      },
      { generateId: true },
    );
    const vendor2Property = PropertyFactory.build(
      { addedBy: vendorUser2._id, updatedBy: vendorUser2._id },
      { generateId: true },
    );

    const regularUser2 = UserFactory.build(
      { role: USER_ROLE.USER, activated: true },
      { generateId: true },
    );

    const enquiry1 = EnquiryFactory.build(
      {
        propertyId: property._id,
        userId: regularUser._id,
        addedBy: regularUser._id,
        updatedBy: regularUser._id,
      },
      { generateId: true },
    );

    const enquiry2 = EnquiryFactory.build(
      {
        propertyId: vendor2Property._id,
        userId: regularUser2._id,
        addedBy: regularUser2._id,
        updatedBy: regularUser2._id,
      },
      { generateId: true },
    );

    beforeEach(async () => {
      await addUser(vendorUser2);
      await addUser(regularUser2);
      await addProperty(vendor2Property);
      await addEnquiry(enquiry1);
      await addEnquiry(enquiry2);
    });

    context('with admin token ', () => {
      [enquiry1, enquiry2].map((enquiry) =>
        it('returns successful payload', (done) => {
          request()
            .get(`/api/v1/enquiry/${enquiry._id}`)
            .set('authorization', adminToken)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body).to.have.property('enquiry');
              expect(res.body.enquiry._id).to.be.eql(enquiry._id.toString());
              expect(res.body.enquiry).to.have.property('vendorInfo');
              done();
            });
        }),
      );
    });

    context('when viewing an unauthorized enquiry', () => {
      [vendorUser, regularUser].map((user) => {
        let token;
        beforeEach(async () => {
          const loggedInUser = await loginUser(user);
          token = loggedInUser.token;
        });

        it('returns not found', (done) => {
          request()
            .get(`/api/v1/enquiry/${enquiry2._id}`)
            .set('authorization', token)
            .end((err, res) => {
              expect(res).to.have.status(404);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Enquiry not found');
              done();
            });
        });
        return null;
      });
    });

    context('when viewing an authorized enquiry', () => {
      [regularUser2, vendorUser2].map((user) => {
        let token;
        beforeEach(async () => {
          const loggedInUser = await loginUser(user);
          token = loggedInUser.token;
        });

        it('returns enquiry', (done) => {
          request()
            .get(`/api/v1/enquiry/${enquiry2._id}`)
            .set('authorization', token)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body).to.have.property('enquiry');
              expect(res.body.enquiry._id).to.be.eql(enquiry2._id.toString());
              done();
            });
        });
        return null;
      });
    });

    context('when viewing an unauthorized enquiry', () => {
      [regularUser2, vendorUser2].map((user) => {
        let token;
        beforeEach(async () => {
          const loggedInUser = await loginUser(user);
          token = loggedInUser.token;
        });

        it('returns not found', (done) => {
          request()
            .get(`/api/v1/enquiry/${enquiry1._id}`)
            .set('authorization', token)
            .end((err, res) => {
              expect(res).to.have.status(404);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Enquiry not found');
              done();
            });
        });
        return null;
      });
    });

    context('when viewing an authorized enquiry', () => {
      [regularUser, vendorUser].map((user) => {
        let token;
        beforeEach(async () => {
          const loggedInUser = await loginUser(user);
          token = loggedInUser.token;
        });

        it('returns enquiry', (done) => {
          request()
            .get(`/api/v1/enquiry/${enquiry1._id}`)
            .set('authorization', token)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body).to.have.property('enquiry');
              expect(res.body.enquiry._id).to.be.eql(enquiry1._id.toString());
              done();
            });
        });
        return null;
      });
    });

    context('with an invalid enquiry id', () => {
      const invalidId = mongoose.Types.ObjectId();
      it('returns not found', (done) => {
        request()
          .get(`/api/v1/enquiry/${invalidId}`)
          .set('authorization', userToken)
          .end((err, res) => {
            expect(res).to.have.status(404);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Enquiry not found');
            done();
          });
      });
    });

    context('without token', () => {
      it('returns error', (done) => {
        request()
          .get(`/api/v1/enquiry/${enquiry1._id}`)
          .end((err, res) => {
            expect(res).to.have.status(403);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Token needed to access resources');
            done();
          });
      });
    });

    context('when getEnquiry service fails', () => {
      it('returns the error', (done) => {
        sinon.stub(Enquiry, 'aggregate').throws(new Error('Type Error'));
        request()
          .get(`/api/v1/enquiry/${enquiry1._id}`)
          .set('authorization', userToken)
          .end((err, res) => {
            expect(res).to.have.status(500);
            done();
            Enquiry.aggregate.restore();
          });
      });
    });
  });

  describe('Get all enquiries', () => {
    const endpoint = '/api/v1/enquiry/all';
    const method = 'get';
    let vendor2Token;

    const vendor2 = UserFactory.build(
      {
        role: USER_ROLE.VENDOR,
        activated: true,
        email: 'vendor2@mail.com',
        vendor: {
          verified: true,
        },
      },
      { generateId: true },
    );
    const vendorProperties = PropertyFactory.buildList(
      13,
      {
        addedBy: vendorUser._id,
        updatedBy: vendorUser._id,
      },
      { generateId: true },
    );
    const vendor2Properties = PropertyFactory.buildList(
      5,
      {
        addedBy: vendor2._id,
        updatedBy: vendor2._id,
      },
      { generateId: true },
    );
    const dummyProperties = [...vendorProperties, ...vendor2Properties];

    const userEnquiries = dummyProperties.map((_, index) =>
      EnquiryFactory.build(
        {
          propertyId: dummyProperties[index]._id,
          userId: regularUser._id,
          vendorId: dummyProperties[index].addedBy,
        },
        { generateId: true },
      ),
    );
    const enquiry = EnquiryFactory.build(
      {
        userId: adminUser._id,
        propertyId: vendorProperties[0]._id,
      },
      { generateId: true },
    );

    beforeEach(async () => {
      vendor2Token = await addUser(vendor2);
    });

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

    describe('when enquiries exist in db', () => {
      beforeEach(async () => {
        await Property.insertMany(dummyProperties);
        await Enquiry.insertMany(userEnquiries);
        await addEnquiry(enquiry);
      });

      itReturnsTheRightPaginationValue({
        endpoint,
        method,
        user: regularUser,
        useExistingUser: true,
      });

      itReturnsForbiddenForNoToken({ endpoint, method });

      context('when request is sent by admin token', () => {
        it('returns all enquiries', (done) => {
          request()
            [method](endpoint)
            .set('authorization', adminToken)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body.pagination.currentPage).to.be.eql(1);
              expect(res.body.pagination.limit).to.be.eql(10);
              expect(res.body.pagination.total).to.be.eql(19);
              expect(res.body.pagination.offset).to.be.eql(0);
              expect(res.body.result.length).to.be.eql(10);
              expect(res.body.result[0]._id).to.be.eql(userEnquiries[0]._id.toString());
              expect(res.body.result[0].userId).to.be.eql(regularUser._id.toString());
              expect(res.body.result[0].propertyId).to.be.eql(res.body.result[0].propertyInfo._id);
              expect(res.body.result[0].vendorInfo._id).to.be.eql(vendorUser._id.toString());
              expect(res.body.result[0].firstName).to.be.eql(userEnquiries[0].firstName);
              expect(res.body.result[0].otherName).to.be.eql(userEnquiries[0].otherName);
              done();
            });
        });
      });

      context('when request is sent by vendor2 token', () => {
        it('returns vendor2 enquiries', (done) => {
          request()
            [method](endpoint)
            .set('authorization', vendor2Token)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body.pagination.currentPage).to.be.eql(1);
              expect(res.body.pagination.limit).to.be.eql(10);
              expect(res.body.pagination.total).to.be.eql(5);
              expect(res.body.pagination.offset).to.be.eql(0);
              expect(res.body.result.length).to.be.eql(5);
              expect(res.body.result[0]._id).to.be.eql(userEnquiries[13]._id.toString());
              expect(res.body.result[0].userId).to.be.eql(regularUser._id.toString());
              expect(res.body.result[0].propertyId).to.be.eql(res.body.result[0].propertyInfo._id);
              expect(res.body.result[0].vendorInfo._id).to.be.eql(vendor2._id.toString());
              expect(res.body.result[0].firstName).to.be.eql(userEnquiries[13].firstName);
              expect(res.body.result[0].otherName).to.be.eql(userEnquiries[13].otherName);
              done();
            });
        });
      });

      context('when request is sent by vendor', () => {
        it('returns vendor enquiries', (done) => {
          request()
            [method](endpoint)
            .set('authorization', vendorToken)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body.pagination.currentPage).to.be.eql(1);
              expect(res.body.pagination.limit).to.be.eql(10);
              expect(res.body.pagination.total).to.be.eql(14);
              expect(res.body.pagination.offset).to.be.eql(0);
              expect(res.body.result.length).to.be.eql(10);
              expect(res.body.result[0]._id).to.be.eql(userEnquiries[0]._id.toString());
              expect(res.body.result[0].userId).to.be.eql(regularUser._id.toString());
              expect(res.body.result[0].propertyId).to.be.eql(res.body.result[0].propertyInfo._id);
              expect(res.body.result[0].vendorInfo._id).to.be.eql(vendorUser._id.toString());
              expect(res.body.result[0].firstName).to.be.eql(userEnquiries[0].firstName);
              expect(res.body.result[0].otherName).to.be.eql(userEnquiries[0].otherName);
              done();
            });
        });
      });
    });
  });
});
