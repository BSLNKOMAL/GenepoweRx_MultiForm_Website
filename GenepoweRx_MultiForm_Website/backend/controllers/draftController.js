const Draft = require('../models/Draft');

exports.saveDraft = async (req, res) => {
  const { draftId, patientName, patientId, referenceNumber, formType, formData } = req.body;
  const parsed = typeof formData === 'string' ? JSON.parse(formData) : (formData || {});

  let draft;
  if (draftId) {
    draft = await Draft.findOneAndUpdate(
      { draftId },
      { formData: parsed, patientName, lastModified: new Date() },
      { new: true }
    );
  }
  if (!draft) {
    draft = await Draft.create({
      patientName,
      patientId: patientId || null,
      referenceNumber: referenceNumber || null,
      formType,
      formData: parsed
    });
  }
  res.json({ success: true, data: draft });
};

exports.getDrafts = async (req, res) => {
  const { q, formType } = req.query;
  const filter = { isSubmitted: false };
  if (formType) filter.formType = formType;
  if (q) {
    const regex = new RegExp(q, 'i');
    filter.$or = [
      { patientName: regex },
      { patientId: regex },
      { draftId: regex },
      { referenceNumber: regex }
    ];
  }
  const drafts = await Draft.find(filter).sort({ lastModified: -1 }).limit(50);
  res.json({ success: true, data: drafts });
};

exports.getDraft = async (req, res) => {
  const draft = await Draft.findOne({ draftId: req.params.id });
  if (!draft) return res.status(404).json({ success: false, message: 'Draft not found' });
  res.json({ success: true, data: draft });
};

exports.deleteDraft = async (req, res) => {
  await Draft.findOneAndDelete({ draftId: req.params.id });
  res.json({ success: true, message: 'Draft deleted' });
};

exports.updateDraft = async (req, res) => {
  const { formData, patientName } = req.body;
  const parsed = typeof formData === 'string' ? JSON.parse(formData) : (formData || {});
  const draft = await Draft.findOneAndUpdate(
    { draftId: req.params.id },
    { formData: parsed, patientName, lastModified: new Date() },
    { new: true }
  );
  if (!draft) return res.status(404).json({ success: false, message: 'Draft not found' });
  res.json({ success: true, data: draft });
};
