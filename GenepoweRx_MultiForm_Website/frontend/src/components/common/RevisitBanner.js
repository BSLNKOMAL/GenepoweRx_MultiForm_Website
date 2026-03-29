import React from 'react';
import { RiHistoryLine, RiUserHeartLine } from 'react-icons/ri';
import './RevisitBanner.css';

export default function RevisitBanner({ patientId, patientName, isRevisit, visitInfo }) {
  if (!patientId) return null;
  return (
    <div className={`revisit-banner ${isRevisit ? 'revisit' : 'new-patient'}`}>
      <div className="rb-icon">
        {isRevisit ? <RiHistoryLine /> : <RiUserHeartLine />}
      </div>
      <div className="rb-content">
        <div className="rb-title">
          {isRevisit ? '🔄 Returning Patient — New Visit' : '✅ New Patient Registration'}
        </div>
        <div className="rb-meta">
          <span className="rb-pid">{patientId}</span>
          {patientName && <span className="rb-name">{patientName}</span>}
          {visitInfo && <span className="rb-visit">{visitInfo}</span>}
        </div>
        {isRevisit && (
          <div className="rb-note">
            Submitting this form will create a new visit record linked to this Patient ID.
            Previous visit data is preserved and unaffected.
          </div>
        )}
      </div>
    </div>
  );
}
