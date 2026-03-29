import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { submitConsent, getPDFUrl } from '../../services/api';
import { FormSection, FormGrid, Input, Select } from '../../components/common/FormComponents';
import { RiShieldCheckLine, RiUserLine, RiPenNibLine,
         RiDeleteBin6Line, RiFilePdfLine, RiCheckLine, RiDownloadLine } from 'react-icons/ri';
import './FormPage.css';

const CONSENT_POINTS = [
  'The medical practitioner / physician has fully and clearly explained the risks, outcomes, benefits and limitations of the genomics testing. I hereby agree that I have had an opportunity to discuss and clarify the risks and other concerns with the medical practitioner. I hereby give my free consent to the Clinic to conduct the Test on the sample provided by me.',
  'I shall provide accurate medical and personal information about my age, medical history, health concerns, symptoms, dietary habits, allergies, medications, lifestyle habits, family history and/or any other details/questions that enables the Clinic to conduct and interpret the results of the tests effectively.',
  'I shall not hold the Clinic responsible or liable for the interpretation or analysis of the tests conducted by the Clinic solely based on the medical information provided by me.',
  'I understand that though genomics testing provide generally accurate results, several sources of errors are possible. Due to current limitations in technology and incomplete knowledge on genes and diseases, there is a possibility that the test results may be inconclusive or of unknown significance which may require further testing.',
  'I hereby understand that the results/outcome of the tests is indicative and cannot be perceived as conclusive or guaranteed. Further clinical correlation may be required.',
  'I understand that the Clinic is not a specimen banking facility and therefore the sample shall be discarded after 2 (two) months.',
  'I hereby provide my consent to the Clinic to store my personal data in safe custody in an encrypted form for medical research purpose.',
  'I further consent and authorize to the collection, processing, use, storage and retention of anonymized data for ongoing test developments, educational, scientific research and/or other related activities.',
  'I understand that the clinic shall not disclose or hand-over the results of the tests to anyone else other than me, unless required by law or expressly authorized by me.',
  'I herein agree that a copy of this consent form is retained by me for any future use that may arise.'
];

// ── Signature Pad ──────────────────────────────────────────────────────────
function SignaturePad({ onSave }) {
  const canvasRef = useRef(null);
  const drawing   = useRef(false);
  const lastPos   = useRef(null);
  const [isEmpty, setIsEmpty] = useState(true);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width  / rect.width;
    const scaleY = canvas.height / rect.height;
    const src = e.touches ? e.touches[0] : e;
    return { x: (src.clientX - rect.left) * scaleX, y: (src.clientY - rect.top) * scaleY };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = canvas.offsetWidth  * dpr;
    canvas.height = canvas.offsetHeight * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
  }, []);

  const startDraw = useCallback((e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const pos = getPos(e, canvas);
    drawing.current = true;
    lastPos.current = pos;
    setIsEmpty(false);
  }, []);

  const draw = useCallback((e) => {
    e.preventDefault();
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = '#0d1b2a';
    ctx.lineWidth   = 2.2;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';
    ctx.stroke();
    lastPos.current = pos;
  }, []);

  const stopDraw = useCallback(() => {
    if (!drawing.current) return;
    drawing.current = false;
    if (canvasRef.current) onSave(canvasRef.current.toDataURL('image/png'));
  }, [onSave]);

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
    onSave(null);
  };

  return (
    <div className="sig-section">
      <div className="sig-label"><RiPenNibLine style={{marginRight:5}}/>Draw Your Signature</div>
      <div className="sig-canvas-wrap">
        <canvas ref={canvasRef} className="sig-canvas"
          onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
          onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw} />
        {isEmpty && (
          <div className="sig-placeholder"><RiPenNibLine /> Sign here using mouse or touch</div>
        )}
      </div>
      <div className="sig-actions">
        <button type="button" className="sig-clear-btn" onClick={clear}>
          <RiDeleteBin6Line style={{marginRight:4}}/>Clear
        </button>
        {!isEmpty && (
          <span style={{fontSize:12,color:'#27ae60',display:'flex',alignItems:'center',gap:4,fontWeight:600}}>
            <RiCheckLine /> Signature captured
          </span>
        )}
      </div>
      <p className="sig-hint">Your drawn signature will be embedded in the generated PDF.</p>
    </div>
  );
}

// ── Success Screen ─────────────────────────────────────────────────────────
function SuccessScreen({ patientId, onGoHome }) {
  const formPdfUrl    = getPDFUrl(patientId, 'form');
  const consentPdfUrl = getPDFUrl(patientId, 'consent');

  return (
    <div className="consent-success">
      <div className="cs-icon">✅</div>
      <h2 className="cs-title">All Done!</h2>
      <p className="cs-sub">Both PDFs have been generated and saved.</p>
      <div className="cs-patient-id">Patient ID: <strong>{patientId}</strong></div>
      <div className="cs-pdf-btns">
        <a href={formPdfUrl} download className="pdf-btn">
          <RiDownloadLine /> Download Form PDF
        </a>
        <a href={consentPdfUrl} download className="pdf-btn consent-pdf-btn">
          <RiDownloadLine /> Download Consent PDF
        </a>
      </div>
      <button className="btn-ghost" style={{marginTop:16}} onClick={onGoHome}>
        Go to Dashboard
      </button>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function ConsentForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Pre-fill from URL params when redirected from another form
  const prefillPatientId = searchParams.get('patientId')      || '';
  const prefillName      = searchParams.get('name')           || '';
  const prefillRef       = searchParams.get('referenceNumber')|| '';

  const [form, setForm] = useState({
    name:          prefillName,
    age:           '',
    gender:        '',
    phone:         '',
    email:         '',
    signatureName: prefillName,
    agreed:        false,
    date:          new Date().toISOString().split('T')[0]
  });
  const [signatureDataURL, setSignatureDataURL] = useState(null);
  const [submitting, setSubmitting]             = useState(false);
  const [submitted, setSubmitted]               = useState(false);
  const [finalPatientId, setFinalPatientId]     = useState(prefillPatientId);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.agreed)         { toast.error('You must agree to the informed consent'); return; }
    if (!form.name)            { toast.error('Patient name is required'); return; }
    if (!signatureDataURL)     { toast.error('Please draw your signature'); return; }
    if (!prefillPatientId)     { toast.error('No Patient ID found. Please submit a form first.'); return; }

    setSubmitting(true);
    try {
      const res = await submitConsent({
        patientId:        prefillPatientId,
        signatureDataURL,
        formData:         JSON.stringify(form)
      });
      setFinalPatientId(res.data?.patient?.patientId || prefillPatientId);
      toast.success('Consent submitted! Both PDFs generated ✓');
      setSubmitted(true);
    } catch (err) {
      toast.error(err.message || 'Submission failed');
    }
    setSubmitting(false);
  };

  if (submitted) {
    return (
      <div className="form-page page-fade">
        <SuccessScreen patientId={finalPatientId} onGoHome={() => navigate('/dashboard')} />
      </div>
    );
  }

  return (
    <div className="form-page page-fade">
      <div className="form-page-header">
        <div className="form-type-badge consent">CONSENT</div>
        <h1 className="form-page-title">Patient Consent Form</h1>
        <p className="form-page-sub">GenepoweRx — Step 2 of 2: Informed Consent</p>
      </div>

      {/* Patient ID banner if redirected */}
      {prefillPatientId && (
        <div className="consent-patient-banner">
          <span className="cpb-label">Patient ID</span>
          <span className="cpb-id">{prefillPatientId}</span>
          {prefillRef && <span className="cpb-ref">Ref: {prefillRef}</span>}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <FormSection title="Patient Information" icon={<RiUserLine />}>
          <FormGrid cols={3}>
            <Input label="Full Name" required value={form.name} onChange={e => set('name', e.target.value)} />
            <Input label="Age" type="number" value={form.age} onChange={e => set('age', e.target.value)} />
            <Select label="Gender" value={form.gender} onChange={e => set('gender', e.target.value)} options={['Male','Female','Prefer not to say']} />
          </FormGrid>
          <FormGrid cols={3}>
            <Input label="Phone Number" value={form.phone} onChange={e => set('phone', e.target.value)} />
            <Input label="Email Address" type="email" value={form.email} onChange={e => set('email', e.target.value)} />
            <Input label="Date" type="date" value={form.date} onChange={e => set('date', e.target.value)} />
          </FormGrid>
        </FormSection>

        <FormSection title="Informed Consent Declaration" icon={<RiShieldCheckLine />}>
          <p style={{fontSize:13,color:'var(--text-muted)',marginBottom:14,lineHeight:1.6}}>
            By signing this form, I acknowledge that I have read and understood all terms stated herein:
          </p>
          <div className="consent-text">
            <ol>{CONSENT_POINTS.map((p,i) => <li key={i}>{p}</li>)}</ol>
          </div>
          <label className="consent-agree">
            <input type="checkbox" checked={form.agreed} onChange={e => set('agreed', e.target.checked)} />
            <span>I have read and agree to the informed consent above</span>
          </label>
        </FormSection>

        <FormSection title="Digital Signature" icon={<RiPenNibLine />}>
          <FormGrid cols={2}>
            <Input label="Full Name (Print)" required value={form.signatureName} onChange={e => set('signatureName', e.target.value)} placeholder="Type your full name" />
            <Input label="Date" type="date" value={form.date} onChange={e => set('date', e.target.value)} />
          </FormGrid>
          <SignaturePad onSave={setSignatureDataURL} />
          {signatureDataURL && (
            <div style={{marginTop:14,padding:12,background:'#f0f9f4',border:'1.5px solid #27ae60',borderRadius:10}}>
              <p style={{fontSize:12,color:'#27ae60',fontWeight:600,marginBottom:8}}>✓ Signature Preview</p>
              <img src={signatureDataURL} alt="sig" style={{maxHeight:70,border:'1px solid #dde8f0',borderRadius:6,background:'#fff',padding:4}} />
            </div>
          )}
        </FormSection>

        <div className="submit-bar">
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting
              ? <><span className="btn-spinner"/> Generating PDFs...</>
              : <><RiShieldCheckLine/> Submit & Generate PDFs</>}
          </button>
        </div>
      </form>
    </div>
  );
}
