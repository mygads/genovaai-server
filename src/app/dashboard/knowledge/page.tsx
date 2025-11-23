'use client';

import { useEffect, useState } from 'react';
import { FaFileAlt, FaPlus, FaTrash, FaDownload, FaUpload, FaEye } from 'react-icons/fa';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface KnowledgeFile {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  extractedText: string | null;
  uploadedAt: string;
  isActive: boolean;
}

export default function KnowledgePage() {
  const [files, setFiles] = useState<KnowledgeFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<KnowledgeFile | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchFiles();
  }, []);

  async function fetchFiles() {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setFiles([]);
        setLoading(false);
        return;
      }
      
      const response = await fetch('http://localhost:8090/api/customer/genovaai/knowledge?limit=100', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      console.log('[Knowledge] Response:', data);
      if (data.success && data.data?.files) {
        setFiles(data.data.files);
      } else {
        setFiles([]);
      }
    } catch (error) {
      console.error('Failed to fetch knowledge files:', error);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['.txt', '.pdf', '.docx'];
    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedTypes.includes(fileExt)) {
      alert('Only TXT, PDF, and DOCX files are allowed');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    setUploading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://localhost:8090/api/customer/genovaai/knowledge/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        alert('File uploaded successfully');
        fetchFiles();
      } else {
        alert(data.error || 'Failed to upload file');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload file');
    } finally {
      setUploading(false);
      // Reset input
      event.target.value = '';
    }
  }

  async function handleDelete(fileId: string) {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:8090/api/customer/genovaai/knowledge/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        alert('File deleted successfully');
        fetchFiles();
        if (selectedFile?.id === fileId) {
          setSelectedFile(null);
          setShowPreview(false);
        }
      } else {
        alert(data.error || 'Failed to delete file');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete file');
    }
  }

  async function handleDownload(fileId: string, fileName: string) {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:8090/api/customer/genovaai/knowledge/${fileId}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        alert('Failed to download file');
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download file');
    }
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg text-gray-500 dark:text-gray-400">Loading knowledge files...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Knowledge Base</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Upload files to use as context in your sessions
          </p>
        </div>
        <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
          <FaUpload className="w-4 h-4" />
          {uploading ? 'Uploading...' : 'Upload File'}
          <input
            type="file"
            accept=".txt,.pdf,.docx"
            onChange={handleUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>

      {/* Info Card */}
      <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <div className="text-blue-600 dark:text-blue-400">ℹ️</div>
            <div className="text-sm text-blue-900 dark:text-blue-100">
              <p className="font-medium mb-1">How Knowledge Base Works:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-800 dark:text-blue-200">
                <li>Upload PDF, TXT, or DOCX files</li>
                <li>Text will be automatically extracted from files</li>
                <li>Link knowledge files to sessions in Settings</li>
                <li>AI will use the knowledge as context when answering</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Files List */}
      {!files || files.length === 0 ? (
        <Card className="border-border/50 shadow-sm">
          <CardContent className="py-12">
            <div className="text-center">
              <FaFileAlt className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No files yet</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Upload your first knowledge file to get started
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Files List */}
          <div className="space-y-4">
            {files.map((file) => (
              <Card
                key={file.id}
                className={`border-border/50 shadow-sm cursor-pointer transition-all ${
                  selectedFile?.id === file.id
                    ? 'ring-2 ring-blue-500 shadow-md'
                    : 'hover:shadow-md'
                }`}
                onClick={() => {
                  setSelectedFile(file);
                  setShowPreview(true);
                }}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex-shrink-0">
                        <FaFileAlt className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                          {file.fileName}
                        </h3>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge variant="outline">{file.fileType.toUpperCase()}</Badge>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatFileSize(file.fileSize)}
                          </span>
                          <Badge variant={file.isActive ? 'default' : 'secondary'}>
                            {file.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          {new Date(file.uploadedAt).toLocaleString('id-ID')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(file.id, file.fileName);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="Download"
                      >
                        <FaDownload className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(file.id);
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <FaTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Preview Panel */}
          <div className="lg:sticky lg:top-6 lg:self-start">
            {showPreview && selectedFile ? (
              <Card className="border-border/50 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FaEye className="w-5 h-5 text-blue-600" />
                    Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        File Name
                      </h4>
                      <p className="text-sm text-gray-900 dark:text-white break-all">
                        {selectedFile.fileName}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        File Info
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Type:</span>
                          <span className="ml-2 text-gray-900 dark:text-white">
                            {selectedFile.fileType.toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Size:</span>
                          <span className="ml-2 text-gray-900 dark:text-white">
                            {formatFileSize(selectedFile.fileSize)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Extracted Text
                      </h4>
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 max-h-[400px] overflow-y-auto">
                        {selectedFile.extractedText ? (
                          <pre className="text-xs text-gray-900 dark:text-white whitespace-pre-wrap font-mono">
                            {selectedFile.extractedText}
                          </pre>
                        ) : (
                          <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                            No text extracted yet
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-border/50 shadow-sm">
                <CardContent className="py-12">
                  <div className="text-center text-gray-500 dark:text-gray-400">
                    <FaEye className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Select a file to preview</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
