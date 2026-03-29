import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { RiUserHeartLine, RiFileListLine, RiDraftLine, RiPercentLine,
         RiArrowRightLine, RiRefreshLine } from 'react-icons/ri';
import { getAnalytics } from '../services/api';
import './Dashboard.css';

const COLORS = ['#00d4aa','#38d9f5','#f9a825','#ff6b8a','#a78bfa'];

const StatCard = ({ icon, label, value, sub, color }) => (
  <div className="stat-card" style={{'--accent': color}}>
    <div className="stat-icon">{icon}</div>
    <div className="stat-body">
      <div className="stat-value">{value ?? '—'}</div>
      <div className="stat-label">{label}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <div className="ct-label">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="ct-row" style={{color: p.color}}>
          {p.name}: <strong>{p.value}</strong>
        </div>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const res = await getAnalytics();
      setData(res.data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  if (loading) return (
    <div className="dash-loading">
      <div className="loading-dna">
        <span />
        <span />
        <span />
      </div>
      <p>Loading analytics...</p>
    </div>
  );

  const stats = data?.stats || {};
  const formsByType = data?.formsByType || [];
  const genderDist = data?.genderDist || [];
  const monthlyTrend = data?.monthlyTrend || [];
  const recentSubs = data?.recentSubmissions || [];

  return (
    <div className="dashboard page-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">Clinical Dashboard</h1>
          <p className="page-sub">GenepoweRx Analytics & Insights</p>
        </div>
        <button className="btn-ghost refresh-btn" onClick={load}>
          <RiRefreshLine /> Refresh
        </button>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid">
        <StatCard icon={<RiUserHeartLine />} label="Total Patients" value={stats.totalPatients} sub="All registered" color="var(--teal)" />
        <StatCard icon={<RiFileListLine />} label="Form Submissions" value={stats.totalForms} sub="Completed forms" color="var(--aqua)" />
        <StatCard icon={<RiDraftLine />} label="Active Drafts" value={stats.totalDrafts} sub="Pending completion" color="var(--amber)" />
        <StatCard icon={<RiPercentLine />} label="Completion Rate" value={stats.completionRate != null ? `${stats.completionRate}%` : '—'} sub="Forms vs drafts" color="var(--rose)" />
      </div>

      {/* Charts Row 1 */}
      <div className="charts-row">
        <div className="chart-card wide">
          <div className="chart-header">
            <h3>Monthly Submissions</h3>
            <span className="chart-badge">12-month trend</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthlyTrend}>
              <defs>
                <linearGradient id="tealGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00d4aa" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00d4aa" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: '#8bafc4', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#8bafc4', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="submissions" stroke="#00d4aa" strokeWidth={2.5} fill="url(#tealGrad)" name="Submissions" dot={{ fill: '#00d4aa', r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <h3>Forms by Type</h3>
            <span className="chart-badge">Distribution</span>
          </div>
          {formsByType.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={formsByType} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                  dataKey="value" nameKey="name" paddingAngle={3}>
                  {formsByType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend formatter={(v) => <span style={{color:'var(--text-secondary)',fontSize:12}}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="no-data">No submissions yet</div>}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="charts-row">
        <div className="chart-card">
          <div className="chart-header">
            <h3>Gender Distribution</h3>
          </div>
          {genderDist.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={genderDist} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fill: '#8bafc4', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#8bafc4', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Patients" radius={[6,6,0,0]}>
                  {genderDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="no-data">No patient data yet</div>}
        </div>

        {/* Recent Submissions */}
        <div className="chart-card wide">
          <div className="chart-header">
            <h3>Recent Submissions</h3>
            <button className="chart-link" onClick={() => navigate('/patients')}>
              View All <RiArrowRightLine />
            </button>
          </div>
          <div className="recent-list">
            {recentSubs.length > 0 ? recentSubs.map((s, i) => (
              <div key={i} className="recent-item" onClick={() => navigate(`/patients/${s.patientId}`)}>
                <div className="ri-avatar">{s.patient?.name?.[0] || '?'}</div>
                <div className="ri-info">
                  <span className="ri-name">{s.patient?.name || 'Unknown'}</span>
                  <span className="ri-id">{s.patientId}</span>
                </div>
                <div className="ri-right">
                  <span className={`form-tag ${s.formType?.toLowerCase()}`}>{s.formType}</span>
                  <span className="ri-time">{new Date(s.submittedAt).toLocaleDateString()}</span>
                </div>
              </div>
            )) : <div className="no-data">No recent submissions</div>}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h3 className="qa-title">Quick Actions</h3>
        <div className="qa-grid">
          {[
            { label: 'New Lifestyle Form', path: '/forms/lifestyle', color: 'var(--teal)' },
            { label: 'Short Lifestyle Form', path: '/forms/short-lifestyle', color: 'var(--aqua)' },
            { label: 'WES Form', path: '/forms/wes', color: 'var(--amber)' },
            { label: 'ONCO Form', path: '/forms/onco', color: 'var(--rose)' },
            { label: 'Patient Consent', path: '/forms/consent', color: '#a78bfa' },
            { label: 'View All Patients', path: '/patients', color: 'var(--teal-dim)' },
          ].map(a => (
            <button key={a.path} className="qa-btn" style={{'--c': a.color}} onClick={() => navigate(a.path)}>
              {a.label} <RiArrowRightLine />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
