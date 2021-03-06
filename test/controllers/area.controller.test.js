import mongoose from 'mongoose';
import querystring from 'querystring';
import { expect, request, sinon } from '../config';
import Area from '../../server/models/area.model';
import ContentProperty from '../../server/models/contentProperty.model';
import AreaFactory from '../factories/area.factory';
import UserFactory from '../factories/user.factory';
import ContentPropertyFactory from '../factories/contentProperty.factory';
import { addUser } from '../../server/services/user.service';
import { addArea } from '../../server/services/area.service';
import { addContentProperty } from '../../server/services/contentProperty.service';
import { USER_ROLE } from '../../server/helpers/constants';
import { AREA_FILTERS } from '../../server/helpers/filters';
import {
  itReturnsForbiddenForNoToken,
  itReturnsForbiddenForTokenWithInvalidAccess,
  itReturnsEmptyValuesWhenNoItemExistInDatabase,
  itReturnsTheRightPaginationValue,
  itReturnsAnErrorWhenServiceFails,
  itReturnAllResultsWhenAnUnknownFilterIsUsed,
  defaultPaginationResult,
  expectsPaginationToReturnTheRightValues,
  itReturnsNoResultWhenNoFilterParameterIsMatched,
  filterTestForSingleParameter,
  futureDate,
  currentDate,
} from '../helpers';

let userToken;
let adminToken;
let editorToken;

const regularUser = UserFactory.build({ role: USER_ROLE.USER, activated: true });
const adminUser = UserFactory.build({ role: USER_ROLE.ADMIN, activated: true });
const editorUser = UserFactory.build({ role: USER_ROLE.EDITOR, activated: true });
const vendorUser = UserFactory.build({ role: USER_ROLE.VENDOR, activated: true });

describe('Area Controller', () => {
  beforeEach(async () => {
    editorToken = await addUser(editorUser);
    userToken = await addUser(regularUser);
    adminToken = await addUser(adminUser);
    await addUser(vendorUser);
  });

  describe('Add Area Route', () => {
    context('when a valid token is used', () => {
      [...new Array(2)].map((_, index) =>
        it('returns successful area', (done) => {
          const area = AreaFactory.build();
          request()
            .post('/api/v1/area/add')
            .set('authorization', [editorToken, adminToken][index])
            .send(area)
            .end((err, res) => {
              expect(res).to.have.status(201);
              expect(res.body.success).to.be.eql(true);
              expect(res.body.message).to.be.eql('Area added successfully');
              expect(res.body.area).to.include(area);
              done();
            });
        }),
      );
    });

    context('when user token is used', () => {
      it('returns forbidden', (done) => {
        const area = AreaFactory.build();
        request()
          .post('/api/v1/area/add')
          .set('authorization', userToken)
          .send(area)
          .end((err, res) => {
            expect(res).to.have.status(403);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('You are not permitted to perform this action');
            done();
          });
      });
    });

    context('with invalid data', () => {
      context('when area already exists with same state', () => {
        const ogunState = AreaFactory.build({ state: 'ogun', area: 'abeokuta' });
        beforeEach(async () => {
          await addArea(ogunState);
        });
        it('returns an error', (done) => {
          request()
            .post('/api/v1/area/add')
            .set('authorization', editorToken)
            .send(ogunState)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Area already exists');
              expect(res.body.error).to.be.eql('Area already exists');
              done();
            });
        });
      });

      context('when area is empty', () => {
        it('returns an error', (done) => {
          const area = AreaFactory.build({ area: '' });
          request()
            .post('/api/v1/area/add')
            .set('authorization', editorToken)
            .send(area)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Area" is not allowed to be empty');
              done();
            });
        });
      });

      context('when state is empty', () => {
        it('returns an error', (done) => {
          const area = AreaFactory.build({ state: '' });
          request()
            .post('/api/v1/area/add')
            .set('authorization', editorToken)
            .send(area)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"State" is not allowed to be empty');
              done();
            });
        });
      });

      context('when longitude is empty', () => {
        it('returns added area', (done) => {
          const area = AreaFactory.build({ longitude: '' });
          request()
            .post('/api/v1/area/add')
            .set('authorization', editorToken)
            .send(area)
            .end((err, res) => {
              expect(res).to.have.status(201);
              expect(res.body.success).to.be.eql(true);
              expect(res.body.message).to.be.eql('Area added successfully');
              expect(res.body.area).to.include({ ...area, longitude: null });
              done();
            });
        });
      });

      context('when latitude is empty', () => {
        it('returns added area', (done) => {
          const area = AreaFactory.build({ latitude: '' });
          request()
            .post('/api/v1/area/add')
            .set('authorization', editorToken)
            .send(area)
            .end((err, res) => {
              expect(res).to.have.status(201);
              expect(res.body.success).to.be.eql(true);
              expect(res.body.message).to.be.eql('Area added successfully');
              expect(res.body.area).to.include({ ...area, latitude: null });
              done();
            });
        });
      });
    });
  });

  describe('Get all states', () => {
    const lagosState = AreaFactory.build({ state: 'lagos' });
    const areasInOyoState = AreaFactory.buildList(5, { state: 'oyo' });
    beforeEach(async () => {
      await addArea(lagosState);
      await Area.insertMany(areasInOyoState);
    });

    context('when a valid token is used', () => {
      [...new Array(2)].map((_, index) =>
        it('returns array of two states', (done) => {
          request()
            .get('/api/v1/area/states')
            .set('authorization', [editorToken, adminToken][index])
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body.states.length).to.be.eql(2);
              done();
            });
        }),
      );
    });

    context('without token', () => {
      it('returns array of two states', (done) => {
        request()
          .get('/api/v1/area/states')
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.states.length).to.be.eql(2);
            done();
          });
      });
    });

    context('when getStateAndArea service fails', () => {
      it('returns the error', (done) => {
        sinon.stub(Area, 'distinct').throws(new Error('Type Error'));
        request()
          .get('/api/v1/area/states')
          .end((err, res) => {
            expect(res).to.have.status(500);
            done();
            Area.distinct.restore();
          });
      });
    });
  });

  describe('Get all areas', () => {
    const state = 'lagos';
    const areaId = mongoose.Types.ObjectId();
    const epe = AreaFactory.build({ _id: areaId, state, area: 'epe' });
    const randomAreas = AreaFactory.buildList(4, { state });
    const contentProperties = ContentPropertyFactory.buildList(3, { areaId });

    beforeEach(async () => {
      await addArea(epe);
      await Area.insertMany(randomAreas);
      await ContentProperty.insertMany(contentProperties);
    });

    context('when a valid token is used', () => {
      [...new Array(2)].map((_, index) =>
        it('returns array of five areas', (done) => {
          request()
            .get(`/api/v1/area/state/${state}`)
            .set('authorization', [editorToken, adminToken][index])
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body.areas.length).to.be.eql(5);
              done();
            });
        }),
      );
    });

    context('without token', () => {
      it('returns array of one area', (done) => {
        request()
          .get(`/api/v1/area/state/${state}`)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.areas.length).to.be.eql(1);
            done();
          });
      });
    });

    context('when getAreasByState service fails', () => {
      it('returns the error', (done) => {
        sinon.stub(Area, 'aggregate').throws(new Error('Type Error'));
        request()
          .get(`/api/v1/area/state/${state}`)
          .end((err, res) => {
            expect(res).to.have.status(500);
            done();
            Area.aggregate.restore();
          });
      });
    });
  });

  describe('Update Area', () => {
    const areaId = mongoose.Types.ObjectId();
    const area = AreaFactory.build({
      _id: areaId,
      area: 'ibadan',
      state: 'oyo',
      longitude: 40.7128,
      latitude: 74.006,
    });
    const updatedArea = {
      id: areaId,
      area: 'Oshogbo',
      state: 'Oyo',
      longitude: 30.7128,
      latitude: 79.666,
    };

    beforeEach(async () => {
      await addArea(area);
    });

    context('when a valid token is used', () => {
      [...new Array(2)].map((_, index) =>
        it('returns updated area', (done) => {
          request()
            .put('/api/v1/area/update')
            .set('authorization', [editorToken, adminToken][index])
            .send(updatedArea)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body.area._id).to.be.eql(areaId.toString());
              expect(res.body.area.area).to.be.eql(updatedArea.area);
              expect(res.body.area.state).to.be.eql(updatedArea.state);
              expect(res.body.area.longitude).to.be.eql(updatedArea.longitude);
              expect(res.body.area.latitude).to.be.eql(updatedArea.latitude);
              done();
            });
        }),
      );
    });

    context('when user token is used', () => {
      it('returns forbidden', (done) => {
        request()
          .put('/api/v1/area/update')
          .set('authorization', userToken)
          .send(updatedArea)
          .end((err, res) => {
            expect(res).to.have.status(403);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('You are not permitted to perform this action');
            done();
          });
      });
    });

    context('without token', () => {
      it('returns error', (done) => {
        request()
          .put('/api/v1/area/update')
          .send(updatedArea)
          .end((err, res) => {
            expect(res).to.have.status(403);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Token needed to access resources');
            done();
          });
      });
    });

    context('with invalid area id', () => {
      const invalidAreaId = mongoose.Types.ObjectId();
      it('returns a updated user', (done) => {
        request()
          .put('/api/v1/area/update')
          .set('authorization', editorToken)
          .send({ ...updatedArea, id: invalidAreaId })
          .end((err, res) => {
            expect(res).to.have.status(404);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Area not found');
            done();
          });
      });
    });

    context('when update service returns an error', () => {
      it('returns the error', (done) => {
        sinon.stub(Area, 'findByIdAndUpdate').throws(new Error('Type Error'));
        request()
          .put('/api/v1/area/update')
          .set('authorization', editorToken)
          .send(updatedArea)
          .end((err, res) => {
            expect(res).to.have.status(400);
            expect(res.body.success).to.be.eql(false);
            done();
            Area.findByIdAndUpdate.restore();
          });
      });
    });

    context('with invalid data', () => {
      context('when area id is empty', () => {
        it('returns an error', (done) => {
          request()
            .put('/api/v1/area/update')
            .set('authorization', editorToken)
            .send({ ...updatedArea, id: '' })
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Area Id" is not allowed to be empty');
              done();
            });
        });
      });

      context('when state is empty', () => {
        it('returns an error', (done) => {
          request()
            .put('/api/v1/area/update')
            .set('authorization', editorToken)
            .send({ ...updatedArea, state: '' })
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"State" is not allowed to be empty');
              done();
            });
        });
      });

      context('when area is empty', () => {
        it('returns an error', (done) => {
          request()
            .put('/api/v1/area/update')
            .set('authorization', editorToken)
            .send({ ...updatedArea, area: '' })
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Area" is not allowed to be empty');
              done();
            });
        });
      });

      context('when latitude is empty', () => {
        it('returns updated area', (done) => {
          request()
            .put('/api/v1/area/update')
            .set('authorization', editorToken)
            .send({ ...updatedArea, latitude: '' })
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body.area._id).to.be.eql(areaId.toString());
              expect(res.body.area.latitude).to.be.eql(null);
              done();
            });
        });
      });

      context('when longitude is empty', () => {
        it('returns updated area', (done) => {
          request()
            .put('/api/v1/area/update')
            .set('authorization', editorToken)
            .send({ ...updatedArea, longitude: '' })
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body.area._id).to.be.eql(areaId.toString());
              expect(res.body.area.longitude).to.be.eql(null);
              done();
            });
        });
      });
    });
  });

  describe('Delete area', () => {
    const areaId = mongoose.Types.ObjectId();
    const area = AreaFactory.build({ _id: areaId, areaId });

    beforeEach(async () => {
      await addArea(area);
    });

    context('when a valid token is used', () => {
      [...new Array(2)].map((_, index) =>
        it('deletes area', (done) => {
          request()
            .delete(`/api/v1/area/delete/${areaId}`)
            .set('authorization', [editorToken, adminToken][index])
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body.message).to.be.eql('Area deleted');
              done();
            });
        }),
      );
    });

    context('when user token is used', () => {
      it('returns forbidden', (done) => {
        request()
          .delete(`/api/v1/area/delete/${areaId}`)
          .set('authorization', userToken)
          .end((err, res) => {
            expect(res).to.have.status(403);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('You are not permitted to perform this action');
            done();
          });
      });
    });

    context('without token', () => {
      it('returns error', (done) => {
        request()
          .delete(`/api/v1/area/delete/${areaId}`)
          .end((err, res) => {
            expect(res).to.have.status(403);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Token needed to access resources');
            done();
          });
      });
    });

    context('when delete area service returns an error', () => {
      it('returns the error', (done) => {
        sinon.stub(Area, 'findByIdAndDelete').throws(new Error('Type Error'));
        request()
          .delete(`/api/v1/area/delete/${areaId}`)
          .set('authorization', editorToken)
          .end((err, res) => {
            expect(res).to.have.status(400);
            expect(res.body.success).to.be.eql(false);
            done();
            Area.findByIdAndDelete.restore();
          });
      });
    });

    context('when area is assigned to a content property', () => {
      const contentProperty = ContentPropertyFactory.build({ areaId });
      beforeEach(async () => {
        await addContentProperty(contentProperty);
      });

      it('returns error', (done) => {
        request()
          .delete(`/api/v1/area/delete/${areaId}`)
          .set('authorization', editorToken)
          .end((err, res) => {
            expect(res).to.have.status(412);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Area is linked to 1 content property');
            done();
          });
      });
    });

    context('when area is assigned to 5 content properties', () => {
      const contentProperties = ContentPropertyFactory.buildList(5, { areaId });

      beforeEach(async () => {
        await ContentProperty.insertMany(contentProperties);
      });

      it('returns error', (done) => {
        request()
          .delete(`/api/v1/area/delete/${areaId}`)
          .set('authorization', editorToken)
          .end((err, res) => {
            expect(res).to.have.status(412);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Area is linked to 5 content properties');
            done();
          });
      });
    });

    context('with invalid id supplied', () => {
      const invalidId = mongoose.Types.ObjectId();
      context('when area id is invalid', () => {
        it('returns an error', (done) => {
          request()
            .delete(`/api/v1/area/delete/${invalidId}`)
            .set('authorization', editorToken)
            .end((err, res) => {
              expect(res).to.have.status(404);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Area not found');
              done();
            });
        });
      });
    });
  });

  describe('Get all areas and corresponding properties', () => {
    const endpoint = '/api/v1/area/all';
    const method = 'get';

    const ajahArea = AreaFactory.build(
      { area: 'Ajah', state: 'Abuja', createdAt: futureDate },
      { generateId: true },
    );
    const ajahAreaProperty = ContentPropertyFactory.build(
      { areaId: ajahArea._id, price: 500_000 },
      { generateId: true },
    );

    const dummyArea = AreaFactory.build(
      { area: 'Ikeja', state: 'Ogun', createdAt: currentDate },
      { generateId: true },
    );
    const dummyAreaProperties = ContentPropertyFactory.buildList(
      5,
      { areaId: dummyArea._id },
      { generateId: true },
    );

    const dummyAreas = AreaFactory.buildList(9, { createdAt: currentDate }, { generateId: true });
    const dummyAreasProperties = dummyAreas.map((_, index) =>
      ContentPropertyFactory.build({ areaId: dummyAreas[index]._id }, { generateId: true }),
    );

    const emptyAreas = AreaFactory.buildList(7, {}, { generateId: true });

    describe('Pagination Tests', () => {
      context('when no area exists in db', () => {
        [adminUser, editorUser].map((user) =>
          itReturnsEmptyValuesWhenNoItemExistInDatabase({
            endpoint,
            method,
            user,
            useExistingUser: true,
          }),
        );
      });

      describe('when areas exist in db', () => {
        beforeEach(async () => {
          await Area.insertMany([ajahArea, dummyArea, ...dummyAreas, ...emptyAreas]);
          await ContentProperty.insertMany([
            ajahAreaProperty,
            ...dummyAreaProperties,
            ...dummyAreasProperties,
          ]);
        });

        itReturnsTheRightPaginationValue({
          endpoint,
          method,
          user: adminUser,
          useExistingUser: true,
        });

        context('when a valid token is used', () => {
          it('returns all areas and properties', (done) => {
            request()
              .get(endpoint)
              .set('authorization', editorToken)
              .end((err, res) => {
                expectsPaginationToReturnTheRightValues(res, defaultPaginationResult);
                expect(res.body.result[0]._id).to.be.eql(ajahArea._id.toString());
                expect(res.body.result[0].area).to.be.eql(ajahArea.area);
                expect(res.body.result[0].numOfProperties).to.be.eql(1);
                expect(res.body.result[0].minimumPrice).to.be.eql(500_000);
                expect(res.body.result[0].maximumPrice).to.be.eql(500_000);
                expect(res.body.result[0].averagePrice).to.be.eql(500_000);
                expect(res.body.result[1]._id).to.be.eql(dummyArea._id.toString());
                expect(res.body.result[1].area).to.be.eql(dummyArea.area);
                expect(res.body.result[1].numOfProperties).to.be.eql(5);
                expect(res.body.result[1].minimumPrice).to.be.eql(4_000_010);
                expect(res.body.result[1].maximumPrice).to.be.eql(4_000_014);
                expect(res.body.result[1].averagePrice).to.be.eql(4_000_012);
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

        itReturnsAnErrorWhenServiceFails({
          endpoint,
          method,
          user: editorUser,
          model: Area,
          modelMethod: 'aggregate',
          useExistingUser: true,
        });
      });
    });

    describe('Filter Tests', () => {
      beforeEach(async () => {
        await Area.insertMany([ajahArea, dummyArea, ...dummyAreas, ...emptyAreas]);
        await ContentProperty.insertMany([
          ajahAreaProperty,
          ...dummyAreaProperties,
          ...dummyAreasProperties,
        ]);
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
          area: ajahArea.area,
          createdAt: ajahArea.createdAt,
          state: ajahArea.state,
        };
        const filteredParams = querystring.stringify(multipleFilters);

        it('returns matched area', (done) => {
          request()
            [method](`${endpoint}?${filteredParams}`)
            .set('authorization', editorToken)
            .end((err, res) => {
              expectsPaginationToReturnTheRightValues(res, {
                currentPage: 1,
                limit: 10,
                offset: 0,
                result: 1,
                total: 1,
                totalPage: 1,
              });
              expect(res.body.result[0]._id).to.be.eql(ajahArea._id.toString());
              expect(res.body.result[0].area).to.be.eql(multipleFilters.area);
              expect(res.body.result[0].state).to.be.eql(multipleFilters.state);
              done();
            });
        });
      });

      context('when no parameter is matched', () => {
        const nonMatchingFilters = {
          area: 'Houston',
          createdAt: '2020-11-12',
          state: 'Texas',
        };

        itReturnsNoResultWhenNoFilterParameterIsMatched({
          filter: nonMatchingFilters,
          method,
          endpoint,
          user: editorUser,
          useExistingUser: true,
        });
      });

      filterTestForSingleParameter({
        filter: AREA_FILTERS,
        method,
        endpoint,
        user: editorUser,
        dataObject: ajahArea,
        useExistingUser: true,
      });
    });
  });

  describe('Get area by id', () => {
    const areaId = mongoose.Types.ObjectId();
    const area = AreaFactory.build({ _id: areaId });
    const demoAssignedProperty1 = ContentPropertyFactory.build({ areaId, price: 100000 });
    const demoAssignedProperty2 = ContentPropertyFactory.build({ areaId, price: 500000 });

    beforeEach(async () => {
      await addArea(area);
      await addContentProperty(demoAssignedProperty1);
      await addContentProperty(demoAssignedProperty2);
    });

    context('when a valid token is used', () => {
      [...new Array(2)].map((_, index) =>
        it('returns the specified area', (done) => {
          request()
            .get(`/api/v1/area/${areaId}`)
            .set('authorization', [editorToken, adminToken][index])
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body.area._id).to.be.eql(areaId.toString());
              expect(res.body.area.state).to.be.eql(area.state);
              expect(res.body.area.area).to.be.eql(area.area);
              expect(res.body.area.longitude).to.be.eql(area.longitude);
              expect(res.body.area.latitude).to.be.eql(area.latitude);
              expect(res.body.area.minimumPrice).to.be.eql(100000);
              expect(res.body.area.maximumPrice).to.be.eql(500000);
              expect(res.body.area.averagePrice).to.be.eql(300000);
              expect(res.body.area.numOfProperties).to.be.eql(2);
              done();
            });
        }),
      );
    });

    context('when area has no content property', () => {
      const demoAreaId = mongoose.Types.ObjectId();
      const demoArea = AreaFactory.build({ _id: demoAreaId });
      beforeEach(async () => {
        await addArea(demoArea);
      });
      it('returns not found', (done) => {
        request()
          .get(`/api/v1/area/${demoAreaId}`)
          .set('authorization', editorToken)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.area._id).to.be.eql(demoAreaId.toString());
            expect(res.body.area.state).to.be.eql(demoArea.state);
            expect(res.body.area.area).to.be.eql(demoArea.area);
            expect(res.body.area.longitude).to.be.eql(demoArea.longitude);
            expect(res.body.area.latitude).to.be.eql(demoArea.latitude);
            expect(res.body.area.minimumPrice).to.be.eql(null);
            expect(res.body.area.maximumPrice).to.be.eql(null);
            expect(res.body.area.averagePrice).to.be.eql(null);
            expect(res.body.area.numOfProperties).to.be.eql(0);
            done();
          });
      });
    });

    context('when area id is invalid', () => {
      const invalidAreaId = mongoose.Types.ObjectId();
      it('returns not found', (done) => {
        request()
          .get(`/api/v1/area/${invalidAreaId}`)
          .set('authorization', editorToken)
          .end((err, res) => {
            expect(res).to.have.status(404);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Area not found');
            done();
          });
      });
    });

    context('without token', () => {
      it('returns error', (done) => {
        request()
          .get(`/api/v1/area/${areaId}`)
          .end((err, res) => {
            expect(res).to.have.status(403);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Token needed to access resources');
            done();
          });
      });
    });

    context('when getAreaAndContentPropertiesByAreaId service fails', () => {
      it('returns the error', (done) => {
        sinon.stub(Area, 'aggregate').throws(new Error('Type Error'));
        request()
          .get(`/api/v1/area/${areaId}`)
          .set('authorization', editorToken)
          .end((err, res) => {
            expect(res).to.have.status(500);
            done();
            Area.aggregate.restore();
          });
      });
    });
  });
});
