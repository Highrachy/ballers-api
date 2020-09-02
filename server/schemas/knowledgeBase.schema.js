import Joi from '@hapi/joi';

Joi.objectId = require('joi-objectid')(Joi);

export const addKnowledgeBaseSchema = Joi.object({
  title: Joi.string().label('Title').required(),
  body: Joi.string().label('Body').required(),
  authorSummary: Joi.string().label('Author Summary').optional(),
  image: Joi.string().label('Image').optional(),
  tags: Joi.array().label('Tags').optional(),
});

export const updateKnowledgeBaseSchema = Joi.object({
  id: Joi.objectId().label('Post ID').required(),
  title: Joi.string().label('Title').optional(),
  author: Joi.string().label('Author').optional(),
  authorSummary: Joi.string().label('Author Summary').optional(),
  body: Joi.string().label('Body').optional(),
  image: Joi.string().label('Image').optional(),
  tags: Joi.array().label('Tags').optional(),
});
