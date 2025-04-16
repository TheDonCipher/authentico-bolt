'use client';

import React, { useState } from 'react';
import axios from 'axios';
import { getAuthToken } from '../../lib/token-util';

export default function TestUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file');
      return;
    }

    setStatus('Uploading...');
    setError(null);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('document_file', file);
      formData.append('documentName', 'Test Document');
      formData.append('documentType', 'identity');
      formData.append('verifyingOrgId', 'org1');

      // Log the FormData contents
      console.log('FormData entries:');
      for (const pair of formData.entries()) {
        console.log(pair[0], pair[1]);
      }

      const token = await getAuthToken();
      
      const response = await axios.post('/api/documents/upload', formData, {
        headers: {
          // Don't set Content-Type - let the browser set it with the boundary
          Authorization: `Bearer ${token}`,
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 100)
          );
          setProgress(percentCompleted);
        },
      });

      setStatus('Upload successful!');
      console.log('Response:', response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Upload failed');
      console.error('Upload error:', err);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Test Document Upload</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {status && (
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
          {status}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="mb-4">
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Select Document</label>
          <input 
            type="file" 
            onChange={handleFileChange}
            className="border border-gray-300 p-2 w-full"
            accept=".pdf,.jpg,.jpeg,.png"
          />
        </div>
        
        {progress > 0 && (
          <div className="mb-4">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-1">{progress}% Uploaded</p>
          </div>
        )}
        
        <button 
          type="submit" 
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          disabled={!file}
        >
          Upload Document
        </button>
      </form>
      
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-2">Debug Information</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
          {file ? (
            JSON.stringify({
              name: file.name,
              type: file.type,
              size: `${(file.size / 1024).toFixed(2)} KB`,
            }, null, 2)
          ) : 'No file selected'}
        </pre>
      </div>
    </div>
  );
}
