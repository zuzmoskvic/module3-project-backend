const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Define storage for uploaded files using CloudinaryStorage
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'bananarama',
    allowedFormats: ['mp4', 'm4a', 'mp3', 'wav', 'mpeg'], 
    resource_type: 'auto',
  },
});

// Create the multer instance with the CloudinaryStorage configuration
const cloudinaryAudioUploader = multer({ storage });


module.exports = cloudinaryAudioUploader;