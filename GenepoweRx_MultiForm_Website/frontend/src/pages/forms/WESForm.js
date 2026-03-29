import logo from '../../assets/logo.png';
import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useFormDraft } from './useFormDraft';
import { useFormSubmit } from './useFormSubmit';
import {
  FormSection, FormGrid, Input, Select, Textarea, RadioGroup,
  DraftBar, SubmitBar
} from '../../components/common/FormComponents';
import RevisitBanner from '../../components/common/RevisitBanner';
import FileUpload from '../../components/common/FileUpload';
import { RiUserLine, RiTestTubeLine, RiDnaLine } from 'react-icons/ri';
import './FormPage.css';

const TESTS = ['Whole Exome Sequencing (WES)','Clinical Exome Sequencing (CES)','Targeted Sequencing','Whole Exome Sequencing + Mitochondrial DNA sequencing (WES+CES)','Single Gene Sequencing (SGS)','Mitochondrial DNA (Mito)','Other'];

const initData = (name) => ({
  name: name||'', age:'', gender:'', phone:'', address:'', email:'',
  referredDoctor:'', sampleCoordinator:'', preCounselor:'', date:'',
  testDetails:[], indications:'', testAdvised:'', specificGenes:'',
  clinicalSymptoms:'', ageOfOnset:'', consanguinity:'', diseaseProgression:'',
  currentHealthStatus:'', investigationsPerformed:'', treatment:'',
  geneticTestingBefore:'', geneticTestingDetails:'', familyGeneticHistory:''
});

export default function WESForm() {
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
  const { submitting, handleSubmit: doSubmit } = useFormSubmit('WES');
  const { draftId, draftName, setDraftName, isSaving, handleSaveDraft, loadDraft } = useFormDraft('WES');

  useEffect(() => { if (paramDraftId) loadDraft(paramDraftId, setForm); }, [paramDraftId, loadDraft]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) { toast.error('Name is required'); return; }
    const patientData = {
      patientId: prefillPatientId || undefined,
      name: form.name, age: form.age, gender: form.gender,
      phone: form.phone, email: form.email, address: form.address,
      referralDoctor: form.referredDoctor, coordinator: form.sampleCoordinator
    };
    await doSubmit(form, patientData, draftId || '', uploadedFiles);
  };

  return (
    <div className="form-page page-fade">
      <div className="form-logo-bar">
        <img src={logo} alt="GenepoweRx" className="form-logo" />
      </div>
      <div className="form-page-header">
        <div className="form-type-badge wes">WES</div>
        <h1 className="form-page-title">WES Condition Specific Questionnaire</h1>
        <p className="form-page-sub">GenepoweRx — Whole Exome Sequencing</p>
      </div>

      <RevisitBanner patientId={prefillPatientId} patientName={prefillName} isRevisit={isRevisit} />
      <DraftBar onSave={() => handleSaveDraft(form)} onLoad={() => loadDraft(draftId||'', setForm)}
        draftName={draftName} setDraftName={setDraftName} isSaving={isSaving} />

      <form onSubmit={handleSubmit}>
        <FormSection title="Patient Information" icon={<RiUserLine />}>
          <FormGrid cols={3}>
            <Input label="Name" required value={form.name} onChange={e => set('name', e.target.value)} />
            <Input label="Age" type="number" value={form.age} onChange={e => set('age', e.target.value)} />
            <Select label="Gender" required value={form.gender} onChange={e => set('gender', e.target.value)} options={['Male','Female','Prefer not to say']} />
          </FormGrid>
          <FormGrid cols={3}>
            <Input label="Phone Number" required value={form.phone} onChange={e => set('phone', e.target.value)} />
            <Input label="Email" required type="email" value={form.email} onChange={e => set('email', e.target.value)} />
            <Input label="Address" value={form.address} onChange={e => set('address', e.target.value)} />
          </FormGrid>
          <FormGrid cols={3}>
            <Input label="Referred Doctor" value={form.referredDoctor} onChange={e => set('referredDoctor', e.target.value)} />
            <Input label="Sample Coordinator" value={form.sampleCoordinator} onChange={e => set('sampleCoordinator', e.target.value)} />
            <Input label="Pre-Counselor" value={form.preCounselor} onChange={e => set('preCounselor', e.target.value)} />
          </FormGrid>
          <FormGrid cols={1}>
            <Input label="Date" required type="date" value={form.date} onChange={e => set('date', e.target.value)} />
          </FormGrid>
        </FormSection>

        <FormSection title="Test Details" icon={<RiDnaLine />}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:8,marginBottom:16}}>
            {TESTS.map(t => (
              <label key={t} className={`checkbox-label ${form.testDetails.includes(t) ? 'checked' : ''}`}>
                <input type="checkbox" checked={form.testDetails.includes(t)}
                  onChange={e => set('testDetails', e.target.checked ? [...form.testDetails, t] : form.testDetails.filter(x => x !== t))} />
                <span>{t}</span>
              </label>
            ))}
          </div>
          <FormGrid cols={2}>
            <Textarea label="Indications for Genetic Testing" rows={3} value={form.indications} onChange={e => set('indications', e.target.value)} />
            <Textarea label="Test Advised / Referred by the Doctor" rows={3} value={form.testAdvised} onChange={e => set('testAdvised', e.target.value)} />
          </FormGrid>
          <Textarea label="Any Specific Conditions or Genes to Look For" rows={2} value={form.specificGenes} onChange={e => set('specificGenes', e.target.value)} />
        </FormSection>

        <FormSection title="Clinical Details" icon={<RiTestTubeLine />}>
          <FormGrid cols={2}>
            <Textarea label="Clinical Symptoms" rows={3} value={form.clinicalSymptoms} onChange={e => set('clinicalSymptoms', e.target.value)} placeholder="List symptoms..." />
            <Input label="Age of Onset of Symptoms" value={form.ageOfOnset} onChange={e => set('ageOfOnset', e.target.value)} placeholder="e.g. 5 years" />
          </FormGrid>
          <FormGrid cols={2}>
            <RadioGroup label="H/O Consanguinity" name="wes_cons" options={['Yes','No']} value={form.consanguinity} onChange={e => set('consanguinity', e.target.value)} />
            <Input label="Disease Progression" value={form.diseaseProgression} onChange={e => set('diseaseProgression', e.target.value)} placeholder="Stable / Progressive / Improving" />
          </FormGrid>
          <FormGrid cols={2}>
            <Textarea label="Current Health Status" rows={3} value={form.currentHealthStatus} onChange={e => set('currentHealthStatus', e.target.value)} />
            <Textarea label="Any Investigations Performed" rows={3} value={form.investigationsPerformed} onChange={e => set('investigationsPerformed', e.target.value)} />
          </FormGrid>
          <Textarea label="Treatment (if any)" rows={2} value={form.treatment} onChange={e => set('treatment', e.target.value)} />
        </FormSection>

        <FormSection title="Family History / Pedigree" icon={<RiUserLine />}>
          <FormGrid cols={2}>
            <RadioGroup label="Any Genetic Testing Performed Earlier?" name="wes_gentest" options={['Yes','No']} value={form.geneticTestingBefore} onChange={e => set('geneticTestingBefore', e.target.value)} />
            {form.geneticTestingBefore === 'Yes' && (
              <Textarea label="If Yes, Mention It" rows={3} value={form.geneticTestingDetails} onChange={e => set('geneticTestingDetails', e.target.value)} />
            )}
          </FormGrid>
          <Textarea label="History of Any Genetic Diseases in the Family" rows={4} value={form.familyGeneticHistory} onChange={e => set('familyGeneticHistory', e.target.value)} />
        </FormSection>

        <FormSection title="Upload Files (Optional)" icon={<RiTestTubeLine />}>
          <FileUpload label="Reports / Investigation Results / Previous Test Reports" accept=".pdf,.jpg,.jpeg,.png" multiple onFilesChange={setUploadedFiles} hint="Upload any relevant documents (max 5 files, 10MB each)" />
        </FormSection>

        <SubmitBar onSubmit={handleSubmit} isSubmitting={submitting} formName="WES Questionnaire" />
      </form>
    </div>
  );
}
