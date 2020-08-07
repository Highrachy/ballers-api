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
    folder: 'ballers',
    allowedFormats: ['jpg', 'png'],
    transformation: [{ width: 256, height: 256, crop: 'limit' }],
  },
});

const MAX_IMG_SIZE = 500000; // 500kb

const parser = multer({
  limits: { fileSize: MAX_IMG_SIZE },
  storage,
}).single('image');

export default {
  uploadImage(req, res, next) {
    parser(req, res, (err) => {
      if (!err) {
        return next();
      }
      return next(err);
    });
  },
};
