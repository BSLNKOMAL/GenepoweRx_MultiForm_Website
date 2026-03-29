import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 30000,
});

API.interceptors.response.use(
  res => res.data,
  err => Promise.reject(new Error(err.response?.data?.message || 'Network error'))
);

// ── Analytics ──────────────────────────────────────────────────────────────
export const getAnalytics     = ()       => API.get('/analytics');

// ── Patients ───────────────────────────────────────────────────────────────
export const getAllPatients    = (p)      => API.get('/patients', { params: p });
export const searchPatients   = (q)      => API.get('/patients/search', { params: { q } });
export const getPatient       = (id)     => API.get(`/patients/${id}`);
export const createPatient    = (d)      => API.post('/patients', d);

// ── Form Submit ────────────────────────────────────────────────────────────
export const submitForm = (data) => {
  const fd    = new FormData();
  const files = Array.isArray(data.files) ? data.files : [];
  // Append each file individually under the key 'files'
  files.forEach(f => { if (f instanceof File) fd.append('files', f, f.name); });
  // Append all other string/json fields
  const rest = { ...data };
  delete rest.files;
  Object.entries(rest).forEach(([k, v]) => {
    if (v !== undefined && v !== null)
      fd.append(k, typeof v === 'object' && !(v instanceof File) ? JSON.stringify(v) : String(v));
  });
  return API.post('/forms/submit', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
};
export const submitConsent    = (d)      => API.post('/forms/consent', d);
export const getForms         = (p)      => API.get('/forms', { params: p });
export const getFormById      = (id)     => API.get(`/forms/${id}`);

// ── Patient Form History (pre-fill) ───────────────────────────────────────
export const getPatientFormHistory = (patientId) => API.get(`/history/${patientId}`);

// ── Visit system ───────────────────────────────────────────────────────────
export const getPatientVisits = (patientId)                       => API.get(`/visits/${patientId}`);
export const getVisitData     = (patientId, formType, visitNumber) => API.get(`/visits/${patientId}/${formType}/${visitNumber}`);

// ── PDF Downloads — direct window.location for real file download ──────────
// window.open bypasses React proxy — must use backend port 5000 directly
const BACKEND = 'http://localhost:5000';

export const downloadPDF        = (patientId, type) => { window.open(`${BACKEND}/api/pdf/${patientId}/${type}`, '_blank'); };
export const downloadVisitPDF   = (submissionId)    => { window.open(`${BACKEND}/api/pdf/submission/${submissionId}`, '_blank'); };
export const getPDFUrl          = (patientId, type) => `${BACKEND}/api/pdf/${patientId}/${type}`;
export const getVisitPDFUrl     = (submissionId)    => `${BACKEND}/api/pdf/submission/${submissionId}`;

// ── Excel Exports ──────────────────────────────────────────────────────────
export const exportAllPatients      = ()         => { window.open(`${BACKEND}/api/export/patients`, '_blank'); };
export const exportByForm           = (formType) => { window.open(`${BACKEND}/api/export/form/${formType}`, '_blank'); };
export const exportClinicalInsights = ()         => { window.open(`${BACKEND}/api/export/clinical-insights`, '_blank'); };
export const exportPatientData      = (patientId)=> { window.open(`${BACKEND}/api/export/patient/${patientId}`, '_blank'); };

// ── Drafts ─────────────────────────────────────────────────────────────────
export const saveDraft    = (d)      => API.post('/drafts', d);
export const getDrafts    = (p)      => API.get('/drafts', { params: p });
export const getDraft     = (id)     => API.get(`/drafts/${id}`);
export const updateDraft  = (id, d)  => API.put(`/drafts/${id}`, d);
export const deleteDraft  = (id)     => API.delete(`/drafts/${id}`);

export default API;
