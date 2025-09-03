'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';

interface ChallengeSetupProps {
  challengeName: string;
  files: File[];
  links: string[];
  onChallengeNameChange: (name: string) => void;
  onFilesChange: (files: File[]) => void;
  onLinksChange: (links: string[]) => void;
  onNext: () => void;
}

export default function ChallengeSetup({ 
  challengeName, 
  files, 
  links,
  onChallengeNameChange, 
  onFilesChange, 
  onLinksChange,
  onNext 
}: ChallengeSetupProps) {
  const [dragActive, setDragActive] = useState(false);
  const [newLink, setNewLink] = useState('');

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const newFiles = Array.from(e.dataTransfer.files);
      onFilesChange([...files, ...newFiles]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      onFilesChange([...files, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    onFilesChange(newFiles);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const addLink = () => {
    if (newLink.trim() && isValidGoogleLink(newLink.trim())) {
      onLinksChange([...links, newLink.trim()]);
      setNewLink('');
    }
  };

  const removeLink = (index: number) => {
    const newLinks = links.filter((_, i) => i !== index);
    onLinksChange(newLinks);
  };

  const isValidGoogleLink = (url: string) => {
    const googlePatterns = [
      /^https:\/\/docs\.google\.com\/document\/d\/[a-zA-Z0-9_-]+\/edit/,
      /^https:\/\/docs\.google\.com\/presentation\/d\/[a-zA-Z0-9_-]+\/edit/,
      /^https:\/\/docs\.google\.com\/spreadsheets\/d\/[a-zA-Z0-9_-]+\/edit/,
      /^https:\/\/docs\.google\.com\/forms\/d\/[a-zA-Z0-9_-]+\/edit/
    ];
    return googlePatterns.some(pattern => pattern.test(url));
  };

  const getLinkType = (url: string) => {
    if (url.includes('/document/')) return 'Google Doc';
    if (url.includes('/presentation/')) return 'Google Slides';
    if (url.includes('/spreadsheets/')) return 'Google Sheets';
    if (url.includes('/forms/')) return 'Google Form';
    return 'Google Link';
  };

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Challenge Setup</h2>
        <p>
          Start by naming your challenge and uploading any relevant files (briefs, assets, references, etc.)
        </p>
      </div>

      {/* Challenge Name */}
      <div className="mb-8">
        <label className="block text-sm font-medium mb-2">
          Challenge Name *
        </label>
        <Input
          value={challengeName}
          onChange={(e) => onChallengeNameChange(e.target.value)}
          placeholder="e.g., Summer Sale 2024, Product Launch Campaign"
          className="w-full"
        />
        <p className="text-sm mt-1">
          Give your challenge a descriptive name that will help you identify it later
        </p>
      </div>

      {/* File Upload Area */}
      <div className="mb-8">
        <label className="block text-sm font-medium mb-2">
          Additional Files (Optional)
        </label>
        
        {/* Drag and Drop Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 transition-colors ${
            dragActive
              ? 'border-primary bg-primary/10'
              : 'border-border hover:border-border/80'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {files.length === 0 ? (
            /* Empty State */
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div>
                <p className="text-lg font-medium">
                  Drop files here or click to browse
                </p>
                <p className="text-sm">
                  Upload briefs, assets, references, or any supporting documents
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('file-input')?.click()}
              >
                Choose Files
              </Button>
            </div>
          ) : (
            /* Files Present State */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">
                  Uploaded Files ({files.length})
                </h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('file-input')?.click()}
                  className="border-primary hover:bg-primary/10"
                >
                  + Add Files
                </Button>
              </div>
              
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between border rounded-lg p-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded flex items-center justify-center">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{file.name}</p>
                        <p className="text-xs">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="border-destructive hover:bg-destructive/10"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <input
            id="file-input"
            type="file"
            multiple
            className="hidden"
            onChange={handleFileInput}
            accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
          />
        </div>
      </div>

      {/* Google Links Section */}
      <div className="mb-8">
        <label className="block text-sm font-medium mb-2">
          Google Docs/Presentations Links (Optional)
        </label>
        
        <div className="border rounded-lg p-4">
          <div className="space-y-4">
            {/* Add Link Input */}
            <div className="flex space-x-3">
              <Input
                value={newLink}
                onChange={(e) => setNewLink(e.target.value)}
                placeholder="https://docs.google.com/document/d/..."
                className="flex-1"
              />
              <Button
                type="button"
                onClick={addLink}
                disabled={!newLink.trim() || !isValidGoogleLink(newLink.trim())}
                variant="outline"
              >
                Add Link
              </Button>
            </div>
            
            {/* Link Validation Message */}
            {newLink.trim() && !isValidGoogleLink(newLink.trim()) && (
              <p className="text-sm">
                Please enter a valid Google Docs, Slides, Sheets, or Forms link
              </p>
            )}
            
            {/* Links List */}
            {links.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">
                  Added Links ({links.length})
                </h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {links.map((link, index) => (
                    <div key={index} className="flex items-center justify-between border rounded-lg p-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded flex items-center justify-center">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {getLinkType(link)}
                          </p>
                          <a 
                            href={link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs underline hover:opacity-70 truncate block"
                          >
                            {link}
                          </a>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeLink(index)}
                        className="border-destructive hover:bg-destructive/10"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Next Button */}
      <div className="flex justify-end">
        <Button 
          onClick={onNext}
          disabled={!challengeName.trim()}
          className=""
        >
          Next
        </Button>
      </div>
    </Card>
  );
}
