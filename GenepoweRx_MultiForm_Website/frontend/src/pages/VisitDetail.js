import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getVisitData } from '../services/api';
import { RiArrowLeftLine, RiDownloadLine, RiCalendarLine, RiFileListLine, RiEditLine, RiFileLine } from 'react-icons/ri';
import logo from '../assets/logo.png';
import './VisitDetail.css';

const BACKEND   = 'http://localhost:5000';
const FORM_PATHS = {
  LIFESTYLE:'lifestyle', SHORT_LIFESTYLE:'short-lifestyle',
  WES:'wes', ONCO:'onco', CONSENT:'consent'
};

// ── Properly format any value for display (no [object Object]) ────
function renderValue(val) {
  if (val === null || val === undefined || val === '') return '—';
  if (typeof val === 'boolean') return val ? 'Yes' : 'No';

  if (Array.isArray(val)) {
    const items = val.map(item => {
      if (item === null || item === undefined || item === '') return null;
      if (typeof item === 'object') {
        return Object.entries(item)
          .filter(([, v]) => v !== null && v !== undefined && v !== '' && v !== false)
          .map(([k, v]) => {
            const label = k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim();
            return typeof v === 'boolean' ? (v ? label : null) : `${label}: ${v}`;
          })
          .filter(Boolean).join(' | ');
      }
      return String(item);
    }).filter(Boolean);
    return items.length > 0 ? items.join(',  ') : '—';
  }

  if (typeof val === 'object') {
    const parts = Object.entries(val)
      .filter(([, v]) => v !== null && v !== undefined && v !== '' && v !== false)
      .map(([k, v]) => {
        const label = k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim();
        if (v === true) return label;
        if (typeof v === 'object') return `${label}: ${renderValue(v)}`;
        return `${label}: ${v}`;
      });
    return parts.length > 0 ? parts.join(',  ') : '—';
  }

  return String(val);
}

function FieldCard({ label, value }) {
  const v = renderValue(value);
  if (!v || v === '—') return null;
  return (
    <div className="vd-field">
      <span className="vd-field-label">{label}</span>
      <span className="vd-field-value">{v}</span>
    </div>
  );
}

const SKIP = ['signatureDataURL','agreed'];
const SECTION_MAP = {
  'Patient Details':  ['name','age','gender','phone','email','address','referralDoctor','coordinator'],
  'Test Details':     ['testName','sampleType','testDetails','testAdvised','indications','specificGenes'],
  'Clinical Info':    ['clinicalSymptoms','ageOfOnset','consanguinity','diseaseProgression','currentHealthStatus','investigationsPerformed','treatment','geneticTestingBefore','geneticTestingDetails','familyGeneticHistory'],
  'Oncology':         ['cancerType','cancerStage','primarySite','familyCancerHistory','dietLifestyle','pathologyAttached','pathologyInference'],
  'Presenting Complaints': ['presentComplaints','pastMedicalHistory','reasons','complaints'],
  'Medications':      ['medications','extraMeds'],
  'Family History':   ['familyFather','familyMother','familySibling','familyOther','consanguineous','familyNotes'],
  'Mental Health':    ['mental','mentalNotes','menstrual','infertility','erectile'],
  'Review of Systems':['ros','rosNotes'],
  'Lifestyle & Diet': ['alcohol','smoke','wakeTime','bedTime','workout','sport','sleepPattern','meals','processedFood','outsideFood','softDrinks','cuisine','foodPref'],
  'Physical Exam':    ['bp','pulse','height','weight','bmi'],
  'Additional Info':  ['notes','doctorNotes','pathologyReportNo','referredDoctor','preCounselor','sampleCoordinator','ffpeBlockNo'],
};

export default function VisitDetail() {
  const { patientId, formType, visitNumber } = useParams();
  const navigate = useNavigate();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await getVisitData(patientId, formType, visitNumber);
        setData(res.data);
      } catch { navigate(-1); }
      setLoading(false);
    })();
  }, [patientId, formType, visitNumber, navigate]);

  if (loading) return <div className="vd-loading">Loading visit data...</div>;
  if (!data)   return null;

  const formData  = data.formData || {};
  const rendered  = new Set();
  const subId     = data._id;

  const handleDownloadPDF = () => {
    window.open(`${BACKEND}/api/pdf/submission/${subId}`, '_blank');
  };

  const handleDownloadFile = (index) => {
    window.open(`${BACKEND}/api/file/${subId}/${index}`, '_blank');
  };

  return (
    <div className="visit-detail page-fade">
      <div className="vd-topbar">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <RiArrowLeftLine /> Back
        </button>
        <img src={logo} alt="GenepoweRx" className="vd-logo" />
      </div>

      {/* Header */}
      <div className="vd-header">
        <div className="vd-form-badge"
          style={{background: formType==='ONCO'?'#d62839':formType==='WES'?'#e07b00':'#5B3FA6'}}>
          {formType.replace('_',' ')}
        </div>
        <div className="vd-header-info">
          <h1 className="vd-title">{data.visitLabel} — {formType.replace('_',' ')} Form</h1>
          <div className="vd-meta">
            <span><RiFileListLine /> Patient: <strong>{data.patient?.name}</strong></span>
            <span className="vd-pid">{patientId}</span>
            <span><RiCalendarLine /> {new Date(data.submittedAt).toLocaleString('en-IN')}</span>
            {data.isRevisit && <span className="vd-revisit-badge">Revisit</span>}
          </div>
        </div>
        <div className="vd-actions">
          <button className="btn-secondary vd-download-btn" onClick={handleDownloadPDF}>
            <RiDownloadLine /> Download PDF
          </button>
          <button className="btn-primary vd-new-visit-btn"
            onClick={() => {
              const p = new URLSearchParams({ patientId, name: data.patient?.name||'', isRevisit:'true' });
              navigate(`/forms/${FORM_PATHS[formType]}?${p.toString()}`);
            }}>
            <RiEditLine /> New Visit
          </button>
        </div>
      </div>

      <div className="vd-readonly-notice">
        👁 <strong>Read-only view</strong> — Historical record of {data.visitLabel}.
        Click "New Visit" to submit updated data as a new visit.
      </div>

      {/* Form data sections */}
      {Object.entries(SECTION_MAP).map(([secTitle, keys]) => {
        const relevant = keys.filter(k => formData[k] !== undefined && formData[k] !== '' &&
          formData[k] !== null && !SKIP.includes(k));
        if (!relevant.length) return null;
        relevant.forEach(k => rendered.add(k));
        return (
          <div key={secTitle} className="vd-section">
            <div className="vd-section-title">{secTitle}</div>
            <div className="vd-fields-grid">
              {relevant.map(k => (
                <FieldCard key={k}
                  label={k.replace(/([A-Z])/g,' $1').replace(/^./,s=>s.toUpperCase()).trim()}
                  value={formData[k]} />
              ))}
            </div>
          </div>
        );
      })}

      {/* Remaining fields */}
      {(() => {
        const rest = Object.keys(formData).filter(k =>
          !rendered.has(k) && !SKIP.includes(k) &&
          formData[k] !== '' && formData[k] !== null && formData[k] !== undefined
        );
        if (!rest.length) return null;
        return (
          <div className="vd-section">
            <div className="vd-section-title">Additional Information</div>
            <div className="vd-fields-grid">
              {rest.map(k => (
                <FieldCard key={k}
                  label={k.replace(/([A-Z])/g,' $1').replace(/^./,s=>s.toUpperCase()).trim()}
                  value={formData[k]} />
              ))}
            </div>
          </div>
        );
      })()}

      {/* Uploaded files — with View & Download from MongoDB Buffer */}
      {data.uploadedFiles?.length > 0 && (
        <div className="vd-section">
          <div className="vd-section-title">Uploaded Files</div>
          <div className="vd-files">
            {data.uploadedFiles.map((f, i) => (
              <div key={i} className="vd-file-item">
                <RiFileLine className="vd-file-icon" />
                <div className="vd-file-info">
                  <span className="vd-file-name">{f.originalName}</span>
                  <span className="vd-file-meta">{(f.size/1024).toFixed(1)} KB · {f.mimetype}</span>
                </div>
                <div className="vd-file-actions">
                  <button className="vd-file-btn view"
                    onClick={() => window.open(`${BACKEND}/api/file/${subId}/${i}`, '_blank')}>
                    View
                  </button>
                  <button className="vd-file-btn download" onClick={() => handleDownloadFile(i)}>
                    <RiDownloadLine /> Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}