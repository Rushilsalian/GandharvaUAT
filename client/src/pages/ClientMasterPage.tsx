import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Users, FileSpreadsheet } from 'lucide-react';
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



  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Client Master</h1>
        <p className="text-muted-foreground">Manage client records with bulk upload functionality</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
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


      </Tabs>
    </div>
  );
}