const path = require('path');
const fs   = require('fs');
const FormSubmission = require('../models/FormSubmission');
const Patient        = require('../models/Patient');
const Draft          = require('../models/Draft');
const { generateFormPDFBuffer, generateConsentPDFBuffer } = require('../utils/pdfGenerator');

// ── Visit number helper ───────────────────────────────────────────────────
async function getNextVisitNumber(patientId, formType) {
  const last = await FormSubmission.findOne(
    { patientId, formType }, { visitNumber: 1 }, { sort: { visitNumber: -1 } }
  );
  return last ? last.visitNumber + 1 : 1;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SUBMIT FORM
// Generates PDF immediately, stores as Buffer in MongoDB.
// No file written to disk at any point.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
exports.submitForm = async (req, res) => {
  const { formType, formData, patientData, draftId } = req.body;
  const parsed = typeof formData    === 'string' ? JSON.parse(formData)    : (formData    || {});
  const pData  = typeof patientData === 'string' ? JSON.parse(patientData) : (patientData || {});

  // ── Find or create patient ─────────────────────────────────────────────
  let patient = await Patient.findOne({
    $or: [
      ...(pData.patientId ? [{ patientId: pData.patientId }] : []),
      { name: pData.name, phone: pData.phone }
    ]
  });
  if (!patient) {
    patient = await Patient.create({
      name: pData.name, age: pData.age, gender: pData.gender,
      phone: pData.phone, email: pData.email, address: pData.address,
      referralDoctor: pData.referralDoctor, coordinator: pData.coordinator
    });
  } else {
    await Patient.findByIdAndUpdate(patient._id, {
      age:   pData.age   || patient.age,
      phone: pData.phone || patient.phone,
      email: pData.email || patient.email,
    });
    patient = await Patient.findById(patient._id);
  }

  const pid         = patient.patientId;
  const visitNumber = await getNextVisitNumber(pid, formType);
  const isRevisit   = visitNumber > 1;
  const visitLabel  = `Visit ${visitNumber}`;

  // ── Store uploaded files as Buffer in MongoDB ──────────────────────────
  const uploadedFiles = (req.files || []).map(f => ({
    originalName: f.originalname,
    mimetype:     f.mimetype,
    size:         f.size,
    visitNumber,
    uploadedAt:   new Date(),
    data:         f.buffer
  }));

  // ── Generate PDF as Buffer (zero filesystem usage) ─────────────────────
  let pdfBuffer      = null;
  let pdfGeneratedAt = null;
  const pdfFileName  = `GenepoweRx_${pid}_${formType}_${visitLabel.replace(' ', '_')}.pdf`;

  try {
    pdfBuffer      = await generateFormPDFBuffer(patient, formType, parsed, visitLabel);
    pdfGeneratedAt = new Date();
  } catch (e) {
    console.error('Form PDF generation error:', e.message);
  }

  // ── Save to MongoDB ────────────────────────────────────────────────────
  const submission = await FormSubmission.create({
    patient: patient._id,
    patientId: pid,
    formType,
    visitNumber,
    visitLabel,
    isRevisit,
    formData:         parsed,
    uploadedFiles,
    pdfBuffer,           // Buffer stored in MongoDB
    pdfGeneratedAt,
    pdfFileName,
    generatedPdfPath: null,
    status: 'submitted'
  });

  if (draftId) await Draft.findOneAndUpdate({ draftId }, { isSubmitted: true, lastModified: new Date() });

  const totalForms = await FormSubmission.countDocuments({ patientId: pid });

  res.json({
    success: true,
    data: {
      submission:        { ...submission.toObject(), pdfBuffer: undefined },  // never send buffer over API
      patient,
      visitNumber,
      visitLabel,
      isRevisit,
      totalForms,
      redirectToConsent: formType !== 'CONSENT',
      patientId:         pid,
      referenceNumber:   patient.referenceNumber,
      pdfReady:          !!pdfBuffer,
      submissionId:      submission._id
    }
  });
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SUBMIT CONSENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
exports.submitConsent = async (req, res) => {
  const { formData, patientId, signatureDataURL } = req.body;
  const parsed  = typeof formData === 'string' ? JSON.parse(formData) : (formData || {});
  const patient = await Patient.findOne({ patientId });
  if (!patient) return res.status(404).json({ success: false, message: `Patient ${patientId} not found` });

  const pid         = patient.patientId;
  const visitNumber = await getNextVisitNumber(pid, 'CONSENT');
  const visitLabel  = `Visit ${visitNumber}`;
  const isRevisit   = visitNumber > 1;

  // ── Generate Consent PDF as Buffer ─────────────────────────────────────
  let consentPdfBuffer = null;
  let consentPdfGenAt  = null;
  const consentFileName = `GenepoweRx_${pid}_CONSENT_${visitLabel.replace(' ', '_')}.pdf`;

  try {
    consentPdfBuffer = await generateConsentPDFBuffer(patient, parsed, signatureDataURL);
    consentPdfGenAt  = new Date();
  } catch (e) {
    console.error('Consent PDF generation error:', e.message);
  }

  const consentSubmission = await FormSubmission.create({
    patient: patient._id,
    patientId: pid,
    formType: 'CONSENT',
    visitNumber,
    visitLabel,
    isRevisit,
    formData: { ...parsed, signatureDataURL: signatureDataURL || null },
    uploadedFiles:    [],
    pdfBuffer:        consentPdfBuffer,
    pdfGeneratedAt:   consentPdfGenAt,
    pdfFileName:      consentFileName,
    generatedPdfPath: null,
    status: 'submitted'
  });

  // ── Also get the latest form submission for this patient (non-consent) ─
  const latestFormSub = await FormSubmission.findOne(
    { patientId: pid, formType: { $ne: 'CONSENT' } },
    { _id: 1, formType: 1, visitNumber: 1, pdfBuffer: 1, pdfFileName: 1 },
    { sort: { submittedAt: -1 } }
  );

  const totalForms = await FormSubmission.countDocuments({ patientId: pid });

  res.json({
    success: true,
    data: {
      submission:         { ...consentSubmission.toObject(), pdfBuffer: undefined },
      patient,
      totalForms,
      visitNumber,
      visitLabel,
      consentPdfReady:    !!consentPdfBuffer,
      consentSubmissionId: consentSubmission._id,
      // Pass latest form submission ID so frontend can offer both downloads
      formSubmissionId:   latestFormSub?._id || null,
      formPdfReady:       !!(latestFormSub?.pdfBuffer),
    }
  });
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DOWNLOAD PDF — streams Buffer from MongoDB to browser as file download
// GET /api/pdf/download/:submissionId
// Browser triggers native "Save As" dialog → user's Downloads folder
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
exports.downloadSubmissionPDF = async (req, res) => {
  const { submissionId } = req.params;

  // Select only the buffer fields — avoids loading full formData into memory
  const sub = await FormSubmission.findById(submissionId).select('pdfBuffer pdfFileName patientId formType visitLabel');
  if (!sub) return res.status(404).json({ success: false, message: 'Submission not found' });
  if (!sub.pdfBuffer) return res.status(404).json({ success: false, message: 'PDF not available for this submission' });

  const fname = sub.pdfFileName || `GenepoweRx_${sub.patientId}_${sub.formType}.pdf`;

  res.setHeader('Content-Type', 'application/pdf');
  // attachment → browser triggers Save As / Downloads
  res.setHeader('Content-Disposition', `attachment; filename="${fname}"`);
  res.setHeader('Content-Length', sub.pdfBuffer.length);
  res.send(sub.pdfBuffer);
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// REGENERATE PDF on demand (for old submissions that have no pdfBuffer yet)
// POST /api/pdf/regenerate/:submissionId
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
exports.regeneratePDF = async (req, res) => {
  const { submissionId } = req.params;
  const sub = await FormSubmission.findById(submissionId).populate('patient');
  if (!sub) return res.status(404).json({ success: false, message: 'Submission not found' });

  try {
    let buf;
    if (sub.formType === 'CONSENT') {
      const sigURL = sub.formData?.signatureDataURL || null;
      buf = await generateConsentPDFBuffer(sub.patient, sub.formData, sigURL);
    } else {
      buf = await generateFormPDFBuffer(sub.patient, sub.formType, sub.formData, sub.visitLabel);
    }

    const pdfFileName = `GenepoweRx_${sub.patientId}_${sub.formType}_${sub.visitLabel.replace(' ', '_')}.pdf`;
    await FormSubmission.findByIdAndUpdate(submissionId, {
      pdfBuffer:      buf,
      pdfGeneratedAt: new Date(),
      pdfFileName
    });

    res.json({ success: true, message: 'PDF regenerated and stored', submissionId, pdfFileName });
  } catch (e) {
    console.error('Regenerate PDF error:', e.message);
    res.status(500).json({ success: false, message: 'PDF generation failed', error: e.message });
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LEGACY download endpoints (old /api/pdf/:patientId/:type routes)
// These now find the latest submission for the patient+type and stream buffer
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
exports.downloadPDF = async (req, res) => {
  const { patientId, type } = req.params;
  const patient = await Patient.findOne({ patientId });
  if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });

  const formType = type === 'consent' ? 'CONSENT' : { $ne: 'CONSENT' };
  const sub = await FormSubmission.findOne(
    { patientId, formType },
    { pdfBuffer: 1, pdfFileName: 1, patientId: 1, formType: 1 },
    { sort: { submittedAt: -1 } }
  );

  if (!sub || !sub.pdfBuffer)
    return res.status(404).json({ success: false, message: 'PDF not found for this patient' });

  const fname = sub.pdfFileName || `GenepoweRx_${patientId}_${type}.pdf`;
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${fname}"`);
  res.setHeader('Content-Length', sub.pdfBuffer.length);
  res.send(sub.pdfBuffer);
};

exports.downloadVisitPDF = async (req, res) => {
  const { submissionId } = req.params;
  return exports.downloadSubmissionPDF(req, res);
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SEARCH — by Patient Name or Patient ID (KHID)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
exports.searchPatientData = async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ success: false, message: 'Search query required' });

  const patients = await Patient.find({
    $or: [
      { name:      { $regex: q, $options: 'i' } },
      { patientId: { $regex: q, $options: 'i' } }
    ]
  });
  if (!patients.length)
    return res.status(404).json({ success: false, message: 'No patients found', data: [] });

  const results = await Promise.all(patients.map(async p => {
    const submissions = await FormSubmission.find({ patientId: p.patientId })
      .sort({ formType: 1, visitNumber: 1 })
      .select('-uploadedFiles.data -pdfBuffer')  // exclude binary blobs from list
      .lean();
    return {
      patient: p,
      totalSubmissions: submissions.length,
      submissions: submissions.map(sub => ({
        _id:           sub._id,
        formType:      sub.formType,
        visitNumber:   sub.visitNumber,
        visitLabel:    sub.visitLabel,
        isRevisit:     sub.isRevisit,
        submittedAt:   sub.submittedAt,
        status:        sub.status,
        formData:      sub.formData,
        pdfReady:      !!sub.pdfGeneratedAt,
        pdfFileName:   sub.pdfFileName,
        uploadedFiles: (sub.uploadedFiles || []).map(f => ({
          originalName: f.originalName, mimetype: f.mimetype,
          size: f.size, visitNumber: f.visitNumber, uploadedAt: f.uploadedAt,
        })),
      }))
    };
  }));

  res.json({ success: true, query: q, count: results.length, data: results });
};

// ── Retrieve uploaded file by submission ID + file index ──────────────────
exports.getUploadedFile = async (req, res) => {
  const { submissionId, fileIndex } = req.params;
  const sub = await FormSubmission.findById(submissionId);
  if (!sub) return res.status(404).json({ success: false, message: 'Submission not found' });
  const file = sub.uploadedFiles[parseInt(fileIndex, 10)];
  if (!file || !file.data) return res.status(404).json({ success: false, message: 'File not found' });
  res.setHeader('Content-Type', file.mimetype || 'application/octet-stream');
  res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
  res.send(file.data);
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EXISTING READ ENDPOINTS — unchanged (pdfBuffer excluded from all responses)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
exports.getPatientFormHistory = async (req, res) => {
  const { patientId } = req.params;
  const patient = await Patient.findOne({ patientId });
  if (!patient) return res.status(404).json({ success: false, message: `No patient found: ${patientId}` });
  const submissions = await FormSubmission.find({ patientId })
    .sort({ formType: 1, visitNumber: 1 })
    .select('-uploadedFiles.data -pdfBuffer')
    .lean();
  const grouped = {};
  for (const sub of submissions) {
    if (!grouped[sub.formType]) grouped[sub.formType] = [];
    grouped[sub.formType].push({ ...sub, pdfReady: !!sub.pdfGeneratedAt });
  }
  const allFormTypes   = ['LIFESTYLE', 'SHORT_LIFESTYLE', 'WES', 'ONCO', 'CONSENT'];
  const completedForms = Object.keys(grouped);
  const pendingForms   = allFormTypes.filter(f => !completedForms.includes(f));
  res.json({ success: true, data: { patient, grouped, completedForms, pendingForms, totalSubmissions: submissions.length } });
};

exports.getSubmission = async (req, res) => {
  const sub = await FormSubmission.findById(req.params.id)
    .populate('patient').select('-uploadedFiles.data -pdfBuffer').lean();
  if (!sub) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, data: { ...sub, pdfReady: !!sub.pdfGeneratedAt } });
};

exports.getFormSubmissions = async (req, res) => {
  const { formType, patientId, visitNumber } = req.query;
  const filter = {};
  if (formType)    filter.formType    = formType;
  if (patientId)   filter.patientId   = patientId;
  if (visitNumber) filter.visitNumber = Number(visitNumber);
  const submissions = await FormSubmission.find(filter)
    .sort({ submittedAt: -1 })
    .select('-uploadedFiles.data -pdfBuffer')
    .populate('patient', 'name patientId referenceNumber');
  res.json({ success: true, data: submissions });
};

exports.getPatientVisitSummary = async (req, res) => {
  const { patientId } = req.params;
  const patient = await Patient.findOne({ patientId });
  if (!patient) return res.status(404).json({ success: false, message: `No patient: ${patientId}` });
  const all = await FormSubmission.find({ patientId })
    .sort({ formType: 1, visitNumber: -1 })
    .select('-uploadedFiles.data -pdfBuffer').lean();
  const byForm = {};
  all.forEach(sub => {
    if (!byForm[sub.formType]) byForm[sub.formType] = [];
    byForm[sub.formType].push({ ...sub, pdfReady: !!sub.pdfGeneratedAt });
  });
  const allFormTypes   = ['LIFESTYLE', 'SHORT_LIFESTYLE', 'WES', 'ONCO', 'CONSENT'];
  const completedForms = Object.keys(byForm);
  const pendingForms   = allFormTypes.filter(f => !completedForms.includes(f));
  res.json({ success: true, data: { patient, visitsByForm: byForm, completedForms, pendingForms, totalSubmissions: all.length } });
};

exports.getVisitData = async (req, res) => {
  const { patientId, formType, visitNumber } = req.params;
  const sub = await FormSubmission.findOne({ patientId, formType, visitNumber: Number(visitNumber) })
    .populate('patient').select('-uploadedFiles.data -pdfBuffer').lean();
  if (!sub) return res.status(404).json({ success: false, message: 'Visit not found' });
  res.json({ success: true, data: { ...sub, pdfReady: !!sub.pdfGeneratedAt } });
};