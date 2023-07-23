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
      folder: 'bananarama', // Specify the folder where you want to store the uploaded files in your Cloudinary account
      allowedFormats: ['jpg', 'jpeg', 'png'], // Specify the allowed file formats
      resource_type: 'image', // Automatically detect the resource type (image, video, raw)
    },
  });

// Create the multer instance with the CloudinaryStorage configuration
const cloudinaryImageUploader = multer({ storage });

module.exports = cloudinaryImageUploader;