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
import { RiUserLine, RiTestTubeLine, RiVirusLine } from 'react-icons/ri';
import './FormPage.css';

const TESTS = ['Whole Exome Sequencing (WES)','Clinical Exome Sequencing (CES)','Targeted Sequencing (Oncology)','Whole Exome Sequencing + Mitochondrial DNA sequencing (WES+Mito)','Single Gene Sequencing (SGS)','Microsatellite Instability Assay (MSI)','Tumor Mutation Burden (TMB)'];
const SAMPLE_TYPES = ['FFPE Block','Fresh Tissue','Blood','Saliva','Other'];

const initData = (name) => ({
  name: name||'', age:'', gender:'', phone:'', email:'', pathologyReportNo:'',
  referredDoctor:'', sampleType:'', preCounselor:'', sampleCoordinator:'', ffpeBlockNo:'',
  testAdvised:'', testDetails:[], specificGenes:'',
  presentComplaints:'', pastMedicalHistory:'', medications:'',
  cancerType:'', cancerStage:'', primarySite:'',
  familyCancerHistory:'', dietLifestyle:'',
  pathologyAttached:'', pathologyInference:'', notes:''
});

export default function ONCoForm() {
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
  const { submitting, handleSubmit: doSubmit } = useFormSubmit('ONCO');
  const { draftId, draftName, setDraftName, isSaving, handleSaveDraft, loadDraft } = useFormDraft('ONCO');

  useEffect(() => { if (paramDraftId) loadDraft(paramDraftId, setForm); }, [paramDraftId, loadDraft]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.cancerType) { toast.error('Name and Cancer Type are required'); return; }
    const patientData = {
      patientId: prefillPatientId || undefined,
      name: form.name, age: form.age, gender: form.gender,
      phone: form.phone, email: form.email,
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
        <div className="form-type-badge onco">ONCO</div>
        <h1 className="form-page-title">ONCO Questionnaire</h1>
        <p className="form-page-sub">GenepoweRx — Somatic Testing Form</p>
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
            <Input label="Phone Number" required value={form.phone} onChange={e => set('phone',e.target.value)} />
            <Input label="Email" required type="email" value={form.email} onChange={e => set('email',e.target.value)} />
            <Input label="Pathology Report No." required value={form.pathologyReportNo} onChange={e => set('pathologyReportNo',e.target.value)} />
          </FormGrid>
          <FormGrid cols={3}>
            <Input label="Referred Doctor" required value={form.referredDoctor} onChange={e => set('referredDoctor',e.target.value)} />
            <Select label="Sample Type" required value={form.sampleType} onChange={e => set('sampleType',e.target.value)} options={SAMPLE_TYPES} />
            <Input label="Pre-Counselor" value={form.preCounselor} onChange={e => set('preCounselor',e.target.value)} />
          </FormGrid>
          <FormGrid cols={2}>
            <Input label="Sample Coordinator" required value={form.sampleCoordinator} onChange={e => set('sampleCoordinator',e.target.value)} />
            <Input label="FFPE Block No." required value={form.ffpeBlockNo} onChange={e => set('ffpeBlockNo',e.target.value)} />
          </FormGrid>
        </FormSection>

        <FormSection title="Test Details" icon={<RiTestTubeLine />}>
          <Input label="Test Advised / Referred by the Doctor" required value={form.testAdvised} onChange={e => set('testAdvised',e.target.value)} />
          <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:8,marginTop:12,marginBottom:12}}>
            {TESTS.map(t => (
              <label key={t} className={`checkbox-label ${form.testDetails.includes(t)?'checked':''}`}>
                <input type="checkbox" checked={form.testDetails.includes(t)}
                  onChange={e => set('testDetails', e.target.checked ? [...form.testDetails,t] : form.testDetails.filter(x=>x!==t))} />
                <span>{t}</span>
              </label>
            ))}
          </div>
          <Textarea label="Specify condition/genes to be screened (if any)" rows={2} value={form.specificGenes} onChange={e => set('specificGenes',e.target.value)} />
        </FormSection>

        <FormSection title="Clinical History" icon={<RiVirusLine />}>
          <Textarea label="Present Complaints" required rows={4} value={form.presentComplaints} onChange={e => set('presentComplaints',e.target.value)} placeholder="List with number indexes..." />
          <Textarea label="Past Medical History" required rows={4} value={form.pastMedicalHistory} onChange={e => set('pastMedicalHistory',e.target.value)} placeholder="List with number indexes..." />
          <Textarea label="Medications" required rows={4} value={form.medications} onChange={e => set('medications',e.target.value)} placeholder="List with number indexes..." />
        </FormSection>

        <FormSection title="Oncology Details" icon={<RiVirusLine />}>
          <FormGrid cols={3}>
            <Input label="Cancer Type & Stage" required value={form.cancerType} onChange={e => set('cancerType',e.target.value)} placeholder="e.g. Breast Cancer Stage II" />
            <Input label="Cancer Stage" value={form.cancerStage} onChange={e => set('cancerStage',e.target.value)} placeholder="I / II / III / IV" />
            <Input label="Primary Site of Tumor" required value={form.primarySite} onChange={e => set('primarySite',e.target.value)} placeholder="e.g. Left breast" />
          </FormGrid>
          <Textarea label="Family Health History of Cancer" required rows={4} value={form.familyCancerHistory} onChange={e => set('familyCancerHistory',e.target.value)} />
          <Textarea label="Diet and Lifestyle Details" required rows={4} value={form.dietLifestyle} onChange={e => set('dietLifestyle',e.target.value)} placeholder="No. of meals, smoking & drinking habits, exercises..." />
        </FormSection>

        <FormSection title="Pathology & Notes" icon={<RiTestTubeLine />}>
          <FormGrid cols={2}>
            <RadioGroup label="Pathology Report Attached?" required name="onco_path" options={['Yes','No']} value={form.pathologyAttached} onChange={e => set('pathologyAttached',e.target.value)} />
          </FormGrid>
          {form.pathologyAttached === 'No' && (
            <Textarea label="Pathology Report Inference (Required if not attached)" required rows={4} value={form.pathologyInference} onChange={e => set('pathologyInference',e.target.value)} />
          )}
          <Textarea label="Notes (Additional Details)" rows={4} value={form.notes} onChange={e => set('notes',e.target.value)} />
        </FormSection>

        <FormSection title="Upload Files (Optional)" icon={<RiTestTubeLine />}>
          <FileUpload label="Pathology Report / Scan Reports / Lab Results" accept=".pdf,.jpg,.jpeg,.png" multiple onFilesChange={setUploadedFiles} hint="Upload pathology reports, scan images, or any relevant documents (max 5 files, 10MB each)" />
        </FormSection>

        <SubmitBar onSubmit={handleSubmit} isSubmitting={submitting} formName="ONCO Questionnaire" />
      </form>
    </div>
  );
}
