const { Schema, model } = require("mongoose");

const recordSchema = new Schema(
  {
    task: {
      type: String,
      required: [true, 'Task is required.'],
      lowercase: true
     },
    record: {
      type: String,
      required: [true, 'Record is required.']
    }
  },
  {
    // this second object adds extra properties: `createdAt` and `updatedAt`    
    timestamps: true
  }
);

const Record = model("Record", recordSchema);

module.exports = Record;