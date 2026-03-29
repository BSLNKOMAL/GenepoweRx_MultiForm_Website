import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  RiTestTubeLine, RiAddLine, RiCheckLine, RiDeleteBin6Line,
  RiEditLine, RiSearchLine, RiRefreshLine, RiFileListLine,
  RiDropLine, RiCloseLine, RiSaveLine, RiDownloadLine,
  RiBarChartLine, RiUserLine, RiArrowRightLine, RiStethoscopeLine
} from 'react-icons/ri';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer
} from 'recharts';
import './PatientSamples.css';

// ── localStorage helpers ──────────────────────────────────────────
const LS_KEY = 'gpx_patient_samples';
const loadSamples  = ()    => { try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch { return []; } };
const saveSamples  = (arr) => localStorage.setItem(LS_KEY, JSON.stringify(arr));

// ── KHID generator ────────────────────────────────────────────────
function generateKHID(name, existing) {
  const clean = (name || 'PATIENT').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
  const base  = `KHGENEPOWERX-${clean}`;
  const count = existing.filter(s => s.khid.startsWith(base)).length;
  return count === 0 ? base : `${base}-${count + 1}`;
}

const TEST_TYPES = ['Lifestyle', 'Short Lifestyle', 'Onco', 'CSP'];
const FORM_PATHS = {
  'Lifestyle':       '/forms/lifestyle',
  'Short Lifestyle': '/forms/short-lifestyle',
  'Onco':            '/forms/onco',
  'CSP':             '/forms/lifestyle',
};

const EMPTY = { name:'', age:'', gender:'', testType:'', notes:'', addedBy:'' };

function StatusBadge({ done, label }) {
  return (
    <span className={`smp-badge ${done ? 'done' : 'pending'}`}>
      {done ? '✓' : '✗'} {label}: {done ? 'T' : 'F'}
    </span>
  );
}

function CombinedStatus({ trf, blood }) {
  if (trf && blood)  return <span className="smp-combined tt">✓ Fully Complete (TT)</span>;
  if (trf && !blood) return <span className="smp-combined tf">TRF Done · Blood Pending (TF)</span>;
  if (!trf && blood) return <span className="smp-combined ft">Blood Done · TRF Pending (FT)</span>;
  return <span className="smp-combined ff">Both Pending (FF)</span>;
}

export default function PatientSamples() {
  const navigate = useNavigate();
  const [tab,      setTab]     = useState('doctors');
  const [samples,  setSamples] = useState(loadSamples);
  const [search,   setSearch]  = useState('');
  const [showAdd,  setShowAdd] = useState(false);
  const [editItem, setEditItem]= useState(null);
  const [form,     setForm]    = useState(EMPTY);
  const [saving,   setSaving]  = useState(false);

  // Persist to localStorage on every change
  useEffect(() => { saveSamples(samples); }, [samples]);

  // Filtered list
  const filtered = samples.filter(s => {
    if (!search) return true;
    const q = search.toLowerCase();
    return s.khid.toLowerCase().includes(q) || s.name.toLowerCase().includes(q);
  });

  // Stats
  const total      = samples.length;
  const trfDone    = samples.filter(s => s.trfStatus).length;
  const bloodDone  = samples.filter(s => s.bloodStatus).length;
  const bothDone   = samples.filter(s => s.trfStatus && s.bloodStatus).length;
  const trfPending = total - trfDone;
  const bloodPending = total - bloodDone;
  const ff = samples.filter(s => !s.trfStatus && !s.bloodStatus).length;
  const tf = samples.filter(s =>  s.trfStatus && !s.bloodStatus).length;
  const ft = samples.filter(s => !s.trfStatus &&  s.bloodStatus).length;
  const tt = samples.filter(s =>  s.trfStatus &&  s.bloodStatus).length;

  // Doctor tab lists
  const doctorPending   = filtered.filter(s => !s.trfStatus);
  const doctorCompleted = filtered.filter(s =>  s.trfStatus);

  // ── Optimistic update ─────────────────────────────────────────
  const updateSample = (id, fields) => {
    setSamples(prev => prev.map(s => s.id === id ? { ...s, ...fields } : s));
  };

  // ── Save (add / edit) ─────────────────────────────────────────
  const handleSave = () => {
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    setTimeout(() => {
      if (editItem) {
        setSamples(prev => prev.map(s =>
          s.id === editItem.id ? { ...s, ...form } : s
        ));
        toast.success('Updated!');
      } else {
        const all  = loadSamples();
        const khid = generateKHID(form.name, all);
        const newS = {
          id:          Date.now().toString(),
          khid,
          name:        form.name,
          age:         form.age,
          gender:      form.gender,
          testType:    form.testType,
          notes:       form.notes,
          addedBy:     form.addedBy,
          trfStatus:   false,
          bloodStatus: false,
          createdAt:   new Date().toISOString(),
        };
        setSamples(prev => [newS, ...prev]);
        toast.success(`Registered! KHID: ${khid}`);
      }
      setShowAdd(false);
      setSaving(false);
    }, 300);
  };

  const handleDelete = (s) => {
    if (!window.confirm(`Delete ${s.name}?`)) return;
    setSamples(prev => prev.filter(x => x.id !== s.id));
    toast.success('Deleted');
  };

  // ── Navigate to form with patient details ─────────────────────
  const goToForm = (sample, testType) => {
    const formPath = FORM_PATHS[testType] || '/forms/lifestyle';
    const params   = new URLSearchParams({
      patientId:  sample.khid,
      name:       sample.name,
      age:        sample.age || '',
      gender:     sample.gender || '',
      isRevisit:  'false',
      sampleId:   sample.id,
      markTRF:    'true',
    });
    // Store in sessionStorage so form can mark TRF on submit
    sessionStorage.setItem('pendingSampleId', sample.id);
    navigate(`${formPath}?${params.toString()}`);
  };

  // ── Export CSV ────────────────────────────────────────────────
  const exportCSV = () => {
    const header = 'KHID,Name,Age,Gender,Test_Type,TRF_Status,Blood_Status,Created_At\n';
    const rows   = samples.map(r =>
      [r.khid, `"${r.name}"`, r.age||'', r.gender||'', r.testType||'',
       r.trfStatus ? 'T':'F', r.bloodStatus ? 'T':'F',
       new Date(r.createdAt).toLocaleDateString('en-IN')
      ].join(',')
    ).join('\n');
    const blob = new Blob([header + rows], { type:'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `patient_samples_${Date.now()}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast.success('CSV downloaded!');
  };

  const openAdd  = ()  => { setEditItem(null); setForm(EMPTY); setShowAdd(true); };
  const openEdit = (s) => {
    setEditItem(s);
    setForm({ name: s.name, age: s.age||'', gender: s.gender||'',
              testType: s.testType||'', notes: s.notes||'', addedBy: s.addedBy||'' });
    setShowAdd(true);
  };
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="patient-samples page-fade">

      {/* ── HEADER ───────────────────────────────────────────── */}
      <div className="smp-header">
        <div className="smp-header-left">
          <div className="smp-header-icon"><RiTestTubeLine /></div>
          <div>
            <h1 className="page-title">Patient Samples</h1>
            <p className="page-sub">Manage TRF forms and blood sample collection — stored locally</p>
          </div>
        </div>
        <div className="smp-header-actions">
          <button className="btn-secondary smp-export-btn" onClick={exportCSV}>
            <RiDownloadLine /> Export CSV
          </button>
          <button className="btn-primary" onClick={openAdd}>
            <RiAddLine /> Register Patient
          </button>
        </div>
      </div>

      {/* ── STATS ────────────────────────────────────────────── */}
      <div className="smp-stats">
        <div className="smp-stat total">
          <div className="smp-stat-num">{total}</div>
          <div className="smp-stat-label">Total Patients</div>
        </div>
        <div className="smp-stat trf-pend">
          <div className="smp-stat-icon"><RiFileListLine /></div>
          <div className="smp-stat-num">{trfPending}</div>
          <div className="smp-stat-label">TRF Pending</div>
        </div>
        <div className="smp-stat blood-pend">
          <div className="smp-stat-icon"><RiDropLine /></div>
          <div className="smp-stat-num">{bloodPending}</div>
          <div className="smp-stat-label">Blood Pending</div>
        </div>
        <div className="smp-stat complete">
          <div className="smp-stat-num">{bothDone}</div>
          <div className="smp-stat-label">Fully Completed</div>
        </div>
      </div>

      {/* ── CHARTS ───────────────────────────────────────────── */}
      {total > 0 && (
        <div className="smp-charts">
          <div className="smp-chart-card">
            <div className="smp-chart-title"><RiBarChartLine /> Status Breakdown</div>
            <ResponsiveContainer width="100%" height={170}>
              <BarChart data={[
                { name:'FF', value: ff, fill:'#d62839' },
                { name:'TF', value: tf, fill:'#e07b00' },
                { name:'FT', value: ft, fill:'#0077b6' },
                { name:'TT', value: tt, fill:'#27ae60' },
              ]} margin={{top:5,right:10,bottom:5,left:0}}>
                <XAxis dataKey="name" tick={{fontSize:11}} />
                <YAxis allowDecimals={false} tick={{fontSize:10}} />
                <Tooltip formatter={(v,n) => [v, {FF:'Both Pending',TF:'TRF Done',FT:'Blood Done',TT:'Both Done'}[n] || n]} />
                <Bar dataKey="value" radius={[4,4,0,0]}>
                  {[{fill:'#d62839'},{fill:'#e07b00'},{fill:'#0077b6'},{fill:'#27ae60'}].map((e,i) => (
                    <Cell key={i} fill={e.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="smp-chart-card">
            <div className="smp-chart-title">TRF Completion Rate</div>
            <ResponsiveContainer width="100%" height={170}>
              <PieChart>
                <Pie data={[
                  { name:'Done',    value: trfDone    },
                  { name:'Pending', value: trfPending },
                ]} cx="50%" cy="50%" outerRadius={60} dataKey="value"
                  label={({percent}) => percent > 0 ? `${(percent*100).toFixed(0)}%` : ''}
                  labelLine={false}>
                  <Cell fill="#27ae60"/><Cell fill="#E2E8F0"/>
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="smp-chart-legend">
              <span><span className="scl-dot" style={{background:'#27ae60'}}/> Done: {trfDone}</span>
              <span><span className="scl-dot" style={{background:'#E2E8F0',border:'1px solid #ccc'}}/> Pending: {trfPending}</span>
            </div>
          </div>
          <div className="smp-chart-card">
            <div className="smp-chart-title">Blood Completion Rate</div>
            <ResponsiveContainer width="100%" height={170}>
              <PieChart>
                <Pie data={[
                  { name:'Done',    value: bloodDone    },
                  { name:'Pending', value: bloodPending },
                ]} cx="50%" cy="50%" outerRadius={60} dataKey="value"
                  label={({percent}) => percent > 0 ? `${(percent*100).toFixed(0)}%` : ''}
                  labelLine={false}>
                  <Cell fill="#0077b6"/><Cell fill="#E2E8F0"/>
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="smp-chart-legend">
              <span><span className="scl-dot" style={{background:'#0077b6'}}/> Done: {bloodDone}</span>
              <span><span className="scl-dot" style={{background:'#E2E8F0',border:'1px solid #ccc'}}/> Pending: {bloodPending}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── SEARCH ───────────────────────────────────────────── */}
      <div className="smp-toolbar">
        <div className="smp-search-wrap">
          <RiSearchLine className="smp-search-icon" />
          <input className="gx-input smp-search"
            placeholder="Search by name or KHID..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button className="smp-refresh-btn" onClick={() => setSamples(loadSamples())}>
          <RiRefreshLine />
        </button>
      </div>

      {/* ── TABS ─────────────────────────────────────────────── */}
      <div className="smp-tabs">
        <button className={`smp-tab ${tab==='doctors'?'active':''}`} onClick={() => setTab('doctors')}>
          <RiStethoscopeLine /> Doctors Tab (TRF)
          <span className="smp-tab-count">{doctorPending.length} pending</span>
        </button>
        <button className={`smp-tab ${tab==='desk'?'active':''}`} onClick={() => setTab('desk')}>
          <RiDropLine /> Front Desk (Blood Sample)
          <span className="smp-tab-count">{bloodPending}</span>
        </button>
        <button className={`smp-tab ${tab==='all'?'active':''}`} onClick={() => setTab('all')}>
          <RiBarChartLine /> All Patients
          <span className="smp-tab-count">{total}</span>
        </button>
      </div>

      {/* ── TAB BODY ─────────────────────────────────────────── */}
      <div className="smp-tab-body">

        {/* ══ DOCTORS TAB ══════════════════════════════════════ */}
        {tab === 'doctors' && (
          <div>
            <div className="smp-doctor-summary">
              <div className="sds-info">
                <RiStethoscopeLine className="sds-icon" />
                <div>
                  <div className="sds-title">Doctors Tab — TRF Management</div>
                  <div className="sds-sub">Select Test Type to open the pre-filled form. Submitting the form marks TRF as Complete (T).</div>
                </div>
              </div>
              <div className="sds-stats">
                <div className="sds-stat"><span className="sds-n total">{total}</span><span className="sds-l">Total</span></div>
                <div className="sds-stat"><span className="sds-n done">{trfDone}</span><span className="sds-l">TRF Done</span></div>
                <div className="sds-stat"><span className="sds-n pend">{trfPending}</span><span className="sds-l">TRF Pending</span></div>
              </div>
            </div>

            {/* Pending TRF */}
            {doctorPending.length > 0 ? (
              <table className="smp-table">
                <thead><tr>
                  <th>#</th><th>KHID</th><th>Name</th><th>Age</th><th>Gender</th>
                  <th>Select Test Type → Opens Form</th><th>TRF Status</th><th>Actions</th>
                </tr></thead>
                <tbody>
                  {doctorPending.map((s, i) => (
                    <tr key={s.id}>
                      <td className="smp-td-n">{i+1}</td>
                      <td><span className="smp-khid">{s.khid}</span></td>
                      <td className="smp-bold">{s.name}</td>
                      <td>{s.age||'—'}</td>
                      <td>{s.gender||'—'}</td>
                      <td>
                        <div style={{display:'flex',alignItems:'center',gap:8}}>
                          <select className="smp-select"
                            value=""
                            onChange={e => {
                              const tt = e.target.value;
                              if (!tt) return;
                              updateSample(s.id, { testType: tt });
                              goToForm({ ...s, testType: tt }, tt);
                            }}>
                            <option value="">— Select to open form —</option>
                            {TEST_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                          {s.testType && <span className="smp-current-type">{s.testType}</span>}
                        </div>
                      </td>
                      <td><StatusBadge done={s.trfStatus} label="TRF" /></td>
                      <td>
                        <div className="smp-actions">
                          {s.testType && (
                            <button className="smp-act-btn go" onClick={() => goToForm(s, s.testType)}>
                              <RiArrowRightLine /> Open Form
                            </button>
                          )}
                          <button className="smp-act-btn mark" title="Mark TRF Done manually"
                            onClick={() => { updateSample(s.id, { trfStatus: true }); toast.success(`TRF marked ✓ for ${s.name}`); }}>
                            <RiCheckLine />
                          </button>
                          <button className="smp-act-btn edit" onClick={() => openEdit(s)}><RiEditLine /></button>
                          <button className="smp-act-btn del"  onClick={() => handleDelete(s)}><RiDeleteBin6Line /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="smp-empty">
                <RiCheckLine style={{color:'#27ae60',opacity:1}} />
                <p style={{color:'#27ae60',fontWeight:700}}>All TRF forms completed!</p>
              </div>
            )}

            {/* Completed TRF */}
            {doctorCompleted.length > 0 && (
              <div className="smp-completed-section">
                <div className="smp-completed-title">
                  <RiCheckLine /> TRF Completed — {doctorCompleted.length} patient{doctorCompleted.length!==1?'s':''}
                </div>
                <table className="smp-table smp-table-done">
                  <thead><tr>
                    <th>#</th><th>KHID</th><th>Name</th><th>Age</th><th>Gender</th>
                    <th>Test Type</th><th>TRF Status</th><th>Actions</th>
                  </tr></thead>
                  <tbody>
                    {doctorCompleted.map((s, i) => (
                      <tr key={s.id} className="row-done">
                        <td className="smp-td-n">{i+1}</td>
                        <td><span className="smp-khid">{s.khid}</span></td>
                        <td className="smp-bold">{s.name}</td>
                        <td>{s.age||'—'}</td>
                        <td>{s.gender||'—'}</td>
                        <td>{s.testType||'—'}</td>
                        <td><StatusBadge done={true} label="TRF" /></td>
                        <td>
                          <div className="smp-actions">
                            <button className="smp-act-btn edit" onClick={() => openEdit(s)}><RiEditLine /></button>
                            <button className="smp-act-btn del"  onClick={() => handleDelete(s)}><RiDeleteBin6Line /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {total === 0 && (
              <div className="smp-empty">
                <RiUserLine />
                <p>No patients registered yet</p>
                <button className="btn-primary" onClick={openAdd}><RiAddLine /> Register First Patient</button>
              </div>
            )}
          </div>
        )}

        {/* ══ FRONT DESK TAB ═══════════════════════════════════ */}
        {tab === 'desk' && (
          <div>
            <div className="smp-tab-info blue">
              <RiDropLine />
              <strong>Front Desk Blood Sample Tab</strong> — Tick the checkbox when blood sample is collected. Updates Blood_Status to T.
            </div>
            {filtered.length === 0 ? (
              <div className="smp-empty">
                <p>No patients registered yet</p>
                <button className="btn-primary" onClick={openAdd}><RiAddLine /> Register Patient</button>
              </div>
            ) : (
              <table className="smp-table">
                <thead><tr>
                  <th>#</th><th>KHID</th><th>Name</th><th>Age</th><th>Gender</th>
                  <th style={{textAlign:'center'}}>Blood Sample Collected</th>
                  <th>Blood Status</th><th>TRF Status</th><th>Actions</th>
                </tr></thead>
                <tbody>
                  {filtered.map((s, i) => (
                    <tr key={s.id} className={s.bloodStatus ? 'row-done' : ''}>
                      <td className="smp-td-n">{i+1}</td>
                      <td><span className="smp-khid">{s.khid}</span></td>
                      <td className="smp-bold">{s.name}</td>
                      <td>{s.age||'—'}</td>
                      <td>{s.gender||'—'}</td>
                      <td style={{textAlign:'center'}}>
                        <label className="smp-checkbox-label">
                          <input type="checkbox"
                            checked={!!s.bloodStatus}
                            onChange={e => {
                              const checked = e.target.checked;
                              updateSample(s.id, { bloodStatus: checked });
                              toast.success(checked
                                ? `✓ Blood collected for ${s.name}`
                                : `Blood status reset for ${s.name}`);
                            }} />
                          <span className="smp-checkbox-text">
                            {s.bloodStatus ? '✓ Collected' : 'Mark Collected'}
                          </span>
                        </label>
                      </td>
                      <td><StatusBadge done={s.bloodStatus} label="Blood" /></td>
                      <td><StatusBadge done={s.trfStatus}   label="TRF"   /></td>
                      <td>
                        <div className="smp-actions">
                          <button className="smp-act-btn edit" onClick={() => openEdit(s)}><RiEditLine /></button>
                          <button className="smp-act-btn del"  onClick={() => handleDelete(s)}><RiDeleteBin6Line /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ══ ALL PATIENTS TAB ═════════════════════════════════ */}
        {tab === 'all' && (
          <div>
            <div className="smp-tab-info purple">
              <RiBarChartLine />
              <strong>All Patients — Combined View</strong> — Complete TRF and Blood status for every registered patient.
            </div>
            {filtered.length === 0 ? (
              <div className="smp-empty">
                <RiUserLine />
                <p>No patients registered yet</p>
                <button className="btn-primary" onClick={openAdd}><RiAddLine /> Register First Patient</button>
              </div>
            ) : (
              <table className="smp-table">
                <thead><tr>
                  <th>#</th><th>KHID</th><th>Name</th><th>Age</th><th>Gender</th>
                  <th>Test Type</th><th>TRF Status</th><th>Blood Status</th>
                  <th>Combined Status</th><th>Registered</th><th>Actions</th>
                </tr></thead>
                <tbody>
                  {filtered.map((s, i) => (
                    <tr key={s.id} className={s.trfStatus && s.bloodStatus ? 'row-done' : ''}>
                      <td className="smp-td-n">{i+1}</td>
                      <td><span className="smp-khid">{s.khid}</span></td>
                      <td className="smp-bold">{s.name}</td>
                      <td>{s.age||'—'}</td>
                      <td>{s.gender||'—'}</td>
                      <td>
                        {s.testType || <span style={{color:'#aaa'}}>—</span>}
                      </td>
                      <td>
                        <StatusBadge done={s.trfStatus} label="TRF" />
                        {!s.trfStatus && s.testType && (
                          <button className="smp-mini-btn" style={{marginLeft:4}}
                            onClick={() => goToForm(s, s.testType)}>
                            Fill TRF →
                          </button>
                        )}
                      </td>
                      <td><StatusBadge done={s.bloodStatus} label="Blood" /></td>
                      <td><CombinedStatus trf={s.trfStatus} blood={s.bloodStatus} /></td>
                      <td className="smp-date">{new Date(s.createdAt).toLocaleDateString('en-IN')}</td>
                      <td>
                        <div className="smp-actions">
                          <button className="smp-act-btn edit" onClick={() => openEdit(s)}><RiEditLine /></button>
                          <button className="smp-act-btn del"  onClick={() => handleDelete(s)}><RiDeleteBin6Line /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* ── ADD / EDIT MODAL ─────────────────────────────────── */}
      {showAdd && (
        <div className="smp-modal-overlay"
          onClick={e => e.target === e.currentTarget && setShowAdd(false)}>
          <div className="smp-modal">
            <div className="smp-modal-hdr">
              <h2>{editItem ? `Edit — ${editItem.name}` : 'Register New Patient'}</h2>
              <button className="smp-close" onClick={() => setShowAdd(false)}><RiCloseLine /></button>
            </div>
            <div className="smp-modal-khid">
              {editItem
                ? <>Patient KHID: <span>{editItem.khid}</span></>
                : 'KHID auto-generated on registration (KHGENEPOWERX-NAME)'
              }
            </div>
            <div className="smp-modal-body">
              <div className="smp-form-grid">
                <div className="smp-field" style={{gridColumn:'1/-1'}}>
                  <label>Full Name *</label>
                  <input className="gx-input" placeholder="Patient full name"
                    value={form.name} onChange={e => set('name', e.target.value)}
                    autoFocus />
                </div>
                <div className="smp-field">
                  <label>Age</label>
                  <input className="gx-input" placeholder="Age" type="number" min="0" max="150"
                    value={form.age} onChange={e => set('age', e.target.value)} />
                </div>
                <div className="smp-field">
                  <label>Gender</label>
                  <select className="gx-input" value={form.gender}
                    onChange={e => set('gender', e.target.value)}>
                    <option value="">— Select —</option>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Prefer not to say</option>
                  </select>
                </div>
                <div className="smp-field" style={{gridColumn:'1/-1'}}>
                  <label>Test Type</label>
                  <select className="gx-input" value={form.testType}
                    onChange={e => set('testType', e.target.value)}>
                    <option value="">— Select —</option>
                    {TEST_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="smp-field" style={{gridColumn:'1/-1'}}>
                  <label>Added By / Doctor Name</label>
                  <input className="gx-input" placeholder="e.g. Dr. Hima"
                    value={form.addedBy} onChange={e => set('addedBy', e.target.value)} />
                </div>
                <div className="smp-field" style={{gridColumn:'1/-1'}}>
                  <label>Notes</label>
                  <textarea className="gx-input" rows={2} placeholder="Optional..."
                    value={form.notes} onChange={e => set('notes', e.target.value)} />
                </div>
              </div>
            </div>
            <div className="smp-modal-ftr">
              <button className="btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleSave} disabled={saving}>
                {saving
                  ? <><span className="btn-spinner"/> Saving...</>
                  : <><RiSaveLine /> {editItem ? 'Update' : 'Register Patient'}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}