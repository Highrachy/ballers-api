import mongoose from 'mongoose';
import { expect, sinon, useDatabase } from '../config';
import {
  estimateReadingTime,
  getPostInKnowledgeBaseById,
  addPostToKnowledgeBase,
  updatePostInKnowledgeBase,
  deletePostFromKnowledgeBase,
  getOnePostFromKnowledgeBase,
  getAllPostsFromKnowledgeBase,
} from '../../server/services/knowledgeBase.service';
import KnowledgeBaseFactory from '../factories/knowledgeBase.factory';
import KnowledgeBase from '../../server/models/knowledgeBase.model';
import User from '../../server/models/user.model';
import UserFactory from '../factories/user.factory';
import { fourHundredWords, twentyWords } from '../words';

useDatabase();

describe('KnowledgeBase Service', () => {
  describe('#getPostInKnowledgeBaseById', () => {
    const id = mongoose.Types.ObjectId();

    before(async () => {
      await addPostToKnowledgeBase(KnowledgeBaseFactory.build({ _id: id, author: id }));
    });

    it('returns a valid post by Id', async () => {
      const post = await getPostInKnowledgeBaseById(id);
      expect(id.equals(post.id)).to.be.eql(true);
    });
  });

  describe('#estimateReadingTime', () => {
    context('with 300 words', () => {
      it('returns 2 minutes as reading time', async () => {
        const post = estimateReadingTime(fourHundredWords);
        expect(post).to.be.eql(2);
      });
    });

    context('with 20 words', () => {
      it('returns 1 minute as reading time', async () => {
        const post = estimateReadingTime(twentyWords);
        expect(post).to.be.eql(1);
      });
    });
  });

  describe('#addPostToKnowledgeBase', () => {
    let countedPosts;
    const id = mongoose.Types.ObjectId();
    const post = KnowledgeBaseFactory.build({ author: id });

    beforeEach(async () => {
      countedPosts = await KnowledgeBase.countDocuments({});
    });

    context('when a valid post is entered', () => {
      beforeEach(async () => {
        await addPostToKnowledgeBase(post);
      });

      it('adds a new post', async () => {
        const currentCountedPosts = await KnowledgeBase.countDocuments({});
        expect(currentCountedPosts).to.eql(countedPosts + 1);
      });
    });

    context('when an invalid data is entered', () => {
      it('throws an error', async () => {
        try {
          const InvalidPost = KnowledgeBaseFactory.build({
            title: '',
            author: id,
          });
          await addPostToKnowledgeBase(InvalidPost);
        } catch (err) {
          const currentCountedPosts = await KnowledgeBase.countDocuments({});
          expect(err.statusCode).to.eql(400);
          expect(err.error.name).to.be.eql('ValidationError');
          expect(err.message).to.be.eql('Error adding post to knowledge base');
          expect(currentCountedPosts).to.eql(countedPosts);
        }
      });
    });
  });

  describe('#getAllPostsFromKnowledgeBase', () => {
    const id = mongoose.Types.ObjectId();
    const post1 = KnowledgeBaseFactory.build({ author: id, updatedBy: id });
    const post2 = KnowledgeBaseFactory.build({ author: id, updatedBy: id });
    const post3 = KnowledgeBaseFactory.build({ author: id, updatedBy: id });

    beforeEach(async () => {
      await User.create(UserFactory.build({ _id: id }));
      await addPostToKnowledgeBase(post1);
      await addPostToKnowledgeBase(post2);
    });

    context('when post added is valid', () => {
      it('returns 2 posts', async () => {
        const posts = await getAllPostsFromKnowledgeBase();
        expect(posts).to.be.an('array');
        expect(posts.length).to.be.eql(2);
      });
    });
    context('when new post is added', () => {
      before(async () => {
        await addPostToKnowledgeBase(post3);
      });
      it('returns 3 posts', async () => {
        const posts = await getAllPostsFromKnowledgeBase();
        expect(posts).to.be.an('array');
        expect(posts.length).to.be.eql(3);
      });
    });
  });

  describe('#getOnePostFromKnowledgeBase', () => {
    const id = mongoose.Types.ObjectId();
    const slug = 'beginners-guide-1';

    before(async () => {
      await User.create(UserFactory.build({ _id: id }));
      await addPostToKnowledgeBase(
        KnowledgeBaseFactory.build({
          _id: id,
          title: 'Beginners guide 1',
          author: id,
          updatedBy: id,
        }),
      );
    });

    context('when post is gotten', () => {
      it('returns a valid post', async () => {
        const post = await getOnePostFromKnowledgeBase(slug);
        expect(post[0]._id).to.eql(id);
      });
    });
  });

  describe('#updatePostInKnowledgeBase', () => {
    const _id = mongoose.Types.ObjectId();
    const updatedDetails = {
      id: _id,
      title: 'New updated title',
    };
    before(async () => {
      await addPostToKnowledgeBase(
        KnowledgeBaseFactory.build({ _id, author: _id, updatedBy: _id }),
      );
    });

    context('when post is updated', () => {
      it('returns a valid updated post', async () => {
        const updatedPost = await updatePostInKnowledgeBase(updatedDetails);
        expect(updatedPost.title).to.eql(updatedDetails.title);
      });
    });

    context('when getPostInKnowledgeBaseById fails', () => {
      it('throws an error', async () => {
        sinon.stub(KnowledgeBase, 'findById').throws(new Error('error msg'));
        try {
          await updatePostInKnowledgeBase(updatedDetails);
        } catch (err) {
          expect(err.statusCode).to.eql(500);
          expect(err.error).to.be.an('Error');
          expect(err.message).to.be.eql('Internal Server Error');
        }
        KnowledgeBase.findById.restore();
      });
    });

    context('when findByIdAndUpdate fails', () => {
      it('throws an error', async () => {
        sinon.stub(KnowledgeBase, 'findByIdAndUpdate').throws(new Error('error msg'));
        try {
          await updatePostInKnowledgeBase(updatedDetails);
        } catch (err) {
          expect(err.statusCode).to.eql(400);
          expect(err.error).to.be.an('Error');
          expect(err.message).to.be.eql('Error updating post in knowledge base');
        }
        KnowledgeBase.findByIdAndUpdate.restore();
      });
    });
  });

  describe('#deletePostFromKnowledgeBase', () => {
    const _id = mongoose.Types.ObjectId();
    before(async () => {
      await addPostToKnowledgeBase(
        KnowledgeBaseFactory.build({ _id, author: _id, updatedBy: _id }),
      );
    });

    context('when post is deleted', () => {
      it('returns empty post', async () => {
        await deletePostFromKnowledgeBase(_id);
        const post = getPostInKnowledgeBaseById(_id);
        // eslint-disable-next-line no-unused-expressions
        expect(post).to.be.empty;
      });
    });

    context('when getPostInKnowledgeBaseById fails', () => {
      it('throws an error', async () => {
        sinon.stub(KnowledgeBase, 'findById').throws(new Error('error msg'));
        try {
          await deletePostFromKnowledgeBase(_id);
        } catch (err) {
          expect(err.statusCode).to.eql(500);
          expect(err.error).to.be.an('Error');
          expect(err.message).to.be.eql('Internal Server Error');
        }
        KnowledgeBase.findById.restore();
      });
    });

    context('when findByIdAndDelete fails', () => {
      it('throws an error', async () => {
        sinon.stub(KnowledgeBase, 'findByIdAndDelete').throws(new Error('error msg'));
        try {
          await deletePostFromKnowledgeBase(_id);
        } catch (err) {
          expect(err.statusCode).to.eql(400);
          expect(err.error).to.be.an('Error');
          expect(err.message).to.be.eql('Error deleting post from knowledge base');
        }
        KnowledgeBase.findByIdAndDelete.restore();
      });
    });
  });
});
