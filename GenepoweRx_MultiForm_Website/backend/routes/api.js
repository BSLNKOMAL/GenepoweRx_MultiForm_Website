const express = require('express');
const router  = express.Router();

const patientCtrl = require('../controllers/patientController');
const formCtrl    = require('../controllers/formController');
const draftCtrl   = require('../controllers/draftController');
const exportCtrl  = require('../controllers/exportController');
const sampleCtrl  = require('../controllers/patientSampleController');
const upload      = require('../middleware/upload');

// ── Analytics ──────────────────────────────────────────────────────────────
router.get('/analytics',              patientCtrl.getAnalytics);

// ── Patients ───────────────────────────────────────────────────────────────
router.get('/patients',               patientCtrl.getAllPatients);
router.get('/patients/search',        patientCtrl.searchPatients);
router.get('/patients/:id',           patientCtrl.getPatient);
router.post('/patients',              patientCtrl.createOrGetPatient);

// ── Forms ──────────────────────────────────────────────────────────────────
router.post('/forms/submit',          upload.array('files', 10), formCtrl.submitForm);
router.post('/forms/consent',         formCtrl.submitConsent);
router.get('/forms',                  formCtrl.getFormSubmissions);
router.get('/forms/:id',              formCtrl.getSubmission);

// ── Patient history & visits ───────────────────────────────────────────────
router.get('/history/:patientId',     formCtrl.getPatientFormHistory);
router.get('/visits/:patientId',      formCtrl.getPatientVisitSummary);
router.get('/visits/:patientId/:formType/:visitNumber', formCtrl.getVisitData);

// ── Search ─────────────────────────────────────────────────────────────────
router.get('/search',                 formCtrl.searchPatientData);

// ── Uploaded file retrieval ────────────────────────────────────────────────
router.get('/file/:submissionId/:fileIndex', formCtrl.getUploadedFile);

// ── PDF — Buffer-based (no filesystem) ────────────────────────────────────
// Primary: download PDF stored as Buffer in MongoDB → user's Downloads folder
router.get('/pdf/download/:submissionId',   formCtrl.downloadSubmissionPDF);
// On-demand regenerate (for old submissions without pdfBuffer)
router.post('/pdf/regenerate/:submissionId', formCtrl.regeneratePDF);
// Legacy routes (kept for backward compat)
router.get('/pdf/submission/:submissionId', formCtrl.downloadVisitPDF);
router.get('/pdf/:patientId/:type',         formCtrl.downloadPDF);

// ── Excel exports ──────────────────────────────────────────────────────────
router.get('/export/patients',           exportCtrl.exportPatients);
router.get('/export/form/:formType',     exportCtrl.exportByFormType);
router.get('/export/clinical-insights',  exportCtrl.exportClinicalInsights);
router.get('/export/patient/:patientId', exportCtrl.exportPatientData);

// ── Drafts ─────────────────────────────────────────────────────────────────
router.post('/drafts',                draftCtrl.saveDraft);
router.get('/drafts',                 draftCtrl.getDrafts);
router.get('/drafts/:id',             draftCtrl.getDraft);
router.put('/drafts/:id',             draftCtrl.updateDraft);
router.delete('/drafts/:id',          draftCtrl.deleteDraft);

// ── Patient Samples ────────────────────────────────────────────────────────
router.get('/samples/stats',          sampleCtrl.getStats);
router.get('/samples/export',         sampleCtrl.exportCSV);
router.get('/samples',                sampleCtrl.getAll);
router.post('/samples',               sampleCtrl.create);
router.put('/samples/id/:id',         sampleCtrl.updateById);
router.put('/samples/:khid',          sampleCtrl.update);
router.delete('/samples/id/:id',      sampleCtrl.remove);
router.get('/samples/:khid',          sampleCtrl.getOne);

module.exports = router;