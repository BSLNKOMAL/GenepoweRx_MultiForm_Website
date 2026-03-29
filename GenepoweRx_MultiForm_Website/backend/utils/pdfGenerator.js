'use strict';
/**
 * pdfGenerator.js — GenepoweRx®
 * Generates Form PDF + Consent PDF as in-memory Buffers (zero disk writes).
 * Consent PDF is guaranteed single-page.
 */

const PDFDocument = require('pdfkit');
const fs   = require('fs');
const path = require('path');

// ─────────────────────────────────────────────────────────────────────────────
// COLOURS & GEOMETRY
// ─────────────────────────────────────────────────────────────────────────────
const C = {
  orange:'#E8611A', purple:'#5B3FA6', teal:'#0E7490', red:'#C41E3A',
  dark:'#1A1A2E',   gray:'#64748B',   lgray:'#F1F5F9', mgray:'#E2E8F0',
  white:'#FFFFFF',  green:'#16A34A',  stripe:'#F8FAFC',
};

const M       = 36;
const PAGE_W  = 595.28;
const PAGE_H  = 841.89;
const CW      = PAGE_W - M * 2;
const LBL_W   = Math.round(CW * 0.34);
const VAL_W   = CW - LBL_W - 1;
const HDR_H   = 76;
const PAT_H   = 56;
const FTR_H   = 38;

// ─────────────────────────────────────────────────────────────────────────────
// FIELD LABELS
// ─────────────────────────────────────────────────────────────────────────────
const FIELD_LABEL = {
  name:'Patient Name', age:'Age', gender:'Gender', phone:'Phone',
  email:'Email', address:'Address', referralDoctor:'Referral Doctor',
  coordinator:'Coordinator', date:'Date',
  testName:'Test Name', testAdvised:'Test Advised', testDetails:'Test Details',
  testSelection:'Test Panel Selection', sampleType:'Sample Type',
  indications:'Clinical Indications', specificGenes:'Specific Genes',
  geneList:'Gene List', panelGenes:'Panel / Genes',
  reasons:'Reasons for Testing', testReason:'Reason for Testing',
  complaints:'Presenting Complaints', presentComplaints:'Presenting Complaints',
  chiefComplaint:'Chief Complaint', pastMedicalHistory:'Past Medical History',
  pastMedical:'Past Medical Conditions', surgeries:'Surgeries / Procedures',
  hospitalizations:'Hospitalizations', previousDiagnosis:'Previous Diagnoses',
  comorbidities:'Comorbidities',
  clinicalSymptoms:'Clinical Symptoms', ageOfOnset:'Age of Onset',
  consanguinity:'Consanguinity', diseaseProgression:'Disease Progression',
  currentHealthStatus:'Current Health Status',
  investigationsPerformed:'Investigations Performed',
  treatment:'Treatment / Therapy', currentTreatment:'Current Treatment',
  geneticTestingBefore:'Prior Genetic Testing', geneticTestingDetails:'Prior Testing Details',
  familyGeneticHistory:'Family Genetic History',
  cancerType:'Cancer Type', cancerStage:'Cancer Stage', primarySite:'Primary Site',
  metastasis:'Metastasis', metastasisSites:'Metastasis Sites',
  familyCancerHistory:'Family Cancer History',
  pathologyAttached:'Pathology Attached', pathologyInference:'Pathology Inference',
  pathologyReportNo:'Pathology Report No.', ffpeBlockNo:'FFPE Block No.',
  tumorMarkers:'Tumour Markers', priorChemo:'Prior Chemotherapy',
  priorRadiation:'Prior Radiation', currentOncologyTreatment:'Current Oncology Treatment',
  dietLifestyle:'Diet & Lifestyle',
  medications:'Current Medications', currentMedications:'Current Medications',
  extraMeds:'Additional Medications', supplements:'Supplements',
  familyFather:"Father's Side", familyMother:"Mother's Side",
  familySibling:'Siblings', familyOther:'Other Relatives',
  consanguineous:'Consanguineous Marriage', familyNotes:'Family History Notes',
  mental:'Mental Health Questionnaire', mentalNotes:'Mental Health Notes',
  menstrual:'Menstrual History', infertility:'Infertility', erectile:'Erectile Dysfunction',
  alcohol:'Alcohol Consumption', smoke:'Smoking / Tobacco',
  wakeTime:'Wake-up Time', bedTime:'Bed Time', workout:'Exercise / Workout',
  sport:'Sports Activity', sleepPattern:'Sleep Pattern',
  meals:'Meals per Day', processedFood:'Processed Food', outsideFood:'Outside Food',
  softDrinks:'Soft Drinks', cuisine:'Cuisine Preference', foodPref:'Food Preference',
  ros:'Review of Systems', rosNotes:'ROS Notes',
  bp:'Blood Pressure', pulse:'Pulse Rate', height:'Height', weight:'Weight', bmi:'BMI',
  referredDoctor:'Referred By', preCounselor:'Pre-Counselor',
  sampleCoordinator:'Sample Coordinator', notes:'Notes', doctorNotes:"Doctor's Notes",
};
function fieldLabel(key) {
  return FIELD_LABEL[key] ||
    key.replace(/([A-Z])/g,' $1').replace(/_/g,' ').replace(/^./,s=>s.toUpperCase()).trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// OPTION MAPS
// ─────────────────────────────────────────────────────────────────────────────
const OPT = {
  gender:      { male:'Male', female:'Female', Male:'Male', Female:'Female', other:'Other' },
  alcohol:     { none:'None', occasional:'Occasional', moderate:'Moderate', frequent:'Frequent', daily:'Daily', weekly:'Weekly', monthly:'Monthly' },
  smoke:       { never:'Never', former:'Former Smoker', occasional:'Occasional', daily:'Daily', tobacco:'Smokeless Tobacco', ecigarette:'E-Cigarette' },
  workout:     { none:'None / Sedentary', walking:'Walking', running:'Running', gym:'Gym', yoga:'Yoga', cycling:'Cycling', swimming:'Swimming', sports:'Sports', other:'Other' },
  sleepPattern:{ normal:'Normal (7–9 hrs)', insomnia:'Insomnia', hypersomnia:'Hypersomnia', interrupted:'Fragmented', lateSleep:'Late Sleeper', other:'Other' },
  processedFood:{ never:'Never', rarely:'Rarely', sometimes:'Sometimes', often:'Often', daily:'Daily' },
  outsideFood:  { never:'Never', rarely:'Rarely', sometimes:'Sometimes', often:'Often', daily:'Daily' },
  softDrinks:   { never:'Never', rarely:'Rarely', sometimes:'Sometimes', often:'Often', daily:'Daily' },
  cuisine:     { indian:'Indian', southIndian:'South Indian', northIndian:'North Indian', continental:'Continental', chinese:'Chinese', mediterranean:'Mediterranean', other:'Other' },
  foodPref:    { vegetarian:'Vegetarian', nonVegetarian:'Non-Vegetarian', vegan:'Vegan', eggetarian:'Eggetarian', jain:'Jain', other:'Other' },
  sampleType:  { blood:'Blood (EDTA)', edta:'Blood (EDTA)', saliva:'Saliva', buccal:'Buccal Swab', tissue:'Tissue Biopsy', ffpe:'FFPE Block', urine:'Urine', other:'Other' },
  consanguinity:{ yes:'Yes', no:'No', unknown:'Unknown' },
  consanguineous:{ yes:'Yes', no:'No', unknown:'Unknown' },
  pathologyAttached:{ yes:'Yes', no:'No' },
  geneticTestingBefore:{ yes:'Yes', no:'No' },
  metastasis:{ yes:'Yes', no:'No', unknown:'Unknown' },
  diseaseProgression:{ stable:'Stable', improving:'Improving', worsening:'Worsening', remission:'In Remission', fluctuating:'Fluctuating', unknown:'Unknown' },
  cancerStage:{ '0':'Stage 0','1':'Stage I','2':'Stage II','3':'Stage III','4':'Stage IV', stage1:'Stage I', stage2:'Stage II', stage3:'Stage III', stage4:'Stage IV', unknown:'Unknown' },
};
function resolveOption(fieldKey, v) {
  const map = OPT[fieldKey];
  if (map && map[v] !== undefined) return map[v];
  if (typeof v === 'string' && v.length < 30)
    return v.replace(/([A-Z])/g,' $1').replace(/_/g,' ').replace(/^./,s=>s.toUpperCase()).trim();
  return String(v);
}

// ─────────────────────────────────────────────────────────────────────────────
// MENTAL HEALTH QUESTIONS (index 0-8, same as LifestyleForm.js)
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// ROS LABELS
// ─────────────────────────────────────────────────────────────────────────────
const ROS_SEC = {
  cardiovascular:'Cardiovascular', respiratory:'Respiratory',
  gastrointestinal:'Gastrointestinal', neurological:'Neurological',
  musculoskeletal:'Musculoskeletal', endocrine:'Endocrine',
  dermatological:'Dermatological', genitourinary:'Genitourinary',
  hematological:'Haematological', immunological:'Immunological',
  psychiatric:'Psychiatric', ophthalmological:'Ophthalmological', ent:'ENT',
};

// ─────────────────────────────────────────────────────────────────────────────
// MASTER FORMATTER — converts any raw value to readable string or null
// ─────────────────────────────────────────────────────────────────────────────
function formatValue(key, value) {
  if (value === null || value === undefined || value === false || value === '') return null;
  if (Array.isArray(value) && value.length === 0) return null;
  if (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0) return null;

  if (value === true)               return 'Yes';
  if (typeof value === 'number')    return String(value);

  // ── Plain string ──────────────────────────────────────────────────────
  if (typeof value === 'string') {
    const t = value.trim();
    if (!t) return null;
    const map = OPT[key];
    if (map && map[t] !== undefined) return map[t];
    return t;
  }

  // ── Medications [{name, dosage, frequency}] ───────────────────────────
  const isMed = ['medications','currentMedications','extraMeds','supplements'].includes(key);
  if (isMed && Array.isArray(value)) {
    const lines = value
      .filter(m => m && typeof m === 'object')
      .map((m, i) => {
        const name = (m.name || m.medication || m.drug || '').trim();
        const dose = (m.dosage || m.dose || m.strength || '').trim();
        const freq = (m.frequency || m.freq || m.timing || '').trim();
        const route= (m.route || '').trim();
        const parts = [name, dose, route, freq].filter(Boolean);
        return parts.length ? `${i+1}. ${parts.join('  ·  ')}` : null;
      }).filter(Boolean);
    return lines.length ? lines.join('\n') : null;
  }

  // ── Complaints [{c, onset, duration}] ────────────────────────────────
  const isComp = ['complaints','presentComplaints'].includes(key);
  if (isComp && Array.isArray(value)) {
    const lines = value
      .filter(c => c && typeof c === 'object')
      .map((c, i) => {
        const name = (c.c || c.complaint || c.symptom || '').trim();
        if (!name) return null;
        const parts = [`${i+1}. ${name}`];
        if (c.onset)    parts.push(`Onset: ${c.onset}`);
        if (c.duration) parts.push(`Duration: ${c.duration}`);
        if (c.severity) parts.push(`Severity: ${c.severity}`);
        return parts.join('  |  ');
      }).filter(Boolean);
    return lines.length ? lines.join('\n') : null;
  }

  // ── Mental health {0:'Yes', 1:'No', ...} ─────────────────────────────
  if (key === 'mental' && typeof value === 'object' && !Array.isArray(value)) {
    const lines = Object.entries(value)
      .filter(([,ans]) => ans !== null && ans !== undefined && ans !== '' && ans !== false)
      .sort(([a],[b]) => parseInt(a)-parseInt(b))
      .map(([idx,ans]) => {
        const q = MENTAL_QS[parseInt(idx)] || `Question ${parseInt(idx)+1}`;
        const a = (ans === true || ans === 'true') ? 'Yes' : String(ans);
        return `Q${parseInt(idx)+1}. ${q}  →  ${a}`;
      });
    return lines.length ? lines.join('\n') : null;
  }

  // ── ROS {section:{item:true}} ─────────────────────────────────────────
  if (key === 'ros' && typeof value === 'object' && !Array.isArray(value)) {
    const lines = [];
    for (const [sec, items] of Object.entries(value)) {
      if (!items || typeof items !== 'object') continue;
      const label = ROS_SEC[sec] || fieldLabel(sec);
      const selected = Object.entries(items)
        .filter(([,v]) => v === true || v === 'true' || v === 'Yes' || v === 1)
        .map(([k]) => fieldLabel(k));
      if (selected.length) lines.push(`${label}: ${selected.join(', ')}`);
    }
    return lines.length ? lines.join('\n') : null;
  }

  // ── Plain array ───────────────────────────────────────────────────────
  if (Array.isArray(value)) {
    const lines = value.map((item, i) => {
      if (!item) return null;
      if (typeof item === 'string' || typeof item === 'number') return String(item);
      if (typeof item === 'boolean') return item ? 'Yes' : null;
      if (typeof item === 'object') {
        const parts = Object.entries(item)
          .filter(([,v]) => v !== null && v !== undefined && v !== '' && v !== false)
          .map(([k,v]) => v === true ? fieldLabel(k) : `${fieldLabel(k)}: ${v}`)
          .filter(Boolean);
        return parts.length ? `${i+1}. ${parts.join('  |  ')}` : null;
      }
      return null;
    }).filter(Boolean);
    return lines.length ? lines.join('\n') : null;
  }

  // ── Object: all bool-like → comma list of selected keys ──────────────
  const entries = Object.entries(value);
  const allBool = entries.every(([,v]) =>
    v === true || v === false || v === 'true' || v === 'false' || v === null || v === ''
  );
  if (allBool) {
    const selected = entries
      .filter(([,v]) => v === true || v === 'true')
      .map(([k]) => resolveOption(key, k));
    return selected.length ? selected.join(', ') : null;
  }

  // ── Mixed object ──────────────────────────────────────────────────────
  const parts = [];
  for (const [k,v] of entries) {
    if (v === null || v === undefined || v === '' || v === false) continue;
    if (v === true)                  { parts.push(resolveOption(key, k)); }
    else if (typeof v === 'string')  { parts.push(`${fieldLabel(k)}: ${resolveOption(key, v.trim())}`); }
    else if (typeof v === 'number')  { parts.push(`${fieldLabel(k)}: ${v}`); }
    else if (typeof v === 'object')  {
      const sub = Object.entries(v).filter(([,sv]) => sv===true||sv==='true').map(([sk])=>fieldLabel(sk));
      if (sub.length) parts.push(`${fieldLabel(k)}: ${sub.join(', ')}`);
    }
  }
  return parts.length ? parts.join('\n') : null;
}

// ─────────────────────────────────────────────────────────────────────────────
// PDF PRIMITIVES
// ─────────────────────────────────────────────────────────────────────────────
function checkSpace(doc, needed) {
  if (doc.y + needed > PAGE_H - FTR_H - 8) { doc.addPage(); doc.y = 50; }
}

function estH(text, w, fs) {
  const cpl = Math.max(1, Math.floor(w / (fs * 0.52)));
  return String(text).split('\n').reduce((acc,l) => acc + Math.max(1, Math.ceil(l.length/cpl)) * (fs+3), 0);
}

function drawPageHeader(doc, patient, formType, visitLabel) {
  const pw = doc.page.width;
  const logoPath = path.join(__dirname,'../assets/logo.png');
  doc.rect(0,0,pw,HDR_H).fill(C.white);
  if (fs.existsSync(logoPath)) { try { doc.image(logoPath,M,7,{height:46}); } catch(_){} }
  const fl = formType==='CONSENT' ? 'Patient Informed Consent Form' : `${formType.replace(/_/g,' ')} Submission Form`;
  doc.fontSize(7.5).fillColor(C.gray).font('Helvetica')
    .text(fl, pw-M-210, 12, {width:210, align:'right'});
  doc.font('Helvetica-Bold').fillColor(C.orange).fontSize(8)
    .text('Genetic Science powered by K&H', pw-M-210, 24, {width:210, align:'right'});
  doc.font('Helvetica').fillColor(C.gray).fontSize(7.5)
    .text(`Generated: ${new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}`, pw-M-210, 36, {width:210, align:'right'});
  if (visitLabel) doc.font('Helvetica-Bold').fillColor(C.purple).fontSize(7.5)
    .text(visitLabel, pw-M-210, 49, {width:210, align:'right'});
  doc.rect(0, HDR_H-2.5, pw, 2.5).fill(C.orange);
}

function drawPatientBox(doc, patient) {
  const pw = doc.page.width;
  const bx=M, by=HDR_H+5, bw=pw-M*2;
  doc.rect(bx,by,bw,PAT_H).fill(C.lgray);
  doc.rect(bx,by,3.5,PAT_H).fill(C.orange);
  doc.fontSize(6.5).fillColor(C.orange).font('Helvetica-Bold').text('PATIENT DETAILS', bx+10, by+6);
  doc.fontSize(10.5).fillColor(C.dark).font('Helvetica-Bold').text(patient.name||'Unknown', bx+10, by+16);
  const hw=(bw-14)/2;
  doc.fontSize(7.5).font('Helvetica').fillColor(C.gray)
    .text(`Patient ID:  ${patient.patientId||'—'}`,       bx+10,    by+30)
    .text(`Reference:  ${patient.referenceNumber||'—'}`,  bx+10+hw, by+30)
    .text(`Phone:  ${patient.phone||'—'}`,                bx+10,    by+42)
    .text(`Email:  ${patient.email||'—'}`,                bx+10+hw, by+42);
  doc.y = by+PAT_H+8;
}

function drawSectionHeader(doc, title, color) {
  checkSpace(doc, 26);
  const pw = doc.page.width;
  doc.rect(M, doc.y, pw-M*2, 19).fill(color||C.purple);
  doc.fontSize(7.5).fillColor(C.white).font('Helvetica-Bold')
    .text(title.toUpperCase(), M+8, doc.y+5.5, {width:pw-M*2-16, lineBreak:false});
  doc.y += 23;
}

function drawRow(doc, label, valueText, shaded) {
  const pw  = doc.page.width;
  const rw  = pw-M*2;
  const val = String(valueText||'—');
  const lH  = estH(label, LBL_W-12, 7.5);
  const vH  = estH(val,   VAL_W-8,  7.5);
  const rowH = Math.max(18, Math.max(lH,vH)+9);
  checkSpace(doc, rowH+2);
  const sy = doc.y;
  if (shaded) doc.rect(M,sy,rw,rowH).fill(C.stripe);
  doc.rect(M,sy,rw,rowH).strokeColor(C.mgray).lineWidth(0.25).stroke();
  const divX = M+LBL_W;
  doc.moveTo(divX,sy).lineTo(divX,sy+rowH).lineWidth(0.25).strokeColor(C.mgray).stroke();
  doc.fontSize(7.5).font('Helvetica-Bold').fillColor(C.gray)
    .text(label, M+6, sy+5, {width:LBL_W-10, lineBreak:true});
  let vy = sy+5;
  val.split('\n').forEach(line => {
    const lh = estH(line||' ', VAL_W-8, 7.5);
    doc.fontSize(7.5).font('Helvetica').fillColor(C.dark)
      .text(line||'', divX+6, vy, {width:VAL_W-8, lineBreak:true});
    vy += Math.max(10, lh);
  });
  doc.y = sy+rowH+1;
}

function drawFooter(doc, patient, formType) {
  const pw = doc.page.width;
  const fy = PAGE_H-FTR_H;
  doc.rect(0,fy,pw,FTR_H).fill(C.dark);
  doc.font('Helvetica').fillColor('#94A3B8').fontSize(6.5)
    .text(`Submitted: ${new Date().toLocaleString('en-IN')}  |  GenepoweRx®  |  Patient ID: ${patient.patientId||'—'}  |  Form: ${formType}`,
      M, fy+8, {width:pw-M*2, align:'center'})
    .text('GenepoweRx® — Genetic Science powered by K&H  |  Confidential Medical Record',
      M, fy+21, {width:pw-M*2, align:'center'});
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function collectRows(fd, keys, rendered) {
  const rows = [];
  keys.forEach(key => {
    rendered.add(key);
    const raw = fd[key];
    if (raw===undefined||raw===null||raw==='') return;
    const display = formatValue(key, raw);
    if (display) rows.push({label:fieldLabel(key), value:display});
  });
  return rows;
}

function renderRows(doc, title, rows, color) {
  if (!rows||rows.length===0) return;
  drawSectionHeader(doc, title, color);
  rows.forEach(({label,value},i) => drawRow(doc, label, value, i%2===0));
  doc.y += 4;
}

function section(doc, fd, rendered, title, keys, color) {
  renderRows(doc, title, collectRows(fd, keys, rendered), color);
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC: generateFormPDF → Promise<Buffer>
// ─────────────────────────────────────────────────────────────────────────────
exports.generateFormPDF = function(patient, formType, formData, visitLabel) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({size:'A4',margin:0,autoFirstPage:true,bufferPages:true});
      const chunks=[]; doc.on('data',c=>chunks.push(c)); doc.on('end',()=>resolve(Buffer.concat(chunks))); doc.on('error',reject);

      drawPageHeader(doc, patient, formType, visitLabel);
      drawPatientBox(doc, patient);

      const badgeCol = formType==='ONCO'?C.red:formType==='WES'?'#E07B00':C.orange;
      doc.rect(M,doc.y,64,14).fill(badgeCol);
      doc.fontSize(7).fillColor(C.white).font('Helvetica-Bold')
        .text(formType.replace(/_/g,' '), M+2, doc.y+3.5, {width:60,align:'center'});
      doc.y+=18;

      const fd = formData||{};
      const rendered = new Set(['signatureDataURL','agreed','__v','_id','draftId','submittedAt','createdAt','updatedAt']);

      section(doc,fd,rendered,'Patient Information',   ['name','age','gender','phone','email','address','referralDoctor','coordinator','date']);
      section(doc,fd,rendered,'Test Details',           ['testName','testAdvised','testDetails','testSelection','sampleType','indications','specificGenes','geneList','panelGenes']);
      if(formType==='WES') {
        const wr=collectRows(fd,['specificGenes','geneList','panelGenes'],new Set());
        if(wr.length){ drawSectionHeader(doc,'WES Gene / Panel Selection',C.teal); wr.forEach(({label,value},i)=>drawRow(doc,label,value,i%2===0)); doc.y+=4; }
      }
      section(doc,fd,rendered,'Reasons for Testing',   ['reasons','testReason','indication']);
      section(doc,fd,rendered,'Presenting Complaints', ['complaints','presentComplaints','chiefComplaint','pastMedicalHistory']);
      section(doc,fd,rendered,'Past Medical & Surgical History',['pastMedical','surgeries','hospitalizations','previousDiagnosis','comorbidities']);
      section(doc,fd,rendered,'Clinical Information',  ['clinicalSymptoms','ageOfOnset','consanguinity','diseaseProgression','currentHealthStatus','investigationsPerformed','treatment','currentTreatment','geneticTestingBefore','geneticTestingDetails','familyGeneticHistory']);
      if(formType==='ONCO') {
        section(doc,fd,rendered,'Oncology Details',['cancerType','cancerStage','primarySite','metastasis','metastasisSites','familyCancerHistory','pathologyAttached','pathologyInference','pathologyReportNo','ffpeBlockNo','tumorMarkers','priorChemo','priorRadiation','currentOncologyTreatment','dietLifestyle'],C.red);
      } else {
        ['cancerType','cancerStage','primarySite','metastasis','metastasisSites','familyCancerHistory','pathologyAttached','pathologyInference','pathologyReportNo','ffpeBlockNo','tumorMarkers','priorChemo','priorRadiation','currentOncologyTreatment'].forEach(k=>rendered.add(k));
      }
      section(doc,fd,rendered,'Current Medications',   ['medications','currentMedications']);
      section(doc,fd,rendered,'Additional Medications & Supplements',['extraMeds','supplements']);
      section(doc,fd,rendered,'Family History',         ['familyFather','familyMother','familySibling','familyOther','consanguineous','familyNotes']);
      section(doc,fd,rendered,'Mental Health',          ['mental','mentalNotes','anxiety','depression']);
      section(doc,fd,rendered,'Reproductive Health',    ['menstrual','infertility','erectile']);
      section(doc,fd,rendered,'Lifestyle & Diet',       ['alcohol','smoke','wakeTime','bedTime','workout','sport','sleepPattern','meals','processedFood','outsideFood','softDrinks','cuisine','foodPref']);
      section(doc,fd,rendered,'Review of Systems',      ['ros','rosNotes']);
      section(doc,fd,rendered,'Physical Examination',   ['bp','pulse','height','weight','bmi']);
      section(doc,fd,rendered,'Additional Information', ['referredDoctor','preCounselor','sampleCoordinator','notes','doctorNotes']);

      // Catch-all
      const restRows=[];
      Object.keys(fd).forEach(k=>{
        if(rendered.has(k)) return; rendered.add(k);
        const d=formatValue(k,fd[k]);
        if(d) restRows.push({label:fieldLabel(k),value:d});
      });
      renderRows(doc,'Other Information',restRows);

      drawFooter(doc, patient, formType);
      doc.end();
    } catch(err){ reject(err); }
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC: generateConsentPDF → Promise<Buffer>  ← SINGLE PAGE GUARANTEED
// ─────────────────────────────────────────────────────────────────────────────
// Available body height: ~640 pts
// Budget: header(26)+preamble(10)+10×points(~160)+agreement(15)+decl-hdr(23)+info(28)+sig(72)+disclaimer(14) ≈ 348 pts → fits with room to spare
// ─────────────────────────────────────────────────────────────────────────────
exports.generateConsentPDF = function(patient, consentData, signatureDataURL) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({size:'A4',margin:0,autoFirstPage:true,bufferPages:true});
      const chunks=[]; doc.on('data',c=>chunks.push(c)); doc.on('end',()=>resolve(Buffer.concat(chunks))); doc.on('error',reject);

      const pw = doc.page.width;
      const cw = pw - M*2;

      drawPageHeader(doc, patient, 'CONSENT', '');
      drawPatientBox(doc, patient);

      // ── Section header ────────────────────────────────────────────────
      drawSectionHeader(doc, 'Informed Consent Declaration', C.purple);

      // ── Preamble ──────────────────────────────────────────────────────
      doc.fontSize(7).font('Helvetica-Oblique').fillColor(C.gray)
        .text('By signing below, I confirm I have read and understood all the terms stated herein:',
          M, doc.y, {width:cw});
      doc.y += 5;

      // ── 10 Consent points — compact alternating rows ──────────────────
      // Points are shortened to 1 sentence each so they fit on one page
      const POINTS = [
        'The medical practitioner has explained the risks, outcomes, benefits and limitations of genomics testing. I freely consent to the Test being conducted on my sample.',
        'I shall provide accurate personal and medical information (history, symptoms, medications, lifestyle, family history) to enable effective testing and result interpretation.',
        'I shall not hold the Clinic liable for interpretation or analysis of tests conducted based on medical information provided by me.',
        'Though genomics testing is generally accurate, results may be inconclusive or of unknown significance due to technology limitations, and further testing may be required.',
        'Test results are indicative and cannot be considered conclusive or guaranteed; further clinical correlation may be required.',
        'The Clinic is not a specimen banking facility. My sample will be discarded after 2 months and will not be available for future clinical tests.',
        'I consent to the Clinic storing my personal data in safe, encrypted custody for medical research purposes.',
        'I authorise collection, processing, use, storage and retention of anonymised data for test development, educational and scientific research activities.',
        'The Clinic shall not disclose test results to any third party unless required by law or expressly authorised by me.',
        'A copy of this consent form is retained by me for any future reference.',
      ];

      POINTS.forEach((pt, i) => {
        // 7pt font, ~(cw-19)/4.55 chars per line
        const cpl   = Math.floor((cw - 19) / 4.3);
        const nLines= Math.max(1, Math.ceil(pt.length / cpl));
        const blkH  = nLines * 8.5 + 4;

        // DO NOT call checkSpace here — consent must stay single page
        const ry = doc.y;
        if (i%2===0) doc.rect(M, ry, cw, blkH).fill(C.lgray);
        // Circle
        doc.circle(M+7, ry+blkH/2, 6.5).fill(C.purple);
        doc.fontSize(6).font('Helvetica-Bold').fillColor(C.white)
          .text(String(i+1), M+3.5, ry+blkH/2-4, {width:7, align:'center'});
        // Text
        doc.fontSize(7).font('Helvetica').fillColor(C.dark)
          .text(pt, M+17, ry+2, {width:cw-19, lineBreak:true});
        doc.y = ry + blkH + 1;
      });

      doc.y += 3;

      // ── Agreement bar ─────────────────────────────────────────────────
      const agrY = doc.y;
      doc.rect(M, agrY, cw, 14).fill('#ECFDF5');
      doc.rect(M, agrY, 3.5, 14).fill(C.green);
      doc.fontSize(8).font('Helvetica-Bold').fillColor(C.green)
        .text('&  I have read and agree to all the informed consent terms stated above.',
          M+9, agrY+3, {width:cw-12});
      doc.y = agrY + 17;

      // ── Declaration / Signature section header ────────────────────────
      const declY = doc.y;
      doc.rect(M, declY, cw, 17).fill(C.purple);
      doc.fontSize(7.5).fillColor(C.white).font('Helvetica-Bold')
        .text('PATIENT DECLARATION & SIGNATURE', M+8, declY+4.5, {width:cw-16, lineBreak:false});
      doc.y = declY + 20;

      // ── Name / ID / Date info row ─────────────────────────────────────
      const infoY = doc.y;
      const col   = cw/3;
      doc.fontSize(6.5).fillColor(C.gray).font('Helvetica')
        .text('Full Name',   M,          infoY)
        .text('Patient ID',  M+col,      infoY)
        .text('Date',        M+col*2,    infoY);
      doc.fontSize(8).fillColor(C.dark).font('Helvetica-Bold')
        .text(patient.name||'—',       M,          infoY+9, {width:col-4})
        .text(patient.patientId||'—',  M+col,      infoY+9, {width:col-4})
        .text(new Date().toLocaleDateString('en-IN'), M+col*2, infoY+9, {width:col-4});
      doc.moveTo(M, infoY+22).lineTo(M+cw, infoY+22).lineWidth(0.3).strokeColor(C.mgray).stroke();
      doc.y = infoY + 26;

      // ── Signature panels (side by side) ───────────────────────────────
      const sigY = doc.y;
      const sigW = 210;
      const witW = cw - sigW - 12;
      const panH = 72;

      // Patient signature panel
      doc.rect(M, sigY, sigW, panH).strokeColor(C.mgray).lineWidth(0.5).stroke();
      doc.rect(M, sigY, sigW, 11).fill(C.lgray);
      doc.fontSize(6).fillColor(C.gray).font('Helvetica-Bold')
        .text('PATIENT / GUARDIAN SIGNATURE', M+4, sigY+3, {width:sigW-8});

      if (signatureDataURL && signatureDataURL.startsWith('data:image')) {
        try {
          const buf = Buffer.from(signatureDataURL.split(',')[1], 'base64');
          doc.image(buf, M+2, sigY+13, {width:sigW-4, height:panH-15});
        } catch(_) {
          doc.fontSize(7).fillColor('#CBD5E0').font('Helvetica-Oblique')
            .text('Signature image error', M+50, sigY+35);
        }
      } else {
        doc.fontSize(7).fillColor('#CBD5E0').font('Helvetica-Oblique')
          .text('(Signature not captured)', M+52, sigY+36);
      }

      // Witness / Doctor panel
      const wx = M+sigW+12;
      doc.rect(wx, sigY, witW, panH).strokeColor(C.mgray).lineWidth(0.5).stroke();
      doc.rect(wx, sigY, witW, 11).fill(C.lgray);
      doc.fontSize(6).fillColor(C.gray).font('Helvetica-Bold')
        .text('WITNESS / DOCTOR SIGNATURE', wx+4, sigY+3, {width:witW-8});
      doc.fontSize(7).fillColor(C.gray).font('Helvetica')
        .text('Name:' + '  ' + '_'.repeat(22), wx+4, sigY+17)
        .text('Designation:' + '  ' + '_'.repeat(15), wx+4, sigY+29)
        .text('Reg. No.:' + '  ' + '_'.repeat(18), wx+4, sigY+41)
        .text('Stamp / Date:', wx+4, sigY+53);

      doc.y = sigY + panH + 5;

      // ── Place and date row ────────────────────────────────────────────
      doc.fontSize(6.5).fillColor(C.gray).font('Helvetica')
        .text('Place: ' + '_'.repeat(20), M, doc.y, {width:cw/2})
        .text(`Date: ${new Date().toLocaleDateString('en-IN')}`, M+cw/2, doc.y, {width:cw/2, align:'right'});
      doc.y += 10;

      // ── Disclaimer note ───────────────────────────────────────────────
      const noteY = doc.y;
      doc.rect(M, noteY, cw, 12).fill('#FFF7ED');
      doc.fontSize(6).fillColor('#92400E').font('Helvetica-Oblique')
        .text('This consent is valid for the specific test(s) requested above. GenepoweRx® reserves the right to update consent terms with prior notice.',
          M+5, noteY+3, {width:cw-8});
      doc.y = noteY+14;

      drawFooter(doc, patient, 'CONSENT');
      doc.end();
    } catch(err){ reject(err); }
  });
};

exports.generateFormPDFBuffer    = exports.generateFormPDF;
exports.generateConsentPDFBuffer = exports.generateConsentPDF;