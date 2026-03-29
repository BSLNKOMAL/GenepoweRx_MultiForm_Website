import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPatientFormHistory, downloadVisitPDF, exportPatientData } from '../services/api';
import {
  RiSearchLine, RiUserHeartLine, RiArrowRightLine, RiAddLine,
  RiCheckLine, RiHistoryLine, RiEyeLine, RiEditLine,
  RiDownloadLine, RiFileExcelLine, RiFilePdfLine, RiTimeLine
} from 'react-icons/ri';
import logo from '../assets/logo.png';
import './PatientLookup.css';

const FORM_META = {
  LIFESTYLE:       { label: 'Lifestyle Form',    color: '#0077b6', path: 'lifestyle' },
  SHORT_LIFESTYLE: { label: 'Short Lifestyle',   color: '#0096c7', path: 'short-lifestyle' },
  WES:             { label: 'WES Questionnaire', color: '#e07b00', path: 'wes' },
  ONCO:            { label: 'ONCO Questionnaire',color: '#d62839', path: 'onco' },
  CONSENT:         { label: 'Patient Consent',   color: '#5e3dbc', path: 'consent' },
};

export default function PatientLookup() {
  const [pid, setPid]         = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState('');
  const [expanded, setExpanded] = useState({});
  const navigate = useNavigate();

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!pid.trim()) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await getPatientFormHistory(pid.trim().toUpperCase());
      setResult(res.data);
    } catch (err) { setError(err.message || 'Patient not found'); }
    setLoading(false);
  };

  // Navigate to form pre-filled with last visit's data
  const editAsNewVisit = (formType, lastVisitData) => {
    const meta = FORM_META[formType];
    if (!meta) return;
    const params = new URLSearchParams({
      patientId:   result.patient.patientId,
      name:        result.patient.name || '',
      isRevisit:   'true',
      prefillData: JSON.stringify(lastVisitData || {}),
    });
    navigate(`/forms/${meta.path}?${params.toString()}`);
  };

  const viewVisit = (formType, visitNumber) => {
    navigate(`/visits/${result.patient.patientId}/${formType}/${visitNumber}`);
  };

  const toggleExpand = (ft) => setExpanded(p => ({ ...p, [ft]: !p[ft] }));

  return (
    <div className="patient-lookup page-fade">
      <div className="pl-header">
        <img src={logo} alt="GenepoweRx" className="pl-logo" />
        <div>
          <h1 className="page-title">Patient ID Lookup</h1>
          <p className="page-sub">Enter your Patient ID to retrieve all records, review previous forms and start a new visit</p>
        </div>
      </div>

      {/* Search */}
      <form className="pl-search-card" onSubmit={handleSearch}>
        <div className="pl-search-label">Enter Patient ID</div>
        <div className="pl-search-row">
          <div className="pl-input-wrap">
            <RiUserHeartLine className="pl-input-icon" />
            <input
              className="gx-input pl-input"
              placeholder="e.g. KHGENEPOWERX-JOHNSMITH"
              value={pid}
              onChange={e => setPid(e.target.value)}
              autoFocus
            />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? <><span className="btn-spinner"/> Searching...</> : <><RiSearchLine /> Find Patient</>}
          </button>
        </div>
        <p className="pl-hint">💡 Your Patient ID was shown after your first form submission (format: KHGENEPOWERX-YOURNAME)</p>
        {error && <div className="pl-error">❌ {error}</div>}
      </form>

      {result && (
        <div className="pl-result page-fade">
          {/* Patient card */}
          <div className="pl-patient-card">
            <div className="plpc-avatar">{result.patient.name?.[0]?.toUpperCase()}</div>
            <div className="plpc-info">
              <div className="plpc-name">{result.patient.name}</div>
              <div className="plpc-meta">
                <span className="plpc-id">{result.patient.patientId}</span>
                <span className="plpc-ref">Ref: {result.patient.referenceNumber}</span>
                {result.patient.age  && <span>{result.patient.age}y</span>}
                {result.patient.gender && <span>{result.patient.gender}</span>}
                {result.patient.phone  && <span>📞 {result.patient.phone}</span>}
              </div>
            </div>
            <div className="plpc-right">
              <div className="plpc-stats">
                <div className="plpc-stat">
                  <span className="plpc-stat-num">{result.totalSubmissions}</span>
                  <span className="plpc-stat-label">Submissions</span>
                </div>
                <div className="plpc-stat">
                  <span className="plpc-stat-num">{result.completedForms.length}</span>
                  <span className="plpc-stat-label">Form Types</span>
                </div>
              </div>
              <button className="btn-secondary pl-export-btn"
                onClick={() => exportPatientData(result.patient.patientId)}>
                <RiFileExcelLine /> Export Excel
              </button>
            </div>
          </div>

          {/* Forms */}
          <div className="pl-section-title">Form History & Actions</div>
          <div className="pl-forms-list">
            {Object.keys(FORM_META).map(ft => {
              const meta    = FORM_META[ft];
              const visits  = result.grouped[ft] || [];
              const done    = visits.length > 0;
              const lastVisit = done ? visits[visits.length - 1] : null;
              const isOpen  = expanded[ft];

              return (
                <div key={ft} className="pl-form-row" style={{'--fc': meta.color}}>
                  {/* Form header */}
                  <div className="plf-header" onClick={() => done && toggleExpand(ft)}>
                    <div className="plf-left">
                      <div className="plf-badge">{meta.label}</div>
                      {done
                        ? <span className="plf-done"><RiCheckLine /> {visits.length} visit{visits.length>1?'s':''} — Last: {new Date(lastVisit.submittedAt).toLocaleDateString('en-IN')}</span>
                        : <span className="plf-pending">Not yet submitted</span>
                      }
                    </div>
                    <div className="plf-right">
                      {/* New Visit / Start Button */}
                      <button className="plf-new-btn" onClick={e => { e.stopPropagation(); editAsNewVisit(ft, lastVisit?.formData); }}>
                        {done ? <><RiEditLine /> Start Visit {visits.length + 1}</> : <><RiAddLine /> Start Visit 1</>}
                        <RiArrowRightLine />
                      </button>
                    </div>
                  </div>

                  {/* Visit history (expandable) */}
                  {done && isOpen && (
                    <div className="plf-visits">
                      {[...visits].reverse().map(v => (
                        <div key={v._id} className="plf-visit-row">
                          <span className="plf-visit-num">{v.visitLabel}</span>
                          <span className="plf-visit-date">
                            <RiTimeLine /> {new Date(v.submittedAt).toLocaleString('en-IN')}
                          </span>
                          {v.isRevisit && <span className="plf-revisit-tag">Revisit</span>}
                          <div className="plf-visit-actions">
                            <button className="plf-view-btn" onClick={() => viewVisit(ft, v.visitNumber)}>
                              <RiEyeLine /> View
                            </button>
                            {v.generatedPdfPath && (
                              <button className="plf-pdf-btn" onClick={() => downloadVisitPDF(v._id)}>
                                <RiFilePdfLine /> Download PDF
                              </button>
                            )}
                            <button className="plf-edit-btn" onClick={() => editAsNewVisit(ft, v.formData)}>
                              <RiEditLine /> Use as Template
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {done && !isOpen && (
                    <div className="plf-expand-hint" onClick={() => toggleExpand(ft)}>
                      ▼ Show {visits.length} visit record{visits.length>1?'s':''}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
