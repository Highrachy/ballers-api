import mongoose from 'mongoose';
import querystring from 'querystring';
import { expect, request, sinon } from '../config';
import Badge from '../../server/models/badge.model';
import AssignedBadge from '../../server/models/assignedBadge.model';
import BadgeFactory from '../factories/badge.factory';
import UserFactory from '../factories/user.factory';
import AssignedBadgeFactory from '../factories/assignedBadge.factory';
import { addBadge } from '../../server/services/badge.service';
import { addUser } from '../../server/services/user.service';
import { USER_ROLE, BADGE_ACCESS_LEVEL } from '../../server/helpers/constants';
import { BADGE_FILTERS } from '../../server/helpers/filters';
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

const regularUser = UserFactory.build(
  { role: USER_ROLE.USER, activated: true },
  { generateId: true },
);
const adminUser = UserFactory.build(
  { role: USER_ROLE.ADMIN, activated: true },
  { generateId: true },
);
const vendorUser = UserFactory.build(
  { role: USER_ROLE.VENDOR, activated: true },
  { generateId: true },
);

describe('Badge Controller', () => {
  beforeEach(async () => {
    adminToken = await addUser(adminUser);
  });

  describe('Add badge route', () => {
    const endpoint = '/api/v1/badge';
    const method = 'post';

    const badge = {
      name: 'Special user badge',
      assignedRole: BADGE_ACCESS_LEVEL.USER,
      image: 'badge.png',
    };

    context('when a valid token is used', () => {
      it('successfully adds badge', (done) => {
        request()
          [method](endpoint)
          .set('authorization', adminToken)
          .send(badge)
          .end((err, res) => {
            expect(res).to.have.status(201);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.message).to.be.eql('Badge added successfully');
            expect(res.body.badge.name).to.be.eql(badge.name);
            expect(res.body.badge.assignedRole).to.be.eql(BADGE_ACCESS_LEVEL.USER);
            expect(res.body.badge.image).to.be.eql(badge.image);
            expect(res.body.badge.addedBy).to.be.eql(adminUser._id.toString());
            done();
          });
      });
    });

    context('when badge with similar name exists', () => {
      beforeEach(async () => {
        await addBadge(badge);
      });
      it('returns error', (done) => {
        request()
          [method](endpoint)
          .set('authorization', adminToken)
          .send({ ...badge, name: 'SPECIAL USER BADGE' })
          .end((err, res) => {
            expect(res).to.have.status(412);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Badge already exists');
            done();
          });
      });
    });

    [vendorUser, regularUser].map((user) =>
      itReturnsForbiddenForTokenWithInvalidAccess({
        endpoint,
        method,
        user,
        data: badge,
      }),
    );

    itReturnsForbiddenForNoToken({ endpoint, method, data: badge });

    context('with invalid data', () => {
      const invalidEmptyData = {
        name: '"Name" is not allowed to be empty',
        assignedRole: '"Role" must be one of [-1, 1, 2]',
        image: '"Image" is not allowed to be empty',
      };

      itReturnsErrorForEmptyFields({
        endpoint,
        method,
        user: adminUser,
        data: invalidEmptyData,
        factory: BadgeFactory,
        useExistingUser: true,
      });
    });
  });

  describe('Update badge route', () => {
    const endpoint = '/api/v1/badge';
    const method = 'put';
    const badge = BadgeFactory.build({}, { generateId: true });

    const data = {
      id: badge._id,
      name: 'Special user badge',
      assignedRole: BADGE_ACCESS_LEVEL.USER,
      image: 'badge.png',
    };

    beforeEach(async () => {
      await addBadge(badge);
    });

    context('when a valid token is used', () => {
      it('successfully updates badge', (done) => {
        request()
          [method](endpoint)
          .set('authorization', adminToken)
          .send(data)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.message).to.be.eql('Badge updated');
            expect(res.body.badge._id).to.be.eql(data.id.toString());
            expect(res.body.badge.name).to.be.eql(data.name);
            expect(res.body.badge.assignedRole).to.be.eql(data.assignedRole);
            expect(res.body.badge.image).to.be.eql(data.image);
            done();
          });
      });
    });

    context('when badge id is invalid', () => {
      it('returns not found', (done) => {
        request()
          [method](endpoint)
          .set('authorization', adminToken)
          .send({ ...data, id: mongoose.Types.ObjectId() })
          .end((err, res) => {
            expect(res).to.have.status(404);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Badge not found');
            done();
          });
      });
    });

    [vendorUser, regularUser].map((user) =>
      itReturnsForbiddenForTokenWithInvalidAccess({
        endpoint,
        method,
        user,
        data,
      }),
    );

    itReturnsForbiddenForNoToken({ endpoint, method, data });

    context('with invalid data', () => {
      context('when id is empty', () => {
        it('returns an error', (done) => {
          request()
            [method](endpoint)
            .set('authorization', adminToken)
            .send({ ...data, id: '' })
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Badge Id" is not allowed to be empty');
              done();
            });
        });
      });

      context('when name is empty', () => {
        it('returns an error', (done) => {
          request()
            [method](endpoint)
            .set('authorization', adminToken)
            .send({ ...data, name: '' })
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Name" is not allowed to be empty');
              done();
            });
        });
      });

      context('when assignedRole is empty', () => {
        it('returns an error', (done) => {
          request()
            [method](endpoint)
            .set('authorization', adminToken)
            .send({ ...data, assignedRole: '' })
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Role" must be one of [-1, 1, 2]');
              done();
            });
        });
      });

      context('when image is empty', () => {
        it('returns an error', (done) => {
          request()
            [method](endpoint)
            .set('authorization', adminToken)
            .send({ ...data, image: '' })
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Image" is not allowed to be empty');
              done();
            });
        });
      });
    });

    context('when update service returns an error', () => {
      it('returns the error', (done) => {
        sinon.stub(Badge, 'findByIdAndUpdate').throws(new Error('Type Error'));
        request()
          [method](endpoint)
          .set('authorization', adminToken)
          .send(data)
          .end((err, res) => {
            expect(res).to.have.status(400);
            expect(res.body.success).to.be.eql(false);
            done();
            Badge.findByIdAndUpdate.restore();
          });
      });
    });
  });

  describe('Delete badge route', () => {
    const badge = BadgeFactory.build({}, { generateId: true });
    const endpoint = `/api/v1/badge/${badge._id}`;
    const method = 'delete';

    beforeEach(async () => {
      await addBadge(badge);
    });

    context('when a valid token is used', () => {
      it('successfully deletes badge', (done) => {
        request()
          [method](endpoint)
          .set('authorization', adminToken)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.message).to.be.eql('Badge deleted');
            done();
          });
      });
    });

    context('when badge id is invalid', () => {
      it('returns not found', (done) => {
        request()
          [method](`/api/v1/badge/${mongoose.Types.ObjectId()}`)
          .set('authorization', adminToken)
          .end((err, res) => {
            expect(res).to.have.status(404);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Badge not found');
            done();
          });
      });
    });

    context('when badge has been assigned to a user', () => {
      const assignedBadge = AssignedBadgeFactory.build({ badgeId: badge._id });

      beforeEach(async () => {
        await AssignedBadge.create(assignedBadge);
      });

      it('returns error', (done) => {
        request()
          [method](endpoint)
          .set('authorization', adminToken)
          .end((err, res) => {
            expect(res).to.have.status(412);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Badge has been assigned to 1 user');
            done();
          });
      });
    });

    [vendorUser, regularUser].map((user) =>
      itReturnsForbiddenForTokenWithInvalidAccess({
        endpoint,
        method,
        user,
      }),
    );

    itReturnsForbiddenForNoToken({ endpoint, method });

    context('when delete service returns an error', () => {
      it('returns the error', (done) => {
        sinon.stub(Badge, 'findByIdAndDelete').throws(new Error('Type Error'));
        request()
          [method](endpoint)
          .set('authorization', adminToken)
          .end((err, res) => {
            expect(res).to.have.status(400);
            expect(res.body.success).to.be.eql(false);
            done();
            Badge.findByIdAndDelete.restore();
          });
      });
    });
  });

  describe('Get single badge route', () => {
    const badge = BadgeFactory.build({}, { generateId: true });
    const endpoint = `/api/v1/badge/${badge._id}`;
    const method = 'get';

    beforeEach(async () => {
      await addBadge(badge);
    });

    context('when a valid token is used', () => {
      it('successfully returns badge', (done) => {
        request()
          [method](endpoint)
          .set('authorization', adminToken)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.badge._id).to.be.eql(badge._id.toString());
            done();
          });
      });
    });

    context('when badge id is invalid', () => {
      it('returns not found', (done) => {
        request()
          [method](`/api/v1/badge/${mongoose.Types.ObjectId()}`)
          .set('authorization', adminToken)
          .end((err, res) => {
            expect(res).to.have.status(404);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Badge not found');
            done();
          });
      });
    });

    [vendorUser, regularUser].map((user) =>
      itReturnsForbiddenForTokenWithInvalidAccess({
        endpoint,
        method,
        user,
      }),
    );

    itReturnsForbiddenForNoToken({ endpoint, method });

    itReturnsAnErrorWhenServiceFails({
      endpoint,
      method,
      user: adminUser,
      model: Badge,
      modelMethod: 'aggregate',
      useExistingUser: true,
    });
  });

  describe('Get all badges route', () => {
    const endpoint = '/api/v1/badge/all';
    const method = 'get';

    const badge = BadgeFactory.build(
      {
        addedBy: adminUser._id,
        assignedRole: BADGE_ACCESS_LEVEL.VENDOR,
        createdAt: futureDate,
        name: 'Special vendor badge',
      },
      { generateId: true },
    );

    const badges = BadgeFactory.buildList(
      17,
      {
        addedBy: mongoose.Types.ObjectId(),
        assignedRole: BADGE_ACCESS_LEVEL.ALL,
        createdAt: currentDate,
      },
      { generateId: true },
    );

    describe('Pagination Tests', () => {
      itReturnsEmptyValuesWhenNoItemExistInDatabase({
        endpoint,
        method,
        user: adminUser,
        useExistingUser: true,
      });

      describe('when badges exist in db', () => {
        beforeEach(async () => {
          await Badge.insertMany([badge, ...badges]);
        });

        itReturnsTheRightPaginationValue({
          endpoint,
          method,
          user: adminUser,
          useExistingUser: true,
        });

        context('when a valid token is used', () => {
          it('returns all badges', (done) => {
            request()
              .get(endpoint)
              .set('authorization', adminToken)
              .end((err, res) => {
                expectsPaginationToReturnTheRightValues(res, defaultPaginationResult);
                expect(res.body.result[0]._id).to.be.eql(badge._id.toString());
                expect(res.body.result[0].name).to.be.eql(badge.name);
                expect(res.body.result[0].addedBy).to.be.eql(badge.addedBy.toString());
                expect(res.body.result[0].assignedRole).to.be.eql(badge.assignedRole);
                expect(res.body.result[1]._id).to.be.eql(badges[0]._id.toString());
                expect(res.body.result[1].name).to.be.eql(badges[0].name);
                expect(res.body.result[1].addedBy).to.be.eql(badges[0].addedBy.toString());
                expect(res.body.result[1].assignedRole).to.be.eql(badges[0].assignedRole);
                done();
              });
          });
        });

        [vendorUser, regularUser].map((user) =>
          itReturnsForbiddenForTokenWithInvalidAccess({
            endpoint,
            method,
            user,
          }),
        );

        itReturnsForbiddenForNoToken({ endpoint, method });

        itReturnsAnErrorWhenServiceFails({
          endpoint,
          method,
          user: adminUser,
          model: Badge,
          modelMethod: 'aggregate',
          useExistingUser: true,
        });
      });
    });

    describe('Filter Tests', () => {
      beforeEach(async () => {
        await Badge.insertMany([badge, ...badges]);
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
          name: badge.name,
          createdAt: badge.createdAt,
          assignedRole: badge.assignedRole,
        };
        const filteredParams = querystring.stringify(multipleFilters);

        it('returns matched badge', (done) => {
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
              expect(res.body.result[0]._id).to.be.eql(badge._id.toString());
              expect(res.body.result[0].name).to.be.eql(multipleFilters.name);
              expect(res.body.result[0].assignedRole).to.be.eql(multipleFilters.assignedRole);
              done();
            });
        });
      });

      context('when no parameter is matched', () => {
        const nonMatchingFilters = {
          createdAt: '2020-11-12',
          name: 'Special badge',
          assignedRole: 11,
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
        filter: BADGE_FILTERS,
        method,
        endpoint,
        user: adminUser,
        dataObject: badge,
        useExistingUser: true,
      });
    });
  });
});
