const multer = require("multer");

// Multer configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './'); // Specify the directory where you want to save the files
    },
    filename: function (req, file, cb) {
      cb(null, 'recorded.wav'); // Use the original filename for saving the file
    },
  });
  const upload = multer({ storage: storage });


module.exports = upload;