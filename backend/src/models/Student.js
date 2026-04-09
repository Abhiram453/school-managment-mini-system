const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    className: {
      type: String,
      required: true,
      trim: true,
    },
    age: {
      type: Number,
      min: 1,
      max: 120,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Student', studentSchema);
