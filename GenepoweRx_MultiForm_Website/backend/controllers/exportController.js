const ExcelJS    = require('exceljs');
const Patient    = require('../models/Patient');
const FormSubmission = require('../models/FormSubmission');

const ORANGE = 'FFE8611A';
const PURPLE = 'FF5B3FA6';
const HEADER_FONT = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };

const MENTAL_QS = [
  'Difficulty concentrating on work?',
  'Lost sleep / difficulty sleeping?',
  'Not playing a useful part in work?',
  'Under constant stress?',
  'Could not overcome difficulties?',
  'Unhappy or depressed most days?',
  'Losing confidence in yourself?',
  'Consider yourself an anxious person?',
  'Stressors in family / professional life?',
];

const ROS_SEC = {
  cardiovascular:'Cardiovascular', respiratory:'Respiratory',
  gastrointestinal:'Gastrointestinal', neurological:'Neurological',
  musculoskeletal:'Musculoskeletal', endocrine:'Endocrine',
  dermatological:'Dermatological', genitourinary:'Genitourinary',
  hematological:'Haematological', immunological:'Immunological',
  psychiatric:'Psychiatric', ophthalmological:'Ophthalmological', ent:'ENT',
};

function humanKey(k) {
  return k.replace(/([A-Z])/g,' $1').replace(/_/g,' ').replace(/^./,s=>s.toUpperCase()).trim();
}

// ── Master value formatter — handles every data shape ───────────────────────
function renderVal(key, value) {
  // Accept both renderVal(key,v) and legacy renderVal(v) calls
  if (arguments.length === 1) { value = key; key = ''; }

  if (value === null || value === undefined || value === false || value === '') return '';
  if (value === true) return 'Yes';
  if (typeof value === 'number') return String(value);

  if (typeof value === 'string') return value.trim();

  // ── Medications [{name, dosage, frequency}] ──────────────────────────────
  const isMed = ['medications','currentMedications','extraMeds','supplements'].includes(key);
  if (isMed && Array.isArray(value)) {
    return value.filter(m => m && typeof m === 'object').map((m, i) => {
      const name  = (m.name||m.medication||m.drug||'').trim();
      const dose  = (m.dosage||m.dose||m.strength||'').trim();
      const freq  = (m.frequency||m.freq||m.timing||'').trim();
      const route = (m.route||'').trim();
      const parts = [name, dose, route, freq].filter(Boolean);
      return parts.length ? `${i+1}. ${parts.join(' | ')}` : null;
    }).filter(Boolean).join('\n') || '';
  }

  // ── Complaints [{c, onset, duration}] ────────────────────────────────────
  const isComp = ['complaints','presentComplaints'].includes(key);
  if (isComp && Array.isArray(value)) {
    return value.filter(c => c && typeof c === 'object').map((c, i) => {
      const name = (c.c||c.complaint||c.symptom||'').trim();
      if (!name) return null;
      const parts = [`${i+1}. ${name}`];
      if (c.onset)    parts.push(`Onset: ${c.onset}`);
      if (c.duration) parts.push(`Duration: ${c.duration}`);
      return parts.join(' | ');
    }).filter(Boolean).join('\n') || '';
  }

  // ── Mental health {0:'Yes', 1:'No', ...} ─────────────────────────────────
  if (key === 'mental' && typeof value === 'object' && !Array.isArray(value)) {
    return Object.entries(value)
      .filter(([,ans]) => ans !== null && ans !== undefined && ans !== '' && ans !== false)
      .sort(([a],[b]) => parseInt(a)-parseInt(b))
      .map(([idx,ans]) => {
        const q = MENTAL_QS[parseInt(idx)] || `Q${parseInt(idx)+1}`;
        const a = (ans === true || ans === 'true') ? 'Yes' : String(ans);
        return `Q${parseInt(idx)+1}. ${q} => ${a}`;
      }).join('\n') || '';
  }

  // ── ROS {section:{item:true}} ─────────────────────────────────────────────
  if (key === 'ros' && typeof value === 'object' && !Array.isArray(value)) {
    return Object.entries(value).map(([sec, items]) => {
      if (!items || typeof items !== 'object') return null;
      const label = ROS_SEC[sec] || humanKey(sec);
      const selected = Object.entries(items)
        .filter(([,v]) => v===true||v==='true'||v==='Yes'||v===1)
        .map(([k]) => humanKey(k));
      return selected.length ? `${label}: ${selected.join(', ')}` : null;
    }).filter(Boolean).join(' | ') || '';
  }

  // ── Plain array ───────────────────────────────────────────────────────────
  if (Array.isArray(value)) {
    return value.map((item, i) => {
      if (!item) return null;
      if (typeof item === 'string' || typeof item === 'number') return String(item);
      if (typeof item === 'boolean') return item ? 'Yes' : null;
      if (typeof item === 'object') {
        const parts = Object.entries(item)
          .filter(([,v]) => v!==null && v!==undefined && v!=='' && v!==false)
          .map(([k,v]) => v===true ? humanKey(k) : `${humanKey(k)}: ${v}`)
          .filter(Boolean);
        return parts.length ? `${i+1}. ${parts.join(' | ')}` : null;
      }
      return null;
    }).filter(Boolean).join('; ') || '';
  }

  // ── Object: all bool-like → comma list of selected ───────────────────────
  const entries = Object.entries(value);
  const allBool = entries.every(([,v]) =>
    v===true||v===false||v==='true'||v==='false'||v===null||v===''
  );
  if (allBool) {
    return entries.filter(([,v])=>v===true||v==='true').map(([k])=>humanKey(k)).join(', ') || '';
  }

  // ── Mixed object ──────────────────────────────────────────────────────────
  const parts = [];
  for (const [k, v] of entries) {
    if (v===null||v===undefined||v===''||v===false) continue;
    if (v===true)               { parts.push(humanKey(k)); }
    else if (typeof v==='string') { parts.push(`${humanKey(k)}: ${v}`); }
    else if (typeof v==='number') { parts.push(`${humanKey(k)}: ${v}`); }
    else if (typeof v==='object') {
      const sub = Object.entries(v).filter(([,sv])=>sv===true||sv==='true').map(([sk])=>humanKey(sk));
      if (sub.length) parts.push(`${humanKey(k)}: ${sub.join(', ')}`);
    }
  }
  return parts.join('; ') || '';
}

// ── Styled row helpers ───────────────────────────────────────────────────────
function styleHeader(row, color) {
  row.eachCell(cell => {
    cell.fill   = { type:'pattern', pattern:'solid', fgColor:{ argb:color } };
    cell.font   = HEADER_FONT;
    cell.alignment = { vertical:'middle', horizontal:'center', wrapText:true };
    cell.border = {
      top:   {style:'thin',color:{argb:'FFD0D0D0'}}, bottom:{style:'thin',color:{argb:'FFD0D0D0'}},
      left:  {style:'thin',color:{argb:'FFD0D0D0'}}, right: {style:'thin',color:{argb:'FFD0D0D0'}},
    };
  });
  row.height = 28;
}

function styleDataRow(row, isEven) {
  row.eachCell(cell => {
    cell.fill      = { type:'pattern', pattern:'solid', fgColor:{ argb: isEven ? 'FFF8F8FF':'FFFFFFFF' } };
    cell.alignment = { vertical:'top', wrapText:true };
    cell.border = {
      top:   {style:'hair',color:{argb:'FFE0E0E0'}}, bottom:{style:'hair',color:{argb:'FFE0E0E0'}},
      left:  {style:'thin',color:{argb:'FFE0E0E0'}}, right: {style:'thin',color:{argb:'FFE0E0E0'}},
    };
  });
  row.height = 20;
}

function autoWidth(ws, cols) {
  cols.forEach((w, i) => { ws.getColumn(i+1).width = w; });
}

// ── 1. ALL PATIENTS EXPORT ───────────────────────────────────────────────────
exports.exportPatients = async (req, res) => {
  const patients    = await Patient.find().sort({ createdAt:-1 });
  const submissions = await FormSubmission.find().sort({ submittedAt:-1 });

  const wb = new ExcelJS.Workbook();
  wb.creator = 'GenepoweRx'; wb.created = new Date();

  const ws = wb.addWorksheet('All Patients', { views:[{state:'frozen',ySplit:1}] });
  ws.addRow(['Patient ID','Reference No.','Name','Age','Gender','Phone','Email','Address','Referral Doctor','Coordinator','Total Forms','Registered Date']);
  styleHeader(ws.lastRow, ORANGE);
  autoWidth(ws, [28,22,20,8,12,16,24,30,20,20,14,18]);

  patients.forEach((p, i) => {
    const total = submissions.filter(s => s.patientId === p.patientId).length;
    const row = ws.addRow([
      p.patientId, p.referenceNumber, p.name, p.age, p.gender,
      p.phone, p.email, p.address, p.referralDoctor, p.coordinator,
      total, p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-IN') : ''
    ]);
    styleDataRow(row, i%2===0);
  });

  const ws2 = wb.addWorksheet('All Submissions', { views:[{state:'frozen',ySplit:1}] });
  ws2.addRow(['Patient ID','Patient Name','Form Type','Visit No.','Visit Label','Is Revisit','Submitted At','Status']);
  styleHeader(ws2.lastRow, PURPLE);
  autoWidth(ws2, [28,20,18,10,12,10,22,14]);

  submissions.forEach((s, i) => {
    const p = patients.find(pt => pt.patientId === s.patientId);
    const row = ws2.addRow([
      s.patientId, p?.name||'', s.formType, s.visitNumber, s.visitLabel,
      s.isRevisit ? 'Yes':'No', new Date(s.submittedAt).toLocaleString('en-IN'), s.status
    ]);
    styleDataRow(row, i%2===0);
  });

  res.setHeader('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition',`attachment; filename="GenepoweRx_Patients_${Date.now()}.xlsx"`);
  await wb.xlsx.write(res); res.end();
};

// ── 2. FORM-WISE EXPORT ──────────────────────────────────────────────────────
exports.exportByFormType = async (req, res) => {
  const { formType } = req.params;
  const submissions  = await FormSubmission.find({ formType }).sort({ submittedAt:-1 })
    .populate('patient','name patientId referenceNumber');

  const wb = new ExcelJS.Workbook(); wb.creator = 'GenepoweRx';
  const ws = wb.addWorksheet(formType, { views:[{state:'frozen',ySplit:1}] });

  // Collect all unique field keys
  const allKeys = new Set();
  submissions.forEach(s => {
    if (s.formData && typeof s.formData === 'object') {
      Object.keys(s.formData).forEach(k => {
        if (!['signatureDataURL','agreed','__v'].includes(k)) allKeys.add(k);
      });
    }
  });
  const dataKeys = Array.from(allKeys);

  ws.addRow(['Patient ID','Reference No.','Patient Name','Visit No.','Visit Label','Is Revisit','Submitted At','Status', ...dataKeys.map(humanKey)]);
  styleHeader(ws.lastRow, formType==='ONCO'?'FFD62839':formType==='WES'?'FFE07B00':PURPLE);
  autoWidth(ws, [28,20,18,10,12,10,22,12, ...dataKeys.map(()=>28)]);

  submissions.forEach((s, i) => {
    const fd  = s.formData || {};
    const row = ws.addRow([
      s.patientId, s.patient?.referenceNumber||'', s.patient?.name||'',
      s.visitNumber, s.visitLabel, s.isRevisit?'Yes':'No',
      new Date(s.submittedAt).toLocaleString('en-IN'), s.status,
      ...dataKeys.map(k => renderVal(k, fd[k]))   // ← pass key so formatter knows context
    ]);
    styleDataRow(row, i%2===0);
    // Auto-expand row height for multi-line cells
    const maxLines = dataKeys.reduce((max, k) => {
      const v = renderVal(k, fd[k]);
      return Math.max(max, (v.match(/\n/g)||[]).length + 1);
    }, 1);
    if (maxLines > 1) row.height = Math.min(maxLines * 15, 120);
  });

  const fname = `GenepoweRx_${formType}_${Date.now()}.xlsx`;
  res.setHeader('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition',`attachment; filename="${fname}"`);
  await wb.xlsx.write(res); res.end();
};

// ── 3. CLINICAL INSIGHTS EXPORT ──────────────────────────────────────────────
exports.exportClinicalInsights = async (req, res) => {
  const [patients, submissions] = await Promise.all([
    Patient.find().sort({ createdAt:-1 }),
    FormSubmission.find().sort({ submittedAt:-1 })
  ]);

  const wb = new ExcelJS.Workbook(); wb.creator = 'GenepoweRx'; wb.created = new Date();

  // Sheet 1: Summary
  const ws1 = wb.addWorksheet('Clinical Summary');
  ws1.getColumn(1).width = 32; ws1.getColumn(2).width = 22;
  const addStat = (label, val) => {
    const row = ws1.addRow([label, val]);
    row.getCell(1).font = { bold:true, color:{ argb:'FF333366' } };
    row.getCell(2).font = { bold:true, size:12, color:{ argb:ORANGE } };
    row.height = 22;
  };
  ws1.addRow(['GenepoweRx — Clinical Insights Report']);
  ws1.lastRow.getCell(1).font = { bold:true, size:14, color:{ argb:PURPLE } };
  ws1.lastRow.height = 32;
  ws1.addRow(['Generated:', new Date().toLocaleString('en-IN')]);
  ws1.addRow([]);
  addStat('Total Patients', patients.length);
  addStat('Total Submissions', submissions.length);
  addStat('Total Revisits', submissions.filter(s=>s.isRevisit).length);
  ws1.addRow([]);
  ['LIFESTYLE','SHORT_LIFESTYLE','WES','ONCO','CONSENT'].forEach(ft => {
    addStat(`  ${ft}`, submissions.filter(s=>s.formType===ft).length);
  });
  ws1.addRow([]);
  ['Male','Female','Prefer not to say'].forEach(g => {
    addStat(`  ${g}`, patients.filter(p=>p.gender===g).length);
  });

  // Sheet 2: ONCO
  const oncoSubs = submissions.filter(s=>s.formType==='ONCO');
  if (oncoSubs.length) {
    const ws2 = wb.addWorksheet('ONCO Patients', { views:[{state:'frozen',ySplit:1}] });
    ws2.addRow(['Patient ID','Name','Cancer Type','Cancer Stage','Primary Site','Family Cancer History','Pathology Attached','Submitted At','Visit No.']);
    styleHeader(ws2.lastRow,'FFD62839');
    autoWidth(ws2,[28,20,24,14,22,30,16,22,10]);
    oncoSubs.forEach((s,i) => {
      const p=patients.find(pt=>pt.patientId===s.patientId), fd=s.formData||{};
      const row = ws2.addRow([
        s.patientId, p?.name||'', fd.cancerType||'', fd.cancerStage||'',
        fd.primarySite||'', renderVal('familyCancerHistory',fd.familyCancerHistory), fd.pathologyAttached||'',
        new Date(s.submittedAt).toLocaleString('en-IN'), s.visitNumber
      ]);
      styleDataRow(row,i%2===0);
    });
  }

  // Sheet 3: WES
  const wesSubs = submissions.filter(s=>s.formType==='WES');
  if (wesSubs.length) {
    const ws3 = wb.addWorksheet('WES Patients', { views:[{state:'frozen',ySplit:1}] });
    ws3.addRow(['Patient ID','Name','Clinical Symptoms','Age of Onset','Consanguinity','Disease Progression','Genetic Testing Before','Submitted At','Visit No.']);
    styleHeader(ws3.lastRow,'FFE07B00');
    autoWidth(ws3,[28,20,30,14,14,22,20,22,10]);
    wesSubs.forEach((s,i) => {
      const p=patients.find(pt=>pt.patientId===s.patientId), fd=s.formData||{};
      const row = ws3.addRow([
        s.patientId, p?.name||'', fd.clinicalSymptoms||'', fd.ageOfOnset||'',
        fd.consanguinity||'', fd.diseaseProgression||'', fd.geneticTestingBefore||'',
        new Date(s.submittedAt).toLocaleString('en-IN'), s.visitNumber
      ]);
      styleDataRow(row,i%2===0);
    });
  }

  // Sheet 4: Mental Health & Lifestyle
  const lifeSubs = submissions.filter(s=>s.formType==='LIFESTYLE'||s.formType==='SHORT_LIFESTYLE');
  if (lifeSubs.length) {
    const ws4 = wb.addWorksheet('Mental Health', { views:[{state:'frozen',ySplit:1}] });
    ws4.addRow(['Patient ID','Name','Gender','Age','Alcohol','Smoking','Sleep Pattern','Workout','Meals/Day','Mental Health Answers','Submitted At']);
    styleHeader(ws4.lastRow,PURPLE);
    autoWidth(ws4,[28,20,12,8,16,16,16,14,14,60,22]);
    lifeSubs.forEach((s,i) => {
      const p=patients.find(pt=>pt.patientId===s.patientId), fd=s.formData||{};
      const row = ws4.addRow([
        s.patientId, p?.name||'', p?.gender||'', p?.age||'',
        fd.alcohol||'', fd.smoke||'', fd.sleepPattern||'',
        fd.workout||'', fd.meals||'',
        renderVal('mental', fd.mental),
        new Date(s.submittedAt).toLocaleString('en-IN')
      ]);
      styleDataRow(row,i%2===0);
      const mentalLines = renderVal('mental',fd.mental).split('\n').length;
      if (mentalLines > 1) row.height = Math.min(mentalLines*14, 150);
    });
  }

  const fname = `GenepoweRx_ClinicalInsights_${Date.now()}.xlsx`;
  res.setHeader('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition',`attachment; filename="${fname}"`);
  await wb.xlsx.write(res); res.end();
};

// ── 4. SINGLE PATIENT EXPORT ─────────────────────────────────────────────────
exports.exportPatientData = async (req, res) => {
  const { patientId } = req.params;
  const patient = await Patient.findOne({ patientId });
  if (!patient) return res.status(404).json({ success:false, message:'Patient not found' });

  const submissions = await FormSubmission.find({ patientId }).sort({ formType:1, visitNumber:1 });
  const wb = new ExcelJS.Workbook(); wb.creator = 'GenepoweRx';

  // Patient info sheet
  const wsInfo = wb.addWorksheet('Patient Info');
  wsInfo.getColumn(1).width = 28; wsInfo.getColumn(2).width = 36;
  wsInfo.addRow(['GenepoweRx — Patient Report']);
  wsInfo.lastRow.getCell(1).font = { bold:true, size:14, color:{ argb:PURPLE } };
  wsInfo.addRow([]);
  [
    ['Patient ID', patient.patientId], ['Reference No.', patient.referenceNumber],
    ['Name', patient.name], ['Age', patient.age], ['Gender', patient.gender],
    ['Phone', patient.phone], ['Email', patient.email], ['Address', patient.address],
    ['Referral Doctor', patient.referralDoctor], ['Coordinator', patient.coordinator],
    ['Registered', patient.createdAt ? new Date(patient.createdAt).toLocaleString('en-IN') : ''],
    ['Total Submissions', submissions.length],
  ].forEach(([k,v]) => {
    const row = wsInfo.addRow([k, v||'']);
    row.getCell(1).font = { bold:true, color:{ argb:'FF333366' } };
    row.height = 20;
  });

  // One sheet per form type
  const grouped = {};
  submissions.forEach(s => {
    if (!grouped[s.formType]) grouped[s.formType] = [];
    grouped[s.formType].push(s);
  });

  for (const [formType, subs] of Object.entries(grouped)) {
    const ws = wb.addWorksheet(formType, { views:[{state:'frozen',ySplit:1}] });
    const allKeys = new Set();
    subs.forEach(s => {
      if (s.formData) Object.keys(s.formData).forEach(k => {
        if (!['signatureDataURL','agreed','__v'].includes(k)) allKeys.add(k);
      });
    });
    const dataKeys = Array.from(allKeys);
    ws.addRow(['Visit No.','Visit Label','Is Revisit','Submitted At', ...dataKeys.map(humanKey)]);
    styleHeader(ws.lastRow, formType==='ONCO'?'FFD62839':formType==='WES'?'FFE07B00':ORANGE);
    autoWidth(ws, [10,14,10,22, ...dataKeys.map(()=>28)]);
    subs.forEach((s,i) => {
      const fd = s.formData||{};
      const row = ws.addRow([
        s.visitNumber, s.visitLabel, s.isRevisit?'Yes':'No',
        new Date(s.submittedAt).toLocaleString('en-IN'),
        ...dataKeys.map(k => renderVal(k, fd[k]))
      ]);
      styleDataRow(row, i%2===0);
      const maxLines = dataKeys.reduce((max,k) => {
        const v = renderVal(k,fd[k]);
        return Math.max(max,(v.match(/\n/g)||[]).length+1);
      },1);
      if (maxLines > 1) row.height = Math.min(maxLines*15, 120);
    });
  }

  const fname = `GenepoweRx_${patientId}_${Date.now()}.xlsx`;
  res.setHeader('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition',`attachment; filename="${fname}"`);
  await wb.xlsx.write(res); res.end();
};