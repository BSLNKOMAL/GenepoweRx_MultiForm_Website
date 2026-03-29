const connectClientsDB = require('../config/clientsDb');
const PatientSampleSchema = require('../models/PatientSample');

// Get model dynamically
async function getModel() {
  const conn = await connectClientsDB();

  if (conn.models && conn.models['PatientSample']) {
    return conn.models['PatientSample'];
  }

  return conn.model('PatientSample', PatientSampleSchema);
}

// Generate KHID
async function generateKHID(name, PatientSample) {
  const clean = (name || 'PATIENT')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 12);

  const base = `KHGENEPOWERX-${clean}`;

  const count = await PatientSample.countDocuments({
    khid: { $regex: `^${base}` }
  });

  return count === 0 ? base : `${base}-${count + 1}`;
}

// GET all
exports.getAll = async (req, res) => {
  const PatientSample = await getModel();
  const { q, trfStatus, bloodStatus } = req.query;

  const filter = {};

  if (q) {
    filter.$or = [
      { khid: { $regex: q, $options: 'i' } },
      { name: { $regex: q, $options: 'i' } }
    ];
  }

  if (trfStatus !== undefined) {
    filter.trfStatus = trfStatus === 'true';
  }

  if (bloodStatus !== undefined) {
    filter.bloodStatus = bloodStatus === 'true';
  }

  const data = await PatientSample.find(filter).sort({ createdAt: -1 });

  res.json({ success: true, data });
};

// GET one
exports.getOne = async (req, res) => {
  const PatientSample = await getModel();

  const doc = await PatientSample.findOne({ khid: req.params.khid });

  if (!doc) {
    return res.status(404).json({ success: false, message: 'Not found' });
  }

  res.json({ success: true, data: doc });
};

// CREATE
exports.create = async (req, res) => {
  const PatientSample = await getModel();

  const { name, age, gender, testType, notes, addedBy } = req.body;

  if (!name) {
    return res.status(400).json({ success: false, message: 'Name is required' });
  }

  const khid = await generateKHID(name, PatientSample);

  const doc = await PatientSample.create({
    khid,
    name,
    age: age || '',
    gender: gender || '',
    testType: testType || '',
    notes: notes || '',
    addedBy: addedBy || '',
    trfStatus: false,
    bloodStatus: false
  });

  res.json({ success: true, data: doc });
};

// UPDATE by ID
exports.updateById = async (req, res) => {
  const PatientSample = await getModel();

  const doc = await PatientSample.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { new: true }
  );

  if (!doc) {
    return res.status(404).json({ success: false, message: 'Not found' });
  }

  res.json({ success: true, data: doc });
};

// UPDATE by KHID
exports.update = async (req, res) => {
  const PatientSample = await getModel();

  const doc = await PatientSample.findOneAndUpdate(
    { khid: req.params.khid },
    { $set: req.body },
    { new: true }
  );

  if (!doc) {
    return res.status(404).json({ success: false, message: 'Not found' });
  }

  res.json({ success: true, data: doc });
};

// DELETE
exports.remove = async (req, res) => {
  const PatientSample = await getModel();

  await PatientSample.findByIdAndDelete(req.params.id);

  res.json({ success: true });
};

// STATS
exports.getStats = async (req, res) => {
  const PatientSample = await getModel();

  const [total, trfDone, bloodDone, bothComplete] = await Promise.all([
    PatientSample.countDocuments({}),
    PatientSample.countDocuments({ trfStatus: true }),
    PatientSample.countDocuments({ bloodStatus: true }),
    PatientSample.countDocuments({ trfStatus: true, bloodStatus: true })
  ]);

  const trfPending = total - trfDone;
  const bloodPending = total - bloodDone;

  const statusBreakdown = {
    ff: await PatientSample.countDocuments({ trfStatus: false, bloodStatus: false }),
    tf: await PatientSample.countDocuments({ trfStatus: true, bloodStatus: false }),
    ft: await PatientSample.countDocuments({ trfStatus: false, bloodStatus: true }),
    tt: await PatientSample.countDocuments({ trfStatus: true, bloodStatus: true })
  };

  res.json({
    success: true,
    data: {
      total,
      trfDone,
      bloodDone,
      bothComplete,
      trfPending,
      bloodPending,
      statusBreakdown
    }
  });
};

// EXPORT CSV
exports.exportCSV = async (req, res) => {
  const PatientSample = await getModel();

  const rows = await PatientSample.find({}).sort({ createdAt: -1 });

  const header = 'KHID,Name,Age,Gender,Test_Type,TRF_Status,Blood_Status,Created_At\n';

  const csv = rows.map(r =>
    [
      r.khid,
      `"${r.name}"`,
      r.age || '',
      r.gender || '',
      r.testType || '',
      r.trfStatus ? 'T' : 'F',
      r.bloodStatus ? 'T' : 'F',
      new Date(r.createdAt).toLocaleDateString('en-IN')
    ].join(',')
  ).join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="patient_samples_${Date.now()}.csv"`
  );

  res.send(header + csv);
};