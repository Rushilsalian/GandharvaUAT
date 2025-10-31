import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Download, Users, FileSpreadsheet } from 'lucide-react';
import { ClientTable } from '../components/ClientTable';
import { ClientExcelUpload } from '../components/ClientExcelUpload';
import { ClientBulkUploadResults } from '../components/ClientBulkUploadResults';

export function ClientMasterPage() {
  const [activeTab, setActiveTab] = useState('list');
  const [uploadResults, setUploadResults] = useState<any>(null);

  const handleUploadComplete = (results: any) => {
    setUploadResults(results);
    setActiveTab('results');
  };

  const downloadTemplate = () => {
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
      'reference_code'
    ];
    
    const csvContent = headers.join(',') + '\n' +
      'CLI001,John Doe,9876543210,john@example.com,01-01-1990,ABCDE1234F,123456789012,Main Branch,123 Main St,Mumbai,400001,REF001\n' +
      'CLI002,Jane Smith,9876543211,jane@example.com,15-05-1985,FGHIJ5678K,123456789013,Branch A,456 Oak Ave,Delhi,110001,REF002';
    
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
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Client Master</h1>
          <p className="text-muted-foreground">Manage client records with bulk upload functionality</p>
        </div>
        <Button onClick={downloadTemplate} variant="outline" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Download Template
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Client List
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Bulk Upload
          </TabsTrigger>
          <TabsTrigger value="results" className="flex items-center gap-2" disabled={!uploadResults}>
            <FileSpreadsheet className="h-4 w-4" />
            Upload Results
          </TabsTrigger>
          <TabsTrigger value="template" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Template Info
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <ClientTable />
        </TabsContent>

        <TabsContent value="upload" className="space-y-4">
          <ClientExcelUpload onUploadComplete={handleUploadComplete} />
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          {uploadResults && (
            <ClientBulkUploadResults results={uploadResults} />
          )}
        </TabsContent>

        <TabsContent value="template" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Excel Template Format</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Required Fields (Mandatory)</h3>
                  <ul className="space-y-1 text-sm">
                    <li><strong>client_code:</strong> Alpha Numeric, Length 50</li>
                    <li><strong>name:</strong> Alpha Numeric, Length 100</li>
                    <li><strong>mobile:</strong> Numeric, Length 20</li>
                    <li><strong>email:</strong> Alpha Numeric, Length 50</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Optional Fields</h3>
                  <ul className="space-y-1 text-sm">
                    <li><strong>dob:</strong> DD-MM-YYYY format</li>
                    <li><strong>pan_no:</strong> Alpha Numeric, Length 10</li>
                    <li><strong>aadhaar_no:</strong> Numeric, Length 15</li>
                    <li><strong>branch:</strong> Alpha Numeric, Length 20</li>
                    <li><strong>address:</strong> Alpha Numeric, Length 200</li>
                    <li><strong>city:</strong> Alpha Numeric, Length 50</li>
                    <li><strong>pincode:</strong> Numeric, Length 6</li>
                    <li><strong>reference_code:</strong> Alpha Numeric, Length 50</li>
                  </ul>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Upload Process</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                  <li>Download the template and fill in client data</li>
                  <li>Ensure all mandatory fields are completed</li>
                  <li>Upload the Excel/CSV file using the Bulk Upload tab</li>
                  <li>System will validate data and create client records</li>
                  <li>For new clients with email, user accounts will be created automatically</li>
                  <li>Welcome emails with login credentials will be sent to new clients</li>
                  <li>Review upload results for any errors or issues</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}