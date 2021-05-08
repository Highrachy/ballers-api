import mongoose from 'mongoose';
import querystring from 'querystring';
import { expect, request, sinon } from '../config';
import Notification from '../../server/models/notification.model';
import NotificationFactory from '../factories/notification.factory';
import UserFactory from '../factories/user.factory';
import { addUser } from '../../server/services/user.service';
import { USER_ROLE } from '../../server/helpers/constants';
import { NOTIFICATION_FILTERS } from '../../server/helpers/filters';
import {
  itReturnsForbiddenForNoToken,
  itReturnsTheRightPaginationValue,
  itReturnsAnErrorWhenServiceFails,
  itReturnAllResultsWhenAnUnknownFilterIsUsed,
  defaultPaginationResult,
  expectsPaginationToReturnTheRightValues,
  itReturnsNoResultWhenNoFilterParameterIsMatched,
  filterTestForSingleParameter,
  itReturnsNotFoundForInvalidToken,
  futureDate,
  currentDate,
  pastDate,
} from '../helpers';

let userToken;

const regularUser = UserFactory.build(
  { role: USER_ROLE.USER, activated: true },
  { generateId: true },
);
const adminUser = UserFactory.build(
  { role: USER_ROLE.ADMIN, activated: true },
  { generateId: true },
);
const editorUser = UserFactory.build(
  { role: USER_ROLE.EDITOR, activated: true },
  { generateId: true },
);
const vendorUser = UserFactory.build(
  { role: USER_ROLE.VENDOR, activated: true },
  { generateId: true },
);

describe('Notification Controller', () => {
  beforeEach(async () => {
    userToken = await addUser(regularUser);
  });

  describe('Mark Notification as Read', () => {
    const userNotification = NotificationFactory.build(
      { userId: regularUser._id, read: false },
      { generateId: true },
    );
    const adminNotification = NotificationFactory.build(
      { userId: adminUser._id, read: false },
      { generateId: true },
    );
    const vendorNotification = NotificationFactory.build(
      { userId: vendorUser._id, read: false },
      { generateId: true },
    );
    const editorNotification = NotificationFactory.build(
      { userId: editorUser._id, read: false },
      { generateId: true },
    );
    const method = 'put';
    const endpoint = `/api/v1/notification/read/${userNotification._id}`;

    let adminToken;
    let vendorToken;
    let editorToken;

    beforeEach(async () => {
      adminToken = await addUser(adminUser);
      vendorToken = await addUser(vendorUser);
      editorToken = await addUser(editorUser);

      await Notification.insertMany([
        userNotification,
        adminNotification,
        vendorNotification,
        editorNotification,
      ]);
    });

    context('with valid data', () => {
      context('when user is a user', () => {
        it('marks notification as read', (done) => {
          request()
            [method](`/api/v1/notification/read/${userNotification._id}`)
            .set('authorization', userToken)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body.message).to.be.eql('Notification marked as read');
              expect(res.body.notification._id).to.be.eql(userNotification._id.toString());
              expect(res.body.notification.userId).to.be.eql(regularUser._id.toString());
              expect(res.body.notification.read).to.be.eql(true);
              done();
            });
        });
      });

      context('when user is an admin', () => {
        it('marks notification as read', (done) => {
          request()
            [method](`/api/v1/notification/read/${adminNotification._id}`)
            .set('authorization', adminToken)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body.message).to.be.eql('Notification marked as read');
              expect(res.body.notification._id).to.be.eql(adminNotification._id.toString());
              expect(res.body.notification.userId).to.be.eql(adminUser._id.toString());
              expect(res.body.notification.read).to.be.eql(true);
              done();
            });
        });
      });

      context('when user is a vendor', () => {
        it('marks notification as read', (done) => {
          request()
            [method](`/api/v1/notification/read/${vendorNotification._id}`)
            .set('authorization', vendorToken)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body.message).to.be.eql('Notification marked as read');
              expect(res.body.notification._id).to.be.eql(vendorNotification._id.toString());
              expect(res.body.notification.userId).to.be.eql(vendorUser._id.toString());
              expect(res.body.notification.read).to.be.eql(true);
              done();
            });
        });
      });

      context('when user is an editor', () => {
        it('marks notification as read', (done) => {
          request()
            [method](`/api/v1/notification/read/${editorNotification._id}`)
            .set('authorization', editorToken)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body.message).to.be.eql('Notification marked as read');
              expect(res.body.notification._id).to.be.eql(editorNotification._id.toString());
              expect(res.body.notification.userId).to.be.eql(editorUser._id.toString());
              expect(res.body.notification.read).to.be.eql(true);
              done();
            });
        });
      });
    });

    context('with invalid notification id', () => {
      it('returns not found', (done) => {
        request()
          [method](`/api/v1/notification/read/${mongoose.Types.ObjectId()}`)
          .set('authorization', userToken)
          .end((err, res) => {
            expect(res).to.have.status(400);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.error.message).to.be.eql('Notification not found');
            done();
          });
      });
    });

    context('with token without valid access', () => {
      [...new Array(3)].map((_, index) =>
        it('returns successful payload', (done) => {
          request()
            [method](`/api/v1/notification/read/${userNotification._id}`)
            .set('authorization', [adminToken, vendorToken, editorToken][index])
            .end((err, res) => {
              expect(res).to.have.status(400);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.error.message).to.be.eql('Notification not found');
              done();
            });
        }),
      );
    });

    itReturnsNotFoundForInvalidToken({
      endpoint,
      method,
      user: regularUser,
      userId: regularUser._id,
      useExistingUser: true,
    });

    itReturnsForbiddenForNoToken({ endpoint, method });

    context('when markNotificationAsRead service fails', () => {
      it('returns the error', (done) => {
        sinon.stub(Notification, 'findOneAndUpdate').throws(new Error('Type Error'));
        request()
          [method](`/api/v1/notification/read/${userNotification._id}`)
          .set('authorization', userToken)
          .end((err, res) => {
            expect(res).to.have.status(400);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Error marking notification as read');
            done();
            Notification.findOneAndUpdate.restore();
          });
      });
    });
  });

  describe('Mark all Notifications as Read', () => {
    const method = 'put';
    const endpoint = '/api/v1/notification/read/all';

    const userNotifications = NotificationFactory.buildList(7, {
      userId: regularUser._id,
      read: false,
    });

    const adminNotifications = NotificationFactory.buildList(3, {
      userId: adminUser._id,
      read: false,
    });

    let adminToken;

    beforeEach(async () => {
      adminToken = await addUser(adminUser);
      await Notification.insertMany([...userNotifications, ...adminNotifications]);
    });

    context('with valid data', () => {
      it('returns notification as read', (done) => {
        request()
          [method](endpoint)
          .set('authorization', userToken)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.message).to.be.eql('All notifications marked as read');
            expect(res.body.noOfMarkedNotifications).to.be.eql(userNotifications.length + 1);
            done();
          });
      });
    });

    context('with valid data', () => {
      it('returns notification as read', (done) => {
        request()
          [method](endpoint)
          .set('authorization', adminToken)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.message).to.be.eql('All notifications marked as read');
            expect(res.body.noOfMarkedNotifications).to.be.eql(adminNotifications.length + 1);
            done();
          });
      });
    });

    itReturnsNotFoundForInvalidToken({
      endpoint,
      method,
      user: regularUser,
      userId: regularUser._id,
      useExistingUser: true,
    });

    itReturnsForbiddenForNoToken({ endpoint, method });

    context('when markAllNotificationsAsRead service fails', () => {
      it('returns the error', (done) => {
        sinon.stub(Notification, 'updateMany').throws(new Error('Type Error'));
        request()
          [method](endpoint)
          .set('authorization', userToken)
          .end((err, res) => {
            expect(res).to.have.status(400);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Error marking all notifications as read');
            done();
            Notification.updateMany.restore();
          });
      });
    });
  });

  describe('Get all Notifications', () => {
    const method = 'get';
    const endpoint = '/api/v1/notification/all';

    const userNotifications = NotificationFactory.buildList(17, {
      userId: regularUser._id,
      read: false,
      createdAt: currentDate,
    });

    const adminNotifications = NotificationFactory.buildList(
      3,
      {
        userId: adminUser._id,
        read: false,
        createdAt: currentDate,
      },
      { generateId: true },
    );

    const editorNotification = NotificationFactory.build(
      {
        userId: editorUser._id,
        read: true,
        type: 1,
        createdAt: futureDate,
      },
      { generateId: true },
    );

    let adminToken;

    beforeEach(async () => {
      adminToken = await addUser(adminUser);
    });

    describe('Notification Pagination', () => {
      describe('when notifications exist in db', () => {
        beforeEach(async () => {
          await Notification.insertMany([...userNotifications, ...adminNotifications]);
        });

        itReturnsTheRightPaginationValue({
          endpoint,
          method,
          user: regularUser,
          useExistingUser: true,
        });

        context('when request is sent by admin', () => {
          it('returns admin notifications', (done) => {
            request()
              [method](endpoint)
              .set('authorization', adminToken)
              .end((err, res) => {
                expectsPaginationToReturnTheRightValues(res, {
                  ...defaultPaginationResult,
                  total: 4,
                  result: 4,
                  totalPage: 1,
                });
                done();
              });
          });
        });

        itReturnsForbiddenForNoToken({ endpoint, method });

        itReturnsAnErrorWhenServiceFails({
          endpoint,
          method,
          user: regularUser,
          model: Notification,
          modelMethod: 'aggregate',
          useExistingUser: true,
        });
      });
    });

    describe('Filter Tests', () => {
      beforeEach(async () => {
        await Notification.insertMany([adminNotifications[0], editorNotification]);
      });

      describe('Unknown Filters', () => {
        const unknownFilter = {
          dob: '1993-02-01',
        };

        itReturnAllResultsWhenAnUnknownFilterIsUsed({
          filter: unknownFilter,
          method,
          endpoint,
          user: regularUser,
          expectedPagination: {
            ...defaultPaginationResult,
            total: 1,
            result: 1,
            totalPage: 1,
          },
          useExistingUser: true,
        });
      });

      context('when multiple filters are used', () => {
        const multipleFilters = {
          read: adminNotifications[0].read,
          type: adminNotifications[0].type,
          createdAt: adminNotifications[0].createdAt,
        };
        const filteredParams = querystring.stringify(multipleFilters);

        it('returns matched notification', (done) => {
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
              expect(res.body.result[0]._id).to.be.eql(adminNotifications[0]._id.toString());
              expect(res.body.result[0].userId).to.be.eql(adminUser._id.toString());
              expect(res.body.result[0].read).to.be.eql(adminNotifications[0].read);
              expect(res.body.result[0].type).to.be.eql(adminNotifications[0].type);
              expect(res.body.result[0].createdAt).to.have.string(adminNotifications[0].createdAt);
              done();
            });
        });
      });

      context('when no parameter is matched', () => {
        const nonMatchingFilters = {
          read: true,
          type: 2,
          createdAt: pastDate,
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
        filter: NOTIFICATION_FILTERS,
        method,
        endpoint,
        user: editorUser,
        dataObject: editorNotification,
      });
    });
  });
});
