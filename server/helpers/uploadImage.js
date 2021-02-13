import S3 from 'aws-sdk/clients/s3';
import { v1 as uuid } from 'uuid';

import { updateUser } from '../services/user.service';
import httpStatus from './httpStatus';

require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'ballers-profile',
    allowedFormats: ['jpg', 'jpeg', 'gif', 'png'],
    transformation: [{ width: 256, height: 256, crop: 'limit' }],
  },
});

const largeStorage = new CloudinaryStorage({
  cloudinary,
  params: async () => {
    return {
      folder: 'ballers-upload',
      allowedFormats: ['jpg', 'jpeg', 'gif', 'png', 'pdf'],
    };
  },
});

const MAX_PROFILE_IMG_SIZE = 500000; // 500kb
const parserProfileImage = multer({
  limits: { fileSize: MAX_PROFILE_IMG_SIZE },
  storage,
}).single('image');

const MAX_IMG_SIZE = 1000000; // 1MB
const parserImage = multer({
  limits: { fileSize: MAX_IMG_SIZE },
  storage: largeStorage,
}).single('image');

export default {
  uploadProfileImage(req, res, next) {
    parserProfileImage(req, res, (err) => {
      if (!err) {
        return next();
      }
      return next(err);
    });
  },

  uploadImage(req, res, next) {
    parserImage(req, res, (err) => {
      if (!err) {
        return next();
      }
      return next(err);
    });
  },
};

const s3 = new S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

export const UploadController = {
  uploadProfileImage(req, res, next) {
    const { user } = req;
    if (req.file) {
      const profileImage = {
        id: req.file.filename,
        url: req.file.path,
      };
      return updateUser({ profileImage, id: user._id })
        .then(() =>
          res.status(httpStatus.OK).json({ success: true, message: 'User updated', profileImage }),
        )
        .catch((error) => next(error));
    }
    return res.status(httpStatus.PRECONDITION_FAILED).json({
      success: false,
      message: 'Image cannot be uploaded',
      error: 'Image cannot be uploaded',
    });
  },

  uploadImage(req, res) {
    if (req.file) {
      return res.json({ file: req.file });
    }
    return res.status(httpStatus.PRECONDITION_FAILED).json({
      success: false,
      message: 'Image cannot be uploaded',
      error: 'Image cannot be uploaded',
    });
  },

  uploadToS3(req, res) {
    const { extension, type } = req.query;
    const key = `${req.user._id}/${uuid()}.${extension}`;
    s3.getSignedUrl(
      'putObject',
      {
        Bucket: process.env.AWS_S3_BUCKET,
        ContentType: type,
        Key: key,
      },
      (err, url) => res.json({ key, url, query: req.query }),
    );
  },
};
