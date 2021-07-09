import mongoose from 'mongoose';
import querystring from 'querystring';
import { expect, request, sinon } from '../config';
import AssignedBadge from '../../server/models/assignedBadge.model';
import BadgeFactory from '../factories/badge.factory';
import UserFactory from '../factories/user.factory';
import AssignedBadgeFactory from '../factories/assignedBadge.factory';
import { addBadge } from '../../server/services/badge.service';
import { assignBadge } from '../../server/services/assignedBadge.service';
import { addUser } from '../../server/services/user.service';
import { USER_ROLE, BADGE_ACCESS_LEVEL } from '../../server/helpers/constants';
import { ASSIGNED_BADGE_FILTERS } from '../../server/helpers/filters';
import {
  itReturnsForbiddenForNoToken,
  itReturnsForbiddenForTokenWithInvalidAccess,
  itReturnsErrorForEmptyFields,
  itReturnsEmptyValuesWhenNoItemExistInDatabase,
  itReturnsTheRightPaginationValue,
  itReturnsAnErrorWhenServiceFails,
  defaultPaginationResult,
  expectsPaginationToReturnTheRightValues,
  itReturnsNoResultWhenNoFilterParameterIsMatched,
  filterTestForSingleParameter,
  itReturnAllResultsWhenAnUnknownFilterIsUsed,
  futureDate,
  currentDate,
} from '../helpers';

let adminToken;
let userToken;

const regularUser = UserFactory.build(
  { role: USER_ROLE.USER, activated: true },
  { generateId: true },
);
const adminUser = UserFactory.build(
  { role: USER_ROLE.ADMIN, activated: true },
  { generateId: true },
);
const vendorUser = UserFactory.build(
  { role: USER_ROLE.VENDOR, activated: true, vendor: { verified: true } },
  { generateId: true },
);
const badge = BadgeFactory.build({ assignedRole: BADGE_ACCESS_LEVEL.USER }, { generateId: true });

describe('Assigned Badge Controller', () => {
  beforeEach(async () => {
    adminToken = await addUser(adminUser);
    userToken = await addUser(regularUser);
    await addBadge(badge);
  });

  describe('Assign badge route', () => {
    const endpoint = '/api/v1/assign-badge';
    const method = 'post';
    const invalidId = mongoose.Types.ObjectId();

    const badgeInfo = {
      badgeId: badge._id,
      userId: regularUser._id,
    };

    beforeEach(async () => {
      await addUser(vendorUser);
    });

    context('when a valid token is used', () => {
      it('successfully assigns badge', (done) => {
        request()
          [method](endpoint)
          .set('authorization', adminToken)
          .send(badgeInfo)
          .end((err, res) => {
            expect(res).to.have.status(201);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.message).to.be.eql('Badge assigned successfully');
            expect(res.body.assignedBadge.badgeId).to.be.eql(badge._id.toString());
            expect(res.body.assignedBadge.userId).to.be.eql(regularUser._id.toString());
            expect(res.body.assignedBadge.assignedBy).to.be.eql(adminUser._id.toString());
            done();
          });
      });
    });

    [vendorUser, regularUser].map((user) =>
      itReturnsForbiddenForTokenWithInvalidAccess({
        endpoint,
        method,
        user,
        data: badgeInfo,
        useExistingUser: true,
      }),
    );

    itReturnsForbiddenForNoToken({ endpoint, method, data: badgeInfo });

    context('with invalid data', () => {
      const invalidEmptyData = {
        badgeId: '"Badge id" is not allowed to be empty',
        userId: '"User id" is not allowed to be empty',
      };

      itReturnsErrorForEmptyFields({
        endpoint,
        method,
        user: adminUser,
        data: invalidEmptyData,
        factory: AssignedBadgeFactory,
        useExistingUser: true,
      });

      context('when badge id is invalid', () => {
        it('returns not found', (done) => {
          request()
            [method](endpoint)
            .set('authorization', adminToken)
            .send({ ...badgeInfo, badgeId: invalidId })
            .end((err, res) => {
              expect(res).to.have.status(404);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Badge not found');
              done();
            });
        });
      });

      context('when badge is automated', () => {
        const automatedBadge = BadgeFactory.build(
          { assignedRole: BADGE_ACCESS_LEVEL.ALL, automated: true },
          { generateId: true },
        );

        beforeEach(async () => {
          await addBadge(automatedBadge);
        });

        it('returns error', (done) => {
          request()
            [method](endpoint)
            .set('authorization', adminToken)
            .send({ ...badgeInfo, badgeId: automatedBadge._id })
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Automated badge cannot be assigned manually');
              done();
            });
        });
      });

      context('when user id is invalid', () => {
        it('returns not found', (done) => {
          request()
            [method](endpoint)
            .set('authorization', adminToken)
            .send({ ...badgeInfo, userId: invalidId })
            .end((err, res) => {
              expect(res).to.have.status(404);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('User not found');
              done();
            });
        });
      });

      context('when badge assigned role does not match', () => {
        it('returns error', (done) => {
          request()
            [method](endpoint)
            .set('authorization', adminToken)
            .send({ ...badgeInfo, userId: vendorUser._id })
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Badge cannot be assigned to user');
              done();
            });
        });
      });
    });
  });

  describe('Delete badge route', () => {
    const assignedBadge = AssignedBadgeFactory.build(
      {
        badgeId: badge._id,
        userId: regularUser._id,
      },
      { generateId: true },
    );
    const endpoint = `/api/v1/assign-badge/${assignedBadge._id}`;
    const method = 'delete';

    beforeEach(async () => {
      await addUser(vendorUser);
      await assignBadge(assignedBadge);
    });

    context('when a valid token is used', () => {
      it('successfully deletes assigned badge', (done) => {
        request()
          [method](endpoint)
          .set('authorization', adminToken)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.message).to.be.eql('Assigned badge deleted');
            done();
          });
      });
    });

    context('when assigned badge id is invalid', () => {
      it('returns not found', (done) => {
        request()
          [method](`/api/v1/assign-badge/${mongoose.Types.ObjectId()}`)
          .set('authorization', adminToken)
          .end((err, res) => {
            expect(res).to.have.status(404);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Assigned badge not found');
            done();
          });
      });
    });

    [vendorUser, regularUser].map((user) =>
      itReturnsForbiddenForTokenWithInvalidAccess({
        endpoint,
        method,
        user,
        useExistingUser: true,
      }),
    );

    itReturnsForbiddenForNoToken({ endpoint, method });

    context('when delete service returns an error', () => {
      it('returns the error', (done) => {
        sinon.stub(AssignedBadge, 'findByIdAndDelete').throws(new Error('Type Error'));
        request()
          [method](endpoint)
          .set('authorization', adminToken)
          .end((err, res) => {
            expect(res).to.have.status(400);
            expect(res.body.success).to.be.eql(false);
            done();
            AssignedBadge.findByIdAndDelete.restore();
          });
      });
    });
  });

  describe('Get single assigned badge route', () => {
    const assignedBadge = AssignedBadgeFactory.build(
      {
        badgeId: badge._id,
        userId: regularUser._id,
      },
      { generateId: true },
    );
    const endpoint = `/api/v1/assign-badge/${assignedBadge._id}`;
    const method = 'get';

    beforeEach(async () => {
      await assignBadge(assignedBadge);
    });

    context('when a valid token is used', () => {
      it('successfully returns assigned badge', (done) => {
        request()
          [method](endpoint)
          .set('authorization', adminToken)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.assignedBadge._id).to.be.eql(assignedBadge._id.toString());
            expect(res.body.assignedBadge.badgeInfo._id).to.be.eql(badge._id.toString());
            expect(res.body.assignedBadge.userInfo._id).to.be.eql(regularUser._id.toString());
            done();
          });
      });
    });

    context('when badge id is invalid', () => {
      it('returns not found', (done) => {
        request()
          [method](`/api/v1/assign-badge/${mongoose.Types.ObjectId()}`)
          .set('authorization', adminToken)
          .end((err, res) => {
            expect(res).to.have.status(404);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Assigned badge not found');
            done();
          });
      });
    });

    itReturnsForbiddenForNoToken({ endpoint, method });

    itReturnsAnErrorWhenServiceFails({
      endpoint,
      method,
      user: adminUser,
      model: AssignedBadge,
      modelMethod: 'aggregate',
      useExistingUser: true,
    });
  });

  describe('Get all assigned badges route', () => {
    let vendorToken;
    const endpoint = '/api/v1/assign-badge/all';
    const method = 'get';

    const vendorBadge = BadgeFactory.build(
      { assignedRole: BADGE_ACCESS_LEVEL.VENDOR },
      { generateId: true },
    );

    const assignedBadge = AssignedBadgeFactory.build(
      {
        badgeId: badge._id,
        userId: regularUser._id,
        createdAt: futureDate,
        assignedBy: adminUser._id,
      },
      { generateId: true },
    );

    const assignedBadges = AssignedBadgeFactory.buildList(
      17,
      {
        badgeId: vendorBadge._id,
        userId: vendorUser._id,
        createdAt: currentDate,
        assignedBy: mongoose.Types.ObjectId(),
      },
      { generateId: true },
    );

    beforeEach(async () => {
      vendorToken = await addUser(vendorUser);
      await addBadge(vendorBadge);
    });

    describe('Pagination Tests', () => {
      itReturnsEmptyValuesWhenNoItemExistInDatabase({
        endpoint,
        method,
        user: adminUser,
        useExistingUser: true,
      });

      describe('when assigned badges exist in db', () => {
        beforeEach(async () => {
          await AssignedBadge.insertMany([assignedBadge, ...assignedBadges]);
        });

        itReturnsTheRightPaginationValue({
          endpoint,
          method,
          user: adminUser,
          useExistingUser: true,
        });

        context('when a user token is used', () => {
          it('returns all user badges', (done) => {
            request()
              .get(endpoint)
              .set('authorization', userToken)
              .end((err, res) => {
                expectsPaginationToReturnTheRightValues(res, {
                  ...defaultPaginationResult,
                  total: 1,
                  result: 1,
                  totalPage: 1,
                });
                expect(res.body.result[0]._id).to.be.eql(assignedBadge._id.toString());
                expect(res.body.result[0].userId).to.be.eql(regularUser._id.toString());
                expect(res.body.result[0].badgeInfo._id).to.be.eql(badge._id.toString());
                expect(res.body.result[0].badgeInfo.assignedRole).to.be.eql(badge.assignedRole);
                done();
              });
          });
        });

        context('when a vendor token is used', () => {
          it('returns all vendor badges', (done) => {
            request()
              .get(endpoint)
              .set('authorization', vendorToken)
              .end((err, res) => {
                expectsPaginationToReturnTheRightValues(res, {
                  ...defaultPaginationResult,
                  total: 17,
                  totalPage: 2,
                });
                expect(res.body.result[0]._id).to.be.eql(assignedBadges[0]._id.toString());
                expect(res.body.result[0].userId).to.be.eql(vendorUser._id.toString());
                expect(res.body.result[0].badgeInfo._id).to.be.eql(vendorBadge._id.toString());
                expect(res.body.result[0].badgeInfo.assignedRole).to.be.eql(
                  vendorBadge.assignedRole,
                );
                done();
              });
          });
        });

        itReturnsForbiddenForNoToken({ endpoint, method });

        itReturnsAnErrorWhenServiceFails({
          endpoint,
          method,
          user: adminUser,
          model: AssignedBadge,
          modelMethod: 'aggregate',
          useExistingUser: true,
        });
      });
    });

    describe('Filter Tests', () => {
      beforeEach(async () => {
        await AssignedBadge.insertMany([assignedBadge, ...assignedBadges]);
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
          expectedPagination: defaultPaginationResult,
          useExistingUser: true,
        });
      });

      context('when multiple filters are used', () => {
        const multipleFilters = {
          badgeId: badge._id.toString(),
          userId: regularUser._id.toString(),
        };
        const filteredParams = querystring.stringify(multipleFilters);

        it('returns matched assigned badge', (done) => {
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
              expect(res.body.result[0]._id).to.be.eql(assignedBadge._id.toString());
              expect(res.body.result[0].badgeId).to.be.eql(badge._id.toString());
              expect(res.body.result[0].userId).to.be.eql(regularUser._id.toString());
              expect(res.body.result[0].badgeInfo._id).to.be.eql(badge._id.toString());
              done();
            });
        });
      });

      context('when no parameter is matched', () => {
        const nonMatchingFilters = {
          createdAt: '2020-11-12',
          badgeId: mongoose.Types.ObjectId(),
          userId: mongoose.Types.ObjectId(),
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
        filter: ASSIGNED_BADGE_FILTERS,
        method,
        endpoint,
        user: adminUser,
        dataObject: assignedBadge,
        useExistingUser: true,
      });
    });
  });
});
