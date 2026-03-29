const mongoose = require('mongoose');

const PatientSampleSchema = new mongoose.Schema({
  khid:        { type: String, unique: true, sparse: true, index: true },
  patientId:   { type: String, default: '' },
  name:        { type: String, required: true },
  age:         { type: String, default: '' },
  gender:      { type: String, enum: ['Male', 'Female', 'Prefer not to say', ''], default: '' },
  testType:    { type: String, default: '' },   // free text — no enum restriction
  category:    {
    type: String,
    enum: ['BLOOD_DONE_NO_TRF', 'TRF_DONE_NO_BLOOD'],
    default: 'BLOOD_DONE_NO_TRF',
  },
  // derived convenience flags (kept for backward compat)
  trfStatus:   { type: Boolean, default: false },   // true = TRF submitted
  bloodStatus: { type: Boolean, default: false },   // true = Blood sample done
  resolved:    { type: Boolean, default: false },
  notes:       { type: String, default: '' },
  addedBy:     { type: String, default: '' },
}, { timestamps: true, collection: 'patient_samples' });

// Auto-sync trfStatus / bloodStatus from category before save
PatientSampleSchema.pre('save', function (next) {
  if (this.category === 'BLOOD_DONE_NO_TRF') {
    this.bloodStatus = true;
    this.trfStatus   = false;
  } else if (this.category === 'TRF_DONE_NO_BLOOD') {
    this.trfStatus   = true;
    this.bloodStatus = false;
  }
  next();
});

module.exports = mongoose.model('PatientSample', PatientSampleSchema);