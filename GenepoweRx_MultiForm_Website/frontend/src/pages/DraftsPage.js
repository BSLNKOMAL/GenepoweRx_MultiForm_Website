import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDrafts, deleteDraft } from '../services/api';
import { RiSearchLine, RiDraftLine, RiDeleteBin6Line, RiEditLine } from 'react-icons/ri';
import toast from 'react-hot-toast';
import './DraftsPage.css';

const FORM_TYPES = ['All', 'LIFESTYLE', 'SHORT_LIFESTYLE', 'WES', 'ONCO', 'CONSENT'];

export default function DraftsPage() {
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [formType, setFormType] = useState('All');
  const navigate = useNavigate();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (q) params.q = q;
      if (formType !== 'All') params.formType = formType;
      const res = await getDrafts(params);
      setDrafts(res.data || []);
    } catch {}
    setLoading(false);
  }, [q, formType]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (draftId, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this draft?')) return;
    try {
      await deleteDraft(draftId);
      toast.success('Draft deleted');
      load();
    } catch { toast.error('Failed to delete'); }
  };

  const getFormPath = (formType, draftId) => {
    const map = { LIFESTYLE:'lifestyle', SHORT_LIFESTYLE:'short-lifestyle', WES:'wes', ONCO:'onco', CONSENT:'consent' };
    return `/forms/${map[formType] || 'lifestyle'}/${draftId}`;
  };

  return (
    <div className="drafts-page page-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">Drafts</h1>
          <p className="page-sub">{drafts.length} active drafts</p>
        </div>
      </div>
      <div className="drafts-filters">
        <div className="drafts-search">
          <RiSearchLine />
          <input className="gx-input" placeholder="Search by name, ID, draft ID..." value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <div className="type-filters">
          {FORM_TYPES.map(t => (
            <button key={t} className={`type-btn ${formType===t?'active':''}`} onClick={() => setFormType(t)}>{t}</button>
          ))}
        </div>
      </div>

      {loading ? <div className="drafts-loading">Loading drafts...</div> :
       drafts.length === 0 ? (
         <div className="drafts-empty"><RiDraftLine /><p>No drafts found</p></div>
       ) : (
        <div className="drafts-grid">
          {drafts.map(d => (
            <div key={d._id} className="draft-card" onClick={() => navigate(getFormPath(d.formType, d.draftId))}>
              <div className="dc-top">
                <div className="dc-type-badge">{d.formType}</div>
                <button className="dc-delete" onClick={(e) => handleDelete(d.draftId, e)}><RiDeleteBin6Line /></button>
              </div>
              <div className="dc-name">{d.patientName}</div>
              <div className="dc-meta">
                <span>{d.draftId}</span>
                {d.patientId && <span>{d.patientId}</span>}
              </div>
              <div className="dc-footer">
                <span className="dc-time">Modified: {new Date(d.lastModified).toLocaleString()}</span>
                <button className="dc-edit-btn" onClick={(e) => { e.stopPropagation(); navigate(getFormPath(d.formType, d.draftId)); }}>
                  <RiEditLine /> Continue
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
