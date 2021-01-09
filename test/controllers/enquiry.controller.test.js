import mongoose from 'mongoose';
import { expect, request, sinon, useDatabase } from '../config';
import Enquiry from '../../server/models/enquiry.model';
import User from '../../server/models/user.model';
import EnquiryFactory from '../factories/enquiry.factory';
import UserFactory from '../factories/user.factory';
import PropertyFactory from '../factories/property.factory';
import { addUser } from '../../server/services/user.service';
import { addEnquiry } from '../../server/services/enquiry.service';
import { addProperty } from '../../server/services/property.service';
import { USER_ROLE } from '../../server/helpers/constants';

useDatabase();

let adminToken;
let userToken;
const adminUser = UserFactory.build({ role: USER_ROLE.ADMIN, activated: true });
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
    await addUser(vendorUser);
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
        it('returns an error', (done) => {
          const enquiry = EnquiryFactory.build({ otherName: '' });
          request()
            .post('/api/v1/enquiry/add')
            .set('authorization', userToken)
            .send(enquiry)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Other Name" is not allowed to be empty');
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
        it('returns an error', (done) => {
          const enquiry = EnquiryFactory.build({
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
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Street 2" is not allowed to be empty');
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
      await addEnquiry(enquiry);
    });

    context('with valid data & token', () => {
      it('returns a approved enquiry', (done) => {
        request()
          .put('/api/v1/enquiry/approve')
          .set('authorization', adminToken)
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
          .set('authorization', adminToken)
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
            .set('authorization', adminToken)
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
    const enquiry = EnquiryFactory.build(
      {
        propertyId: property._id,
        userId: regularUser._id,
        addedBy: regularUser._id,
        updatedBy: regularUser._id,
      },
      { generateId: true },
    );

    beforeEach(async () => {
      await addEnquiry(enquiry);
    });

    context('with a valid token & id', () => {
      it('returns successful payload', (done) => {
        request()
          .get(`/api/v1/enquiry/${enquiry._id}`)
          .set('authorization', adminToken)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body).to.have.property('enquiry');
            expect(res.body.enquiry._id).to.be.eql(enquiry._id.toString());
            done();
          });
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
          .get(`/api/v1/enquiry/${enquiry._id}`)
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
          .get(`/api/v1/enquiry/${enquiry._id}`)
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
    const enquiry = EnquiryFactory.build(
      {
        propertyId: property._id,
        userId: regularUser._id,
        addedBy: regularUser._id,
        updatedBy: regularUser._id,
      },
      { generateId: true },
    );

    context('when no enquiry is found', () => {
      it('returns empty array of enquiries', (done) => {
        request()
          .get('/api/v1/enquiry/all')
          .set('authorization', adminToken)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body).to.have.property('enquiries');
            done();
          });
      });
    });

    describe('when enquiries exist in db', () => {
      beforeEach(async () => {
        await addEnquiry(enquiry);
      });

      context('with a valid token & id', async () => {
        it('returns successful payload', (done) => {
          request()
            .get('/api/v1/enquiry/all')
            .set('authorization', adminToken)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body).to.have.property('enquiries');
              expect(res.body.enquiries[0]._id).to.be.eql(enquiry._id.toString());
              expect(res.body.enquiries[0].userId).to.be.eql(regularUser._id.toString());
              expect(res.body.enquiries[0].propertyId).to.be.eql(
                res.body.enquiries[0].propertyInfo[0]._id,
              );
              expect(res.body.enquiries[0].firstName).to.be.eql(enquiry.firstName);
              expect(res.body.enquiries[0].otherName).to.be.eql(enquiry.otherName);
              expect(res.body.enquiries[0].nameOnTitleDocument).to.be.eql(
                enquiry.nameOnTitleDocument,
              );
              expect(res.body.enquiries[0].initialInvestmentAmount).to.be.eql(
                enquiry.initialInvestmentAmount,
              );
              expect(res.body.enquiries[0].propertyInfo[0]._id).to.be.eql(property._id.toString());
              expect(res.body.enquiries[0].propertyInfo[0].addedBy).to.be.eql(
                property.addedBy.toString(),
              );
              expect(res.body.enquiries[0].propertyInfo[0].name).to.be.eql(property.name);
              done();
            });
        });
      });

      context('without token', () => {
        it('returns error', (done) => {
          request()
            .get('/api/v1/enquiry/all')
            .end((err, res) => {
              expect(res).to.have.status(403);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Token needed to access resources');
              done();
            });
        });
      });

      context('when user token is used', () => {
        it('returns forbidden error', (done) => {
          request()
            .get('/api/v1/enquiry/all')
            .set('authorization', userToken)
            .end((err, res) => {
              expect(res).to.have.status(403);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('You are not permitted to perform this action');
              done();
            });
        });
      });

      context('when getAllEnquiries service fails', () => {
        it('returns the error', (done) => {
          sinon.stub(Enquiry, 'aggregate').throws(new Error('Type Error'));
          request()
            .get('/api/v1/enquiry/all')
            .set('authorization', adminToken)
            .end((err, res) => {
              expect(res).to.have.status(500);
              done();
              Enquiry.aggregate.restore();
            });
        });
      });
    });
  });
});
