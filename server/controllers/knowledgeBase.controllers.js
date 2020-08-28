import {
  addPostToKnowledgeBase,
  updatePostInKnowledgeBase,
  deletePostFromKnowledgeBase,
  getAllPostsFromKnowledgeBase,
  getOnePostFromKnowledgeBase,
} from '../services/knowledgeBase.service';
import httpStatus from '../helpers/httpStatus';

const KnowledgeBaseController = {
  add(req, res, next) {
    const newKnowledgeBase = req.locals;
    const { user } = req;
    addPostToKnowledgeBase({ ...newKnowledgeBase, updatedBy: user._id })
      .then((post) => {
        res.status(httpStatus.CREATED).json({ success: true, message: 'Post added', post });
      })
      .catch((error) => next(error));
  },

  update(req, res, next) {
    const updatedproperty = req.locals;
    const { user } = req;
    updatePostInKnowledgeBase({ ...updatedproperty, updatedBy: user._id })
      .then((post) => {
        res.status(httpStatus.OK).json({ success: true, message: 'Post updated', post });
      })
      .catch((error) => next(error));
  },

  delete(req, res, next) {
    const { id } = req.params;
    deletePostFromKnowledgeBase(id)
      .then(() => {
        res.status(httpStatus.OK).json({ success: true, message: 'Post deleted' });
      })
      .catch((error) => next(error));
  },

  getAll(req, res, next) {
    getAllPostsFromKnowledgeBase()
      .then((posts) => {
        res.status(httpStatus.OK).json({ success: true, posts });
      })
      .catch((error) => next(error));
  },

  getOne(req, res, next) {
    const { id } = req.params;
    getOnePostFromKnowledgeBase(id)
      .then((post) => {
        if (post.length > 0) {
          res.status(httpStatus.OK).json({ success: true, post });
        } else {
          res.status(httpStatus.NOT_FOUND).json({ success: false, message: 'Post not found' });
        }
      })
      .catch((error) => next(error));
  },
};

export default KnowledgeBaseController;
