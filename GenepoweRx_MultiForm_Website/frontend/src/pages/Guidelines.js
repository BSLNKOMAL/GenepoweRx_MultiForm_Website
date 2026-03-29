import React, { useState } from 'react';
import logo from '../assets/logo.png';
import './Guidelines.css';

const TABS = ['Overview','For Patients','For Doctors / Admin','Form Guide','FAQ'];

const SECTIONS = {
  Overview: [
    { icon:'🧬', title:'What is GenepoweRx?', body:'GenepoweRx is a clinical genomics platform by K&H that digitises the entire patient intake, genetic testing consent, and sample management workflow. It eliminates paperwork by capturing all forms electronically and generating professional PDFs automatically.' },
    { icon:'🔄', title:'How It Works', body:`1. Patient or coordinator fills out the intake form (Lifestyle / WES / ONCO / Short Lifestyle).\n2. On submission, the system auto-generates a Patient ID in the format KHGENEPOWERX-PATIENTNAME and creates a Form PDF.\n3. The patient is automatically redirected to the Consent Form.\n4. After the patient draws their digital signature and submits, a Consent PDF is also generated.\n5. Both PDFs are stored in a dedicated folder named after the Patient ID in the server and can be downloaded anytime.` },
    { icon:'📁', title:'File Storage Structure', body:`All files are stored per patient:\nuploads/\n  KHGENEPOWERX-JOHNSMITH/\n    pdfs/\n      KHGENEPOWERX-JOHNSMITH_LIFESTYLE_timestamp.pdf\n      KHGENEPOWERX-JOHNSMITH_CONSENT_timestamp.pdf\n    uploads/\n      (any uploaded prescription / pathology files)` },
  ],
  'For Patients': [
    { icon:'1️⃣', title:'Step 1 — Fill Your Form', body:'Ask your coordinator which form applies to you. Fill in all required fields marked with *. You can save a draft at any time using the Save Draft button — just enter your name first.' },
    { icon:'2️⃣', title:'Step 2 — Sign the Consent', body:'After submitting your form you will be automatically taken to the Consent Form. Read all 10 consent points carefully, tick the agreement checkbox, then draw your signature in the signature box using your mouse or finger on a touch screen.' },
    { icon:'3️⃣', title:'Step 3 — Download Your PDFs', body:'After submitting the Consent Form, a success screen will appear with two Download buttons — one for your Form PDF and one for your Consent PDF. Save these for your records.' },
    { icon:'🔑', title:'Your Patient ID', body:'Your unique Patient ID looks like KHGENEPOWERX-YOURNAME. Keep this safe — it lets you or your doctor retrieve all your records at any time using the search bar at the top of the screen.' },
    { icon:'💾', title:'Resuming a Draft', body:'If you saved a draft, go to the Drafts section in the left sidebar. Search by your name or draft ID, then click Continue Editing to resume exactly where you left off.' },
  ],
  'For Doctors / Admin': [
    { icon:'🔍', title:'Retrieving Patient Records', body:'Use the search bar at the top of any page. Type the Patient ID (e.g. KHGENEPOWERX-RAVI), patient name, phone number, or reference number. Click the result to open the full patient profile showing all submitted forms and drafts.' },
    { icon:'📊', title:'Dashboard Analytics', body:'The Dashboard shows: total patients registered, total forms submitted, active drafts, completion rate, monthly submission trend chart, gender distribution, forms by type, and the 5 most recent submissions.' },
    { icon:'📋', title:'Managing Drafts', body:'Go to the Drafts section to see all incomplete forms. Filter by form type. Click Continue Editing to open a draft, complete it, and submit. Drafts are automatically marked as submitted once the form is completed.' },
    { icon:'⬇️', title:'Downloading PDFs', body:'From the Patient Detail page, click the Forms tab. Each submission shows a Download PDF link. Alternatively, after any consent submission the system shows direct download buttons for both the Form PDF and the Consent PDF.' },
    { icon:'👥', title:'Patient List', body:'The Patients page shows all registered patients in a searchable table with Patient ID, Reference Number, age, gender, and contact. Click any row to open the full patient profile.' },
    { icon:'🗂️', title:'Form Types Explained', body:`• Lifestyle Form — Full intake: complaints, medical history, family history, mental health, diet, constitution assessment.\n• Short Lifestyle — Abbreviated intake with medications, family history, mental health, sexual history.\n• WES Form — Whole Exome Sequencing questionnaire: clinical symptoms, pedigree, genetic history.\n• ONCO Form — Oncology somatic testing: tumor details, pathology report, cancer family history.\n• Consent Form — 10-point informed consent with digital signature.` },
  ],
  'Form Guide': [
    { icon:'💊', title:'Lifestyle Form', body:'Used for general wellness and preventive genomics. Covers: personal details, test selection, complaints (up to 7), reasons for genetic testing, past medical and surgical history, family history (Father/Mother/Sibling), mental health assessment, medications, review of 11 body systems, diet and lifestyle habits, physical examination, and Ayurvedic constitution assessment.' },
    { icon:'⚡', title:'Short Lifestyle Form', body:'A faster version for repeat patients or straightforward cases. Covers: patient info, test selection, medications, family history with per-condition details, 5 mental health questions, and gender-specific sexual health questions.' },
    { icon:'🧪', title:'WES / Condition Specific Form', body:'For patients undergoing Whole Exome Sequencing. Covers: patient demographics, test type, indications, doctor referral, clinical symptoms, age of onset, consanguinity, disease progression, current health status, investigations performed, treatment, and genetic testing family history.' },
    { icon:'🔬', title:'ONCO Form', body:'For somatic / oncology testing. Mandatory fields: cancer type & stage, primary tumor site, pathology report number, FFPE block number, family cancer history, diet and lifestyle details. Pathology report must be attached or inference provided.' },
    { icon:'✍️', title:'Consent Form', body:'Must be completed after every other form. Requires: patient details, agreement to all 10 consent points, and a hand-drawn digital signature. The signature is embedded directly into the generated PDF.' },
    { icon:'💾', title:'Draft System', body:'Any form can be saved as a draft by entering a patient name in the Draft bar at the top of the form and clicking Save Draft. A unique Draft ID is assigned. Drafts appear in the Drafts section and can be resumed, edited, and submitted at any time.' },
  ],
  FAQ: [
    { icon:'❓', title:'How is the Patient ID generated?', body:'Automatically on first form submission. Format: KHGENEPOWERX-PATIENTNAME (e.g. KHGENEPOWERX-ANILKUMAR). If two patients have the same name, a counter suffix is added (e.g. KHGENEPOWERX-ANIL-2).' },
    { icon:'❓', title:'Where are PDFs stored on the server?', body:`In the backend uploads directory, inside a folder named after the Patient ID:\nuploads/KHGENEPOWERX-NAME/pdfs/` },
    { icon:'❓', title:'Can I edit a submitted form?', body:'Submitted forms cannot be edited directly. However, you can submit a new form for the same patient — all submissions are kept and linked to the same Patient ID.' },
    { icon:'❓', title:'What happens if I close the browser mid-form?', body:'Use Save Draft before closing. The draft is stored on the server and can be resumed from any device using the Drafts section.' },
    { icon:'❓', title:'Is the signature legally valid?', body:'The digital signature drawn on-screen is embedded in the PDF. For legal validity in your jurisdiction, please consult your compliance team. The system records the signature image, patient name, and timestamp.' },
    { icon:'❓', title:'Can the same patient submit multiple forms?', body:'Yes. Multiple form types (Lifestyle, WES, ONCO etc.) can be submitted for the same patient. All are linked to the same KHGENEPOWERX ID and visible in the patient profile.' },
  ],
};

export default function Guidelines() {
  const [tab, setTab] = useState('Overview');
  return (
    <div className="guidelines page-fade">
      <div className="gl-header">
        <img src={logo} alt="GenepoweRx" className="gl-logo" />
        <div>
          <h1 className="page-title">Instructions & Guidelines</h1>
          <p className="page-sub">Complete guide to using the GenepoweRx clinical genomics platform</p>
        </div>
      </div>

      <div className="gl-tabs">
        {TABS.map(t => (
          <button key={t} className={`gl-tab ${tab===t?'active':''}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      <div className="gl-content">
        {(SECTIONS[tab] || []).map((s, i) => (
          <div key={i} className="gl-card">
            <div className="gl-card-icon">{s.icon}</div>
            <div className="gl-card-body">
              <h3 className="gl-card-title">{s.title}</h3>
              <pre className="gl-card-text">{s.body}</pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
