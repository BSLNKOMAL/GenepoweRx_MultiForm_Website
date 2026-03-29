import logo from '../../assets/logo.png';
import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useFormDraft } from './useFormDraft';
import { useFormSubmit } from './useFormSubmit';
import {
  FormSection, FormGrid, Input, Select, Textarea, RadioGroup,
  CheckboxList, MedicationEntry, DraftBar, SubmitBar
} from '../../components/common/FormComponents';
import RevisitBanner from '../../components/common/RevisitBanner';
import FileUpload from '../../components/common/FileUpload';
import {
  RiUserLine, RiTestTubeLine, RiHeartLine, RiMentalHealthLine,
  RiLeafLine, RiBodyScanLine
} from 'react-icons/ri';
import './FormPage.css';

const TESTS = ['Whole Exome Sequencing (WES)','Clinical Exome Sequencing (CES)','CES + Mitochondrial Sequencing','Targeted Sequencing for Oncology','Whole transcriptome analysis (WTA)','small RNA seq','mRNA analysis (mRNA seq)','Sanger Sequencing','Hereditary Cancer Screening (HCS)','WES + Mitochondrial Sequencing','To be filled by genetic Counsellor','Other'];
const SAMPLES = ['Whole Blood in EDTA','Whole Blood in Heparin','FFPE Blocks','Swab/Specimen/Culture','Urine','Tissue (in PBS/Saline/RNA Later/Others)','Sputum','Whole Blood in cfDNA Tubes','To be filled by genetic Counsellor','Other'];
const REASONS = ['I want to know if there is any genetic cause for my Medical Condition.','I want to know if there is any genetic cause for a symptom I have been having since a long time.','My family or close relatives are having history of chronic disease.','There is a history of cancer in me/ history of cancer in the family.','Have a history of genetic disease in the immediate family or close relatives.','I want to know the future risks and possibilities regarding my health.','I want to check if we are carriers for any genetic illness.','I want to know treatment plans based on genetics for our illness.','I have received an abnormal prenatal screening test or Amniocentesis.','I want to do it because my other family members have taken genetic testing.','I want to know my Genetic makeup.'];
const PAST_MED = ['Asthma','Peptic Ulcer disease','High Blood Pressure','Inflammatory bowel disease','High Cholesterol','Frequent Constipation','Diabetes','Frequent Diarrhea','Coronary Artery Disease','Seizures','Cerebrovascular Accidents/ Stroke','Migraines','Myocardial Infarction/ Heart Attack','Depression','Hyperthyroidism','Anemia','Hypothyroidism','Cancer','Kidney Stones','Arthritis','Frequent Sinus Infections','Psoriasis/Skin Conditions'];
const SURGERIES = ['Appendectomy','Joint Replacements','Tonsillectomy','Cardiac Stent Placements','Coronary Artery Bypass Grafting (CABG)','Hysterectomy','Splenectomy','Oophorectomy','Bariatric Surgery','Cholecystectomy'];
const FAMILY_CONDS = ['Allergies','Asthma','Depression/Suicide Attempts','Premature Myocardial Infarction','Sudden Death','High Blood Pressure','Cerebrovascular Accident','Diabetes','Seizures','Mental Illness','Cancer','Hearing/Speech Problems','Alcohol Abuse','Thyroid Disease','Liver Cirrhosis','Rheumatoid Arthritis','Connective Tissue Diseases'];
const MENTAL_QS = ['Do you face any difficulty concentrating on your work?','Have you lost much sleep/difficulty sleeping?','Do you feel you are not playing a useful part in your work?','Do you feel you are under constant stress?','Do you feel you could not overcome difficulties?','Do you feel unhappy or depressed most days of the week?','Do you feel you are losing confidence?','Do you consider yourself an anxious person?','Do you have any stressors in family or professional life more than ordinary?'];
const ROS_SECTIONS = {
  Constitutional: ['Lack of Energy','Unexplained Weight Loss/Gain','Loss of Appetite','Fevers','Night Sweats'],
  Cardiovascular: ['Heart Racing/Palpitations','Chest Pain','Swelling of legs/feet','Pain in calf while walking'],
  Respiratory: ['Shortness Of Breath','Prolonged Cough','Wheezing'],
  Gastrointestinal: ['Heartburn','Constipation','Intolerance to certain food','Diarrhea/Loose Stools','Difficulty in Swallowing'],
  Musculoskeletal: ['Joint Pains','Aching Muscles','Swelling of Joints','Back pain'],
  Neurologic: ['Frequent Headaches','Double Vision','Weakness','Change in Sensation','Dizziness','Tremors','Episodes of Vision Loss'],
  'Skin Issues': ['Itching','Persistent Rash','New Skin Lesions','Hair Loss','Excessive Hair'],
  Endocrine: ['Intolerance to Heat or Cold','Frequent Hunger or Thirst','Changes in Sex Drive'],
  ENT: ['Sinus Problem','Difficulty in Hearing','Ringing in Ears'],
  GU: ['Painful Urination','Frequent Urination','Prostate Problems','Kidney Stones'],
  'Allergic/Immunologic': ['Food Allergies','Seasonal Allergies','Itching Eyes/Sneezing','Frequent Infections'],
};

const initData = (name) => ({
  name: name||'', age:'', gender:'', phone:'', email:'', address:'',
  referralDoctor:'', coordinator:'', testName:'', sampleType:'',
  indications:'', specificGenes:'', reasons:{}, complaints:[{c:'',onset:'',duration:''}],
  pastMedical:{}, surgeries:{}, familyFather:{}, familyMother:{}, familySibling:{}, familyOther:{},
  consanguineous:'', familyNotes:'', mental:{}, menstrual:'', infertility:'', erectile:'',
  mentalNotes:'', medications:[], extraMeds:'', ros:{}, rosNotes:'',
  alcohol:'', smoke:'', wakeTime:'', bedTime:'', workout:'', sport:'',
  sleepPattern:'', meals:'', processedFood:'', outsideFood:'', softDrinks:'',
  cuisine:'', foodPref:'', bp:'', pulse:'', height:'', weight:'', bmi:''
});

export default function LifestyleForm() {
  const { draftId: paramDraftId } = useParams();
  const [searchParams] = useSearchParams();

  // Revisit / prefill from URL params
  const prefillPatientId = searchParams.get('patientId') || '';
  const prefillName      = searchParams.get('name') || '';
  const isRevisit        = searchParams.get('isRevisit') === 'true';

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
  const [form, setForm]               = useState(safePrefill || initData(prefillName));
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const { submitting, handleSubmit: doSubmit } = useFormSubmit('LIFESTYLE');
  const { draftId, draftName, setDraftName, isSaving, handleSaveDraft, loadDraft } = useFormDraft('LIFESTYLE');

  useEffect(() => {
    if (paramDraftId) loadDraft(paramDraftId, setForm);
  }, [paramDraftId, loadDraft]);

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));
  const setNested = (obj, key, val) => setForm(prev => ({ ...prev, [obj]: { ...prev[obj], [key]: val } }));
  const addComplaint = () => set('complaints', [...form.complaints, {c:'',onset:'',duration:''}]);
  const setComplaint = (i, k, v) => set('complaints', form.complaints.map((c,idx) => idx===i ? {...c,[k]:v} : c));
  const addMed = () => set('medications', [...form.medications, {name:'',dosage:'',frequency:''}]);
  const setMed = (i, k, v) => set('medications', form.medications.map((m,idx) => idx===i ? {...m,[k]:v} : m));
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
        <div className="form-type-badge lifestyle">LIFESTYLE</div>
        <h1 className="form-page-title">Patient Intake Form</h1>
        <p className="form-page-sub">GenepoweRx — Lifestyle Assessment</p>
      </div>

      <RevisitBanner patientId={prefillPatientId} patientName={prefillName} isRevisit={isRevisit} />
      <DraftBar onSave={() => handleSaveDraft(form)} onLoad={() => loadDraft(draftId || '', setForm)}
        draftName={draftName} setDraftName={setDraftName} isSaving={isSaving} />

      <form onSubmit={handleSubmit}>
        <FormSection title="Patient Information" icon={<RiUserLine />}>
          <FormGrid cols={3}>
            <Input label="Name" required value={form.name} onChange={e => set('name',e.target.value)} placeholder="Full name" />
            <Input label="Age" required type="number" value={form.age} onChange={e => set('age',e.target.value)} placeholder="Age" />
            <Select label="Gender" required value={form.gender} onChange={e => set('gender',e.target.value)} options={['Male','Female','Prefer not to say']} />
          </FormGrid>
          <FormGrid cols={3}>
            <Input label="Phone Number" value={form.phone} onChange={e => set('phone',e.target.value)} placeholder="+91 XXXXX XXXXX" />
            <Input label="Email" type="email" value={form.email} onChange={e => set('email',e.target.value)} placeholder="email@example.com" />
            <Input label="Referral Doctor / Hospital" value={form.referralDoctor} onChange={e => set('referralDoctor',e.target.value)} />
          </FormGrid>
          <FormGrid cols={2}>
            <Textarea label="Address" rows={2} value={form.address} onChange={e => set('address',e.target.value)} />
            <Input label="Pre-Counselor / Sample Coordinator" required value={form.coordinator} onChange={e => set('coordinator',e.target.value)} />
          </FormGrid>
        </FormSection>

        <FormSection title="Test Details" icon={<RiTestTubeLine />}>
          <FormGrid cols={2}>
            <Select label="Test Name" required value={form.testName} onChange={e => set('testName',e.target.value)} options={TESTS} />
            <Select label="Sample Type" required value={form.sampleType} onChange={e => set('sampleType',e.target.value)} options={SAMPLES} />
          </FormGrid>
          <FormGrid cols={2}>
            <Textarea label="Indications for Genetic Testing" rows={2} value={form.indications} onChange={e => set('indications',e.target.value)} />
            <Textarea label="Any Specific Condition or Genes to Look For" rows={2} value={form.specificGenes} onChange={e => set('specificGenes',e.target.value)} />
          </FormGrid>
        </FormSection>

        <FormSection title="Presenting Complaints" icon={<RiHeartLine />}>
          {form.complaints.map((c, i) => (
            <div key={i} className="complaint-row">
              <FormGrid cols={3}>
                <Input label={`Complaint ${i+1}`} value={c.c} onChange={e => setComplaint(i,'c',e.target.value)} placeholder="Describe complaint" />
                <Input label="Onset" value={c.onset} onChange={e => setComplaint(i,'onset',e.target.value)} placeholder="When did it start?" />
                <Input label="Duration" value={c.duration} onChange={e => setComplaint(i,'duration',e.target.value)} placeholder="How long?" />
              </FormGrid>
            </div>
          ))}
          {form.complaints.length < 7 && (
            <button type="button" className="btn-secondary add-row-btn" onClick={addComplaint}>+ Add Complaint</button>
          )}
        </FormSection>

        <FormSection title="Reason for Genetic Testing" icon={<RiTestTubeLine />}>
          <CheckboxList items={REASONS} values={form.reasons} onChange={(k,v) => setNested('reasons',k,v)} columns={2} />
        </FormSection>

        <FormSection title="Past Medical History" icon={<RiHeartLine />}>
          <CheckboxList items={PAST_MED} values={form.pastMedical} onChange={(k,v) => setNested('pastMedical',k,v)} columns={3} />
        </FormSection>

        <FormSection title="Past Surgical History" icon={<RiHeartLine />}>
          <CheckboxList items={SURGERIES} values={form.surgeries} onChange={(k,v) => setNested('surgeries',k,v)} columns={3} />
        </FormSection>

        <FormSection title="Family History" icon={<RiUserLine />}>
          {['Father','Mother','Sibling','Other'].map(rel => (
            <div key={rel} className="family-rel-block">
              <div className="family-rel-label">{rel}</div>
              <CheckboxList items={FAMILY_CONDS} values={form[`family${rel}`]} onChange={(k,v) => setNested(`family${rel}`,k,v)} columns={3} />
            </div>
          ))}
          <FormGrid cols={2}>
            <RadioGroup label="Consanguineous Marriage" name="consanguineous" options={['Yes','No']} value={form.consanguineous} onChange={e => set('consanguineous',e.target.value)} />
            <Textarea label="Notes for Family History" rows={2} value={form.familyNotes} onChange={e => set('familyNotes',e.target.value)} />
          </FormGrid>
        </FormSection>

        <FormSection title="Mental Health History" icon={<RiMentalHealthLine />}>
          {MENTAL_QS.map((q, i) => (
            <div key={i} className="mental-row">
              <span className="mental-q">{q}</span>
              <RadioGroup name={`mental_${i}`} options={['Yes','No','Sometimes']} value={form.mental[i]} onChange={e => setNested('mental',i,e.target.value)} />
            </div>
          ))}
          <FormGrid cols={2}>
            {form.gender === 'Female' && (<>
              <RadioGroup label="Menstrual Cycles" name="menstrual" options={['Regular','Irregular']} value={form.menstrual} onChange={e => set('menstrual',e.target.value)} />
              <RadioGroup label="History of Infertility" name="infertility" options={['Yes','No']} value={form.infertility} onChange={e => set('infertility',e.target.value)} />
            </>)}
            {form.gender === 'Male' && (
              <RadioGroup label="Erectile Dysfunction" name="erectile" options={['Yes','No']} value={form.erectile} onChange={e => set('erectile',e.target.value)} />
            )}
          </FormGrid>
          <Textarea label="Notes on Mental Health" rows={2} value={form.mentalNotes} onChange={e => set('mentalNotes',e.target.value)} />
        </FormSection>

        <FormSection title="Current / Past Medications" icon={<RiTestTubeLine />}>
          {form.medications.map((m, i) => (
            <MedicationEntry key={i} index={i} data={m} onChange={(k,v) => setMed(i,k,v)} onDelete={() => delMed(i)} />
          ))}
          <button type="button" className="btn-secondary add-row-btn" onClick={addMed}>+ Add Medication</button>
          <Textarea label="Extra Medicines (Notes)" rows={2} value={form.extraMeds} onChange={e => set('extraMeds',e.target.value)} />
        </FormSection>

        <FormSection title="Review of Systems" icon={<RiBodyScanLine />}>
          <FormGrid cols={2}>
            {Object.entries(ROS_SECTIONS).map(([sec, items]) => (
              <div key={sec} className="ros-subsection">
                <div className="ros-sec-title">{sec}</div>
                <CheckboxList items={items} values={form.ros[sec] || {}} onChange={(k,v) => setForm(prev => ({ ...prev, ros: { ...prev.ros, [sec]: { ...(prev.ros[sec]||{}), [k]:v } } }))} columns={1} />
              </div>
            ))}
          </FormGrid>
          <Textarea label="Notes on Review of Systems" rows={2} value={form.rosNotes} onChange={e => set('rosNotes',e.target.value)} />
        </FormSection>

        <FormSection title="Personal Health & Lifestyle" icon={<RiLeafLine />}>
          <FormGrid cols={3}>
            <RadioGroup label="Do You Drink Alcohol?" name="alcohol" options={['Yes','Never','Previous Drinker']} value={form.alcohol} onChange={e => set('alcohol',e.target.value)} />
            <RadioGroup label="Do You Smoke Cigarettes?" name="smoke" options={['Yes','Never smoker','Previous smoker']} value={form.smoke} onChange={e => set('smoke',e.target.value)} />
            <RadioGroup label="Sleep Pattern" name="sleepPattern" options={['Disturbed','Normal']} value={form.sleepPattern} onChange={e => set('sleepPattern',e.target.value)} />
          </FormGrid>
          <FormGrid cols={4}>
            <RadioGroup label="Wake Up Time" name="wakeTime" options={['Before 6am','After 6am']} value={form.wakeTime} onChange={e => set('wakeTime',e.target.value)} />
            <RadioGroup label="Bed Time" name="bedTime" options={['Before 9pm','After 9pm']} value={form.bedTime} onChange={e => set('bedTime',e.target.value)} />
            <RadioGroup label="Do You Workout?" name="workout" options={['Yes','No']} value={form.workout} onChange={e => set('workout',e.target.value)} />
            <RadioGroup label="Active Sport When Young?" name="sport" options={['Yes','No']} value={form.sport} onChange={e => set('sport',e.target.value)} />
          </FormGrid>
        </FormSection>

        <FormSection title="Diet & Nutrition" icon={<RiLeafLine />}>
          <FormGrid cols={3}>
            <RadioGroup label="How many meals/day?" name="meals" options={['Less than 3','3','More than 3']} value={form.meals} onChange={e => set('meals',e.target.value)} />
            <RadioGroup label="Processed foods/week?" name="processedFood" options={['None','1','2','More Than 2']} value={form.processedFood} onChange={e => set('processedFood',e.target.value)} />
            <RadioGroup label="Outside food/week?" name="outsideFood" options={['None','1','2','More Than 2']} value={form.outsideFood} onChange={e => set('outsideFood',e.target.value)} />
          </FormGrid>
          <FormGrid cols={3}>
            <RadioGroup label="Soft drinks/week?" name="softDrinks" options={['None','1','2','More than 2']} value={form.softDrinks} onChange={e => set('softDrinks',e.target.value)} />
            <RadioGroup label="Cuisine Preference" name="cuisine" options={['South Indian','North Indian','Continental']} value={form.cuisine} onChange={e => set('cuisine',e.target.value)} />
            <RadioGroup label="Food Preference" name="foodPref" options={['Non Vegeterian','Vegetarian','Egg + Vegetarian']} value={form.foodPref} onChange={e => set('foodPref',e.target.value)} />
          </FormGrid>
        </FormSection>

        <FormSection title="Physical Examination" icon={<RiBodyScanLine />}>
          <FormGrid cols={3}>
            <Input label="Blood Pressure" value={form.bp} onChange={e => set('bp',e.target.value)} placeholder="120/80 mmHg" />
            <Input label="Pulse Rate" value={form.pulse} onChange={e => set('pulse',e.target.value)} placeholder="bpm" />
            <Input label="Height" value={form.height} onChange={e => set('height',e.target.value)} placeholder="cm" />
            <Input label="Weight" value={form.weight} onChange={e => set('weight',e.target.value)} placeholder="kg" />
            <Input label="BMI" value={form.bmi} onChange={e => set('bmi',e.target.value)} placeholder="calculated" />
          </FormGrid>
        </FormSection>

        <FormSection title="Upload Files (Optional)" icon={<RiTestTubeLine />}>
          <FileUpload
            label="Medical Reports / Prescriptions / Lab Results"
            accept=".pdf,.jpg,.jpeg,.png"
            multiple
            onFilesChange={setUploadedFiles}
            hint="Upload any relevant medical documents (max 5 files, 10MB each)"
          />
        </FormSection>

        <SubmitBar onSubmit={handleSubmit} isSubmitting={submitting} formName="Lifestyle Form" />
      </form>
    </div>
  );
}
