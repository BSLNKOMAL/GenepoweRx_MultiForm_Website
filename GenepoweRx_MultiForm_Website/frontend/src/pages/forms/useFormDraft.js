import { useState, useCallback } from 'react';
import { saveDraft, getDraft } from '../../services/api';
import toast from 'react-hot-toast';

export function useFormDraft(formType) {
  const [draftId, setDraftId] = useState(null);
  const [draftName, setDraftName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveDraft = useCallback(async (formData) => {
    if (!draftName.trim()) { toast.error('Enter a patient name to save draft'); return; }
    setIsSaving(true);
    try {
      const res = await saveDraft({
        draftId,
        patientName: draftName,
        formType,
        formData: JSON.stringify(formData)
      });
      setDraftId(res.data.draftId);
      toast.success(`Draft saved! ID: ${res.data.draftId}`);
    } catch (e) { toast.error('Failed to save draft'); }
    setIsSaving(false);
  }, [draftId, draftName, formType]);

  const loadDraft = useCallback(async (id, setFormData) => {
    try {
      const res = await getDraft(id);
      const d = res.data;
      setDraftId(d.draftId);
      setDraftName(d.patientName);
      if (setFormData && d.formData) setFormData(d.formData);
      toast.success('Draft loaded');
    } catch { toast.error('Draft not found'); }
  }, []);

  return { draftId, setDraftId, draftName, setDraftName, isSaving, handleSaveDraft, loadDraft };
}
