const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

/**
 * MULTER CONFIGURATION
 * Handles file persistence for avatars and chat media.
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, PNG and WEBP are allowed.'), false);
  }
};

const limits = {
  fileSize: 5 * 1024 * 1024 // 5MB Limit
};

const upload = multer({ storage, fileFilter, limits });

module.exports = {
  avatarUpload: upload.single('avatar'),
  imageUpload: upload.single('image')
};
