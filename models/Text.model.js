const { Schema, model } = require("mongoose");

const textSchema = new Schema(
  {
    writtenText: {
        type: String,
    }
  },
  {
    // this second object adds extra properties: `createdAt` and `updatedAt`    
    timestamps: true
  }
);

const Text = model("Text", textSchema);

module.exports = Text;