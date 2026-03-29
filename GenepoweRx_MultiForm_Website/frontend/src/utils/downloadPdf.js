// frontend/src/utils/downloadPdf.js
// Fetches the PDF Buffer from the API and triggers a native browser download.
// The file goes directly to the user's Downloads folder — nothing stored on server disk.

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * Download a PDF for a specific submission.
 * @param {string} submissionId  - MongoDB _id of the FormSubmission
 * @param {string} [filename]    - Optional override for the downloaded filename
 */
export async function downloadSubmissionPDF(submissionId, filename) {
  try {
    const response = await fetch(`${API_BASE}/pdf/download/${submissionId}`, {
      method: 'GET',
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || `Download failed (${response.status})`);
    }

    // Read response as a Blob
    const blob = await response.blob();

    // Get filename from Content-Disposition header if not provided
    if (!filename) {
      const disposition = response.headers.get('Content-Disposition') || '';
      const match = disposition.match(/filename="?([^";\n]+)"?/);
      filename = match ? match[1] : `GenepoweRx_${submissionId}.pdf`;
    }

    // Trigger browser's native download → goes to user's Downloads folder
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href     = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return { success: true };
  } catch (error) {
    console.error('PDF download error:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Convenience: download Form PDF for a patient (latest submission of given formType).
 * Requires the submissionId to be available in your component state.
 */
export async function downloadFormPDF(submissionId, patientId, formType, visitLabel) {
  const filename = `GenepoweRx_${patientId}_${formType}_${(visitLabel || '').replace(' ', '_')}.pdf`;
  return downloadSubmissionPDF(submissionId, filename);
}

/**
 * Convenience: download Consent PDF.
 */
export async function downloadConsentPDF(submissionId, patientId, visitLabel) {
  const filename = `GenepoweRx_${patientId}_CONSENT_${(visitLabel || '').replace(' ', '_')}.pdf`;
  return downloadSubmissionPDF(submissionId, filename);
}