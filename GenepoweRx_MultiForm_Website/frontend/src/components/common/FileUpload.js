import React, { useState, useRef } from 'react';
import { RiUploadLine, RiDeleteBin6Line, RiFileLine, RiCheckLine } from 'react-icons/ri';
import './FileUpload.css';

export default function FileUpload({ label, accept='.pdf,.jpg,.jpeg,.png', multiple=true, onFilesChange, hint }) {
  const [files, setFiles]     = useState([]);
  const [dragging, setDragging] = useState(false);
  const inputRef              = useRef(null);

  const addFiles = (newFiles) => {
    const arr = [...files, ...Array.from(newFiles)].slice(0, 5);
    setFiles(arr);
    onFilesChange && onFilesChange(arr);
  };

  const removeFile = (i) => {
    const arr = files.filter((_, idx) => idx !== i);
    setFiles(arr);
    onFilesChange && onFilesChange(arr);
  };

  const onDrop = (e) => {
    e.preventDefault(); setDragging(false);
    addFiles(e.dataTransfer.files);
  };

  return (
    <div className="file-upload-wrap">
      {label && <div className="fu-label">{label}</div>}
      <div
        className={`fu-dropzone ${dragging ? 'dragging' : ''}`}
        onClick={() => inputRef.current.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <RiUploadLine className="fu-upload-icon" />
        <div className="fu-text">Click to upload or drag & drop</div>
        <div className="fu-subtext">{accept.split(',').join(', ')} — max 10MB per file</div>
        <input ref={inputRef} type="file" accept={accept} multiple={multiple} style={{display:'none'}}
          onChange={e => addFiles(e.target.files)} />
      </div>

      {files.length > 0 && (
        <div className="fu-files-list">
          {files.map((f, i) => (
            <div key={i} className="fu-file-item">
              <RiFileLine className="fu-file-icon" />
              <span className="fu-file-name">{f.name}</span>
              <span className="fu-file-size">{(f.size/1024).toFixed(1)} KB</span>
              <RiCheckLine className="fu-file-check" />
              <button type="button" className="fu-remove-btn" onClick={() => removeFile(i)}>
                <RiDeleteBin6Line />
              </button>
            </div>
          ))}
        </div>
      )}
      {hint && <div className="fu-hint">{hint}</div>}
    </div>
  );
}
