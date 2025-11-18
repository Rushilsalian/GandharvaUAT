import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, X, FileText } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';

interface ClientExcelUploadProps {
  onUploadComplete: (results: any) => void;
}

export function ClientExcelUpload({ onUploadComplete }: ClientExcelUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      // Parse file to get total record count for progress calculation
      let totalRecords = 0;
      if (file.name.toLowerCase().endsWith('.json')) {
        const text = await file.text();
        const jsonData = JSON.parse(text);
        totalRecords = Array.isArray(jsonData) ? jsonData.length : 0;
      } else {
        const XLSX = await import('xlsx');
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(worksheet);
        totalRecords = data.length;
      }

      const response = await fetch('/api/clients/bulk-upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      return response.json();
    },
    onSuccess: (data) => {
      setUploadProgress(100);
      onUploadComplete(data);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    onError: (error) => {
      console.error('Upload error:', error);
      setUploadProgress(0);
    },
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (isValidFile(file)) {
        setSelectedFile(file);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (isValidFile(file)) {
        setSelectedFile(file);
      }
    }
  };

  const isValidFile = (file: File) => {
    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'application/json'
    ];
    const validExtensions = ['.xls', '.xlsx', '.csv', '.json'];
    
    const isValidType = validTypes.includes(file.type) || 
      validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    
    if (!isValidType) {
      alert('Please select a valid Excel (.xls, .xlsx), CSV, or JSON file');
      return false;
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      alert('File size must be less than 10MB');
      return false;
    }
    
    return true;
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    setUploadProgress(10);
    
    // Simulate progress during upload
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);
    
    uploadMutation.mutate(selectedFile);
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Bulk Client Upload
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-primary bg-primary/5'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <div className="space-y-2">
              <p className="text-lg font-medium">
                Drop your file here, or{' '}
                <Button
                  variant="ghost"
                  className="p-0 h-auto font-medium text-primary underline hover:no-underline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  browse
                </Button>
              </p>
              <p className="text-sm text-gray-500">
                Supports .xls, .xlsx, .csv, and .json files up to 10MB
              </p>
            </div>
            <Input
              ref={fileInputRef}
              type="file"
              accept=".xls,.xlsx,.csv,.json"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Selected File Display */}
          {selectedFile && (
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                {selectedFile.name.toLowerCase().endsWith('.json') ? (
                  <FileText className="h-8 w-8 text-blue-600" />
                ) : (
                  <FileSpreadsheet className="h-8 w-8 text-green-600" />
                )}
                <div>
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={removeFile}
                disabled={uploadMutation.isPending}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Upload Progress */}
          {uploadMutation.isPending && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading and processing...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}

          {/* Error Display */}
          {uploadMutation.isError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {uploadMutation.error?.message || 'Upload failed. Please try again.'}
              </AlertDescription>
            </Alert>
          )}

          {/* Success Display */}
          {uploadMutation.isSuccess && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                File uploaded successfully! Check the results tab for details.
              </AlertDescription>
            </Alert>
          )}

          {/* Upload Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploadMutation.isPending}
              className="min-w-32"
            >
              {uploadMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Clients
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <div className="min-w-6 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold mt-0.5 flex-shrink-0 aspect-square">
                1
              </div>
              <p>Download the template file and fill in client information</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="min-w-6 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold mt-0.5 flex-shrink-0 aspect-square">
                2
              </div>
              <p>Ensure all mandatory fields (client_code, name, mobile, email) are completed</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="min-w-6 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold mt-0.5 flex-shrink-0 aspect-square">
                3
              </div>
              <p>Upload the file - system will validate and create client records</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="min-w-6 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold mt-0.5 flex-shrink-0 aspect-square">
                4
              </div>
              <p>User accounts will be created automatically for clients with email addresses</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="min-w-6 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold mt-0.5 flex-shrink-0 aspect-square">
                5
              </div>
              <p>Welcome emails with login credentials will be sent to new clients</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}