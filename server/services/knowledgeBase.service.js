import KnowledgeBase from '../models/knowledgeBase.model';
import { ErrorHandler } from '../helpers/errorHandler';
import httpStatus from '../helpers/httpStatus';

const WORDS_PER_MINUTE = 200;

export const estimateReadingTime = (text) => {
  const time = Math.round(text.split(' ').length / WORDS_PER_MINUTE);
  return time < 1 ? 1 : time;
};

export const slugify = (string) => {
  const a = 'àáâäæãåāăąçćčđďèéêëēėęěğǵḧîïíīįìłḿñńǹňôöòóœøōõőṕŕřßśšşșťțûüùúūǘůűųẃẍÿýžźż·/_,:;';
  const b = 'aaaaaaaaaacccddeeeeeeeegghiiiiiilmnnnnoooooooooprrsssssttuuuuuuuuuwxyyzzz------';
  const p = new RegExp(a.split('').join('|'), 'g');

  return string
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(p, (c) => b.charAt(a.indexOf(c)))
    .replace(/&/g, '-and-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

export const getPostInKnowledgeBaseById = async (id) => KnowledgeBase.findById(id).select();

export const getPostBySlug = async (slug, fields = null) =>
  KnowledgeBase.findOne({ slug }).select(fields);

export const addPostToKnowledgeBase = async (post) => {
  const slug = slugify(post.title);
  const slugExists = await getPostBySlug(slug);
  if (slugExists) {
    throw new ErrorHandler(
      httpStatus.PRECONDITION_FAILED,
      'An existing post with the same title exists',
    );
  }
  try {
    const newKnowledgeBase = await new KnowledgeBase({
      ...post,
      readLength: estimateReadingTime(post.body),
      slug,
    }).save();
    return newKnowledgeBase;
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error adding post to knowledge base', error);
  }
};

export const updatePostInKnowledgeBase = async (body) => {
  let slug;
  const updatedPost = body;
  const story = await getPostInKnowledgeBaseById(updatedPost.id).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });
  if (updatedPost.title) {
    slug = slugify(updatedPost.title);
  }

  const slugExists = await getPostBySlug(slug);
  if (slugExists) {
    throw new ErrorHandler(httpStatus.PRECONDITION_FAILED, 'Edit post title');
  }

  if (updatedPost.body) {
    updatedPost.readLength = estimateReadingTime(updatedPost.body);
  }

  try {
    return KnowledgeBase.findByIdAndUpdate(story.id, updatedPost, { new: true });
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

export const getOnePostFromKnowledgeBase = async (slug) =>
  KnowledgeBase.aggregate([
    { $match: { slug } },
    {
      $lookup: {
        from: 'users',
        localField: 'updatedBy',
        foreignField: '_id',
        as: 'updatedBy',
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'author',
        foreignField: '_id',
        as: 'author',
      },
    },
    {
      $unwind: '$updatedBy',
    },
    {
      $unwind: '$author',
    },
    {
      $project: {
        tags: 1,
        title: 1,
        body: 1,
        readLength: 1,
        createdAt: 1,
        updatedAt: 1,
        'updatedBy._id': 1,
        'updatedBy.firstName': 1,
        'updatedBy.lastName': 1,
        'author._id': 1,
        'author.firstName': 1,
        'author.lastName': 1,
        'author.about': 1,
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
      $lookup: {
        from: 'users',
        localField: 'author',
        foreignField: '_id',
        as: 'author',
      },
    },
    {
      $unwind: '$updatedBy',
    },
    {
      $unwind: '$author',
    },
    {
      $project: {
        tags: 1,
        title: 1,
        body: 1,
        readLength: 1,
        createdAt: 1,
        updatedAt: 1,
        'updatedBy._id': 1,
        'updatedBy.firstName': 1,
        'updatedBy.lastName': 1,
        'author._id': 1,
        'author.firstName': 1,
        'author.lastName': 1,
        'author.about': 1,
      },
    },
  ]);
