import React from 'react';
import { useNavigate } from 'react-router-dom';
import { RiArrowRightLine } from 'react-icons/ri';
import './FormsHub.css';

const FORMS = [
  { id: 'lifestyle', label: 'Lifestyle Patient Intake', desc: 'Full patient intake with medical history, review of systems, family history, mental health, constitution assessment', color: 'var(--teal)', tag: 'LIFESTYLE' },
  { id: 'short-lifestyle', label: 'Short Lifestyle Form', desc: 'Abbreviated lifestyle intake with medications, family history, mental health, sexual history', color: 'var(--aqua)', tag: 'SHORT_LIFESTYLE' },
  { id: 'wes', label: 'WES Condition Specific', desc: 'Whole Exome Sequencing questionnaire with clinical symptoms, genetic history, pedigree information', color: 'var(--amber)', tag: 'WES' },
  { id: 'onco', label: 'ONCO Questionnaire', desc: 'Somatic testing form for oncology with tumor details, pathology, lifestyle and family cancer history', color: 'var(--rose)', tag: 'ONCO' },
  { id: 'consent', label: 'Patient Consent Form', desc: 'Informed consent form with full legal disclosure, patient rights and authorization', color: '#a78bfa', tag: 'CONSENT' },
];

export default function FormsHub() {
  const navigate = useNavigate();
  return (
    <div className="forms-hub page-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">Patient Forms</h1>
          <p className="page-sub">Select a form to begin a new submission</p>
        </div>
      </div>
      <div className="forms-hub-grid">
        {FORMS.map(f => (
          <div key={f.id} className="form-hub-card" style={{'--fc': f.color}} onClick={() => navigate(`/forms/${f.id}`)}>
            <div className="fhc-tag">{f.tag}</div>
            <h3 className="fhc-title">{f.label}</h3>
            <p className="fhc-desc">{f.desc}</p>
            <div className="fhc-action">Start Form <RiArrowRightLine /></div>
          </div>
        ))}
      </div>
    </div>
  );
}
