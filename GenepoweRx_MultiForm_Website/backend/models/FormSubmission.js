const mongoose = require('mongoose');

const FormSubmissionSchema = new mongoose.Schema({
  patient:     { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  patientId:   { type: String, required: true, index: true },
  formType: {
    type: String,
    enum: ['LIFESTYLE', 'SHORT_LIFESTYLE', 'WES', 'ONCO', 'CONSENT'],
    required: true
  },
  visitNumber: { type: Number, default: 1 },
  visitLabel:  { type: String, default: 'Visit 1' },
  isRevisit:   { type: Boolean, default: false },

  // ── All form fields stored exactly as submitted ───────────────────────
  formData: { type: mongoose.Schema.Types.Mixed, required: true },

  // ── Uploaded files stored as Buffer (binary) in MongoDB ──────────────
  uploadedFiles: [{
    originalName: String,
    mimetype:     String,
    size:         Number,
    visitNumber:  Number,
    uploadedAt:   { type: Date, default: Date.now },
    data:         { type: Buffer }   // file bytes stored directly in MongoDB
  }],

  // ── PDF stored as Buffer in MongoDB (no filesystem) ───────────────────
  // Generated on form submit, served on demand via /api/pdf/download/:id
  pdfBuffer:        { type: Buffer,  default: null },
  pdfGeneratedAt:   { type: Date,    default: null },
  pdfFileName:      { type: String,  default: null },  // suggested download filename

  // ── Legacy path field (kept null, no longer used) ────────────────────
  generatedPdfPath: { type: String, default: null },

  submittedAt: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ['submitted', 'processing', 'completed'],
    default: 'submitted'
  }
}, { timestamps: true });

FormSubmissionSchema.index({ patientId: 1, formType: 1, visitNumber: 1 });
FormSubmissionSchema.index({ submittedAt: -1 });

module.exports = mongoose.model('FormSubmission', FormSubmissionSchema);