const multer = require("multer");

// Multer configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './audio/'); // Specify the directory where you want to save the files
    },
    filename: function (req, file, cb) {
      cb(null, 'recorded.wav'); // Use the original filename for saving the file
    },
  });
  const multerAudioUploader = multer({ storage: storage });


module.exports = multerAudioUploader;