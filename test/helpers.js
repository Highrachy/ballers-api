import { addUser } from '../server/services/user.service';
import { expect, request, sinon } from './config';

export const expectsPaginationToReturnTheRightValues = (
  res,
  { result, currentPage, limit, offset, total, totalPage },
) => {
  expect(res).to.have.status(200);
  expect(res.body.success).to.be.eql(true);
  expect(res.body.result.length).to.be.eql(result);
  expect(res.body.pagination.currentPage).to.be.eql(currentPage);
  expect(res.body.pagination.limit).to.be.eql(limit);
  expect(res.body.pagination.offset).to.be.eql(offset);
  expect(res.body.pagination.total).to.be.eql(total);
  expect(res.body.pagination.totalPage).to.be.eql(totalPage);
};

export const defaultPaginationResult = {
  currentPage: 1,
  limit: 10,
  offset: 0,
  result: 10,
  total: 18,
  totalPage: 2,
};

export const itReturnsTheRightPaginationValue = (endpoint, user) => {
  let token;

  describe('pagination', () => {
    beforeEach(async () => {
      token = await addUser(user);
    });

    context('when no pagination parameter is passed', () => {
      it('returns the default values', (done) => {
        request()
          .get(endpoint)
          .set('authorization', token)
          .end((err, res) => {
            expectsPaginationToReturnTheRightValues(res, defaultPaginationResult);
            done();
          });
      });
    });

    context('when both page and limit parameters are set', () => {
      it('returns the given page and limit', (done) => {
        request()
          .get(`${endpoint}?page=2&limit=5`)
          .set('authorization', token)
          .end((err, res) => {
            expectsPaginationToReturnTheRightValues(res, {
              ...defaultPaginationResult,
              currentPage: 2,
              limit: 5,
              offset: 5,
              result: 5,
              totalPage: 4,
            });
            done();
          });
      });
    });

    context('when page is set to 2', () => {
      it('returns the second page', (done) => {
        request()
          .get(`${endpoint}?page=2`)
          .set('authorization', token)
          .end((err, res) => {
            expectsPaginationToReturnTheRightValues(res, {
              ...defaultPaginationResult,
              result: 8,
              offset: 10,
              currentPage: 2,
            });
            done();
          });
      });
    });

    context('when limit is set to 4', () => {
      it('returns 4 items', (done) => {
        request()
          .get(`${endpoint}?limit=4`)
          .set('authorization', token)
          .end((err, res) => {
            expectsPaginationToReturnTheRightValues(res, {
              ...defaultPaginationResult,
              limit: 4,
              result: 4,
              totalPage: 5,
            });
            done();
          });
      });
    });
  });
};

export const itReturnsForbiddenForInvalidToken = (endpoint, user) => {
  context('with a invalid access token', () => {
    let token;

    beforeEach(async () => {
      token = await addUser(user);
    });

    it('returns forbidden', (done) => {
      request()
        .get(endpoint)
        .set('authorization', token)
        .end((err, res) => {
          expect(res).to.have.status(403);
          expect(res.body.success).to.be.eql(false);
          expect(res.body.message).to.be.eql('You are not permitted to perform this action');
          done();
        });
    });
  });
};

export const itReturnsForbiddenForNoToken = (endpoint) => {
  context('without token', () => {
    it('returns error', (done) => {
      request()
        .get(endpoint)
        .end((err, res) => {
          expect(res).to.have.status(403);
          expect(res.body.success).to.be.eql(false);
          expect(res.body.message).to.be.eql('Token needed to access resources');
          done();
        });
    });
  });
};

export const itReturnsAnErrorWhenServiceFails = (
  endpoint,
  user,
  model,
  modelMethod = 'aggregate',
) => {
  context('when service fails', () => {
    let token;

    beforeEach(async () => {
      token = await addUser(user);
    });
    it('returns the error', (done) => {
      sinon.stub(model, modelMethod).throws(new Error('Type Error'));
      request()
        .get(endpoint)
        .set('authorization', token)
        .end((err, res) => {
          expect(res).to.have.status(500);
          done();
          model[modelMethod].restore();
        });
    });
  });
};

export const itReturnsAnErrorForInvalidToken = (endpoint, user, model, userId) => {
  let token;
  context('Invalid Token', () => {
    beforeEach(async () => {
      token = await addUser(user);
    });

    context('with unavailable token', () => {
      beforeEach(async () => {
        await model.findByIdAndDelete(user.id || userId);
      });

      it('returns token error', (done) => {
        request()
          .get(endpoint)
          .set('authorization', token)
          .end((err, res) => {
            expect(res).to.have.status(404);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Invalid token');
            done();
          });
      });
    });
  });
};
