import { expect, request } from '../config';
import NextPayment from '../../server/models/nextPayment.model';
import NextPaymentFactory from '../factories/nextPayment.factory';
import UserFactory from '../factories/user.factory';
import PropertyFactory from '../factories/property.factory';
import { addUser } from '../../server/services/user.service';
import { addProperty } from '../../server/services/property.service';
import { USER_ROLE } from '../../server/helpers/constants';
import {
  itReturnsTheRightPaginationValue,
  itReturnsForbiddenForNoToken,
  itReturnsAnErrorWhenServiceFails,
  itReturnsEmptyValuesWhenNoItemExistInDatabase,
} from '../helpers';

let userToken;
let adminToken;
let vendorToken;
const adminUser = UserFactory.build(
  {
    role: USER_ROLE.ADMIN,
    activated: true,
  },
  { generateId: true },
);
const regularUser = UserFactory.build(
  { role: USER_ROLE.USER, activated: true },
  { generateId: true },
);
const vendorUser = UserFactory.build(
  {
    role: USER_ROLE.VENDOR,
    activated: true,
    vendor: { verified: true },
  },
  { generateId: true },
);

describe('Next Payments Controller', () => {
  beforeEach(async () => {
    userToken = await addUser(regularUser);
    adminToken = await addUser(adminUser);
    vendorToken = await addUser(vendorUser);
  });

  describe('Get All Next Payments', () => {
    const endpoint = '/api/v1/next-payment/all';
    const method = 'get';

    const vendorUser2 = UserFactory.build(
      {
        role: USER_ROLE.VENDOR,
        activated: true,
        vendor: { verified: true },
      },
      { generateId: true },
    );

    const vendorProperty = PropertyFactory.build(
      { addedBy: vendorUser._id, updatedBy: vendorUser._id },
      { generateId: true },
    );
    const vendor2Property = PropertyFactory.build(
      { addedBy: vendorUser2._id, updatedBy: vendorUser2._id },
      { generateId: true },
    );

    const unresolvedNextPayments1 = NextPaymentFactory.buildList(8, {
      propertyId: vendorProperty._id,
      userId: regularUser._id,
      vendorId: vendorUser._id,
      resolved: false,
    });
    const unresolvedNextPayments2 = NextPaymentFactory.buildList(10, {
      propertyId: vendor2Property._id,
      userId: regularUser._id,
      vendorId: vendorUser2._id,
      resolved: false,
    });
    const resolvedNextPayments = NextPaymentFactory.buildList(3, {
      propertyId: vendorProperty._id,
      userId: regularUser._id,
      vendorId: vendorUser._id,
      resolved: true,
    });

    beforeEach(async () => {
      await addUser(vendorUser2);
      await addProperty(vendorProperty);
      await addProperty(vendor2Property);
    });

    describe('Next Payments Pagination', () => {
      context('when db is empty', () => {
        [regularUser, vendorUser, adminUser].map((user) =>
          itReturnsEmptyValuesWhenNoItemExistInDatabase({
            endpoint,
            method,
            user,
            useExistingUser: true,
          }),
        );
      });

      describe('when next payments exist in db', () => {
        beforeEach(async () => {
          await NextPayment.insertMany([
            ...unresolvedNextPayments1,
            ...unresolvedNextPayments2,
            ...resolvedNextPayments,
          ]);
        });

        [regularUser, adminUser].map((user) =>
          itReturnsTheRightPaginationValue({
            endpoint,
            method,
            user,
            useExistingUser: true,
          }),
        );

        context('when request is sent by vendor token', () => {
          it('returns vendor next payments', (done) => {
            request()
              [method](endpoint)
              .set('authorization', vendorToken)
              .end((err, res) => {
                expect(res).to.have.status(200);
                expect(res.body.success).to.be.eql(true);
                expect(res.body.pagination.currentPage).to.be.eql(1);
                expect(res.body.pagination.limit).to.be.eql(10);
                expect(res.body.pagination.total).to.be.eql(8);
                expect(res.body.pagination.offset).to.be.eql(0);
                expect(res.body.result.length).to.be.eql(8);
                expect(res.body.result[0].propertyId).to.be.eql(vendorProperty._id.toString());
                expect(res.body.result[0].vendorId).to.be.eql(vendorUser._id.toString());
                expect(res.body.result[0].propertyInfo._id).to.be.eql(
                  vendorProperty._id.toString(),
                );
                expect(res.body.result[0].userInfo._id).to.be.eql(regularUser._id.toString());
                expect(res.body.result[0].resolved).to.be.eql(false);
                done();
              });
          });
        });

        context('when request is sent by admin token', () => {
          it('returns all next payments', (done) => {
            request()
              [method](endpoint)
              .set('authorization', adminToken)
              .end((err, res) => {
                expect(res).to.have.status(200);
                expect(res.body.success).to.be.eql(true);
                expect(res.body.result[0].propertyId).to.be.eql(vendorProperty._id.toString());
                expect(res.body.result[0].vendorId).to.be.eql(vendorUser._id.toString());
                expect(res.body.result[0].propertyInfo._id).to.be.eql(
                  vendorProperty._id.toString(),
                );
                expect(res.body.result[0].userInfo._id).to.be.eql(regularUser._id.toString());
                expect(res.body.result[0].vendorInfo._id).to.be.eql(vendorUser._id.toString());
                expect(res.body.result[0].resolved).to.be.eql(false);
                done();
              });
          });
        });

        context('when request is sent by user token', () => {
          it('returns user next payments', (done) => {
            request()
              [method](endpoint)
              .set('authorization', userToken)
              .end((err, res) => {
                expect(res).to.have.status(200);
                expect(res.body.success).to.be.eql(true);
                expect(res.body.result[0].propertyId).to.be.eql(vendorProperty._id.toString());
                expect(res.body.result[0].vendorId).to.be.eql(vendorUser._id.toString());
                expect(res.body.result[0].propertyInfo._id).to.be.eql(
                  vendorProperty._id.toString(),
                );
                expect(res.body.result[0].vendorInfo._id).to.be.eql(vendorUser._id.toString());
                expect(res.body.result[0].resolved).to.be.eql(false);
                done();
              });
          });
        });

        itReturnsForbiddenForNoToken({ endpoint, method });

        itReturnsAnErrorWhenServiceFails({
          endpoint,
          method,
          user: regularUser,
          model: NextPayment,
          modelMethod: 'aggregate',
          useExistingUser: true,
        });
      });
    });
  });
});
