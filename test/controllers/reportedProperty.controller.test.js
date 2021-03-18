import { expect, request, sinon } from '../config';
import ReportedProperty from '../../server/models/reportedProperty.model';
import UserFactory from '../factories/user.factory';
import PropertyFactory from '../factories/property.factory';
import ReportedPropertyFactory from '../factories/reportedProperty.factory';
import { reportProperty } from '../../server/services/reportedProperty.service';
import { addProperty } from '../../server/services/property.service';
import { addUser } from '../../server/services/user.service';
import { USER_ROLE } from '../../server/helpers/constants';
import {
  itReturnsTheRightPaginationValue,
  itReturnsForbiddenForTokenWithInvalidAccess,
  itReturnsEmptyValuesWhenNoItemExistInDatabase,
  itReturnsForbiddenForNoToken,
  itReturnsAnErrorWhenServiceFails,
  itReturnsNotFoundForInvalidToken,
  expectsPaginationToReturnTheRightValues,
  defaultPaginationResult,
  expectResponseToExcludeSensitiveUserData,
  expectResponseToContainNecessaryPropertyData,
  futureDate,
} from '../helpers';

let adminToken;
let userToken;

const adminUser = UserFactory.build(
  { role: USER_ROLE.ADMIN, activated: true },
  { generateId: true },
);
const regularUser = UserFactory.build(
  { role: USER_ROLE.USER, activated: true },
  { generateId: true },
);
const vendorUser = UserFactory.build(
  { role: USER_ROLE.VENDOR, activated: true },
  { generateId: true },
);
const property = PropertyFactory.build(
  { addedBy: vendorUser._id, updatedBy: vendorUser._id, flagged: { status: false } },
  { generateId: true },
);

describe('Report Property Controller', () => {
  beforeEach(async () => {
    adminToken = await addUser(adminUser);
    userToken = await addUser(regularUser);
    await addUser(vendorUser);
    await addProperty(property);
  });

  describe('Report Property Route', () => {
    const method = 'post';
    const endpoint = '/api/v1/report-property/';
    const report = ReportedPropertyFactory.build({
      propertyId: property._id,
      reason: 'fraudulent vendor',
    });

    context('with valid data', () => {
      it('returns successful token', (done) => {
        request()
          .post('/api/v1/report-property/')
          .set('authorization', userToken)
          .send(report)
          .end((err, res) => {
            expect(res).to.have.status(201);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.message).to.be.eql('Property reported successfully');
            expect(res.body.report.propertyId).to.be.eql(property._id.toString());
            expect(res.body.report.reason).to.be.eql(report.reason);
            expect(res.body.report.resolved.status).to.be.eql(false);
            done();
          });
      });
    });

    context('with invalid data', () => {
      context('when propertyId is empty', () => {
        it('returns an error', (done) => {
          request()
            .post('/api/v1/report-property/')
            .set('authorization', userToken)
            .send({ ...report, propertyId: '' })
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Property Id" is not allowed to be empty');
              done();
            });
        });
      });

      context('when reason is empty', () => {
        it('returns an error', (done) => {
          request()
            .post('/api/v1/report-property/')
            .set('authorization', userToken)
            .send({ ...report, reason: '' })
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Reason" is not allowed to be empty');
              done();
            });
        });
      });
    });

    itReturnsForbiddenForTokenWithInvalidAccess({
      endpoint,
      method,
      user: adminUser,
      useExistingUser: true,
    });

    itReturnsForbiddenForNoToken({ endpoint, method });

    itReturnsNotFoundForInvalidToken({
      endpoint,
      method,
      user: regularUser,
      userId: regularUser._id,
      useExistingUser: true,
    });
  });

  describe('Resolve Report Route', () => {
    const method = 'put';
    const endpoint = '/api/v1/report-property/resolve';
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
      id: report._id,
      notes: 'vendor has been banned',
    };

    beforeEach(async () => {
      await reportProperty(report);
    });

    context('with valid token', () => {
      it('returns resolved report', (done) => {
        request()
          .put('/api/v1/report-property/resolve')
          .set('authorization', adminToken)
          .send(data)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.message).to.be.eql('Report resolved');
            expect(res.body.report._id).to.be.eql(report._id.toString());
            expect(res.body.report.resolved.status).to.be.eql(true);
            expect(res.body.report.resolved.notes).to.be.eql(data.notes);
            expect(res.body.report.resolved.by).to.be.eql(adminUser._id.toString());
            done();
          });
      });
    });

    context('with invalid data', () => {
      context('when id is empty', () => {
        it('returns an error', (done) => {
          request()
            .put('/api/v1/report-property/resolve')
            .set('authorization', adminToken)
            .send({ ...data, id: '' })
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Report Id" is not allowed to be empty');
              done();
            });
        });
      });

      context('when notes is empty', () => {
        it('returns an error', (done) => {
          request()
            .put('/api/v1/report-property/resolve')
            .set('authorization', adminToken)
            .send({ ...data, notes: '' })
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Notes" is not allowed to be empty');
              done();
            });
        });
      });
    });

    itReturnsForbiddenForTokenWithInvalidAccess({
      endpoint,
      method,
      user: regularUser,
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

    context('when update service returns an error', () => {
      it('returns the error', (done) => {
        sinon.stub(ReportedProperty, 'findByIdAndUpdate').throws(new Error('Type Error'));
        request()
          .put('/api/v1/report-property/resolve')
          .set('authorization', adminToken)
          .send(data)
          .end((err, res) => {
            expect(res).to.have.status(400);
            expect(res.body.success).to.be.eql(false);
            done();
            ReportedProperty.findByIdAndUpdate.restore();
          });
      });
    });
  });

  describe('Get all Reports Route', () => {
    const method = 'get';
    const endpoint = '/api/v1/report-property/all';

    const reports = ReportedPropertyFactory.buildList(
      17,
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
    const report = ReportedPropertyFactory.build(
      {
        propertyId: property._id,
        reason: 'suspicious activity',
        reportedBy: regularUser._id,
        resolved: {
          status: false,
          by: adminUser._id,
          notes: 'vendor banned',
          date: futureDate,
        },
        createdAt: futureDate,
      },
      { generateId: true },
    );

    describe('Report Pagination', () => {
      context('when no reports exists in db', () => {
        itReturnsEmptyValuesWhenNoItemExistInDatabase({
          endpoint,
          method,
          user: adminUser,
          useExistingUser: true,
        });
      });

      context('when reports exist in db', () => {
        beforeEach(async () => {
          await ReportedProperty.insertMany([report, ...reports]);
        });

        itReturnsTheRightPaginationValue({
          endpoint,
          method,
          user: adminUser,
          useExistingUser: true,
        });

        context('with a vendor token not attached to any property', () => {
          it('returns no property', (done) => {
            request()
              [method](`${endpoint}?limit=1&page=1`)
              .set('authorization', adminToken)
              .end((err, res) => {
                expectsPaginationToReturnTheRightValues(res, {
                  ...defaultPaginationResult,
                  limit: 1,
                  total: 18,
                  result: 1,
                  totalPage: 18,
                });
                expect(res.body.result[0]._id).to.be.eql(report._id.toString());
                expect(res.body.result[0].reportedBy._id).to.be.eql(regularUser._id.toString());
                expect(res.body.result[0].resolved.by._id).to.be.eql(adminUser._id.toString());
                expect(res.body.result[0].reason).to.be.eql(report.reason);
                expect(res.body.result[0].createdAt).to.have.string(report.createdAt);
                expect(res.body.result[0].resolved.notes).to.be.eql(report.resolved.notes);
                expect(res.body.result[0].resolved.date).to.have.string(report.resolved.date);
                expectResponseToExcludeSensitiveUserData(res.body.result[0].reportedBy);
                expectResponseToExcludeSensitiveUserData(res.body.result[0].resolved.by);
                expectResponseToContainNecessaryPropertyData(
                  res.body.result[0].propertyInfo,
                  property,
                );
                done();
              });
          });
        });

        [regularUser, vendorUser].map((user) =>
          itReturnsForbiddenForTokenWithInvalidAccess({
            endpoint,
            method,
            user,
            useExistingUser: true,
          }),
        );

        itReturnsForbiddenForNoToken({ endpoint, method });

        itReturnsAnErrorWhenServiceFails({
          endpoint,
          method,
          user: adminUser,
          model: ReportedProperty,
          modelMethod: 'aggregate',
          useExistingUser: true,
        });
      });
    });
  });
});
