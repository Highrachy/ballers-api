import mongoose from 'mongoose';
import { expect, request, useDatabase, sinon } from '../config';
import KnowledgeBase from '../../server/models/knowledgeBase.model';
import KnowledgeBaseFactory from '../factories/knowledgeBase.factory';
import { addPostToKnowledgeBase } from '../../server/services/knowledgeBase.service';
import UserFactory from '../factories/user.factory';
import User from '../../server/models/user.model';
import { addUser } from '../../server/services/user.service';
import userRole from '../../server/helpers/userRole';

useDatabase();

let userToken;
let adminToken;

const user = UserFactory.build({ role: userRole.USER, activated: true });
const adminId = mongoose.Types.ObjectId();
const admin = UserFactory.build({ _id: adminId, role: userRole.ADMIN, activated: true });

beforeEach(async () => {
  userToken = await addUser(user);
  adminToken = await addUser(admin);
});

describe('Add post to knowledge base Route', () => {
  context('with valid data', () => {
    it('returns successful post', (done) => {
      const post = KnowledgeBaseFactory.build();
      request()
        .post('/api/v1/knowledge-base/add')
        .set('authorization', adminToken)
        .send(post)
        .end((err, res) => {
          expect(res).to.have.status(201);
          expect(res.body.success).to.be.eql(true);
          expect(res.body.message).to.be.eql('Post added');
          expect(res.body).to.have.property('post');
          expect(res.body.post.updatedBy).to.be.eql(adminId.toString());
          done();
        });
    });
  });

  context('when user token is not available', () => {
    beforeEach(async () => {
      await User.findByIdAndDelete(adminId);
    });

    it('returns token error', (done) => {
      const post = KnowledgeBaseFactory.build();
      request()
        .post('/api/v1/knowledge-base/add')
        .set('authorization', adminToken)
        .send(post)
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
        const post = KnowledgeBaseFactory.build({ title: '' });
        request()
          .post('/api/v1/knowledge-base/add')
          .set('authorization', adminToken)
          .send(post)
          .end((err, res) => {
            expect(res).to.have.status(412);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Validation Error');
            expect(res.body.error).to.be.eql('"Title" is not allowed to be empty');
            done();
          });
      });
    });
  });

  context('with invalid data', () => {
    context('when title is empty', () => {
      it('returns an error', (done) => {
        const post = KnowledgeBaseFactory.build({ title: '' });
        request()
          .post('/api/v1/knowledge-base/add')
          .set('authorization', adminToken)
          .send(post)
          .end((err, res) => {
            expect(res).to.have.status(412);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Validation Error');
            expect(res.body.error).to.be.eql('"Title" is not allowed to be empty');
            done();
          });
      });
    });

    context('when body is empty', () => {
      it('returns an error', (done) => {
        const post = KnowledgeBaseFactory.build({ body: '' });
        request()
          .post('/api/v1/knowledge-base/add')
          .set('authorization', adminToken)
          .send(post)
          .end((err, res) => {
            expect(res).to.have.status(412);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Validation Error');
            expect(res.body.error).to.be.eql('"Body" is not allowed to be empty');
            done();
          });
      });
    });
  });
});

describe('Update Knowledgebase', () => {
  const id = mongoose.Types.ObjectId();
  const post = KnowledgeBaseFactory.build({ _id: id, author: adminId });
  const newPost = {
    id,
    body: 'Lorem ipsum dolor, nsequuntur recusandae maiores soluta nostrum',
  };

  beforeEach(async () => {
    await addPostToKnowledgeBase(post);
  });

  context('with valid data & token', () => {
    it('returns an updated post', (done) => {
      request()
        .put('/api/v1/knowledge-base/update')
        .set('authorization', adminToken)
        .send(newPost)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.success).to.be.eql(true);
          expect(res.body).to.have.property('post');
          expect(res.body.post.body).to.be.eql(newPost.body);
          done();
        });
    });
  });

  context('without token', () => {
    it('returns error', (done) => {
      request()
        .put('/api/v1/knowledge-base/update')
        .send(newPost)
        .end((err, res) => {
          expect(res).to.have.status(403);
          expect(res.body.success).to.be.eql(false);
          expect(res.body.message).to.be.eql('Token needed to access resources');
          done();
        });
    });
  });

  context('with unauthorized user access token', () => {
    it('returns an error', (done) => {
      request()
        .put('/api/v1/knowledge-base/update')
        .set('authorization', userToken)
        .send(newPost)
        .end((err, res) => {
          expect(res).to.have.status(403);
          expect(res.body.success).to.be.eql(false);
          expect(res.body.message).to.be.eql('You are not permitted to perform this action');
          done();
        });
    });
  });

  context('when user token is used', () => {
    beforeEach(async () => {
      await User.findByIdAndDelete(adminId);
    });
    it('returns token error', (done) => {
      request()
        .put('/api/v1/knowledge-base/update')
        .set('authorization', adminToken)
        .send(newPost)
        .end((err, res) => {
          expect(res).to.have.status(404);
          expect(res.body.success).to.be.eql(false);
          expect(res.body.message).to.be.eql('Invalid token');
          done();
        });
    });
  });

  context('with invalid post', () => {
    it('returns a validation error', (done) => {
      request()
        .put('/api/v1/knowledge-base/update')
        .set('authorization', adminToken)
        .send()
        .end((err, res) => {
          expect(res).to.have.status(412);
          expect(res.body.success).to.be.eql(false);
          expect(res.body.message).to.be.eql('Validation Error');
          done();
        });
    });
  });

  context('when update service returns an error', () => {
    it('returns the error', (done) => {
      sinon.stub(KnowledgeBase, 'findByIdAndUpdate').throws(new Error('Type Error'));
      request()
        .put('/api/v1/knowledge-base/update')
        .set('authorization', adminToken)
        .send(newPost)
        .end((err, res) => {
          expect(res).to.have.status(400);
          expect(res.body.success).to.be.eql(false);
          done();
          KnowledgeBase.findByIdAndUpdate.restore();
        });
    });
  });

  context('with invalid data', () => {
    context('when id is empty', () => {
      it('returns an error', (done) => {
        const invalidPost = KnowledgeBaseFactory.build({ id: '' });
        request()
          .put('/api/v1/knowledge-base/update')
          .set('authorization', adminToken)
          .send(invalidPost)
          .end((err, res) => {
            expect(res).to.have.status(412);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Validation Error');
            expect(res.body.error).to.be.eql('"Post ID" is not allowed to be empty');
            done();
          });
      });
    });
    context('when title is empty', () => {
      it('returns an error', (done) => {
        const invalidPost = KnowledgeBaseFactory.build({ id, title: '' });
        request()
          .put('/api/v1/knowledge-base/update')
          .set('authorization', adminToken)
          .send(invalidPost)
          .end((err, res) => {
            expect(res).to.have.status(412);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Validation Error');
            expect(res.body.error).to.be.eql('"Title" is not allowed to be empty');
            done();
          });
      });
    });
    context('when body is empty', () => {
      it('returns an error', (done) => {
        const invalidPost = KnowledgeBaseFactory.build({ id, body: '' });
        request()
          .put('/api/v1/knowledge-base/update')
          .set('authorization', adminToken)
          .send(invalidPost)
          .end((err, res) => {
            expect(res).to.have.status(412);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Validation Error');
            expect(res.body.error).to.be.eql('"Body" is not allowed to be empty');
            done();
          });
      });
    });
    context('when image is empty', () => {
      it('returns an error', (done) => {
        const invalidPost = KnowledgeBaseFactory.build({ id, image: '' });
        request()
          .put('/api/v1/knowledge-base/update')
          .set('authorization', adminToken)
          .send(invalidPost)
          .end((err, res) => {
            expect(res).to.have.status(412);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Validation Error');
            expect(res.body.error).to.be.eql('"Image" is not allowed to be empty');
            done();
          });
      });
    });
    context('when tags is empty', () => {
      it('returns an error', (done) => {
        const invalidPost = KnowledgeBaseFactory.build({ id, tags: '' });
        request()
          .put('/api/v1/knowledge-base/update')
          .set('authorization', adminToken)
          .send(invalidPost)
          .end((err, res) => {
            expect(res).to.have.status(412);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Validation Error');
            expect(res.body.error).to.be.eql('"Tags" must be an array');
            done();
          });
      });
    });
    context('when tags is empty array', () => {
      it('returns an error', (done) => {
        const invalidPost = KnowledgeBaseFactory.build({ id, tags: [] });
        request()
          .put('/api/v1/knowledge-base/update')
          .set('authorization', adminToken)
          .send(invalidPost)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body).to.have.property('post');
            expect(res.body.post.tags).to.be.eql(invalidPost.tags);
            done();
          });
      });
    });
  });
});

describe('Delete post', () => {
  const id = mongoose.Types.ObjectId();
  const post = KnowledgeBaseFactory.build({ _id: id, author: adminId });

  beforeEach(async () => {
    await addPostToKnowledgeBase(post);
  });

  context('with a valid token & id', () => {
    it('successfully deletes post', (done) => {
      request()
        .delete(`/api/v1/knowledge-base/delete/${id}`)
        .set('authorization', adminToken)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.success).to.be.eql(true);
          expect(res.body.message).to.be.eql('Post deleted');
          done();
        });
    });
  });

  context('when token is used', () => {
    beforeEach(async () => {
      await User.findByIdAndDelete(adminId);
    });
    it('returns token error', (done) => {
      request()
        .delete(`/api/v1/knowledge-base/delete/${id}`)
        .set('authorization', adminToken)
        .end((err, res) => {
          expect(res).to.have.status(404);
          expect(res.body.success).to.be.eql(false);
          expect(res.body.message).to.be.eql('Invalid token');
          done();
        });
    });
  });

  context('with an invalid post id', () => {
    const invalidId = mongoose.Types.ObjectId();
    it('returns an error', (done) => {
      request()
        .delete(`/api/v1/knowledge-base/delete/${invalidId}`)
        .set('authorization', adminToken)
        .end((err, res) => {
          expect(res).to.have.status(400);
          expect(res.body.success).to.be.eql(false);
          done();
        });
    });
  });

  context('without token', () => {
    it('returns error', (done) => {
      request()
        .delete(`/api/v1/knowledge-base/delete/${id}`)
        .end((err, res) => {
          expect(res).to.have.status(403);
          expect(res.body.success).to.be.eql(false);
          expect(res.body.message).to.be.eql('Token needed to access resources');
          done();
        });
    });
  });
});

describe('Get all posts', () => {
  const id = mongoose.Types.ObjectId();
  const post = KnowledgeBaseFactory.build({ _id: id, author: adminId, updatedBy: adminId });
  const post2 = KnowledgeBaseFactory.build({ author: adminId, updatedBy: adminId });
  const post3 = KnowledgeBaseFactory.build({ author: adminId, updatedBy: adminId });

  context('when no post is found', () => {
    it('returns not found', (done) => {
      request()
        .get('/api/v1/knowledge-base/all')
        .set('authorization', adminToken)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.success).to.be.eql(true);
          expect(res.body.posts.length).to.be.eql(0);
          done();
        });
    });
  });

  describe('when posts exist in db', () => {
    beforeEach(async () => {
      await addPostToKnowledgeBase(post);
      await addPostToKnowledgeBase(post2);
      await addPostToKnowledgeBase(post3);
    });

    context('with a valid token & id', () => {
      it('returns successful payload', (done) => {
        request()
          .get('/api/v1/knowledge-base/all')
          .set('authorization', adminToken)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body).to.have.property('posts');
            expect(res.body.posts.length).to.be.eql(3);
            expect(res.body.posts[0]).to.have.property('title');
            expect(res.body.posts[0]).to.have.property('author');
            expect(res.body.posts[0]).to.have.property('body');
            expect(res.body.posts[0]).to.have.property('readLength');
            expect(res.body.posts[0]).to.have.property('createdAt');
            expect(res.body.posts[0]).to.have.property('updatedAt');
            expect(res.body.posts[0]).to.have.property('tags');
            done();
          });
      });
    });

    context('without token', () => {
      it('returns error', (done) => {
        request()
          .get('/api/v1/knowledge-base/all')
          .end((err, res) => {
            expect(res).to.have.status(403);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Token needed to access resources');
            done();
          });
      });
    });

    context('when token is used', () => {
      beforeEach(async () => {
        await User.findByIdAndDelete(adminId);
      });
      it('returns token error', (done) => {
        request()
          .get('/api/v1/knowledge-base/all')
          .set('authorization', adminToken)
          .end((err, res) => {
            expect(res).to.have.status(404);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Invalid token');
            done();
          });
      });
    });

    context('when getAllPostsFromKnowledgeBase service fails', () => {
      it('returns the error', (done) => {
        sinon.stub(KnowledgeBase, 'aggregate').throws(new Error('Type Error'));
        request()
          .get('/api/v1/knowledge-base/all')
          .set('authorization', adminToken)
          .end((err, res) => {
            expect(res).to.have.status(500);
            done();
            KnowledgeBase.aggregate.restore();
          });
      });
    });
  });
});

describe('Get one post', () => {
  const postId = mongoose.Types.ObjectId();
  const post = KnowledgeBaseFactory.build({ _id: postId, author: adminId, updatedBy: adminId });

  beforeEach(async () => {
    await addPostToKnowledgeBase(post);
  });

  context('with a valid token & id', () => {
    it('returns successful payload', (done) => {
      request()
        .get(`/api/v1/knowledge-base/${postId}`)
        .set('authorization', adminToken)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.success).to.be.eql(true);
          expect(res.body).to.have.property('post');
          expect(res.body.post).to.have.property('title');
          expect(res.body.post).to.have.property('author');
          expect(res.body.post).to.have.property('body');
          expect(res.body.post).to.have.property('readLength');
          expect(res.body.post).to.have.property('createdAt');
          expect(res.body.post).to.have.property('updatedAt');
          expect(res.body.post).to.have.property('tags');
          done();
        });
    });
  });

  context('when user token is used', () => {
    beforeEach(async () => {
      await User.findByIdAndDelete(adminId);
    });
    it('returns token error', (done) => {
      request()
        .get(`/api/v1/knowledge-base/${postId}`)
        .set('authorization', adminToken)
        .end((err, res) => {
          expect(res).to.have.status(404);
          expect(res.body.success).to.be.eql(false);
          expect(res.body.message).to.be.eql('Invalid token');
          done();
        });
    });
  });

  context('with an invalid post id', () => {
    const invalidId = mongoose.Types.ObjectId();

    it('returns not found', (done) => {
      request()
        .get(`/api/v1/knowledge-base/${invalidId}`)
        .set('authorization', adminToken)
        .end((err, res) => {
          expect(res).to.have.status(404);
          expect(res.body.success).to.be.eql(false);
          done();
        });
    });
  });

  context('without token', () => {
    it('returns error', (done) => {
      request()
        .get(`/api/v1/knowledge-base/${postId}`)
        .end((err, res) => {
          expect(res).to.have.status(403);
          expect(res.body.success).to.be.eql(false);
          expect(res.body.message).to.be.eql('Token needed to access resources');
          done();
        });
    });
  });

  context('when getOnePostFromKnowledgeBase service fails', () => {
    it('returns the error', (done) => {
      sinon.stub(KnowledgeBase, 'aggregate').throws(new Error('Type Error'));
      request()
        .get(`/api/v1/knowledge-base/${postId}`)
        .set('authorization', adminToken)
        .end((err, res) => {
          expect(res).to.have.status(500);
          done();
          KnowledgeBase.aggregate.restore();
        });
    });
  });
});
