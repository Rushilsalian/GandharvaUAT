import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, X, FileText, Download } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';

interface ClientExcelUploadProps {
  onUploadComplete: (results: any) => void;
}

export function ClientExcelUpload({ onUploadComplete }: ClientExcelUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResults, setUploadResults] = useState<any>(null);
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
        console.log('Excel data:', data);
        totalRecords = data.length;
      }
      console.log('Total records to process:', totalRecords);
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
      setUploadResults(data);
      onUploadComplete(data);
      setTimeout(() => {
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 3000);
    },
    onError: (error: any) => {
      console.error('Upload error:', error);
      console.log('Full error response:', error.response);
      setUploadProgress(0);
      const errorData = error.response?.data || { message: error.message, errors: [] };
      console.log('Setting upload results:', errorData);
      setUploadResults(errorData);
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
    const validExtensions = ['.xls', '.xlsx', '.json'];
    
    const isValidType = validTypes.includes(file.type) || 
      validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    
    if (!isValidType) {
      alert('Please select a valid Excel (.xls, .xlsx),or JSON file');
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
    console.log('Starting upload for file:', selectedFile.name);
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
    console.log('Initiating upload mutation');
    uploadMutation.mutate(selectedFile);
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const downloadTemplate = async () => {
    const XLSX = await import('xlsx');
    
    // Create Excel template with required columns
    const headers = [
      'client_code',
      'name', 
      'mobile',
      'email',
      'dob',
      'pan_no',
      'aadhaar_no',
      'branch',
      'address',
      'city',
      'pincode',
      'reference_code',
      'opening_investment'
    ];
    
    const sampleData = [
      headers,
      ['CLI001', 'John Doe', '9876543210', 'john@example.com', '01-01-1990', 'ABCDE1234F', '123456789012', 'Main Branch', '123 Main St', 'Mumbai', '400001', 'REF001', '100000'],
      ['CLI002', 'Jane Smith', '9876543211', 'jane@example.com', '15-05-1985', 'FGHIJ5678K', '123456789013', 'Branch A', '456 Oak Ave', 'Delhi', '110001', 'REF002', '250000']
    ];
    
    const worksheet = XLSX.utils.aoa_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Client Template');
    
    XLSX.writeFile(workbook, 'client_upload_template.xlsx');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Bulk Client Upload
            </CardTitle>
            <Button onClick={downloadTemplate} variant="outline" size="sm" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Download Template
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.json"
              onChange={handleFileSelect}
              className="hidden"
            />
            {!selectedFile ? (
              <div className="space-y-2">
                <Upload className="h-12 w-12 mx-auto text-gray-400" />
                <div>
                  <Button onClick={() => fileInputRef.current?.click()}>
                    Select File
                  </Button>
                </div>
                <p className="text-sm text-gray-500">
                  Supported formats: .xlsx, .xls, .json
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {selectedFile.name.endsWith('.json') ? (
                  <FileText className="h-12 w-12 mx-auto text-green-500" />
                ) : (
                  <FileSpreadsheet className="h-12 w-12 mx-auto text-green-500" />
                )}
                <p className="font-medium">{selectedFile.name}</p>
                <p className="text-sm text-gray-500">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <div className="flex gap-2 justify-center">
                  <Button onClick={handleUpload} disabled={uploadMutation.isPending}>
                    {uploadMutation.isPending ? 'Uploading...' : 'Upload'}
                  </Button>
                  <Button variant="outline" onClick={removeFile}>
                    Remove
                  </Button>
                </div>
              </div>
            )}
          </div>

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

          {/* Results Display */}
          {uploadResults && (
            <div className="space-y-4">
              <Alert className={(uploadResults.failures?.length > 0 || uploadResults.summary?.failed > 0) ? "border-orange-200 bg-orange-50" : ""}>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  {uploadResults.message}
                </AlertDescription>
              </Alert>
              
              {/* Summary Stats */}
              {uploadResults.summary && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {uploadResults.summary.created > 0 && (
                    <div className="bg-green-50 p-3 rounded border border-green-200">
                      <div className="text-green-800 font-medium">Created</div>
                      <div className="text-green-600 text-lg">{uploadResults.summary.created}</div>
                    </div>
                  )}
                  {uploadResults.summary.updated > 0 && (
                    <div className="bg-blue-50 p-3 rounded border border-blue-200">
                      <div className="text-blue-800 font-medium">Updated</div>
                      <div className="text-blue-600 text-lg">{uploadResults.summary.updated}</div>
                    </div>
                  )}
                  {uploadResults.summary.failed > 0 && (
                    <div className="bg-red-50 p-3 rounded border border-red-200">
                      <div className="text-red-800 font-medium">Failed</div>
                      <div className="text-red-600 text-lg">{uploadResults.summary.failed}</div>
                    </div>
                  )}
                  <div className="bg-gray-50 p-3 rounded border border-gray-200">
                    <div className="text-gray-800 font-medium">Total</div>
                    <div className="text-gray-600 text-lg">{uploadResults.summary.total ?? uploadResults.summary.totalRecords}</div>
                  </div>
                </div>
              )}
              
              {uploadResults.failures?.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-red-600 flex items-center gap-2">
                      <AlertCircle className="h-5 w-5" />
                      Processing Failures ({uploadResults.failures.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-60 overflow-y-auto space-y-2">
                      {uploadResults.failures.map((item: any, index: number) => (
                        <div key={index} className="p-3 bg-red-50 border border-red-200 rounded text-sm">
                          <div className="font-medium text-red-800">
                            {item.clientCode || 'Unknown'}
                          </div>
                          <div className="text-red-600 mt-1">
                            {item.reason}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}


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