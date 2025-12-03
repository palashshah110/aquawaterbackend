const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Storage for product images
const productStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'shreeflow/products',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 800, height: 800, crop: 'limit', quality: 'auto' }],
  },
});
// Storage for banner images
const bannerStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'shreeflow/banners',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1920, height: 800, crop: 'limit', quality: 'auto' }],
  },
});

// Multer upload middlewares
const uploadProductImages = multer({
  storage: productStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
}).array('images', 10);

const uploadBannerImage = multer({
  storage: bannerStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
}).single('image');

// Delete image from Cloudinary
const deleteImage = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
    return true;
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    return false;
  }
};

// Storage for article images
const articleStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'shreeflow/articles',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
  },
});

const uploadArticleImage = multer({
  storage: articleStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
}).single('featuredImage');

// Extract public ID from Cloudinary URL
const getPublicIdFromUrl = (url) => {
  if (!url) return null;
  const parts = url.split('/');
  const filename = parts.pop();
  const folder = parts.slice(parts.indexOf('shreeflow')).join('/');
  const publicId = `${folder}/${filename.split('.')[0]}`;
  return publicId;
};

module.exports = {
  cloudinary,
  uploadProductImages,
  uploadBannerImage,
  deleteImage,
  uploadArticleImage,
  getPublicIdFromUrl,
};
