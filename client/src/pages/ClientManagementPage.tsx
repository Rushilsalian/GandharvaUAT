import React, { useState } from 'react';
import { ClientTable } from '../components/ClientTable';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Download } from 'lucide-react';
import { ClientExcelUpload } from '../components/ClientExcelUpload';
import { ClientBulkUploadResults } from '../components/ClientBulkUploadResults';
import * as XLSX from 'xlsx';

export function ClientManagementPage() {
  const [uploadResults, setUploadResults] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('list');

  const handleUploadComplete = (results: any) => {
    setUploadResults(results);
    setActiveTab('results');
  };

  const downloadTemplate = (format: 'excel' | 'json' = 'excel') => {
    const headers = [
      'client_code', 'name', 'mobile', 'email', 'dob', 'pan_no',
      'aadhaar_no', 'branch', 'address', 'city', 'pincode', 'reference_code'
    ];
    
    const sampleData = {
      client_code: 'CLI001',
      name: 'John Doe',
      mobile: '9876543210',
      email: 'john@example.com',
      dob: '01-01-1990',
      pan_no: 'ABCDE1234F',
      aadhaar_no: '123456789012',
      branch: 'Main Branch',
      address: '123 Main St',
      city: 'Mumbai',
      pincode: '400001',
      reference_code: 'REF001'
    };
    
    if (format === 'json') {
      const jsonTemplate = [sampleData];
      const blob = new Blob([JSON.stringify(jsonTemplate, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'client_upload_template.json';
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const excelData = [Object.values(sampleData)];
      const worksheet = XLSX.utils.aoa_to_sheet([headers, ...excelData]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Client Template');
      XLSX.writeFile(workbook, 'client_upload_template.xlsx');
    }
  };

  return (
    <div className="container">
      <div className="md:flex md:justify-between md:items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold">Client Records</h1>
          <p className="text-sm text-gray-600">Manage clients with bulk upload functionality</p>
        </div>
        <div className="flex gap-2 mt-2">
          {/* <Button onClick={() => downloadTemplate('excel')} variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Sample Template
          </Button> */}
          {/* <Button onClick={() => downloadTemplate('json')} variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            JSON Template
          </Button> */}
        </div>
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