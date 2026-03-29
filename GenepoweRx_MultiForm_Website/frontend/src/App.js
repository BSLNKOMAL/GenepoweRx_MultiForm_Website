import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout             from './components/Layout/Layout';
import Dashboard          from './pages/Dashboard';
import PatientsPage       from './pages/PatientsPage';
import PatientDetail      from './pages/PatientDetail';
import DraftsPage         from './pages/DraftsPage';
import FormsHub           from './pages/FormsHub';
import Guidelines         from './pages/Guidelines';
import PatientLookup      from './pages/PatientLookup';
import VisitDetail        from './pages/VisitDetail';
import ExportPage         from './pages/ExportPage';
import PatientSamples      from './pages/PatientSamples';
import LifestyleForm      from './pages/forms/LifestyleForm';
import ShortLifestyleForm from './pages/forms/ShortLifestyleForm';
import WESForm            from './pages/forms/WESForm';
import ONCoForm           from './pages/forms/ONCoForm';
import ConsentForm        from './pages/forms/ConsentForm';

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{
        style: { background:'#fff', color:'#1a1a2e', border:'1px solid #e2e8f0', fontFamily:'var(--font-body)', fontSize:'14px', boxShadow:'0 4px 16px rgba(0,0,0,0.1)' },
        success: { iconTheme: { primary:'#27ae60', secondary:'#fff' } },
        error:   { iconTheme: { primary:'#d62839', secondary:'#fff' } },
      }} />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard"    element={<Dashboard />} />
          <Route path="patients"     element={<PatientsPage />} />
          <Route path="patients/:id" element={<PatientDetail />} />
          <Route path="drafts"       element={<DraftsPage />} />
          <Route path="forms"        element={<FormsHub />} />
          <Route path="guidelines"   element={<Guidelines />} />
          <Route path="revisit"      element={<PatientLookup />} />
          <Route path="export"       element={<ExportPage />} />
          <Route path="pending-samples" element={<PatientSamples />} />
          <Route path="visits/:patientId/:formType/:visitNumber" element={<VisitDetail />} />
          <Route path="forms/lifestyle"                element={<LifestyleForm />} />
          <Route path="forms/lifestyle/:draftId"       element={<LifestyleForm />} />
          <Route path="forms/short-lifestyle"          element={<ShortLifestyleForm />} />
          <Route path="forms/short-lifestyle/:draftId" element={<ShortLifestyleForm />} />
          <Route path="forms/wes"                      element={<WESForm />} />
          <Route path="forms/wes/:draftId"             element={<WESForm />} />
          <Route path="forms/onco"                     element={<ONCoForm />} />
          <Route path="forms/onco/:draftId"            element={<ONCoForm />} />
          <Route path="forms/consent"                  element={<ConsentForm />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}