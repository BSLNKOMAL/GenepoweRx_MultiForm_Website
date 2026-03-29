// frontend/src/components/common/DownloadPdfButton.js
import React, { useState } from 'react';
import { downloadSubmissionPDF } from '../../utils/downloadPdf';

/**
 * A button that downloads a PDF from MongoDB (via API) to the user's Downloads folder.
 *
 * Usage:
 *   <DownloadPdfButton submissionId={sub._id} label="Download Form PDF" />
 *   <DownloadPdfButton submissionId={consentId} label="Download Consent PDF" variant="consent" />
 *
 * Props:
 *   submissionId  {string}  required - MongoDB _id of the FormSubmission
 *   label         {string}  optional - Button text
 *   filename      {string}  optional - Force a specific filename
 *   variant       {string}  optional - 'form' | 'consent' (controls color)
 *   className     {string}  optional - Extra CSS classes
 *   disabled      {bool}    optional - Disable the button
 *   onSuccess     {fn}      optional - Callback on successful download
 *   onError       {fn}      optional - Callback on error
 */
export default function DownloadPdfButton({
  submissionId,
  label       = 'Download PDF',
  filename,
  variant     = 'form',
  className   = '',
  disabled    = false,
  onSuccess,
  onError,
}) {
  const [loading, setLoading] = useState(false);
  const [error,   setError  ] = useState(null);

  const isConsent = variant === 'consent';

  const handleDownload = async () => {
    if (!submissionId) {
      setError('No submission ID provided');
      return;
    }
    setLoading(true);
    setError(null);

    const result = await downloadSubmissionPDF(submissionId, filename);

    setLoading(false);
    if (result.success) {
      if (onSuccess) onSuccess();
    } else {
      setError(result.message || 'Download failed');
      if (onError) onError(result.message);
    }
  };

  // Color scheme matching your app's palette
  const baseStyle = {
    display:        'inline-flex',
    alignItems:     'center',
    gap:            '6px',
    padding:        '8px 16px',
    borderRadius:   '8px',
    border:         'none',
    cursor:         disabled || loading ? 'not-allowed' : 'pointer',
    fontWeight:     '600',
    fontSize:       '14px',
    transition:     'all 0.2s',
    opacity:        disabled || loading ? 0.7 : 1,
    backgroundColor: isConsent ? '#5B3FA6' : '#E8611A',
    color:          '#fff',
  };

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start' }}>
      <button
        style={baseStyle}
        onClick={handleDownload}
        disabled={disabled || loading || !submissionId}
        title={!submissionId ? 'PDF not available' : `Download ${label}`}
      >
        {loading ? (
          <>
            <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            Downloading…
          </>
        ) : (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            {label}
          </>
        )}
      </button>

      {error && (
        <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
          ⚠ {error}
        </span>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}