const mongoose = require('mongoose');

const DraftSchema = new mongoose.Schema({
  draftId: {
    type: String,
    default: () => 'DRF-' + Date.now().toString(36).toUpperCase(),
    unique: true,
    index: true
  },
  patientName: { type: String, required: true, index: true },
  patientId: { type: String, index: true },
  referenceNumber: { type: String, index: true },
  formType: {
    type: String,
    enum: ['LIFESTYLE', 'SHORT_LIFESTYLE', 'WES', 'ONCO', 'CONSENT'],
    required: true
  },
  formData: { type: mongoose.Schema.Types.Mixed, default: {} },
  lastModified: { type: Date, default: Date.now },
  isSubmitted: { type: Boolean, default: false }
}, { timestamps: true });

DraftSchema.index({ patientName: 'text', patientId: 'text', draftId: 'text' });

module.exports = mongoose.model('Draft', DraftSchema);
