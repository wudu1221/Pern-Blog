// backend/middleware/upload.js
const multer = require('multer');
const path = require('path');

// 1. Set storage destination and dynamic naming schema
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Files will be saved in your backend's physical "uploads" folder
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    // Combines timestamp-randomHash.extension (e.g. 171829281-928392.png)
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// 2. Filter out non-image file uploads
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

// 3. Define size limits (e.g., 5MB max)
const upload = multer({ 
  storage: storage, 
  fileFilter: fileFilter,
  limits: { fileSize: 1024 * 1024 * 5 } 
});

module.exports = upload;