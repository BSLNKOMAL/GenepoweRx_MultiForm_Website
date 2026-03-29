import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPatient, getPatientFormHistory, getVisitPDFUrl, exportPatientData } from '../services/api';
import {
  RiArrowLeftLine, RiUserHeartLine, RiDraftLine,
  RiDownloadLine, RiAddCircleLine, RiHistoryLine,
  RiCheckboxCircleLine, RiFileExcelLine
} from 'react-icons/ri';
import './PatientDetail.css';

const FORM_LABELS = {
  LIFESTYLE:'Lifestyle Form', SHORT_LIFESTYLE:'Short Lifestyle',
  WES:'WES Questionnaire', ONCO:'ONCO Questionnaire', CONSENT:'Consent Form'
};
const FORM_PATHS = {
  LIFESTYLE:'/forms/lifestyle', SHORT_LIFESTYLE:'/forms/short-lifestyle',
  WES:'/forms/wes', ONCO:'/forms/onco', CONSENT:'/forms/consent'
};
const FORM_COLORS = {
  LIFESTYLE:'#0077b6', SHORT_LIFESTYLE:'#0096c7',
  WES:'#e07b00', ONCO:'#d62839', CONSENT:'#5B3FA6'
};

export default function PatientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data,    setData]    = useState(null);
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');
  const [expanded, setExpanded]   = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res  = await getPatient(id);
        setData(res.data);
        const hRes = await getPatientFormHistory(res.data.patient.patientId);
        setHistory(hRes.data);
      } catch { navigate('/patients'); }
      setLoading(false);
    })();
  }, [id, navigate]);

  if (loading) return <div className="pd-loading">Loading patient data...</div>;
  if (!data)   return null;

  const { patient, drafts } = data;

  // grouped = { LIFESTYLE: [...visits], WES: [...visits], ... }
  const grouped      = history?.grouped      || {};
  const completedForms = history?.completedForms || [];
  const totalSubs    = history?.totalSubmissions || 0;

  // Build summary array from grouped for display
  const summary = Object.entries(grouped).map(([formType, visits]) => ({
    formType,
    totalVisits: visits.length,
    lastVisit:   visits[visits.length - 1]?.submittedAt,
    visits
  }));

  const goNewVisit = (ft) => {
    const params = new URLSearchParams({
      patientId: patient.patientId,
      name: patient.name || '',
      isRevisit: 'true'
    });
    navigate(`${FORM_PATHS[ft]}?${params.toString()}`);
  };

  return (
    <div className="patient-detail page-fade">
      <button className="back-btn" onClick={() => navigate('/patients')}>
        <RiArrowLeftLine /> Back to Patients
      </button>

      {/* Header */}
      <div className="pd-header">
        <div className="pd-avatar">{patient.name?.[0]}</div>
        <div className="pd-info">
          <h1 className="pd-name">{patient.name}</h1>
          <div className="pd-tags">
            <span className="pd-tag">{patient.patientId}</span>
            <span className="pd-tag dim">{patient.referenceNumber}</span>
            {patient.gender && <span className="pd-tag">{patient.gender}</span>}
            {patient.age    && <span className="pd-tag">{patient.age}y</span>}
          </div>
        </div>
        <div className="pd-counts">
          <div className="pd-count"><span>{completedForms.length}</span>Form Types</div>
          <div className="pd-count"><span>{totalSubs}</span>Total Submissions</div>
          <div className="pd-count"><span>{drafts?.length || 0}</span>Drafts</div>
        </div>
        <button className="btn-secondary pd-export-btn"
          onClick={() => exportPatientData(patient.patientId)}>
          <RiFileExcelLine /> Export Excel
        </button>
      </div>

      {/* Tabs */}
      <div className="pd-tabs">
        {['info','visits','drafts'].map(t => (
          <button key={t} className={`pd-tab ${activeTab===t?'active':''}`} onClick={() => setActiveTab(t)}>
            {t==='info'   && <RiUserHeartLine />}
            {t==='visits' && <RiHistoryLine />}
            {t==='drafts' && <RiDraftLine />}
            {t.charAt(0).toUpperCase() + t.slice(1)}
            {t==='visits' && totalSubs > 0 && <span className="pd-tab-badge">{totalSubs}</span>}
          </button>
        ))}
      </div>

      {/* INFO TAB */}
      {activeTab === 'info' && (
        <div className="pd-section">
          <div className="pd-fields-grid">
            {[
              ['Full Name', patient.name], ['Patient ID', patient.patientId],
              ['Reference', patient.referenceNumber], ['Age', patient.age],
              ['Gender', patient.gender], ['Phone', patient.phone],
              ['Email', patient.email], ['Address', patient.address],
              ['Referral Doctor', patient.referralDoctor], ['Coordinator', patient.coordinator],
              ['Registered', patient.createdAt ? new Date(patient.createdAt).toLocaleString('en-IN') : ''],
            ].map(([k, v]) => v ? (
              <div key={k} className="pd-field">
                <span className="pd-field-key">{k}</span>
                <span className="pd-field-val">{String(v)}</span>
              </div>
            ) : null)}
          </div>
        </div>
      )}

      {/* VISITS TAB */}
      {activeTab === 'visits' && (
        <div className="pd-section">
          {summary.length === 0 ? (
            <div className="pd-empty">No form submissions yet</div>
          ) : (
            summary.map(s => (
              <div key={s.formType} className="pd-form-block"
                style={{'--fc': FORM_COLORS[s.formType] || '#0077b6'}}>
                <div className="pfb-header"
                  onClick={() => setExpanded(e => e === s.formType ? null : s.formType)}>
                  <div className="pfb-left">
                    <RiCheckboxCircleLine style={{color:'#27ae60',fontSize:18}} />
                    <span className="pfb-type">{FORM_LABELS[s.formType] || s.formType}</span>
                    <span className="pfb-count">{s.totalVisits} visit{s.totalVisits>1?'s':''}</span>
                  </div>
                  <div className="pfb-right">
                    <span className="pfb-last">Last: {new Date(s.lastVisit).toLocaleDateString('en-IN')}</span>
                    <button className="pfb-newvisit"
                      onClick={e => { e.stopPropagation(); goNewVisit(s.formType); }}>
                      <RiAddCircleLine /> New Visit
                    </button>
                  </div>
                </div>

                {expanded === s.formType && (
                  <div className="pfb-visits">
                    {s.visits.map(v => (
                      <div key={v._id} className="pfb-visit-row">
                        <span className="pvr-badge2"
                          style={{background:(FORM_COLORS[s.formType]||'#0077b6')+'18',
                                  color: FORM_COLORS[s.formType]||'#0077b6'}}>
                          {v.visitLabel}
                        </span>
                        <span className="pvr-date2">
                          {new Date(v.submittedAt).toLocaleString('en-IN')}
                        </span>
                        {v.isRevisit && <span className="pvr-revisit">Revisit</span>}
                        {v.uploadedFiles?.length > 0 &&
                          <span className="pvr-files2">📎 {v.uploadedFiles.length} file(s)</span>}
                        <div style={{flex:1}} />
                        {v.generatedPdfPath && (
                          <a href={getVisitPDFUrl(v._id)} download
                            className="pvr-dl-btn">
                            <RiDownloadLine /> PDF
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}

          {/* Start new form buttons */}
          <div className="pd-new-forms">
            <h4>START A NEW FORM FOR THIS PATIENT</h4>
            <div className="pd-new-forms-grid">
              {['LIFESTYLE','SHORT_LIFESTYLE','WES','ONCO','CONSENT'].map(ft => (
                <button key={ft} className="pd-new-form-btn"
                  style={{'--fc': FORM_COLORS[ft]}} onClick={() => goNewVisit(ft)}>
                  <RiAddCircleLine /> {FORM_LABELS[ft]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* DRAFTS TAB */}
      {activeTab === 'drafts' && (
        <div className="pd-section">
          {!drafts?.length ? (
            <div className="pd-empty">No active drafts</div>
          ) : (
            drafts.map((d, i) => (
              <div key={i} className="pd-form-card">
                <div className="pfc-left">
                  <span className="pfc-type">{d.formType}</span>
                  <span className="pfc-draft-id">{d.draftId}</span>
                </div>
                <div className="pfc-right">
                  <span className="pfc-date">
                    Modified: {new Date(d.lastModified).toLocaleString('en-IN')}
                  </span>
                  <button className="btn-secondary small"
                    onClick={() => navigate(
                      `/forms/${d.formType.toLowerCase().replace('_','-')}/${d.draftId}`
                    )}>
                    Continue Editing
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
