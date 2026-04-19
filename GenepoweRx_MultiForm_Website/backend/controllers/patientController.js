const Patient        = require('../models/Patient');
const FormSubmission = require('../models/FormSubmission');
const Draft          = require('../models/Draft');

exports.createOrGetPatient = async (req, res) => {
  const { name, age, gender, phone, email, address, referralDoctor, coordinator } = req.body;
  let patient = await Patient.findOne({ name, phone });
  if (!patient) patient = await Patient.create({ name, age, gender, phone, email, address, referralDoctor, coordinator });
  res.json({ success: true, data: patient });
};

exports.searchPatients = async (req, res) => {
  const { q } = req.query;
  if (!q) return res.json({ success: true, data: [] });
  const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  const patients = await Patient.find({
    $or: [{ name: regex }, { patientId: regex }, { referenceNumber: regex }, { phone: regex }, { email: regex }]
  }).limit(20).sort({ createdAt: -1 });
  res.json({ success: true, data: patients });
};

exports.getPatient = async (req, res) => {
  const id = req.params.id;
  const patient = await Patient.findOne({
    $or: [
      { patientId: id },
      { referenceNumber: id },
      ...(id.length === 24 ? [{ _id: id }] : [])
    ]
  });
  if (!patient) return res.status(404).json({ success: false, message: `Patient not found for ID: ${id}` });
  const [forms, drafts] = await Promise.all([
    FormSubmission.find({ patientId: patient.patientId }).sort({ submittedAt: -1 }),
    Draft.find({ patientId: patient.patientId, isSubmitted: false })
  ]);
  res.json({ success: true, data: { patient, forms, drafts, totalForms: forms.length } });
};

exports.getAllPatients = async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (page - 1) * limit;
  const [patients, total] = await Promise.all([
    Patient.find().sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Patient.countDocuments()
  ]);
  res.json({ success: true, data: patients, total, page: Number(page), pages: Math.ceil(total / limit) });
};

exports.getAnalytics = async (req, res) => {
  try {
    const [totalPatients, totalForms, totalDrafts, formStats, recentSubmissions, genderDist] = await Promise.all([
      Patient.countDocuments(),
      FormSubmission.countDocuments(),
      Draft.countDocuments({ isSubmitted: false }),
      FormSubmission.aggregate([
        { $facet: {
          byType: [{ $group: { _id: '$formType', count: { $sum: 1 } } }],
          monthlyTrend: [
            { $group: { _id: { year: { $year: '$submittedAt' }, month: { $month: '$submittedAt' } }, count: { $sum: 1 } } },
            { $sort: { '_id.year': 1, '_id.month': 1 } },
            { $limit: 12 }
          ]
        }}
      ]),
      FormSubmission.find().sort({ submittedAt: -1 }).limit(5).populate('patient','name patientId'),
      Patient.aggregate([{ $group: { _id: '$gender', count: { $sum: 1 } } }])
    ]);
    
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    res.json({
      success: true,
      data: {
        stats: { totalPatients, totalForms, totalDrafts, completionRate: totalForms > 0 ? Math.round((totalForms/(totalForms+totalDrafts))*100) : 0 },
        formsByType: formStats[0]?.byType?.map(f => ({ name: f._id, value: f.count })) || [],
        recentSubmissions,
        genderDist: genderDist.map(g => ({ name: g._id||'Unknown', value: g.count })),
        monthlyTrend: formStats[0]?.monthlyTrend?.map(d => ({ month: months[d._id.month-1]+' '+d._id.year, submissions: d.count })) || []
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
