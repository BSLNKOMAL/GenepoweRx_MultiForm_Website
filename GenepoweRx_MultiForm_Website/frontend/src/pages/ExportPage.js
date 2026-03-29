import React, { useState, useEffect } from 'react';
import { getAnalytics, exportAllPatients, exportByForm, exportClinicalInsights, exportPatientData } from '../services/api';
import { RiFileExcelLine, RiDownloadLine, RiUserHeartLine, RiFileListLine, RiBarChartLine } from 'react-icons/ri';
import logo from '../assets/logo.png';
import './ExportPage.css';

const FORM_TYPES = ['LIFESTYLE','SHORT_LIFESTYLE','WES','ONCO','CONSENT'];

export default function ExportPage() {
  const [stats, setStats]   = useState(null);
  const [pid, setPid]       = useState('');

  useEffect(() => {
    getAnalytics().then(r => setStats(r.data?.stats)).catch(() => {});
  }, []);

  return (
    <div className="export-page page-fade">
      <div className="ep-header">
        <img src={logo} alt="GenepoweRx" className="ep-logo" />
        <div>
          <h1 className="page-title">Data Export</h1>
          <p className="page-sub">Download patient data, form submissions and clinical insights as Excel (.xlsx)</p>
        </div>
      </div>

      {stats && (
        <div className="ep-stats">
          <div className="ep-stat"><span>{stats.totalPatients}</span>Patients</div>
          <div className="ep-stat"><span>{stats.totalForms}</span>Submissions</div>
          <div className="ep-stat"><span>{stats.totalDrafts}</span>Drafts</div>
        </div>
      )}

      <div className="ep-grid">
        {/* Patient-wise */}
        <div className="ep-card">
          <div className="ep-card-icon" style={{background:'rgba(0,119,182,0.1)',color:'#0077b6'}}><RiUserHeartLine /></div>
          <h3>All Patients</h3>
          <p>Export complete patient registry with all demographics, contact info, and submission counts.</p>
          <ul>
            <li>Patient IDs & Reference Numbers</li>
            <li>Demographics (age, gender)</li>
            <li>Contact details</li>
            <li>All submission summary</li>
          </ul>
          <button className="ep-btn" onClick={exportAllPatients}>
            <RiFileExcelLine /> Download Patients Excel
          </button>
        </div>

        {/* Form-wise */}
        <div className="ep-card">
          <div className="ep-card-icon" style={{background:'rgba(91,63,166,0.1)',color:'#5B3FA6'}}><RiFileListLine /></div>
          <h3>Form-wise Export</h3>
          <p>Export all submissions for a specific form type including all visit data.</p>
          <div className="ep-form-btns">
            {FORM_TYPES.map(ft => (
              <button key={ft} className="ep-form-btn" onClick={() => exportByForm(ft)}>
                <RiDownloadLine /> {ft.replace('_',' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Clinical Insights */}
        <div className="ep-card">
          <div className="ep-card-icon" style={{background:'rgba(39,174,96,0.1)',color:'#27ae60'}}><RiBarChartLine /></div>
          <h3>Clinical Insights</h3>
          <p>Multi-sheet report with ONCO details, WES details, mental health data, and summary statistics.</p>
          <ul>
            <li>Clinical Summary sheet</li>
            <li>ONCO patient details</li>
            <li>WES patient details</li>
            <li>Mental health & lifestyle data</li>
          </ul>
          <button className="ep-btn green" onClick={exportClinicalInsights}>
            <RiFileExcelLine /> Download Clinical Insights
          </button>
        </div>

        {/* Single Patient */}
        <div className="ep-card">
          <div className="ep-card-icon" style={{background:'rgba(232,97,26,0.1)',color:'#E8611A'}}><RiUserHeartLine /></div>
          <h3>Single Patient Export</h3>
          <p>Export all data for one specific patient — all form types and all visit records in one file.</p>
          <div className="ep-patient-input">
            <input
              className="gx-input"
              placeholder="e.g. KHGENEPOWERX-JOHNSMITH"
              value={pid}
              onChange={e => setPid(e.target.value.toUpperCase())}
            />
            <button className="ep-btn orange" disabled={!pid.trim()} onClick={() => exportPatientData(pid.trim())}>
              <RiFileExcelLine /> Export Patient
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
