import React from 'react';
import './FormComponents.css';

export const FormSection = ({ title, icon, children }) => (
  <div className="form-section">
    <div className="form-section-header">
      {icon && <span className="section-icon">{icon}</span>}
      <h3 className="section-title">{title}</h3>
    </div>
    <div className="form-section-body">{children}</div>
  </div>
);

export const FormGrid = ({ cols = 2, children }) => (
  <div className={`form-grid cols-${cols}`}>{children}</div>
);

export const FieldGroup = ({ label, required, children, hint }) => (
  <div className="field-group">
    <label className="field-label">
      {label} {required && <span className="required-star">*</span>}
    </label>
    {children}
    {hint && <span className="field-hint">{hint}</span>}
  </div>
);

export const Input = ({ label, required, hint, ...props }) => (
  <FieldGroup label={label} required={required} hint={hint}>
    <input className="gx-input" {...props} />
  </FieldGroup>
);

export const Textarea = ({ label, required, hint, rows = 3, ...props }) => (
  <FieldGroup label={label} required={required} hint={hint}>
    <textarea className="gx-input gx-textarea" rows={rows} {...props} />
  </FieldGroup>
);

export const Select = ({ label, required, hint, options = [], ...props }) => (
  <FieldGroup label={label} required={required} hint={hint}>
    <select className="gx-input gx-select" {...props}>
      <option value="">— Select —</option>
      {options.map(o =>
        typeof o === 'string'
          ? <option key={o} value={o}>{o}</option>
          : <option key={o.value} value={o.value}>{o.label}</option>
      )}
    </select>
  </FieldGroup>
);

export const RadioGroup = ({ label, required, name, options, value, onChange }) => (
  <FieldGroup label={label} required={required}>
    <div className="radio-group">
      {options.map(o => (
        <label key={o} className={`radio-label ${value === o ? 'active' : ''}`}>
          <input type="radio" name={name} value={o} checked={value === o} onChange={onChange} />
          {o}
        </label>
      ))}
    </div>
  </FieldGroup>
);

export const CheckboxList = ({ label, items, values = {}, onChange, columns = 3 }) => (
  <FieldGroup label={label}>
    <div className={`checkbox-grid cols-${columns}`}>
      {items.map(item => (
        <label key={item} className={`checkbox-label ${values[item] ? 'checked' : ''}`}>
          <input
            type="checkbox"
            checked={!!values[item]}
            onChange={e => onChange(item, e.target.checked)}
          />
          <span>{item}</span>
        </label>
      ))}
    </div>
  </FieldGroup>
);

export const MedicationEntry = ({ index, data = {}, onChange, onDelete }) => (
  <div className="med-entry">
    <div className="med-header">
      <span className="med-num">Medication {index + 1}</span>
      <button type="button" className="med-delete-btn" onClick={onDelete}>✕</button>
    </div>
    <div className="form-grid cols-3">
      <input className="gx-input" placeholder="Medicine Name" value={data.name || ''} onChange={e => onChange('name', e.target.value)} />
      <input className="gx-input" placeholder="Dosage (e.g. 500mg)" value={data.dosage || ''} onChange={e => onChange('dosage', e.target.value)} />
      <input className="gx-input" placeholder="Frequency (e.g. twice daily)" value={data.frequency || ''} onChange={e => onChange('frequency', e.target.value)} />
    </div>
  </div>
);

export const DraftBar = ({ onSave, onLoad, draftName, setDraftName, isSaving }) => (
  <div className="draft-bar">
    <div className="draft-label">💾 Draft</div>
    <input
      className="gx-input draft-name-input"
      placeholder="Patient name for draft..."
      value={draftName}
      onChange={e => setDraftName(e.target.value)}
    />
    <button type="button" className="btn-secondary" onClick={onSave} disabled={isSaving}>
      {isSaving ? 'Saving...' : 'Save Draft'}
    </button>
    <button type="button" className="btn-ghost" onClick={onLoad}>Load Draft</button>
  </div>
);

export const SubmitBar = ({ onSubmit, isSubmitting, formName }) => (
  <div className="submit-bar">
    <button type="submit" className="btn-primary" disabled={isSubmitting} onClick={onSubmit}>
      {isSubmitting ? <><span className="btn-spinner" /> Submitting...</> : `Submit ${formName}`}
    </button>
  </div>
);


// ── File Upload Component ─────────────────────────────────────────────────
export const FileUploadField = ({ label, hint, accept = '.pdf,.jpg,.jpeg,.png,.doc,.docx', multiple = false, onChange, fieldName }) => {
  const [files, setFiles] = React.useState([]);
  const inputRef = React.useRef(null);

  const handleChange = (e) => {
    const selected = Array.from(e.target.files);
    setFiles(selected);
    if (onChange) onChange(fieldName || 'files', e.target.files);
  };

  const removeFile = (idx) => {
    const newFiles = files.filter((_, i) => i !== idx);
    setFiles(newFiles);
    // Create new FileList-like
    const dt = new DataTransfer();
    newFiles.forEach(f => dt.items.add(f));
    if (inputRef.current) inputRef.current.files = dt.files;
    if (onChange) onChange(fieldName || 'files', dt.files);
  };

  return (
    <FieldGroup label={label} hint={hint}>
      <div className="file-upload-area" onClick={() => inputRef.current?.click()}>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          style={{ display: 'none' }}
          onChange={handleChange}
        />
        <div className="fua-icon">📎</div>
        <div className="fua-text">
          <span className="fua-primary">Click to upload {multiple ? 'files' : 'a file'}</span>
          <span className="fua-secondary">PDF, JPG, PNG, DOC (max 10MB each)</span>
        </div>
      </div>
      {files.length > 0 && (
        <div className="fua-file-list">
          {files.map((f, i) => (
            <div key={i} className="fua-file-item">
              <span className="fua-file-name">📄 {f.name}</span>
              <span className="fua-file-size">{(f.size / 1024).toFixed(1)} KB</span>
              <button type="button" className="fua-remove-btn" onClick={() => removeFile(i)}>✕</button>
            </div>
          ))}
        </div>
      )}
    </FieldGroup>
  );
};
