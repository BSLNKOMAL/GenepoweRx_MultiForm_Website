import logo from '../../assets/logo.png';
import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useFormDraft } from './useFormDraft';
import { useFormSubmit } from './useFormSubmit';
import {
  FormSection, FormGrid, Input, Select, Textarea, RadioGroup,
  MedicationEntry, DraftBar, SubmitBar
} from '../../components/common/FormComponents';
import RevisitBanner from '../../components/common/RevisitBanner';
import FileUpload from '../../components/common/FileUpload';
import { RiUserLine, RiTestTubeLine, RiHeartLine, RiMentalHealthLine } from 'react-icons/ri';
import './FormPage.css';

const TESTS = ['Whole Exome Sequencing (WES)','Clinical Exome Sequencing (CES)','CES + Mitochondrial Sequencing','Targeted Sequencing for Oncology','Whole transcriptome analysis (WTA)','small RNA seq','mRNA analysis (mRNA seq)','Sanger Sequencing','Hereditary Cancer Screening (HCS)','WES + Mitochondrial Sequencing','To be filled by genetic Counsellor','Other'];
const SAMPLES = ['Whole Blood in EDTA','FFPE Blocks','Swab / Specimen / Culture','Tissue (PBS / Saline / RNA Later / Others)','Sputum','Whole Blood in cfDNA Tubes','To be filled by genetic Counsellor','Other'];
const FAMILY_CONDS = ['Allergies','Asthma','Depression / Suicide Attempts','Premature Myocardial Infarction','Sudden Death','High Blood Pressure','Cerebrovascular Accident','Diabetes','Seizures','Mental Illness','Cancer','Hearing / Speech Problems','Alcohol Abuse','Thyroid Disease','Liver Cirrhosis','Rheumatoid Arthritis','Connective Tissue Diseases'];
const MENTAL_QS = ['Do you face any difficulty concentrating on your work?','Do you feel you are under constant stress?','Do you feel unhappy or depressed most days of the week?','Do you feel you are losing confidence?','Do you consider yourself an anxious person?'];

const initData = (name) => ({
  name: name||'', age:'', gender:'', phone:'', email:'', address:'',
  referralDoctor:'', coordinator:'', testName:'', sampleType:'',
  medications:[], extraMeds:'', familyHistory:{}, familyDetails:{},
  mental:{}, menstrual:'', infertility:'', erectile:'', stds:'', stdDetails:'',
  doctorNotes:''
});

export default function ShortLifestyleForm() {
  const { draftId: paramDraftId } = useParams();
  const [searchParams] = useSearchParams();

  const prefillPatientId = searchParams.get('patientId') || '';
  const prefillName      = searchParams.get('name') || '';
  const isRevisit        = searchParams.get('isRevisit') === 'true';

  // Parse prefill data from URL (when patient edits previous visit as template)
  const prefillDataRaw = searchParams.get('prefillData') || '';
  const prefillFormData = (() => { try { return prefillDataRaw ? JSON.parse(prefillDataRaw) : null; } catch { return null; } })();

  // Ensure array/object fields are properly typed after prefill
  const safePrefill = prefillFormData ? {
    ...prefillFormData,
    testDetails:  Array.isArray(prefillFormData.testDetails)  ? prefillFormData.testDetails  : [],
    medications:  Array.isArray(prefillFormData.medications)  ? prefillFormData.medications  : [],
    complaints:   Array.isArray(prefillFormData.complaints)   ? prefillFormData.complaints   : [{c:'',onset:'',duration:''}],
    reasons:      (prefillFormData.reasons   && typeof prefillFormData.reasons   === 'object') ? prefillFormData.reasons   : {},
    pastMedical:  (prefillFormData.pastMedical && typeof prefillFormData.pastMedical === 'object') ? prefillFormData.pastMedical : {},
    surgeries:    (prefillFormData.surgeries  && typeof prefillFormData.surgeries  === 'object') ? prefillFormData.surgeries  : {},
    familyFather: (prefillFormData.familyFather && typeof prefillFormData.familyFather === 'object') ? prefillFormData.familyFather : {},
    familyMother: (prefillFormData.familyMother && typeof prefillFormData.familyMother === 'object') ? prefillFormData.familyMother : {},
    familySibling:(prefillFormData.familySibling && typeof prefillFormData.familySibling === 'object') ? prefillFormData.familySibling : {},
    familyOther:  (prefillFormData.familyOther  && typeof prefillFormData.familyOther  === 'object') ? prefillFormData.familyOther  : {},
    mental:       (prefillFormData.mental  && typeof prefillFormData.mental  === 'object') ? prefillFormData.mental  : {},
    ros:          (prefillFormData.ros     && typeof prefillFormData.ros     === 'object') ? prefillFormData.ros     : {},
    familyHistory:(prefillFormData.familyHistory && typeof prefillFormData.familyHistory === 'object') ? prefillFormData.familyHistory : {},
    familyDetails:(prefillFormData.familyDetails && typeof prefillFormData.familyDetails === 'object') ? prefillFormData.familyDetails : {},
  } : null;
  const [form, setForm]                   = useState(safePrefill || initData(prefillName));
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const { submitting, handleSubmit: doSubmit } = useFormSubmit('SHORT_LIFESTYLE');
  const { draftId, draftName, setDraftName, isSaving, handleSaveDraft, loadDraft } = useFormDraft('SHORT_LIFESTYLE');

  useEffect(() => { if (paramDraftId) loadDraft(paramDraftId, setForm); }, [paramDraftId, loadDraft]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const addMed = () => set('medications', [...form.medications, {name:'',dosage:'',frequency:''}]);
  const setMed = (i,k,v) => set('medications', form.medications.map((m,idx) => idx===i ? {...m,[k]:v} : m));
  const delMed = (i) => set('medications', form.medications.filter((_,idx) => idx!==i));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.gender) { toast.error('Name and Gender are required'); return; }
    const patientData = {
      patientId: prefillPatientId || undefined,
      name: form.name, age: form.age, gender: form.gender,
      phone: form.phone, email: form.email, address: form.address,
      referralDoctor: form.referralDoctor, coordinator: form.coordinator
    };
    await doSubmit(form, patientData, draftId || '', uploadedFiles);
  };

  return (
    <div className="form-page page-fade">
      <div className="form-logo-bar">
        <img src={logo} alt="GenepoweRx" className="form-logo" />
      </div>
      <div className="form-page-header">
        <div className="form-type-badge short">SHORT LIFESTYLE</div>
        <h1 className="form-page-title">Short Lifestyle Patient Intake</h1>
        <p className="form-page-sub">GenepoweRx — Abbreviated Assessment</p>
      </div>

      <RevisitBanner patientId={prefillPatientId} patientName={prefillName} isRevisit={isRevisit} />
      <DraftBar onSave={() => handleSaveDraft(form)} onLoad={() => loadDraft(draftId||'', setForm)}
        draftName={draftName} setDraftName={setDraftName} isSaving={isSaving} />

      <form onSubmit={handleSubmit}>
        <FormSection title="Patient Information" icon={<RiUserLine />}>
          <FormGrid cols={3}>
            <Input label="Name" required value={form.name} onChange={e => set('name',e.target.value)} />
            <Input label="Age" type="number" value={form.age} onChange={e => set('age',e.target.value)} />
            <Select label="Gender" required value={form.gender} onChange={e => set('gender',e.target.value)} options={['Male','Female','Prefer not to say']} />
          </FormGrid>
          <FormGrid cols={3}>
            <Input label="Phone Number" value={form.phone} onChange={e => set('phone',e.target.value)} />
            <Input label="Email" type="email" value={form.email} onChange={e => set('email',e.target.value)} />
            <Input label="Referral Doctor / Hospital" value={form.referralDoctor} onChange={e => set('referralDoctor',e.target.value)} />
          </FormGrid>
          <FormGrid cols={2}>
            <Textarea label="Address" rows={2} value={form.address} onChange={e => set('address',e.target.value)} />
            <Input label="Pre-Counselor / Sample Coordinator" required value={form.coordinator} onChange={e => set('coordinator',e.target.value)} />
          </FormGrid>
        </FormSection>

        <FormSection title="Test Details" icon={<RiTestTubeLine />}>
          <FormGrid cols={2}>
            <Select label="Test Name" value={form.testName} onChange={e => set('testName',e.target.value)} options={TESTS} />
            <Select label="Sample Type" value={form.sampleType} onChange={e => set('sampleType',e.target.value)} options={SAMPLES} />
          </FormGrid>
        </FormSection>

        <FormSection title="Current / Past Medications" icon={<RiTestTubeLine />}>
          {form.medications.map((m,i) => (
            <MedicationEntry key={i} index={i} data={m} onChange={(k,v) => setMed(i,k,v)} onDelete={() => delMed(i)} />
          ))}
          <button type="button" className="btn-secondary add-row-btn" onClick={addMed}>+ Add Medication</button>
          <Textarea label="Extra Medicines (Notes)" rows={2} value={form.extraMeds} onChange={e => set('extraMeds',e.target.value)} />
        </FormSection>

        <FormSection title="Family History" icon={<RiHeartLine />}>
          {FAMILY_CONDS.map(cond => {
            const safeKey = cond.replace(/\s+/g,'_').replace(/\//g,'_');
            return (
              <div key={cond} style={{display:'flex',alignItems:'center',gap:12,marginBottom:8}}>
                <label className={`checkbox-label ${form.familyHistory[safeKey] ? 'checked' : ''}`} style={{minWidth:220}}>
                  <input type="checkbox" checked={!!form.familyHistory[safeKey]}
                    onChange={e => set('familyHistory', { ...form.familyHistory, [safeKey]: e.target.checked })} />
                  <span>{cond}</span>
                </label>
                {form.familyHistory[safeKey] && (
                  <input className="gx-input" placeholder="Details..." style={{maxWidth:300}}
                    value={form.familyDetails[safeKey] || ''}
                    onChange={e => set('familyDetails', { ...form.familyDetails, [safeKey]: e.target.value })} />
                )}
              </div>
            );
          })}
        </FormSection>

        <FormSection title="Mental Health History" icon={<RiMentalHealthLine />}>
          {MENTAL_QS.map((q, i) => (
            <div key={i} className="mental-row">
              <span className="mental-q">{q}</span>
              <RadioGroup name={`sl_mental_${i}`} options={['Yes','No','Sometimes']} value={form.mental[i]} onChange={e => set('mental', { ...form.mental, [i]: e.target.value })} />
            </div>
          ))}
        </FormSection>

        <FormSection title="Sexual Health" icon={<RiUserLine />}>
          {form.gender === 'Male' && (
            <Select label="Erectile Dysfunction" value={form.erectile} onChange={e => set('erectile',e.target.value)} options={['Yes','No']} />
          )}
          {form.gender === 'Female' && (
            <FormGrid cols={2}>
              <Select label="History of Infertility" value={form.infertility} onChange={e => set('infertility',e.target.value)} options={['Yes','No']} />
              <Select label="Menstrual Cycles" value={form.menstrual} onChange={e => set('menstrual',e.target.value)} options={['Regular','Irregular']} />
              <Select label="History of STDs" value={form.stds} onChange={e => set('stds',e.target.value)} options={['Yes','No']} />
              {form.stds === 'Yes' && <Input label="STD Details" value={form.stdDetails} onChange={e => set('stdDetails',e.target.value)} />}
            </FormGrid>
          )}
          {!form.gender && <p style={{color:'var(--text-muted)',fontSize:13}}>Select a gender above to see relevant questions.</p>}
        </FormSection>

        <FormSection title="Doctor Notes" icon={<RiTestTubeLine />}>
          <Textarea label="Additional Instructions / Clinical Notes" rows={5} value={form.doctorNotes} onChange={e => set('doctorNotes',e.target.value)} />
        </FormSection>

        <FormSection title="Upload Files (Optional)" icon={<RiTestTubeLine />}>
          <FileUpload label="Medical Reports / Prescriptions" accept=".pdf,.jpg,.jpeg,.png" multiple onFilesChange={setUploadedFiles} hint="Upload any relevant medical documents (max 5 files, 10MB each)" />
        </FormSection>

        <SubmitBar onSubmit={handleSubmit} isSubmitting={submitting} formName="Short Lifestyle Form" />
      </form>
    </div>
  );
}
