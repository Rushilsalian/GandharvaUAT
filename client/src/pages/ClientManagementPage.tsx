import React, { useState } from 'react';
import { ClientTable } from '../components/ClientTable';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Download } from 'lucide-react';
import { ClientExcelUpload } from '../components/ClientExcelUpload';
import { ClientBulkUploadResults } from '../components/ClientBulkUploadResults';

export function ClientManagementPage() {
  const [uploadResults, setUploadResults] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('list');

  const handleUploadComplete = (results: any) => {
    setUploadResults(results);
    setActiveTab('results');
  };

  const downloadTemplate = () => {
    const headers = [
      'client_code', 'name', 'mobile', 'email', 'dob', 'pan_no',
      'aadhaar_no', 'branch', 'address', 'city', 'pincode', 'reference_code'
    ];
    
    const csvContent = headers.join(',') + '\n' +
      'CLI001,John Doe,9876543210,john@example.com,01-01-1990,ABCDE1234F,123456789012,Main Branch,123 Main St,Mumbai,400001,REF001';
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'client_upload_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="md:flex md:justify-between md:items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold">Client Records</h1>
          <p className="text-sm text-gray-600">Manage clients with bulk upload functionality</p>
        </div>
        <Button onClick={downloadTemplate} variant="outline" className="flex items-center gap-2 mt-2">
          <Download className="h-4 w-4" />
          Download Template
        </Button>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="list">Client List</TabsTrigger>
          <TabsTrigger value="upload">Bulk Upload</TabsTrigger>
          {uploadResults && <TabsTrigger value="results">Upload Results</TabsTrigger>}
        </TabsList>
        
        <TabsContent value="list">
          <ClientTable />
        </TabsContent>
        
        <TabsContent value="upload">
          <ClientExcelUpload onUploadComplete={handleUploadComplete} />
        </TabsContent>
        
        {uploadResults && (
          <TabsContent value="results">
            <ClientBulkUploadResults results={uploadResults} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}