import { addUser, loginUser } from '../server/services/user.service';
import { expect, request, sinon } from './config';
import User from '../server/models/user.model';

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

export const emptyPaginationResult = {
  currentPage: 1,
  limit: 10,
  offset: 0,
  total: 0,
  totalPage: 0,
};

export const itReturnsEmptyValuesWhenNoItemExistInDatabase = ({
  endpoint,
  method,
  user,
  data = {},
  useExistingUser = false,
}) => {
  let token;

  context('when no item exist', () => {
    beforeEach(async () => {
      if (useExistingUser) {
        const loggedInUser = await loginUser(user);
        token = loggedInUser.token;
      } else {
        token = await addUser(user);
      }
    });
    it('returns not found', (done) => {
      request()
        [method](endpoint)
        .set('authorization', token)
        .send(data)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.success).to.be.eql(true);
          expect(res.body.result.length).to.be.eql(0);
          expect(res.body.pagination).to.be.eql(emptyPaginationResult);
          done();
        });
    });
  });
};

export const itReturnsTheRightPaginationValue = ({
  endpoint,
  method,
  user,
  data = {},
  useExistingUser = false,
}) => {
  let token;

  describe('pagination', () => {
    beforeEach(async () => {
      if (useExistingUser) {
        const loggedInUser = await loginUser(user);
        token = loggedInUser.token;
      } else {
        token = await addUser(user);
      }
    });

    context('when no pagination parameter is passed', () => {
      it('returns the default values', (done) => {
        request()
          [method](endpoint)
          .set('authorization', token)
          .send(data)
          .end((err, res) => {
            expectsPaginationToReturnTheRightValues(res, defaultPaginationResult);
            done();
          });
      });
    });

    context('when both page and limit parameters are set', () => {
      it('returns the given page and limit', (done) => {
        request()
          [method](`${endpoint}?page=2&limit=5`)
          .set('authorization', token)
          .send(data)
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
          [method](`${endpoint}?page=2`)
          .set('authorization', token)
          .send(data)
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
          [method](`${endpoint}?limit=4`)
          .set('authorization', token)
          .send(data)
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

export const itReturnsForbiddenForTokenWithInvalidAccess = ({
  endpoint,
  method,
  user,
  data = {},
  useExistingUser = false,
}) => {
  context('with a invalid access token', () => {
    let token;

    beforeEach(async () => {
      if (useExistingUser) {
        const loggedInUser = await loginUser(user);
        token = loggedInUser.token;
      } else {
        token = await addUser(user);
      }
    });

    it('returns forbidden', (done) => {
      request()
        [method](endpoint)
        .set('authorization', token)
        .send(data)
        .end((err, res) => {
          expect(res).to.have.status(403);
          expect(res.body.success).to.be.eql(false);
          expect(res.body.message).to.be.eql('You are not permitted to perform this action');
          done();
        });
    });
  });
};

export const itReturnsForbiddenForNoToken = ({ endpoint, method, data = {} }) => {
  context('without token', () => {
    it('returns error', (done) => {
      request()
        [method](endpoint)
        .send(data)
        .end((err, res) => {
          expect(res).to.have.status(403);
          expect(res.body.success).to.be.eql(false);
          expect(res.body.message).to.be.eql('Token needed to access resources');
          done();
        });
    });
  });
};

export const itReturnsAnErrorWhenServiceFails = ({
  endpoint,
  method,
  user,
  model,
  modelMethod = 'aggregate',
  data = {},
  useExistingUser = false,
}) => {
  context('when service fails', () => {
    let token;

    beforeEach(async () => {
      if (useExistingUser) {
        const loggedInUser = await loginUser(user);
        token = loggedInUser.token;
      } else {
        token = await addUser(user);
      }
    });
    it('returns the error', (done) => {
      sinon.stub(model, modelMethod).throws(new Error('Type Error'));
      request()
        [method](endpoint)
        .set('authorization', token)
        .send(data)
        .end((err, res) => {
          expect(res).to.have.status(500);
          done();
          model[modelMethod].restore();
        });
    });
  });
};

export const itReturnsNotFoundForInvalidToken = ({
  endpoint,
  method,
  user,
  userId,
  data = {},
  useExistingUser = false,
}) => {
  let token;
  context('Invalid Token', () => {
    beforeEach(async () => {
      if (useExistingUser) {
        const loggedInUser = await loginUser(user);
        token = loggedInUser.token;
      } else {
        token = await addUser(user);
      }
    });

    context('with unavailable token', () => {
      beforeEach(async () => {
        await User.findByIdAndDelete(user._id || userId);
      });

      it('returns token error', (done) => {
        request()
          [method](endpoint)
          .set('authorization', token)
          .send(data)
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

export const itReturnsErrorForEmptyFields = ({
  endpoint,
  method,
  user,
  data,
  factory,
  useExistingUser = false,
}) => {
  let token;

  beforeEach(async () => {
    if (useExistingUser) {
      const loggedInUser = await loginUser(user);
      token = loggedInUser.token;
    } else {
      token = await addUser(user);
    }
  });

  Object.keys(data).map((field) =>
    context(`when ${field} is empty`, () => {
      it('returns an error', (done) => {
        const body = factory.build({ [field]: '' });
        request()
          [method](endpoint)
          .set('authorization', token)
          .send(body)
          .end((err, res) => {
            expect(res).to.have.status(412);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Validation Error');
            expect(res.body.error).to.be.eql(data[field]);
            done();
          });
      });
    }),
  );
};

export const itReturnsErrorForUnverifiedVendor = ({
  endpoint,
  method,
  user,
  data = {},
  useExistingUser = false,
}) => {
  let token;

  beforeEach(async () => {
    if (useExistingUser) {
      const loggedInUser = await loginUser(user);
      token = loggedInUser.token;
    } else {
      token = await addUser({ ...user, vendor: { ...user.vendor, verified: false } });
    }
  });

  context('when vendor is unverified', () => {
    beforeEach(async () => {
      if (useExistingUser) {
        await User.findByIdAndUpdate(user._id, { 'vendor.verified': false });
      }
    });
    it('returns error', (done) => {
      request()
        [method](endpoint)
        .set('authorization', token)
        .send(data)
        .end((err, res) => {
          expect(res).to.have.status(403);
          expect(res.body.success).to.be.eql(false);
          expect(res.body.message).to.be.eql('You are not permitted to perform this action');
          done();
        });
    });
  });
};

export const itDoesNotReturnSensitiveData = (data) => {
  expect(data).to.not.have.property('assignedProperties');
  expect(data).to.not.have.property('favorites');
  expect(data).to.not.have.property('password');
  expect(data).to.not.have.property('referralCode');
  expect(data).to.not.have.property('notifications');
  if (data.vendor) {
    expect(data.vendor).to.not.have.property('bankInfo');
    expect(data.vendor).to.not.have.property('directors');
    expect(data.vendor).to.not.have.property('identification');
    expect(data.vendor).to.not.have.property('entity');
    expect(data.vendor).to.not.have.property('redanNumber');
    expect(data.vendor).to.not.have.property('taxCertificate');
  }
};
