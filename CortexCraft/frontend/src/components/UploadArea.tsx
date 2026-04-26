import React, { useCallback, useState } from 'react';
import { UploadCloud, FileType, CheckCircle } from 'lucide-react';

interface UploadAreaProps {
  onUpload: (file: File) => void;
}

export function UploadArea({ onUpload }: UploadAreaProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleStartAnalysis = () => {
    if (selectedFile) {
      onUpload(selectedFile);
    }
  };

  return (
    <div 
      className={`dropzone-container ${dragActive ? 'drag-active' : ''}`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        type="file"
        id="file-upload"
        multiple={false}
        accept=".pdf,.doc,.docx,.txt"
        onChange={handleChange}
        style={{ display: 'none' }}
      />
      
      {!selectedFile ? (
        <label htmlFor="file-upload" style={{ cursor: 'pointer', display: 'block', height: '100%' }}>
          <UploadCloud className="dropzone-icon" />
          <h3 className="dropzone-title">Drag & Drop your resume</h3>
          <p className="dropzone-subtitle mt-2">
            Supports PDF, DOCX, and TXT files. Max size 5MB.
          </p>
          <div style={{ marginTop: '2rem' }}>
            <span className="btn-secondary">Browse Files</span>
          </div>
        </label>
      ) : (
        <div className="animate-fade-in" style={{ padding: '2rem 0' }}>
          <FileType className="dropzone-icon" style={{ color: 'var(--accent-purple)' }} />
          <h3 className="dropzone-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            {selectedFile.name} <CheckCircle size={24} color="#00f2fe" />
          </h3>
          <p className="dropzone-subtitle" style={{ marginBottom: '2rem' }}>
            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button className="btn-secondary" onClick={() => setSelectedFile(null)}>Remove</button>
            <button className="btn-primary" onClick={handleStartAnalysis}>Start Analysis</button>
          </div>
        </div>
      )}
    </div>
  );
}
