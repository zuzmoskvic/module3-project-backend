const { Schema, model } = require("mongoose");

const recordSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Task is required.'],
      lowercase: true
     },
    recordPath: {
      type: String,
      required: [true, 'Record is required.']
    },
    transcript: {
      type: String
    }
  },
  {
    // this second object adds extra properties: `createdAt` and `updatedAt`    
    timestamps: true
  }
);


const Record = model("Record", recordSchema);


module.exports = Record;