'use client';

import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export default function FileUpload({ onFileSelect, disabled }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const zipFile = files.find(file => file.name.endsWith('.zip'));

    if (zipFile) {
      onFileSelect(zipFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileSelect(files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      className={`
        relative border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
        transition-all duration-200
        ${isDragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={disabled ? undefined : handleClick}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".zip"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />

      <div className="flex flex-col items-center space-y-4">
        <Upload
          className={`w-16 h-16 ${isDragging ? 'text-blue-500' : 'text-gray-400 dark:text-gray-600'}`}
        />
        <div>
          <p className="text-lg font-medium mb-2">
            Drop your ZIP file here or click to browse
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Upload a ZIP archive containing your source code for security review
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            Maximum file size: 50MB
          </p>
        </div>
      </div>
    </div>
  );
}
