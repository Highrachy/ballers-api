import mongoose from 'mongoose';
import KnowledgeBase from '../models/knowledgeBase.model';
import { ErrorHandler } from '../helpers/errorHandler';
import httpStatus from '../helpers/httpStatus';

const { ObjectId } = mongoose.Types.ObjectId;

export const estimateReadingTime = (text) => {
  const time = Math.round(text.split(' ').length / 150);
  return time < 1 ? 1 : time;
};

export const getPostInKnowledgeBaseById = async (id) => KnowledgeBase.findById(id).select();

export const addPostToKnowledgeBase = async (post) => {
  try {
    const newKnowledgeBase = await new KnowledgeBase({
      ...post,
      readLength: estimateReadingTime(post.body),
    }).save();
    return newKnowledgeBase;
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error adding post to knowledge base', error);
  }
};

export const updatePostInKnowledgeBase = async (body) => {
  const post = body;
  const story = await getPostInKnowledgeBaseById(post.id).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });

  if (post.body) {
    post.readLength = estimateReadingTime(post.body);
  }

  try {
    return KnowledgeBase.findByIdAndUpdate(story.id, post, { new: true });
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error updating post in knowledge base', error);
  }
};

export const deletePostFromKnowledgeBase = async (id) => {
  const property = await getPostInKnowledgeBaseById(id).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });
  try {
    return KnowledgeBase.findByIdAndDelete(property.id);
  } catch (error) {
    throw new ErrorHandler(
      httpStatus.BAD_REQUEST,
      'Error deleting post from knowledge base',
      error,
    );
  }
};

export const getOnePostFromKnowledgeBase = async (id) =>
  KnowledgeBase.aggregate([
    { $match: { _id: ObjectId(id) } },
    {
      $lookup: {
        from: 'users',
        localField: 'updatedBy',
        foreignField: '_id',
        as: 'updatedBy',
      },
    },
    {
      $unwind: '$updatedBy',
    },
    {
      $project: {
        tags: 1,
        title: 1,
        author: 1,
        body: 1,
        readLength: 1,
        createdAt: 1,
        updatedAt: 1,
        'updatedBy._id': 1,
        'updatedBy.firstName': 1,
        'updatedBy.lastName': 1,
        'updatedBy.email': 1,
      },
    },
  ]);

export const getAllPostsFromKnowledgeBase = async () =>
  KnowledgeBase.aggregate([
    {
      $lookup: {
        from: 'users',
        localField: 'updatedBy',
        foreignField: '_id',
        as: 'updatedBy',
      },
    },
    {
      $unwind: '$updatedBy',
    },
    {
      $project: {
        tags: 1,
        title: 1,
        author: 1,
        body: 1,
        readLength: 1,
        createdAt: 1,
        updatedAt: 1,
        'updatedBy._id': 1,
        'updatedBy.firstName': 1,
        'updatedBy.lastName': 1,
        'updatedBy.email': 1,
      },
    },
  ]);
