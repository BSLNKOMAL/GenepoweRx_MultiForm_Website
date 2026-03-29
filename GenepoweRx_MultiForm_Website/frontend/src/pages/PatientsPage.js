import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllPatients, searchPatients } from '../services/api';
import { RiSearchLine, RiUserHeartLine, RiArrowRightLine } from 'react-icons/ri';
import './PatientsPage.css';

export default function PatientsPage() {
  const [patients, setPatients] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const navigate = useNavigate();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (q.length > 1) {
        const res = await searchPatients(q);
        setPatients(res.data || []);
        setTotal(res.data?.length || 0);
      } else {
        const res = await getAllPatients({ page, limit: 20 });
        setPatients(res.data || []);
        setTotal(res.total || 0);
      }
    } catch {}
    setLoading(false);
  }, [q, page]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="patients-page page-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">Patients</h1>
          <p className="page-sub">{total} total patients</p>
        </div>
      </div>
      <div className="pts-search-bar">
        <RiSearchLine className="pts-search-icon" />
        <input
          className="gx-input pts-search-input"
          placeholder="Search by name, patient ID, reference number..."
          value={q}
          onChange={e => { setQ(e.target.value); setPage(1); }}
        />
      </div>
      {loading ? (
        <div className="pts-loading">Loading patients...</div>
      ) : patients.length === 0 ? (
        <div className="pts-empty">
          <RiUserHeartLine />
          <p>No patients found</p>
        </div>
      ) : (
        <div className="pts-table-wrap">
          <table className="pts-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Patient ID</th>
                <th>Reference</th>
                <th>Age / Gender</th>
                <th>Contact</th>
                <th>Registered</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {patients.map(p => (
                <tr key={p._id} onClick={() => navigate(`/patients/${p.patientId}`)}>
                  <td>
                    <div className="pt-name-cell">
                      <div className="pt-avatar">{p.name?.[0] || '?'}</div>
                      <span>{p.name}</span>
                    </div>
                  </td>
                  <td><span className="mono-tag">{p.patientId}</span></td>
                  <td><span className="mono-tag dim">{p.referenceNumber}</span></td>
                  <td>{p.age ? `${p.age}y` : '—'} / {p.gender || '—'}</td>
                  <td>{p.phone || p.email || '—'}</td>
                  <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                  <td><RiArrowRightLine className="pt-arrow" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {!q && total > 20 && (
        <div className="pts-pagination">
          <button className="btn-ghost" disabled={page===1} onClick={() => setPage(p => p - 1)}>← Prev</button>
          <span className="page-indicator">Page {page}</span>
          <button className="btn-ghost" disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      )}
    </div>
  );
}
