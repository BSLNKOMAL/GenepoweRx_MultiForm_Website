import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { submitForm } from '../../services/api';

export function useFormSubmit(formType) {
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const prefillPatientId = searchParams.get('patientId') || '';
  const prefillName      = searchParams.get('name')      || '';
  const isRevisit        = searchParams.get('isRevisit') === 'true';

  const handleSubmit = async (formData, patientData, draftId = '', files = []) => {
    setSubmitting(true);
    try {
      const payload = {
        formType,
        formData:    JSON.stringify(formData),
        patientData: JSON.stringify({
          ...patientData,
          patientId: prefillPatientId || patientData.patientId || ''
        }),
        draftId,
        files: Array.isArray(files) ? files : []
      };

      const res = await submitForm(payload);
      const { patient, redirectToConsent, visitLabel, isRevisit: wasRevisit } = res.data;

      // ── Mark TRF in localStorage if came from Patient Samples page ──
      const sampleId = searchParams.get('sampleId') || sessionStorage.getItem('pendingSampleId');
      const markTRF  = searchParams.get('markTRF') === 'true';
      if (sampleId && markTRF) {
        try {
          const LS_KEY = 'gpx_patient_samples';
          const all = JSON.parse(localStorage.getItem(LS_KEY) || '[]');
          const updated = all.map(s =>
            s.id === sampleId
              ? { ...s, trfStatus: true, testType: formType }
              : s
          );
          localStorage.setItem(LS_KEY, JSON.stringify(updated));
          sessionStorage.removeItem('pendingSampleId');
          toast.success('✓ TRF marked complete in Patient Samples');
        } catch {}
      }

      if (wasRevisit) {
        toast.success(`${visitLabel} saved for ${patient.name}! ID: ${patient.patientId}`);
      } else {
        toast.success(`Submitted! Patient ID: ${patient.patientId}`);
      }

      if (redirectToConsent) {
        const params = new URLSearchParams({
          patientId:       patient.patientId,
          name:            patient.name || '',
          referenceNumber: patient.referenceNumber || ''
        });
        navigate(`/forms/consent?${params.toString()}`);
      } else {
        navigate(`/patients/${patient.patientId}`);
      }
    } catch (err) {
      toast.error(err.message || 'Submission failed');
    }
    setSubmitting(false);
  };

  return { submitting, handleSubmit, prefillPatientId, prefillName, isRevisit };
}