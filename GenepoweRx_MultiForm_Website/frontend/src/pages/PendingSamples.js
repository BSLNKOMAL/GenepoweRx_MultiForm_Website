import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import './PendingSamples.css';

const API = 'http://localhost:5000/api/pending-samples';

const TEST_TYPES = [
  'Whole Exome Sequencing (WES)',
  'Clinical Exome Sequencing (CES)',
  'Targeted Sequencing (Oncology)',
  'Whole Exome + Mitochondrial (WES+Mito)',
  'Hereditary Cancer Screening (HCS)',
  'Single Gene Sequencing (SGS)',
  'Sanger Sequencing',
  'Microsatellite Instability (MSI)',
  'Tumor Mutation Burden (TMB)',
  'Whole transcriptome analysis (WTA)',
  'Other',
];

const CATEGORY_META = {
  BLOOD_DONE_NO_TRF: {
    label:    'Blood Done — TRF Missing',
    sublabel: 'Under Dr. Hima',
    short:    'Blood ✓  TRF ✗',
    color:    '#e07b00',
    bg:       'rgba(224,123,0,0.08)',
    border:   '#e07b00',
    dot:      '#e07b00',
  },
  TRF_DONE_NO_BLOOD: {
    label:    'TRF Available — Blood Pending',
    sublabel: 'Front Desk',
    short:    'TRF ✓  Blood ✗',
    color:    '#0077b6',
    bg:       'rgba(0,119,182,0.08)',
    border:   '#0077b6',
    dot:      '#0077b6',
  },
};

// patientId is now required — removed from EMPTY_FORM default so user must type it
const EMPTY_FORM = {
  patientId: '', name: '', age: '', gender: '', testType: '',
  category: 'BLOOD_DONE_NO_TRF', notes: '', addedBy: '',
};

/* ─── Inline SVGs — zero font/icon dependency ────────────────── */
const IconTube = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
    <path d="M14.5 2v17.5c0 1.4-1.1 2.5-2.5 2.5s-2.5-1.1-2.5-2.5V2"/>
    <path d="M8.5 2h7"/><path d="M14.5 16h-5"/>
  </svg>
);
const IconRefresh = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
    strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
    <path d="M3 12a9 9 0 009 9 9 9 0 006.36-2.64M21 12a9 9 0 00-9-9 9 9 0 00-6.36 2.64"/>
    <path d="M3 7v5h5M21 17v-5h-5"/>
  </svg>
);
const IconSearch = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
  </svg>
);

export default function PendingSamples() {
  const [samples, setSamples]           = useState([]);
  const [stats, setStats]               = useState(null);
  const [loading, setLoading]           = useState(true);
  const [showForm, setShowForm]         = useState(false);
  const [editItem, setEditItem]         = useState(null);
  const [form, setForm]                 = useState(EMPTY_FORM);
  const [search, setSearch]             = useState('');
  const [filterCat, setFilterCat]       = useState('');
  const [showResolved, setShowResolved] = useState(false);
  const [saving, setSaving]             = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterCat) params.set('category', filterCat);
      if (search)    params.set('q', search);
      params.set('resolved', showResolved ? 'true' : 'false');
      const [sRes, stRes] = await Promise.all([
        fetch(`${API}?${params}`).then(r => r.json()),
        fetch(`${API}/stats`).then(r => r.json()),
      ]);
      setSamples(sRes.data  || []);
      setStats(stRes.data   || null);
    } catch {
      toast.error('Failed to load samples');
    }
    setLoading(false);
  }, [filterCat, search, showResolved]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openAdd  = () => { setEditItem(null); setForm(EMPTY_FORM); setShowForm(true); };
  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      patientId: item.patientId || '',
      name:      item.name,
      age:       item.age      || '',
      gender:    item.gender   || '',
      testType:  item.testType || '',
      category:  item.category,
      notes:     item.notes    || '',
      addedBy:   item.addedBy  || '',
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    // ── validation — all three are now required ──────────────────
    if (!form.patientId.trim()) { toast.error('Patient ID is required');  return; }
    if (!form.name.trim())      { toast.error('Name is required');         return; }
    if (!form.testType.trim())  { toast.error('Test Type is required');    return; }

    setSaving(true);
    try {
      const url    = editItem ? `${API}/${editItem._id}` : API;
      const method = editItem ? 'PUT' : 'POST';
      const res    = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast.success(editItem ? 'Sample updated!' : 'Sample added!');
      setShowForm(false);
      fetchAll();
    } catch (e) {
      toast.error(e.message || 'Save failed');
    }
    setSaving(false);
  };

  const markResolved = async (item) => {
    try {
      await fetch(`${API}/${item._id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolved: true }),
      });
      toast.success(`${item.name} marked as resolved`);
      fetchAll();
    } catch { toast.error('Failed to resolve'); }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete record for "${item.name}"?`)) return;
    try {
      await fetch(`${API}/${item._id}`, { method: 'DELETE' });
      toast.success('Deleted');
      fetchAll();
    } catch { toast.error('Delete failed'); }
  };

  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="ps-page page-fade">

      {/* ── PAGE HEADER ────────────────────────────────────────── */}
      <div className="ps-page-header">
        <div className="ps-header-left">
          <div className="ps-header-icon"><IconTube /></div>
          <div>
            <h1 className="ps-page-title">Patient Samples</h1>
            <p className="ps-page-sub">Track samples awaiting blood collection or TRF documents</p>
          </div>
        </div>
        <button className="ps-add-btn" onClick={openAdd}>+ Add Pending Sample</button>
      </div>

      {/* ── STATS CARDS ────────────────────────────────────────── */}
      <div className="ps-stats-row">
        <div className="ps-stat-card ps-stat-total">
          <div className="ps-stat-val">{stats ? stats.total : <span className="ps-dash">—</span>}</div>
          <div className="ps-stat-lbl">Total Pending</div>
        </div>
        <div
          className={`ps-stat-card ps-stat-blood ${filterCat === 'BLOOD_DONE_NO_TRF' ? 'ps-stat-sel' : ''}`}
          onClick={() => setFilterCat(f => f === 'BLOOD_DONE_NO_TRF' ? '' : 'BLOOD_DONE_NO_TRF')}
        >
          <div className="ps-stat-badge ps-badge-blood">Blood Done · TRF Missing</div>
          <div className="ps-stat-val">{stats ? stats.bloodNoTrf : <span className="ps-dash">—</span>}</div>
          <div className="ps-stat-lbl">Under Dr. Hima</div>
        </div>
        <div
          className={`ps-stat-card ps-stat-trf ${filterCat === 'TRF_DONE_NO_BLOOD' ? 'ps-stat-sel' : ''}`}
          onClick={() => setFilterCat(f => f === 'TRF_DONE_NO_BLOOD' ? '' : 'TRF_DONE_NO_BLOOD')}
        >
          <div className="ps-stat-badge ps-badge-trf">TRF Available · Blood Pending</div>
          <div className="ps-stat-val">{stats ? stats.trfNoBlood : <span className="ps-dash">—</span>}</div>
          <div className="ps-stat-lbl">Front Desk</div>
        </div>
        <div className="ps-stat-card ps-stat-resolved">
          <div className="ps-stat-val">{stats ? stats.resolved : <span className="ps-dash">—</span>}</div>
          <div className="ps-stat-lbl">Resolved</div>
        </div>
      </div>

      {/* ── LEGEND ─────────────────────────────────────────────── */}
      <div className="ps-legend">
        <div className="ps-legend-item">
          <span className="ps-legend-dot" style={{ background: '#e07b00' }} />
          <span>
            <strong>Blood Done — TRF Missing (Under Dr. Hima)</strong>
            {' '}— Blood sample collected &amp; tested. TRF form not yet received.
          </span>
        </div>
        <div className="ps-legend-item">
          <span className="ps-legend-dot" style={{ background: '#0077b6' }} />
          <span>
            <strong>TRF Available — Blood Pending (Front Desk)</strong>
            {' '}— TRF form received at front desk. Blood sample not yet collected.
          </span>
        </div>
      </div>

      {/* ── TOOLBAR ────────────────────────────────────────────── */}
      <div className="ps-toolbar">
        <div className="ps-search-wrap">
          <span className="ps-search-icon"><IconSearch /></span>
          <input
            className="ps-search-input"
            placeholder="Search by name, patient ID or test type..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="ps-filter-row">
          <button className={`ps-fbtn ${filterCat === '' ? 'ps-fbtn-active' : ''}`} onClick={() => setFilterCat('')}>All</button>
          <button
            className={`ps-fbtn ps-fbtn-blood ${filterCat === 'BLOOD_DONE_NO_TRF' ? 'ps-fbtn-blood-active' : ''}`}
            onClick={() => setFilterCat(f => f === 'BLOOD_DONE_NO_TRF' ? '' : 'BLOOD_DONE_NO_TRF')}
          >Blood Done</button>
          <button
            className={`ps-fbtn ps-fbtn-trf ${filterCat === 'TRF_DONE_NO_BLOOD' ? 'ps-fbtn-trf-active' : ''}`}
            onClick={() => setFilterCat(f => f === 'TRF_DONE_NO_BLOOD' ? '' : 'TRF_DONE_NO_BLOOD')}
          >TRF Available</button>
          <label className="ps-resolved-lbl">
            <input type="checkbox" checked={showResolved} onChange={e => setShowResolved(e.target.checked)} />
            <span>Show Resolved</span>
          </label>
          <button className="ps-refresh-btn" onClick={fetchAll} title="Refresh"><IconRefresh /></button>
        </div>
      </div>

      {/* ── TABLE CARD ─────────────────────────────────────────── */}
      <div className="ps-table-card">
        {loading ? (
          <div className="ps-loading">
            <div className="ps-spinner" />
            <span>Loading samples...</span>
          </div>
        ) : samples.length === 0 ? (
          <div className="ps-empty">
            <div className="ps-empty-icon"><IconTube /></div>
            <p>No pending samples found</p>
            <button className="ps-add-btn" onClick={openAdd}>+ Add First Sample</button>
          </div>
        ) : (
          <div className="ps-table-scroll">
            <table className="ps-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Patient ID</th>
                  <th>KHID</th>
                  <th>Name</th>
                  <th>Age</th>
                  <th>Gender</th>
                  <th>Test Type</th>
                  <th>Category</th>
                  <th>Status Flags</th>
                  <th>Date Added</th>
                  <th>Notes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {samples.map((s, i) => {
                  const meta = CATEGORY_META[s.category] || CATEGORY_META.BLOOD_DONE_NO_TRF;
                  return (
                    <tr key={s._id} className={s.resolved ? 'ps-row-done' : ''}>
                      <td className="ps-td-n">{i + 1}</td>
                      <td>
                        {s.patientId
                          ? <span className="ps-pid">{s.patientId}</span>
                          : <span className="ps-null">—</span>}
                      </td>
                      <td>
                        {s.khid
                          ? <span className="ps-khid">{s.khid}</span>
                          : <span className="ps-null">—</span>}
                      </td>
                      <td className="ps-td-name">{s.name}</td>
                      <td className="ps-td-sm">{s.age    || <span className="ps-null">—</span>}</td>
                      <td className="ps-td-sm">{s.gender || <span className="ps-null">—</span>}</td>
                      <td className="ps-td-test">{s.testType || <span className="ps-null">—</span>}</td>
                      <td>
                        <div className="ps-cat-pill" style={{
                          color:       meta.color,
                          background:  meta.bg,
                          borderColor: meta.border,
                        }}>
                          <span className="ps-cat-dot-sm" style={{ background: meta.dot }} />
                          <div>
                            <div className="ps-cat-short">{meta.short}</div>
                            <div className="ps-cat-sub2">{meta.sublabel}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="ps-flags">
                          <span className={`ps-flag ${s.bloodStatus ? 'ps-flag-done' : 'ps-flag-pend'}`}>
                            Blood: {s.bloodStatus ? '✓ Done' : '✗ Pending'}
                          </span>
                          <span className={`ps-flag ${s.trfStatus ? 'ps-flag-done' : 'ps-flag-pend'}`}>
                            TRF: {s.trfStatus ? '✓ OK' : '✗ Missing'}
                          </span>
                        </div>
                      </td>
                      <td className="ps-td-date">
                        {new Date(s.createdAt).toLocaleDateString('en-IN')}
                        {s.addedBy && <div className="ps-by">{s.addedBy}</div>}
                      </td>
                      <td className="ps-td-notes">{s.notes || <span className="ps-null">—</span>}</td>
                      <td>
                        <div className="ps-act-group">
                          {!s.resolved && (
                            <button className="ps-act ps-act-resolve" title="Mark Resolved" onClick={() => markResolved(s)}>✓</button>
                          )}
                          <button className="ps-act ps-act-edit" title="Edit" onClick={() => openEdit(s)}>✎</button>
                          <button className="ps-act ps-act-del"  title="Delete" onClick={() => handleDelete(s)}>✕</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── MODAL ──────────────────────────────────────────────── */}
      {showForm && (
        <div className="ps-overlay" onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div className="ps-modal">

            <div className="ps-modal-head">
              <h2 className="ps-modal-title">{editItem ? 'Edit Pending Sample' : 'Add Pending Sample'}</h2>
              <button className="ps-modal-x" onClick={() => setShowForm(false)}>✕</button>
            </div>

            <div className="ps-modal-body">

              {/* ── Category ── */}
              <div className="ps-msec">
                <div className="ps-msec-label">Category *</div>
                <div className="ps-cat-opts">
                  {Object.entries(CATEGORY_META).map(([key, meta]) => (
                    <div
                      key={key}
                      className={`ps-cat-opt ${form.category === key ? 'ps-cat-opt-sel' : ''}`}
                      style={form.category === key ? { borderColor: meta.border, background: meta.bg } : {}}
                      onClick={() => setF('category', key)}
                    >
                      <span className="ps-cat-dot-lg" style={{ background: meta.dot }} />
                      <div>
                        <div className="ps-cat-opt-label">{meta.label}</div>
                        <div className="ps-cat-opt-sub">{meta.sublabel}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Patient Info ── */}
              <div className="ps-msec">
                <div className="ps-msec-label">Patient Information</div>
                <div className="ps-mgrid">

                  {/* Patient ID — NOW REQUIRED */}
                  <div className="ps-mfield ps-mfield-required">
                    <label>
                      Patient ID <span className="ps-req-star">*</span>
                    </label>
                    <input
                      className={`gx-input ${!form.patientId.trim() && form._touched_pid ? 'ps-input-error' : ''}`}
                      placeholder="e.g. KHGENEPOWERX-001"
                      value={form.patientId}
                      onChange={e => setF('patientId', e.target.value)}
                      onBlur={() => setF('_touched_pid', true)}
                    />
                    {!form.patientId.trim() && form._touched_pid && (
                      <span className="ps-field-err">Patient ID is required</span>
                    )}
                  </div>

                  {/* Name — required */}
                  <div className="ps-mfield ps-mfield-required">
                    <label>Name <span className="ps-req-star">*</span></label>
                    <input
                      className="gx-input"
                      placeholder="Patient full name"
                      value={form.name}
                      onChange={e => setF('name', e.target.value)}
                    />
                  </div>

                  <div className="ps-mfield">
                    <label>Age</label>
                    <input className="gx-input" type="number" placeholder="Age"
                      value={form.age} onChange={e => setF('age', e.target.value)} />
                  </div>

                  <div className="ps-mfield">
                    <label>Gender</label>
                    <select className="gx-input" value={form.gender} onChange={e => setF('gender', e.target.value)}>
                      <option value="">— Select —</option>
                      <option>Male</option>
                      <option>Female</option>
                      <option>Prefer not to say</option>
                    </select>
                  </div>

                  <div className="ps-mfield ps-mfull ps-mfield-required">
                    <label>Test Type <span className="ps-req-star">*</span></label>
                    <select className="gx-input" value={form.testType} onChange={e => setF('testType', e.target.value)}>
                      <option value="">— Select test type —</option>
                      {TEST_TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>

                  <div className="ps-mfield ps-mfull">
                    <label>Added By</label>
                    <input className="gx-input" placeholder="Staff name (optional)"
                      value={form.addedBy} onChange={e => setF('addedBy', e.target.value)} />
                  </div>

                  <div className="ps-mfield ps-mfull">
                    <label>Notes</label>
                    <textarea className="gx-input" rows={2} placeholder="Any additional notes..."
                      value={form.notes} onChange={e => setF('notes', e.target.value)} />
                  </div>

                </div>
              </div>
            </div>{/* /modal-body */}

            <div className="ps-modal-foot">
              <button className="ps-btn-cancel" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="ps-btn-save" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : editItem ? 'Update Sample' : 'Add Sample'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}