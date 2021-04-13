import mongoose from 'mongoose';
import querystring from 'querystring';
import { expect, request, sinon } from '../config';
import ContentProperty from '../../server/models/contentProperty.model';
import ContentPropertyFactory from '../factories/contentProperty.factory';
import AreaFactory from '../factories/area.factory';
import UserFactory from '../factories/user.factory';
import { addUser } from '../../server/services/user.service';
import { addArea } from '../../server/services/area.service';
import { addContentProperty } from '../../server/services/contentProperty.service';
import { USER_ROLE } from '../../server/helpers/constants';
import { CONTENT_PROPERTY_FILTERS } from '../../server/helpers/filters';
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
const areaId = mongoose.Types.ObjectId();
const area = AreaFactory.build({ _id: areaId, area: 'Ikoyi', state: 'Lagos' });

describe('Content Property Controller', () => {
  beforeEach(async () => {
    editorToken = await addUser(editorUser);
    adminToken = await addUser(adminUser);
    userToken = await addUser(regularUser);
    await addUser(vendorUser);
    await addArea(area);
  });

  describe('Add Content Property Route', () => {
    context('when a valid token is used', () => {
      [...new Array(2)].map((_, index) =>
        it('returns successful property', (done) => {
          const property = ContentPropertyFactory.build({ areaId });
          request()
            .post('/api/v1/content-property/add')
            .set('authorization', [editorToken, adminToken][index])
            .send(property)
            .end((err, res) => {
              expect(res).to.have.status(201);
              expect(res.body.success).to.be.eql(true);
              expect(res.body.message).to.be.eql('Content property added successfully');
              expect(res.body.property).to.include({ ...property, areaId: areaId.toString() });
              expect(res.body.property.areaId).to.be.eql(areaId.toString());
              done();
            });
        }),
      );
    });

    context('when user token is used', () => {
      it('returns forbidden', (done) => {
        const property = ContentPropertyFactory.build({ areaId });
        request()
          .post('/api/v1/content-property/add')
          .set('authorization', userToken)
          .send(property)
          .end((err, res) => {
            expect(res).to.have.status(403);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('You are not permitted to perform this action');
            done();
          });
      });
    });

    context('with invalid data', () => {
      context('when area id is invalid', () => {
        it('returns an error', (done) => {
          const invalidId = mongoose.Types.ObjectId();
          const property = ContentPropertyFactory.build({ areaId: invalidId });
          request()
            .post('/api/v1/content-property/add')
            .set('authorization', editorToken)
            .send(property)
            .end((err, res) => {
              expect(res).to.have.status(404);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Area not found');
              done();
            });
        });
      });

      context('when area id is empty', () => {
        it('returns an error', (done) => {
          const property = ContentPropertyFactory.build({ areaId: '' });
          request()
            .post('/api/v1/content-property/add')
            .set('authorization', editorToken)
            .send(property)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Area Id" is not allowed to be empty');
              done();
            });
        });
      });

      context('when category is empty', () => {
        it('returns an error', (done) => {
          const property = ContentPropertyFactory.build({ areaId, category: '' });
          request()
            .post('/api/v1/content-property/add')
            .set('authorization', editorToken)
            .send(property)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Category" is not allowed to be empty');
              done();
            });
        });
      });

      context('when house type is empty', () => {
        it('returns an error', (done) => {
          const property = ContentPropertyFactory.build({ areaId, houseType: '' });
          request()
            .post('/api/v1/content-property/add')
            .set('authorization', editorToken)
            .send(property)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Property Type" is not allowed to be empty');
              done();
            });
        });
      });

      context('when price is empty', () => {
        it('returns an error', (done) => {
          const property = ContentPropertyFactory.build({ areaId, price: '' });
          request()
            .post('/api/v1/content-property/add')
            .set('authorization', editorToken)
            .send(property)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Price" must be a number');
              done();
            });
        });
      });
    });
  });

  describe('Update Content Property', () => {
    const contentPropertyId = mongoose.Types.ObjectId();
    const contentProperty = ContentPropertyFactory.build({
      _id: contentPropertyId,
      areaId,
      category: 'for rent',
      houseType: '1 bedroom',
      price: 4000000,
    });
    const newContentProperty = {
      id: contentPropertyId,
      areaId,
      category: 'for sale',
      houseType: 'Studio apartment',
      price: 1000000,
    };

    beforeEach(async () => {
      await addContentProperty(contentProperty);
    });

    context('when a valid token is used', () => {
      [...new Array(2)].map((_, index) =>
        it('returns updated content property', (done) => {
          request()
            .put('/api/v1/content-property/update')
            .set('authorization', [editorToken, adminToken][index])
            .send(newContentProperty)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body.property.category).to.be.eql(newContentProperty.category);
              expect(res.body.property.areaId).to.be.eql(areaId.toString());
              expect(res.body.property.houseType).to.be.eql(newContentProperty.houseType);
              expect(res.body.property.price).to.be.eql(newContentProperty.price);
              done();
            });
        }),
      );
    });

    context('when user token is used', () => {
      it('returns forbidden', (done) => {
        request()
          .put('/api/v1/content-property/update')
          .set('authorization', userToken)
          .send(newContentProperty)
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
          .put('/api/v1/content-property/update')
          .send(newContentProperty)
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
          .put('/api/v1/content-property/update')
          .set('authorization', editorToken)
          .send({ ...newContentProperty, areaId: invalidAreaId })
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
        sinon.stub(ContentProperty, 'findByIdAndUpdate').throws(new Error('Type Error'));
        request()
          .put('/api/v1/content-property/update')
          .set('authorization', editorToken)
          .send(newContentProperty)
          .end((err, res) => {
            expect(res).to.have.status(400);
            expect(res.body.success).to.be.eql(false);
            done();
            ContentProperty.findByIdAndUpdate.restore();
          });
      });
    });

    context('with invalid data', () => {
      const property = ContentPropertyFactory.build({ id: contentPropertyId, areaId });
      context('when property id is empty', () => {
        it('returns an error', (done) => {
          request()
            .put('/api/v1/content-property/update')
            .set('authorization', editorToken)
            .send({ ...property, id: '' })
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Property Id" is not allowed to be empty');
              done();
            });
        });
      });

      context('when area id is empty', () => {
        it('returns an error', (done) => {
          request()
            .put('/api/v1/content-property/update')
            .set('authorization', editorToken)
            .send({ ...property, areaId: '' })
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Area Id" is not allowed to be empty');
              done();
            });
        });
      });

      context('when category is empty', () => {
        it('returns an error', (done) => {
          request()
            .put('/api/v1/content-property/update')
            .set('authorization', editorToken)
            .send({ ...property, category: '' })
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Category" is not allowed to be empty');
              done();
            });
        });
      });

      context('when house type is empty', () => {
        it('returns an error', (done) => {
          request()
            .put('/api/v1/content-property/update')
            .set('authorization', editorToken)
            .send({ ...property, houseType: '' })
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Property Type" is not allowed to be empty');
              done();
            });
        });
      });

      context('when property price is empty', () => {
        it('returns an error', (done) => {
          request()
            .put('/api/v1/content-property/update')
            .set('authorization', editorToken)
            .send({ ...property, price: '' })
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Price" must be a number');
              done();
            });
        });
      });
    });
  });

  describe('Delete Content Property', () => {
    const contentPropertyId = mongoose.Types.ObjectId();
    const contentProperty = ContentPropertyFactory.build({ _id: contentPropertyId, areaId });

    beforeEach(async () => {
      await addContentProperty(contentProperty);
    });

    context('when a valid token is used', () => {
      [...new Array(2)].map((_, index) =>
        it('deletes content property', (done) => {
          request()
            .delete(`/api/v1/content-property/delete/${contentPropertyId}`)
            .set('authorization', [editorToken, adminToken][index])
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body.message).to.be.eql('Content property deleted');
              done();
            });
        }),
      );
    });

    context('when user token is used', () => {
      it('returns forbidden', (done) => {
        request()
          .delete(`/api/v1/content-property/delete/${contentPropertyId}`)
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
          .delete(`/api/v1/content-property/delete/${contentPropertyId}`)
          .end((err, res) => {
            expect(res).to.have.status(403);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Token needed to access resources');
            done();
          });
      });
    });

    context('when delete content property service returns an error', () => {
      it('returns the error', (done) => {
        sinon.stub(ContentProperty, 'findByIdAndDelete').throws(new Error('Type Error'));
        request()
          .delete(`/api/v1/content-property/delete/${contentPropertyId}`)
          .set('authorization', editorToken)
          .end((err, res) => {
            expect(res).to.have.status(400);
            expect(res.body.success).to.be.eql(false);
            done();
            ContentProperty.findByIdAndDelete.restore();
          });
      });
    });

    context('with invalid id supplied', () => {
      const invalidId = mongoose.Types.ObjectId();
      context('when content property id is invalid', () => {
        it('returns an error', (done) => {
          request()
            .delete(`/api/v1/content-property/delete/${invalidId}`)
            .set('authorization', editorToken)
            .end((err, res) => {
              expect(res).to.have.status(404);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Property not found');
              done();
            });
        });
      });
    });
  });

  describe('Get all house types for an area', () => {
    const randomProperties = ContentPropertyFactory.buildList(5, { areaId });
    const duplexProperties = ContentPropertyFactory.buildList(5, {
      areaId,
      houseType: 'Terrace duplex',
    });
    beforeEach(async () => {
      await ContentProperty.insertMany(randomProperties);
      await ContentProperty.insertMany(duplexProperties);
    });

    context('without token', () => {
      it('returns array of house types', (done) => {
        request()
          .get(`/api/v1/content-property/area/${areaId}`)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.houseTypes.length).to.be.eql(6);
            done();
          });
      });
    });

    context('when getHouseTypesByAreaId service fails', () => {
      it('returns the error', (done) => {
        sinon.stub(ContentProperty, 'find').throws(new Error('Type Error'));
        request()
          .get(`/api/v1/content-property/area/${areaId}`)
          .end((err, res) => {
            expect(res).to.have.status(500);
            done();
            ContentProperty.find.restore();
          });
      });
    });
  });

  describe('Get Search content properties calculation', () => {
    const houseType = 'Terrace duplex';
    const randomProperties = ContentPropertyFactory.buildList(5, { areaId, price: 5000000 });
    const duplexProperty1 = ContentPropertyFactory.build({
      areaId,
      houseType,
      price: 1000000,
    });
    const duplexProperty2 = ContentPropertyFactory.build({
      areaId,
      houseType,
      price: 2000000,
    });
    const duplexProperty3 = ContentPropertyFactory.build({
      areaId,
      houseType,
      price: 3000000,
    });
    beforeEach(async () => {
      await ContentProperty.insertMany(randomProperties);
      await addContentProperty(duplexProperty1);
      await addContentProperty(duplexProperty2);
      await addContentProperty(duplexProperty3);
    });

    context('when parameters are sent', () => {
      it('returns evaluation of 3 properties', (done) => {
        request()
          .get(
            `/api/v1/content-property/search?area=${area.area}&state=${area.state}&houseType=${houseType}`,
          )
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.evaluation.minimumPrice).to.be.eql(1000000);
            expect(res.body.evaluation.maximumPrice).to.be.eql(3000000);
            expect(res.body.evaluation.averagePrice).to.be.eql(2000000);
            expect(res.body.evaluation.type).to.be.eql(houseType);
            expect(res.body.evaluation.areaName).to.be.eql(area.area);
            expect(res.body.evaluation.stateName).to.be.eql(area.state);
            done();
          });
      });
    });

    context('when areas are sent in different cases', () => {
      const areaNameInDifferentCases = ['Ikoyi', 'IKOYI', 'IKOyi', 'ikoyi'];
      areaNameInDifferentCases.map((areaName) =>
        it('returns array of house types', (done) => {
          request()
            .get(
              `/api/v1/content-property/search?area=${areaName}&state=${area.state}&houseType=${houseType}`,
            )
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body.evaluation.minimumPrice).to.be.eql(1000000);
              expect(res.body.evaluation.maximumPrice).to.be.eql(3000000);
              expect(res.body.evaluation.averagePrice).to.be.eql(2000000);
              expect(res.body.evaluation.type).to.be.eql(houseType);
              expect(res.body.evaluation.areaName).to.be.eql(area.area);
              expect(res.body.evaluation.stateName).to.be.eql(area.state);
              done();
            });
        }),
      );
    });

    context('when the area and state parameters are sent', () => {
      it('returns evaluation of 8 properties', (done) => {
        request()
          .get(`/api/v1/content-property/search?area=${area.area}&state=${area.state}`)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.evaluation.minimumPrice).to.be.eql(1000000);
            expect(res.body.evaluation.maximumPrice).to.be.eql(5000000);
            expect(res.body.evaluation.averagePrice).to.be.eql(3875000);
            expect(res.body.evaluation).to.not.have.property('type');
            expect(res.body.evaluation.areaName).to.be.eql(area.area);
            expect(res.body.evaluation.stateName).to.be.eql(area.state);
            done();
          });
      });
    });

    context('when the area parameter is given only', () => {
      it('returns not found', (done) => {
        request()
          .get(`/api/v1/content-property/search?area=${area.area}`)
          .end((err, res) => {
            expect(res).to.have.status(412);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Invalid state or area');
            done();
          });
      });
    });

    context('when the state parameter is given only', () => {
      it('returns not found', (done) => {
        request()
          .get(`/api/v1/content-property/search?state=${area.state}`)
          .end((err, res) => {
            expect(res).to.have.status(412);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Invalid state or area');
            done();
          });
      });
    });

    context('when the houseType parameter is given only', () => {
      it('returns not found', (done) => {
        request()
          .get(`/api/v1/content-property/search?type=${houseType}`)
          .end((err, res) => {
            expect(res).to.have.status(412);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Invalid state or area');
            done();
          });
      });
    });

    context('without parameters', () => {
      it('returns not found', (done) => {
        request()
          .get('/api/v1/content-property/search')
          .end((err, res) => {
            expect(res).to.have.status(412);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Invalid state or area');
            done();
          });
      });
    });

    context('when getPropertiesByParameters service fails', () => {
      it('returns the error', (done) => {
        sinon.stub(ContentProperty, 'aggregate').throws(new Error('Type Error'));
        request()
          .get(
            `/api/v1/content-property/search?area=${area.area}&state=${area.state}&houseType=${houseType}`,
          )
          .end((err, res) => {
            expect(res).to.have.status(500);
            done();
            ContentProperty.aggregate.restore();
          });
      });
    });
  });

  describe('Get all content properties', () => {
    const endpoint = '/api/v1/content-property/all';
    const method = 'get';
    const dummyArea = AreaFactory.build(
      { area: 'Lekki Phase 1', state: 'Lagos' },
      { generateId: true },
    );

    const dummyProperty = ContentPropertyFactory.build(
      {
        areaId: dummyArea._id,
        category: 'For Rent',
        houseType: 'Penthouse',
        price: 10_000_000,
        createdAt: futureDate,
      },
      { generateId: true },
    );
    const dummyProperties = ContentPropertyFactory.buildList(
      17,
      { areaId, createdAt: currentDate },
      { generateId: true },
    );

    beforeEach(async () => {
      await addArea(dummyArea);
    });

    describe('Pagination Tests', () => {
      context('when no content property exists in db', () => {
        [adminUser, editorUser].map((user) =>
          itReturnsEmptyValuesWhenNoItemExistInDatabase({
            endpoint,
            method,
            user,
            useExistingUser: true,
          }),
        );
      });

      describe('when content properties exist in db', () => {
        beforeEach(async () => {
          await ContentProperty.insertMany([dummyProperty, ...dummyProperties]);
        });

        [adminUser, editorUser].map((user) =>
          itReturnsTheRightPaginationValue({
            endpoint,
            method,
            user,
            useExistingUser: true,
          }),
        );

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
          model: ContentProperty,
          modelMethod: 'aggregate',
          useExistingUser: true,
        });
      });
    });

    describe('Filter Tests', () => {
      beforeEach(async () => {
        await ContentProperty.insertMany([dummyProperty, ...dummyProperties]);
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
          category: dummyProperty.category,
          houseType: dummyProperty.houseType,
          price: dummyProperty.price,
        };
        const filteredParams = querystring.stringify(multipleFilters);

        it('returns matched content property', (done) => {
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
              expect(res.body.result[0]._id).to.be.eql(dummyProperty._id.toString());
              expect(res.body.result[0].category).to.be.eql(multipleFilters.category);
              expect(res.body.result[0].houseType).to.be.eql(multipleFilters.houseType);
              expect(res.body.result[0].price).to.be.eql(multipleFilters.price);
              done();
            });
        });
      });

      context('when no parameter is matched', () => {
        const nonMatchingFilters = {
          category: 'For Lease',
          houseType: 'self contain',
          price: 100_000,
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
        filter: CONTENT_PROPERTY_FILTERS,
        method,
        endpoint,
        user: editorUser,
        dataObject: dummyProperty,
        useExistingUser: true,
      });
    });
  });

  describe('Get property by property id', () => {
    const contentPropertyId = mongoose.Types.ObjectId();
    const contentProperty = ContentPropertyFactory.build({ _id: contentPropertyId, areaId });

    beforeEach(async () => {
      await addContentProperty(contentProperty);
    });

    context('when a valid token is used', () => {
      [...new Array(2)].map((_, index) =>
        it('returns array of house types', (done) => {
          request()
            .get(`/api/v1/content-property/${contentPropertyId}`)
            .set('authorization', [editorToken, adminToken][index])
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body.property._id).to.be.eql(contentPropertyId.toString());
              expect(res.body.property.category).to.be.eql(contentProperty.category);
              expect(res.body.property.houseType).to.be.eql(contentProperty.houseType);
              expect(res.body.property.price).to.be.eql(contentProperty.price);
              expect(res.body.property.area._id).to.be.eql(areaId.toString());
              expect(res.body.property.area.state).to.be.eql(area.state);
              expect(res.body.property.area.longitude).to.be.eql(area.longitude);
              expect(res.body.property.area.latitude).to.be.eql(area.latitude);
              done();
            });
        }),
      );
    });

    context('when property id is invalid', () => {
      const invalidContentPropertyId = mongoose.Types.ObjectId();
      it('returns forbidden', (done) => {
        request()
          .get(`/api/v1/content-property/${invalidContentPropertyId}`)
          .set('authorization', userToken)
          .end((err, res) => {
            expect(res).to.have.status(404);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Property not found');
            done();
          });
      });
    });

    context('without token', () => {
      it('returns error', (done) => {
        request()
          .get(`/api/v1/content-property/${contentPropertyId}`)
          .end((err, res) => {
            expect(res).to.have.status(403);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Token needed to access resources');
            done();
          });
      });
    });

    context('when getOneContentProperty service fails', () => {
      it('returns the error', (done) => {
        sinon.stub(ContentProperty, 'aggregate').throws(new Error('Type Error'));
        request()
          .get(`/api/v1/content-property/${contentPropertyId}`)
          .set('authorization', editorToken)
          .end((err, res) => {
            expect(res).to.have.status(500);
            done();
            ContentProperty.aggregate.restore();
          });
      });
    });
  });
});
