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

useDatabase();

describe('KnowledgeBase Service', () => {
  describe('#getPostInKnowledgeBaseById', () => {
    const id = mongoose.Types.ObjectId();

    before(async () => {
      await addPostToKnowledgeBase(
        KnowledgeBaseFactory.build({ _id: id, author: 'John Doe', updatedBy: id }),
      );
    });

    it('returns a valid post by Id', async () => {
      const post = await getPostInKnowledgeBaseById(id);
      expect(id.equals(post.id)).to.be.eql(true);
    });
  });

  describe('#estimateReadingTime', () => {
    context('when text is less than 150 words', () => {
      const threeHundredWords = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ut venenatis dui, ut malesuada quam. Vestibulum in rhoncus mi, ut fermentum nibh. Vivamus at varius nisi. Morbi tincidunt quam odio, in pretium enim dapibus vitae. Duis fringilla justo ac facilisis fermentum. Proin eu orci interdum, volutpat arcu nec, egestas enim. Morbi elementum neque eget mattis blandit. Praesent lobortis ipsum at consectetur sodales. Ut dictum dolor convallis sapien congue bibendum. Morbi vel dolor ac nisl ullamcorper tempor vitae id enim.
        Donec sit amet luctus lacus. Mauris vel eros eu ligula facilisis tincidunt. Mauris ac interdum arcu. Nam et eleifend nunc, vel euismod nisi. Donec mauris leo, gravida non condimentum sit amet, bibendum at felis. Fusce vitae tempus nibh, posuere luctus massa. Nunc auctor lectus facilisis rutrum venenatis. Vivamus eget elit scelerisque, condimentum risus id, luctus justo. Nullam pulvinar, sapien ut dictum sollicitudin, justo dui pharetra velit, sed pharetra justo urna ut nisi. Donec ex tortor, congue eget luctus eget, maximus at turpis.
        Integer vehicula ultrices tincidunt. Etiam est justo, bibendum sed est eu, vulputate consequat elit. Fusce vel felis ut elit semper varius. Etiam scelerisque sem nec leo ornare, sed tincidunt augue feugiat. Integer et facilisis mi. Aenean at arcu pharetra odio vehicula fermentum sollicitudin in risus. Sed dictum faucibus dolor vitae rutrum. Maecenas in lectus ut magna vehicula dignissim dapibus eget orci. Phasellus eget tincidunt dui. Sed pulvinar dolor quis neque tincidunt, sit amet elementum mi pulvinar. Morbi facilisis scelerisque ultricies. Duis porttitor mattis lectus ut efficitur. Maecenas convallis erat felis, non egestas lacus porttitor sit amet. Sed pellentesque est sed risus dignissim, a vulputate lorem ornare. Quisque nec mollis sapien.
        Suspendisse auctor dapibus bibendum. Sed pellentesque est ligula, ac aliquam nunc posuere ut. Cras fringilla interdum nisi a volutpat. Ut at semper diam. Suspendisse elementum ipsum dolor, ut blandit.`;

      it('returns 2 minutes as reading time', async () => {
        const post = estimateReadingTime(threeHundredWords);
        expect(post).to.be.eql(2);
      });
    });

    context('when text is less than 150 words', () => {
      const twentyWords =
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus a leo ut nibh semper condimentum nec nec nisl. Pellentesque id.';

      it('returns 1 minute as reading time', async () => {
        const post = estimateReadingTime(twentyWords);
        expect(post).to.be.eql(1);
      });
    });
  });

  describe('#addPostToKnowledgeBase', () => {
    let countedPosts;
    const id = mongoose.Types.ObjectId();
    const post = KnowledgeBaseFactory.build({ author: 'John Doe', updatedBy: id });

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
            author: 'John Doe',
            updatedBy: id,
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
    const post = KnowledgeBaseFactory.build({ author: 'John Doe', updatedBy: id });

    beforeEach(async () => {
      await User.create(UserFactory.build({ _id: id }));
      await addPostToKnowledgeBase(post);
      await addPostToKnowledgeBase(post);
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
        await addPostToKnowledgeBase(post);
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

    before(async () => {
      await User.create(UserFactory.build({ _id: id }));
      await addPostToKnowledgeBase(
        KnowledgeBaseFactory.build({ _id: id, author: 'John Doe', updatedBy: id }),
      );
    });

    context('when post is gotten', () => {
      it('returns a valid post', async () => {
        const post = await getOnePostFromKnowledgeBase(id);
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
        KnowledgeBaseFactory.build({ _id, author: 'John Doe', updatedBy: _id }),
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
        KnowledgeBaseFactory.build({ _id, author: 'John Doe', updatedBy: _id }),
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
