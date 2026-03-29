const PendingSample = require('../models/PendingSample');

// GET all pending samples (unresolved by default)
exports.getAll = async (req, res) => {
  const { resolved, category, q } = req.query;
  const filter = {};
  if (resolved !== undefined) filter.resolved = resolved === 'true';
  else filter.resolved = false; // default: show pending only
  if (category) filter.category = category;
  if (q) {
    filter.$or = [
      { name:      { $regex: q, $options: 'i' } },
      { patientId: { $regex: q, $options: 'i' } },
      { testType:  { $regex: q, $options: 'i' } },
    ];
  }
  const samples = await PendingSample.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, data: samples });
};

// POST create
exports.create = async (req, res) => {
  const { patientId, name, age, gender, testType, category, notes, addedBy } = req.body;
  if (!name || !testType || !category)
    return res.status(400).json({ success: false, message: 'Name, testType and category are required' });

  // Auto-set blood/trf flags from category
  const bloodTestDone = category === 'BLOOD_DONE_NO_TRF';
  const trfAvailable  = category === 'TRF_DONE_NO_BLOOD';

  const sample = await PendingSample.create({
    patientId, name, age, gender, testType,
    category, bloodTestDone, trfAvailable,
    notes, addedBy
  });
  res.json({ success: true, data: sample });
};

// PUT update (mark resolved, edit details, or update flags)
exports.update = async (req, res) => {
  const sample = await PendingSample.findByIdAndUpdate(
    req.params.id,
    {
      ...req.body,
      ...(req.body.resolved ? { resolvedAt: new Date() } : {})
    },
    { new: true, runValidators: true }
  );
  if (!sample) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, data: sample });
};

// DELETE
exports.remove = async (req, res) => {
  await PendingSample.findByIdAndDelete(req.params.id);
  res.json({ success: true });
};

// GET stats
exports.getStats = async (req, res) => {
  const [total, bloodNoTrf, trfNoBlood, resolved] = await Promise.all([
    PendingSample.countDocuments({ resolved: false }),
    PendingSample.countDocuments({ category: 'BLOOD_DONE_NO_TRF', resolved: false }),
    PendingSample.countDocuments({ category: 'TRF_DONE_NO_BLOOD', resolved: false }),
    PendingSample.countDocuments({ resolved: true }),
  ]);
  res.json({ success: true, data: { total, bloodNoTrf, trfNoBlood, resolved } });
};