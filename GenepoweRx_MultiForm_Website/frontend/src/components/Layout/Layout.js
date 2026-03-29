import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  RiDashboardLine, RiUserHeartLine, RiFileListLine,
  RiDraftLine, RiSearchLine, RiMenuFoldLine, RiMenuUnfoldLine,
  RiHeartPulseLine, RiBookOpenLine, RiDnaLine, RiRefreshLine, RiFileExcelLine, RiTestTubeLine,
  RiLifebuoyLine, RiMicroscopeLine, RiVirusLine,
  RiShieldCheckLine, RiArrowDownSLine
} from 'react-icons/ri';
import { searchPatients } from '../../services/api';
import logo from '../../assets/logo.png';
import './Layout.css';

const NAV = [
  { to: '/dashboard', icon: <RiDashboardLine />, label: 'Dashboard' },
  { to: '/patients',  icon: <RiUserHeartLine />, label: 'Patients' },
  { to: '/drafts',    icon: <RiDraftLine />,     label: 'Drafts' },
  { to: '/guidelines',icon: <RiBookOpenLine />,  label: 'Guidelines' },
  { to: '/revisit',    icon: <RiRefreshLine />,   label: 'Patient Revisit' },
  { to: '/export',          icon: <RiFileExcelLine />, label: 'Export Data' },
  { to: '/pending-samples',  icon: <RiTestTubeLine />,   label: 'Patient Samples' },
];

const FORM_NAV = [
  { to: '/forms/lifestyle',       icon: <RiHeartPulseLine />, label: 'Lifestyle' },
  { to: '/forms/short-lifestyle', icon: <RiLifebuoyLine />,   label: 'Short Lifestyle' },
  { to: '/forms/wes',             icon: <RiDnaLine />,        label: 'WES Form' },
  { to: '/forms/onco',            icon: <RiVirusLine />,      label: 'ONCO Form' },
  { to: '/forms/consent',         icon: <RiShieldCheckLine />,label: 'Consent' },
];

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [formsOpen, setFormsOpen] = useState(true);
  const [searchQ, setSearchQ]     = useState('');
  const [results, setResults]     = useState([]);
  const [searching, setSearching] = useState(false);
  const navigate = useNavigate();

  const handleSearch = async (e) => {
    const v = e.target.value; setSearchQ(v);
    if (v.length < 2) { setResults([]); return; }
    setSearching(true);
    try { const r = await searchPatients(v); setResults(r.data || []); } catch {}
    setSearching(false);
  };

  const goPatient = (id) => { setSearchQ(''); setResults([]); navigate(`/patients/${id}`); };

  return (
    <div className={`layout ${collapsed ? 'collapsed' : ''}`}>
      <aside className="sidebar">
        {/* Logo */}
        <div className="sidebar-logo">
          {collapsed
            ? <RiDnaLine className="logo-icon-small" />
            : <img src={logo} alt="GenepoweRx" className="sidebar-logo-img" />
          }
        </div>

        <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)} title={collapsed ? 'Expand' : 'Collapse'}>
          {collapsed ? <RiMenuUnfoldLine /> : <RiMenuFoldLine />}
        </button>

        <nav className="sidebar-nav">
          {NAV.map(n => (
            <NavLink key={n.to} to={n.to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <span className="nav-icon">{n.icon}</span>
              {!collapsed && <span className="nav-label">{n.label}</span>}
            </NavLink>
          ))}

          {/* Forms dropdown */}
          <div className="nav-group">
            <button className="nav-group-header" onClick={() => !collapsed && setFormsOpen(!formsOpen)}>
              <span className="nav-icon"><RiFileListLine /></span>
              {!collapsed && <>
                <span className="nav-label">Forms</span>
                <RiArrowDownSLine className={`nav-arrow ${formsOpen ? 'open' : ''}`} />
              </>}
            </button>
            {(formsOpen || collapsed) && (
              <div className={`nav-sub ${collapsed ? 'collapsed-sub' : ''}`}>
                {FORM_NAV.map(n => (
                  <NavLink key={n.to} to={n.to} className={({ isActive }) => `nav-item nav-sub-item ${isActive ? 'active' : ''}`}>
                    <span className="nav-icon">{n.icon}</span>
                    {!collapsed && <span className="nav-label">{n.label}</span>}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        </nav>

        {!collapsed && (
          <div className="sidebar-footer">
            <RiMicroscopeLine />
            <span>GenepoweRx® v3.0</span>
          </div>
        )}
      </aside>

      <div className="main-area">
        {/* Topbar */}
        <header className="topbar">
          <div className="search-wrap">
            <RiSearchLine className="search-icon" />
            <input className="search-input" placeholder="Search patient name, ID, KHGENEPOWERX-..."
              value={searchQ} onChange={handleSearch} />
            {searching && <span className="search-spinner" />}
            {results.length > 0 && (
              <div className="search-dropdown">
                {results.map(p => (
                  <button key={p._id} className="search-result-item" onClick={() => goPatient(p.patientId)}>
                    <span className="sr-name">{p.name}</span>
                    <span className="sr-meta">{p.patientId} · {p.gender||'—'} · {p.age ? p.age+'y' : '—'}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="topbar-right">
            <img src={logo} alt="GenepoweRx" className="topbar-logo" />
            <span className="topbar-badge"><span className="pulse-dot" />Live</span>
          </div>
        </header>

        <main className="content page-fade">
          <Outlet />
        </main>
      </div>
    </div>
  );
}