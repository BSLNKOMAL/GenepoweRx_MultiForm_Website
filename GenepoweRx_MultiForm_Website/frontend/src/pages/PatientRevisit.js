import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchPatients, getPatient, getPatientFormHistory, getVisitPDFUrl } from '../services/api';
import {
  RiSearchLine, RiUserHeartLine, RiFileListLine, RiAddCircleLine,
  RiEyeLine, RiDownloadLine, RiArrowRightLine, RiHistoryLine,
  RiCheckboxCircleLine, RiTimeLine
} from 'react-icons/ri';
import logo from '../assets/logo.png';
import './PatientRevisit.css';

const FORM_LABELS = {
  LIFESTYLE:       'Lifestyle Form',
  SHORT_LIFESTYLE: 'Short Lifestyle Form',
  WES:             'WES Questionnaire',
  ONCO:            'ONCO Questionnaire',
  CONSENT:         'Patient Consent Form',
};

const FORM_PATHS = {
  LIFESTYLE:       '/forms/lifestyle',
  SHORT_LIFESTYLE: '/forms/short-lifestyle',
  WES:             '/forms/wes',
  ONCO:            '/forms/onco',
  CONSENT:         '/forms/consent',
};

const FORM_COLORS = {
  LIFESTYLE:       '#0077b6',
  SHORT_LIFESTYLE: '#0096c7',
  WES:             '#e07b00',
  ONCO:            '#d62839',
  CONSENT:         '#5B3FA6',
};

const ALL_FORMS = ['LIFESTYLE', 'SHORT_LIFESTYLE', 'WES', 'ONCO', 'CONSENT'];

export default function PatientRevisit() {
  const navigate = useNavigate();
  const [searchQ, setSearchQ]         = useState('');
  const [searchResults, setResults]   = useState([]);
  const [searching, setSearching]     = useState(false);
  const [patient, setPatient]         = useState(null);
  const [history, setHistory]         = useState(null);
  const [loading, setLoading]         = useState(false);
  const [expandedForm, setExpanded]   = useState(null);
  const [viewMode, setViewMode]       = useState({}); // submissionId -> formData

  const handleSearch = async (e) => {
    const v = e.target.value;
    setSearchQ(v);
    if (v.length < 2) { setResults([]); return; }
    setSearching(true);
    try {
      const res = await searchPatients(v);
      setResults(res.data || []);
    } catch {}
    setSearching(false);
  };

  const loadPatient = async (pid) => {
    setLoading(true);
    setResults([]);
    setSearchQ('');
    try {
      const [pRes, hRes] = await Promise.all([
        getPatient(pid),
        getPatientFormHistory(pid)
      ]);
      setPatient(pRes.data.patient);
      setHistory(hRes.data);
    } catch (e) {
      alert('Patient not found: ' + e.message);
    }
    setLoading(false);
  };

  const handleDirectSearch = async () => {
    if (!searchQ.trim()) return;
    setLoading(true);
    try {
      const res = await searchPatients(searchQ.trim());
      if (res.data?.length === 1) {
        await loadPatient(res.data[0].patientId);
      } else if (res.data?.length > 1) {
        setResults(res.data);
      } else {
        alert('No patient found for: ' + searchQ);
      }
    } catch {}
    setLoading(false);
  };

  const goToForm = (formType, prefill = {}) => {
    const params = new URLSearchParams({
      patientId:  patient.patientId,
      name:       patient.name || '',
      isRevisit:  'true',
      ...prefill
    });
    navigate(`${FORM_PATHS[formType]}?${params.toString()}`);
  };

  const toggleExpand = (ft) => setExpanded(prev => prev === ft ? null : ft);

  const getSummaryMap = () => {
    const map = {};
    (history?.summary || []).forEach(s => { map[s.formType] = s; });
    return map;
  };

  return (
    <div className="patient-revisit page-fade">
      {/* Header */}
      <div className="pr-header">
        <img src={logo} alt="GenepoweRx" className="pr-logo" />
        <div>
          <h1 className="page-title">Patient Revisit Portal</h1>
          <p className="page-sub">Search existing patient by ID, name or phone — view history & start new visit</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="pr-search-card">
        <div className="pr-search-inner">
          <RiSearchLine className="pr-search-icon" />
          <input
            className="pr-search-input"
            placeholder="Enter Patient ID (e.g. KHGENEPOWERX-RAVI), name, or phone..."
            value={searchQ}
            onChange={handleSearch}
            onKeyDown={e => e.key === 'Enter' && handleDirectSearch()}
          />
          <button className="btn-primary pr-search-btn" onClick={handleDirectSearch} disabled={loading}>
            {loading ? 'Searching...' : <><RiSearchLine /> Search</>}
          </button>
        </div>

        {/* Dropdown results */}
        {searchResults.length > 0 && (
          <div className="pr-dropdown">
            {searchResults.map(p => (
              <button key={p._id} className="pr-dropdown-item" onClick={() => loadPatient(p.patientId)}>
                <div className="pdi-avatar">{p.name?.[0]}</div>
                <div className="pdi-info">
                  <span className="pdi-name">{p.name}</span>
                  <span className="pdi-meta">{p.patientId} · {p.gender||'—'} · {p.age ? p.age+'y' : '—'} · {p.phone||'—'}</span>
                </div>
                <RiArrowRightLine />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Patient loaded */}
      {patient && (
        <div className="pr-content">
          {/* Patient Card */}
          <div className="pr-patient-card">
            <div className="ppc-avatar">{patient.name?.[0]}</div>
            <div className="ppc-info">
              <h2 className="ppc-name">{patient.name}</h2>
              <div className="ppc-tags">
                <span className="ppc-tag primary">{patient.patientId}</span>
                <span className="ppc-tag">{patient.referenceNumber}</span>
                {patient.gender && <span className="ppc-tag">{patient.gender}</span>}
                {patient.age    && <span className="ppc-tag">{patient.age}y</span>}
                {patient.phone  && <span className="ppc-tag">{patient.phone}</span>}
              </div>
            </div>
            <div className="ppc-stats">
              <div className="ppc-stat">
                <span className="ppc-stat-val">{history?.summary?.length || 0}</span>
                <span className="ppc-stat-lbl">Form Types</span>
              </div>
              <div className="ppc-stat">
                <span className="ppc-stat-val">
                  {history?.summary?.reduce((acc, s) => acc + s.totalVisits, 0) || 0}
                </span>
                <span className="ppc-stat-lbl">Total Visits</span>
              </div>
            </div>
          </div>

          {/* Forms Grid */}
          <h3 className="pr-section-title"><RiFileListLine /> Form Status & Visit History</h3>
          <div className="pr-forms-grid">
            {ALL_FORMS.map(ft => {
              const summaryMap = getSummaryMap();
              const info = summaryMap[ft];
              const done = !!info;
              const color = FORM_COLORS[ft];

              return (
                <div key={ft} className={`pr-form-card ${done ? 'done' : 'pending'}`} style={{'--fc': color}}>
                  <div className="pfc-top">
                    <div className="pfc-status-icon">
                      {done ? <RiCheckboxCircleLine style={{color:'#27ae60'}} /> : <RiTimeLine style={{color:'#aaa'}} />}
                    </div>
                    <div className="pfc-form-info">
                      <span className="pfc-form-name">{FORM_LABELS[ft]}</span>
                      {done
                        ? <span className="pfc-visits-count">{info.totalVisits} visit{info.totalVisits > 1 ? 's' : ''} completed</span>
                        : <span className="pfc-not-done">Not submitted yet</span>
                      }
                    </div>
                    {done && (
                      <button className="pfc-expand-btn" onClick={() => toggleExpand(ft)}>
                        <RiHistoryLine /> {expandedForm === ft ? 'Hide' : 'History'}
                      </button>
                    )}
                  </div>

                  {/* Visit history expanded */}
                  {done && expandedForm === ft && (
                    <div className="pfc-history">
                      {info.visits.map((v, idx) => (
                        <div key={v._id} className="pfc-visit-row">
                          <div className="pvr-label">
                            <span className="pvr-badge" style={{background: color + '20', color}}>{v.visitLabel}</span>
                            <span className="pvr-date">{new Date(v.submittedAt).toLocaleString('en-IN')}</span>
                            {v.uploadedFiles?.length > 0 && (
                              <span className="pvr-files">{v.uploadedFiles.length} file(s) attached</span>
                            )}
                          </div>
                          <div className="pvr-actions">
                            {v.generatedPdfPath && (
                              <a href={getVisitPDFUrl(v._id)} download className="pvr-btn download">
                                <RiDownloadLine /> PDF
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="pfc-actions">
                    {done ? (
                      <button className="pfc-revisit-btn" style={{'--fc': color}} onClick={() => goToForm(ft)}>
                        <RiAddCircleLine /> New Visit ({`Visit ${(info.totalVisits || 0) + 1}`})
                      </button>
                    ) : (
                      <button className="pfc-start-btn" style={{'--fc': color}} onClick={() => goToForm(ft)}>
                        <RiArrowRightLine /> Start Visit 1
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!patient && !loading && (
        <div className="pr-empty">
          <RiUserHeartLine />
          <p>Search for a patient above to view their form history and manage visits</p>
          <p className="pr-empty-hint">You can search by Patient ID (KHGENEPOWERX-...), name, or phone number</p>
        </div>
      )}
    </div>
  );
}
