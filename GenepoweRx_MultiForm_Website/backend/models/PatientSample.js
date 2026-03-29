const mongoose = require('mongoose');

const PatientSampleSchema = new mongoose.Schema({
  khid: { type: String, required: true, unique: true },

  name: { type: String, required: true },
  age: { type: String },
  gender: { type: String },

  testType: { type: String }, // lifestyle / shortlifestyle / onco / csp
  notes: { type: String },
  addedBy: { type: String },

  trfStatus: { type: Boolean, default: false },
  bloodStatus: { type: Boolean, default: false },

  createdAt: { type: Date, default: Date.now }
});

module.exports = PatientSampleSchema;