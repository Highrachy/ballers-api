import Joi from '@hapi/joi';

Joi.objectId = require('joi-objectid')(Joi);

export const addKnowledgeBaseSchema = Joi.object({
  title: Joi.string().label('Title').required(),
  author: Joi.string().label('Author').required(),
  body: Joi.string().label('Body').required(),
  readLength: Joi.number().label('Read Length').required(),
  image: Joi.string().label('Image').optional(),
  tags: Joi.array().label('Tags').optional(),
});

export const updateKnowledgeBaseSchema = Joi.object({
  id: Joi.objectId().label('Post ID').required(),
  title: Joi.string().label('Title').optional(),
  author: Joi.string().label('Author').optional(),
  body: Joi.string().label('Body').optional(),
  readLength: Joi.number().label('Read Length').optional(),
  image: Joi.string().label('Image').optional(),
  tags: Joi.array().label('Tags').optional(),
});
