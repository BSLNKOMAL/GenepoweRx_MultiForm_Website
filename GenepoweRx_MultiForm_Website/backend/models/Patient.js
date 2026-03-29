const mongoose = require('mongoose');

const generatePatientId = (name) => {
  const cleanName = (name || 'PATIENT')
    .toUpperCase()
    .replace(/\s+/g, '')
    .replace(/[^A-Z0-9]/g, '')
    .substring(0, 15);
  return `KHGENEPOWERX-${cleanName}`;
};

const generateReference = (name) => {
  const cleanName = (name || 'PT')
    .toUpperCase()
    .replace(/\s+/g, '')
    .replace(/[^A-Z0-9]/g, '')
    .substring(0, 8);
  const ts = Date.now().toString(36).toUpperCase().slice(-4);
  return `REF-${cleanName}-${ts}`;
};

const PatientSchema = new mongoose.Schema({
  patientId: { type: String, unique: true, index: true },
  referenceNumber: { type: String, unique: true, index: true },
  name:            { type: String, required: true, index: true },
  age:             { type: Number },
  gender:          { type: String, enum: ['Male','Female','Prefer not to say'] },
  phone:           { type: String },
  email:           { type: String },
  address:         { type: String },
  referralDoctor:  { type: String },
  coordinator:     { type: String },
  // PDF paths
  formPdfPath:     { type: String },
  consentPdfPath:  { type: String },
}, { timestamps: true });

// Auto-generate IDs before save
PatientSchema.pre('validate', async function(next) {
  if (!this.patientId) {
    const base = generatePatientId(this.name);
    // Ensure uniqueness by appending count if needed
    let id = base;
    let count = await mongoose.model('Patient').countDocuments({ patientId: new RegExp('^' + base) });
    if (count > 0) id = `${base}-${count + 1}`;
    this.patientId = id;
  }
  if (!this.referenceNumber) {
    this.referenceNumber = generateReference(this.name);
  }
  next();
});

PatientSchema.index({ name: 'text', patientId: 'text', referenceNumber: 'text' });

module.exports = mongoose.model('Patient', PatientSchema);
