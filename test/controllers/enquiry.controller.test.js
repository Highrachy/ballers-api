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

useDatabase();

let adminToken;
let userToken;
const _id = mongoose.Types.ObjectId();
const adminUser = UserFactory.build({ role: 0, activated: true });
const regualarUser = UserFactory.build({ _id, role: 1, activated: true });

beforeEach(async () => {
  adminToken = await addUser(adminUser);
  userToken = await addUser(regualarUser);
});

describe('Add Enquiry Route', () => {
  context('with valid data', () => {
    it('returns successful enquiry', (done) => {
      const enquiry = EnquiryFactory.build();
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

  context('when user token is used', () => {
    beforeEach(async () => {
      await User.findByIdAndDelete(_id);
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
            expect(res.body.error).to.be.eql('"Firstname" is not allowed to be empty');
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
            expect(res.body.error).to.be.eql('"Othername" is not allowed to be empty');
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
            expect(res.body.error).to.be.eql('"Lastname" is not allowed to be empty');
            done();
          });
      });
    });
    context('when address is empty', () => {
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
            expect(res.body.error).to.be.eql('"Address" is not allowed to be empty');
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
            expect(res.body.error).to.be.eql('"Name on title document" is not allowed to be empty');
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
            expect(res.body.error).to.be.eql('"Investment frequency" is not allowed to be empty');
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
            expect(res.body.error).to.be.eql('"Initial investment amount" must be a number');
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
            expect(res.body.error).to.be.eql('"Periodic investment amount" must be a number');
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
            expect(res.body.error).to.be.eql('"Investment start date" must be a valid date');
            done();
          });
      });
    });
  });
});

describe('Approve Enquiry', () => {
  const id = mongoose.Types.ObjectId();
  const enquiry = EnquiryFactory.build({ _id: id, userId: id, addedBy: _id, updatedBy: _id });
  const approvedEnquiry = {
    enquiryId: id,
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
          expect(approvedEnquiry.enquiryId.equals(res.body.enquiry._id)).to.be.eql(true);
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

describe('Get all enquiries', () => {
  const id = mongoose.Types.ObjectId();
  const propertyId = mongoose.Types.ObjectId();
  const enquiry = EnquiryFactory.build({
    _id: id,
    propertyId,
    userId: _id,
    addedBy: _id,
    updatedBy: _id,
  });
  const property = PropertyFactory.build({ _id: propertyId, addedBy: _id, updatedBy: _id });

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
      await addProperty(property);
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
            expect(id.equals(res.body.enquiries[0]._id)).to.be.eql(true);
            expect(_id.equals(res.body.enquiries[0].userId)).to.be.eql(true);
            expect(res.body.enquiries[0].propertyId).to.be.eql(
              res.body.enquiries[0].propertyInfo._id,
            );
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
