import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

import { Upload, FileSpreadsheet, FileText, CheckCircle, XCircle, AlertCircle, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { clientAPI } from '@/lib/clientApi';

interface TransactionRow {
  client_code: string;
  date: string;
  amount: string | number;
  remark: string;
  guiid?: string;
  // Excel column names
  'Client Code'?: string;
  'Transaction Date'?: string;
  'Transaction Amount'?: string | number;
  'Narration'?: string;
  'Transaction GUID'?: string;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

interface RecordStatus {
  row: number;
  clientCode: string;
  amount: number;
  status: 'success' | 'error';
  message?: string;
  guiid?: string;
}

interface UploadResult {
  success: number;
  errors: Array<{ row: number; message: string }>;
  records?: RecordStatus[];
}

interface InvestmentExcelUploadProps {
  onUploadComplete?: (result: UploadResult) => void;
}

export function InvestmentExcelUpload({ onUploadComplete }: InvestmentExcelUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [recordStatuses, setRecordStatuses] = useState<RecordStatus[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [validatedRows, setValidatedRows] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cancelRef = useRef(false);

  const validateRow = async (row: any, rowIndex: number): Promise<ValidationError[]> => {
    const errors: ValidationError[] = [];
    
    // Use exact header names from Excel file
    const clientCode = row['Client Code'];
    const dateField = row['Transaction Date'];
    const amountField = row['Transaction Amount'];
    const remarkField = row['Narration'];
    const guiidField = row['Transaction GUID'];
    
    // Validate client_code
    if (!clientCode || typeof clientCode !== 'string') {
      errors.push({ row: rowIndex, field: 'client_code', message: 'Client code is required' });
    } else if (clientCode.length > 50) {
      errors.push({ row: rowIndex, field: 'client_code', message: 'Client code must be 50 characters or less' });
    } else if (!/^[a-zA-Z0-9]+$/.test(clientCode)) {
      errors.push({ row: rowIndex, field: 'client_code', message: 'Client code must be alphanumeric' });
    } else {
      // Check if client exists in database
      try {
        const client = await clientAPI.getClientByCode(clientCode);
        if (!client) {
          errors.push({ row: rowIndex, field: 'client_code', message: `Client with code '${clientCode}' not found in database` });
        }
      } catch (error) {
        errors.push({ row: rowIndex, field: 'client_code', message: `Unable to validate client code '${clientCode}'` });
      }
    }

    // Validate date
    if (!dateField) {
      errors.push({ row: rowIndex, field: 'date', message: 'Date is required' });
    } else {
      let dateValue: Date;
      
      if (typeof dateField === 'number') {
        dateValue = new Date((dateField - 25569) * 86400 * 1000);
      } else if (typeof dateField === 'string') {
        const ddmmyyyy = /^(\d{2})-(\d{2})-(\d{4})$/;
        const match = dateField.match(ddmmyyyy);
        if (match) {
          const [, day, month, year] = match;
          dateValue = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        } else {
          dateValue = new Date(dateField);
        }
      } else {
        dateValue = new Date(dateField);
      }
      
      if (isNaN(dateValue.getTime())) {
        errors.push({ row: rowIndex, field: 'date', message: 'Invalid date format. Use DD-MM-YYYY' });
      }
    }

    // Validate amount
    if (!amountField && amountField !== 0) {
      errors.push({ row: rowIndex, field: 'amount', message: 'Amount is required' });
    } else {
      const amount = parseFloat(amountField);
      if (isNaN(amount)) {
        errors.push({ row: rowIndex, field: 'amount', message: 'Amount must be numeric' });
      } else if (amount <= 0) {
        errors.push({ row: rowIndex, field: 'amount', message: 'Amount must be positive' });
      } else if (amount > 999999999.99) {
        errors.push({ row: rowIndex, field: 'amount', message: 'Amount exceeds maximum limit (999999999.99)' });
      }
    }

    // Validate remark (optional)
    if (remarkField && typeof remarkField === 'string' && remarkField.length > 500) {
      errors.push({ row: rowIndex, field: 'remark', message: 'Remark must be 500 characters or less' });
    }

    // Validate guiid (optional)
    if (guiidField && typeof guiidField === 'string' && guiidField.length > 100) {
      errors.push({ row: rowIndex, field: 'guiid', message: 'GUID must be 100 characters or less' });
    }

    return errors;
  };

  const parseExcelFile = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          if (!jsonData || jsonData.length === 0) {
            reject(new Error('No data found in the Excel file'));
            return;
          }

          resolve(jsonData as any[]);
        } catch (error) {
          reject(new Error('Failed to parse Excel file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  };

  const parseJsonFile = (file: File): Promise<TransactionRow[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const jsonData = JSON.parse(e.target?.result as string);
          
          let transactions: any[];
          
          // Handle nested structure with "Result" property
          if (jsonData.Result && Array.isArray(jsonData.Result)) {
            transactions = jsonData.Result;
          } else if (Array.isArray(jsonData)) {
            transactions = jsonData;
          } else {
            reject(new Error('JSON file must contain an array of transactions or have a "Result" property with an array'));
            return;
          }

          if (transactions.length === 0) {
            reject(new Error('No data found in the JSON file'));
            return;
          }

          // Map field names to expected format
          const mappedTransactions = transactions.map(transaction => ({
            client_code: transaction['Client Code'] || transaction.client_code,
            date: transaction['Transaction Date'] || transaction.date,
            amount: Math.abs(parseFloat(transaction['Transaction Amount'] || transaction.amount)), // Convert negative to positive
            remark: transaction['Remark'] || transaction.remark || '',
            guiid: transaction['GUID'] || transaction.guiid || ''
          }));

          resolve(mappedTransactions as TransactionRow[]);
        } catch (error) {
          reject(new Error('Failed to parse JSON file. Please ensure it contains valid JSON.'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const isExcel = selectedFile.name.endsWith('.xls') || selectedFile.name.endsWith('.xlsx');
      const isJson = selectedFile.name.endsWith('.json');
      
      if (!isExcel && !isJson) {
        alert('Please select a valid Excel (.xls, .xlsx) or JSON (.json) file');
        return;
      }

      setFile(selectedFile);
      setResult(null);
      setValidationErrors([]);
    }
  };

  const handleUpload = async () => {
    cancelRef.current = false;
    console.log('=== HANDLE UPLOAD STARTED ===');
    if (!file) return;

    setUploading(true);
    setProgress(0);
    setValidationErrors([]);
 

    try {
      console.log('=== STARTING FILE PARSING ===');
      // Parse file based on type
      setProgress(5);
      let data: any[];
      
      if (file.name.endsWith('.json')) {
        console.log('Parsing JSON file...');
        data = await parseJsonFile(file);
      } else {
        console.log('Parsing Excel file...');
        data = await parseExcelFile(file);
      }
      setTotalRows(data.length);
      setValidatedRows(0);
      
      console.log('=== FILE PARSED SUCCESSFULLY ===');
      console.log('Parsed data length:', data.length);
      console.log('First row sample:', data[0]);
      
      // Validate data
      setProgress(10);
      console.log('=== STARTING VALIDATION ===');
      const allErrors: ValidationError[] = [];
      const validRows: any[] = [];
      const recordStatuses: RecordStatus[] = [];

      for (let i = 0; i < data.length; i++) {

        // 🔴 STOP if user clicked Remove
        if (cancelRef.current) {
          console.log('❌ Upload cancelled');
          break;
        }

        const row = data[i];
        const rowNumber = i + 2;

        const rowErrors = await validateRow(row, rowNumber);

        // ✅ update validated count
        setValidatedRows(i + 1);

        // dynamic progress: 10 → 85 range based on records processed
        const percent = 10 + ((i + 1) / data.length) * 75;
        setProgress(percent);

        if (rowErrors.length > 0) {
          allErrors.push(...rowErrors);
          recordStatuses.push({
            row: rowNumber,
            clientCode: row['Client Code'] || 'Unknown',
            amount: parseFloat(row['Transaction Amount']) || 0,
            status: 'error',
            message: rowErrors.map(e => e.message).join(', '),
          });
        } else {
          validRows.push({ ...row, originalRowNumber: rowNumber });
          recordStatuses.push({
            row: rowNumber,
            clientCode: row['Client Code'],
            amount: parseFloat(row['Transaction Amount']),
            status: 'success',
          });
        }
      }

      setRecordStatuses(recordStatuses);
      if (cancelRef.current) {
      console.log('❌ Upload cancelled after validation');
      setUploading(false);
      return;
    }

      console.log('=== VALIDATION LOOP COMPLETED ===');
      console.log('Total errors found:', allErrors.length);
      console.log('Valid rows found:', validRows.length);
      console.log('Record statuses:', recordStatuses.length);

      if (allErrors.length > 0) {
        console.log('=== VALIDATION FAILED - RETURNING EARLY ===');
        setValidationErrors(allErrors);
        setResult({
          success: 0,
          errors: allErrors.map(e => ({ row: e.row, message: e.message })),
          records: recordStatuses
        });
        setUploading(false);
        return;
      }

      // Prepare transactions for API
      setProgress(87);
      
      console.log('=== VALIDATION COMPLETED SUCCESSFULLY ===');
      console.log('Valid rows to process:', validRows.length);
      console.log('Sample valid row:', validRows[0]);
      
      const transactions = validRows.map(row => {
        let transactionDate: Date;
        
        const dateField = row['Transaction Date'];
        if (typeof dateField === 'number') {
          transactionDate = new Date((dateField - 25569) * 86400 * 1000);
        } else if (typeof dateField === 'string') {
          const ddmmyyyy = /^(\d{2})-(\d{2})-(\d{4})$/;
          const match = dateField.match(ddmmyyyy);
          if (match) {
            const [, day, month, year] = match;
            transactionDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          } else {
            transactionDate = new Date(dateField);
          }
        } else {
          transactionDate = new Date(dateField);
        }

        const transaction = {
          clientCode: row['Client Code'],
          indicatorName: row['Transaction Type'] || row['Transaction_Type'] || row['TransactionType'],
          amount: parseFloat(row['Transaction Amount']).toString(),
          remark: row['Narration'] || '',
          guiid: row['Transaction GUID'] || '',
          transactionDate: transactionDate.toISOString()
        };
        
        console.log('Prepared transaction:', transaction);
        return transaction;
      });

      // Upload to API
      setProgress(93);
      
      console.log('=== STARTING API UPLOAD ===');
      console.log('Number of transactions to upload:', transactions.length);
      console.log('Sending transactions to API:', JSON.stringify({ transactions }, null, 2));
      
      console.log('Making fetch request to /api/sync/transactions...');
      const response = await fetch('/api/sync/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer sync-api-token-2024'
        },
        body: JSON.stringify({ transactions })
      });

      console.log('API Response received. Status:', response.status, 'OK:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`Failed to upload transactions: ${response.status} - ${errorText}`);
      }

      console.log('Parsing API response JSON...');
      const uploadResult = await response.json();
      console.log('API response parsed successfully');
      setProgress(100);
      
      console.log('=== FULL API RESPONSE ===');
      console.log('Raw API Response:', JSON.stringify(uploadResult, null, 2));
      console.log('uploadResult.summary:', uploadResult.summary);
      console.log('uploadResult.summary?.created:', uploadResult.summary?.created);
      console.log('uploadResult.summary?.updated:', uploadResult.summary?.updated);
      console.log('uploadResult.summary?.failed:', uploadResult.summary?.failed);
      console.log('uploadResult.failures:', uploadResult.failures);
      console.log('uploadResult.success:', uploadResult.success);
      console.log('uploadResult.message:', uploadResult.message);
      
      // Calculate successful transactions from API response
      const successfulTransactions = (uploadResult.summary?.created || 0) + (uploadResult.summary?.updated || 0);
      const failedTransactions = uploadResult.summary?.failed || 0;
      
      // Convert API failures to the expected format
      const apiErrors = (uploadResult.failures || []).map((failure: any, index: number) => ({
        row: index + 2, // Approximate row number
        message: failure.reason || 'Unknown error'
      }));
      
      // Update record statuses based on API response
      const totalFailed = uploadResult.summary?.failed || 0;
      const totalSuccessful = successfulTransactions;
      
      // Since we don't have exact row-to-failure mapping, we'll distribute the failures
      // among the records. The first 'totalFailed' records will be marked as failed,
      // and the remaining will be marked as successful.
      const updatedRecordStatuses = recordStatuses.map((record, index) => {
        if (index < totalFailed) {
          // This record failed
          const failureReason = uploadResult.failures?.[index]?.reason || 'Processing failed';
          return { 
            ...record, 
            status: 'error' as const, 
            message: failureReason
          };
        } else {
          // This record was successful
          return { 
            ...record, 
            status: 'success' as const,
            message: 'Successfully processed and uploaded'
          };
        }
      });
      
      const result: UploadResult = {
        success: successfulTransactions,
        errors: apiErrors,
        records: updatedRecordStatuses
      };
      
      console.log('Final processed result:', result);
      
      setRecordStatuses(updatedRecordStatuses);
      setResult(result);
      onUploadComplete?.(result);

    } catch (error) {
      console.error('=== UPLOAD ERROR ===');
      console.error('Error details:', error);
      console.error('Error message:', error instanceof Error ? error.message : String(error));
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
      setResult({
        success: 0,
        errors: [{ row: 0, message: error instanceof Error ? error.message : 'Upload failed' }]
      });
    } finally {
      console.log('=== UPLOAD PROCESS FINISHED ===');
      setUploading(false);
      setProgress(0);
    }
  };

    const resetUpload = () => {

      // 🔴 ADD THIS (VERY IMPORTANT)
      cancelRef.current = true;

      setUploading(false); // stop UI immediately
      setFile(null);
      setResult(null);
      setValidationErrors([]);
      setRecordStatuses([]);
      setProgress(0);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };

  const downloadSample = (format: 'excel' | 'json') => {
    const sampleData = [
      { 'Transaction GUID': 'INV-001-2024-001', 'Client Code': 'GF00000650', 'Transaction Type': 'Investment Data', 'Transaction Date': '15-01-2024', 'Transaction Amount': 50000, 'Narration': 'Initial investment' },
      { 'Transaction GUID': 'INV-001-2024-002', 'Client Code': 'GF00000651', 'Transaction Type': 'Investment Data', 'Transaction Date': '16-01-2024', 'Transaction Amount': 75000, 'Narration': 'Additional investment' },
      { 'Transaction GUID': '', 'Client Code': 'GF00000652', 'Transaction Type': 'Investment Data', 'Transaction Date': '17-01-2024', 'Transaction Amount': 100000, 'Narration': '' }
    ];
    
    if (format === 'excel') {
      const ws = XLSX.utils.json_to_sheet(sampleData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Investment Sample');
      XLSX.writeFile(wb, 'investment_sample.xlsx');
    } else {
      const jsonString = JSON.stringify(sampleData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'investment_sample.json';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Investment File Upload
        </CardTitle>
        <CardDescription>
          Upload investment transactions from Excel (.xlsx, .xls) or JSON files. Download sample format below.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => downloadSample('excel')} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Download Excel Sample
          </Button>
        </div>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.json"
            onChange={handleFileSelect}
            className="hidden"
          />
          {!file ? (
            <div className="space-y-2">
              <Upload className="h-12 w-12 mx-auto text-gray-400" />
              <div>
                <Button type="button" onClick={() => fileInputRef.current?.click()}>
                  Select File
                </Button>
              </div>
              <p className="text-sm text-gray-500">
                Supported formats: .xlsx, .xls, .json
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {file.name.endsWith('.json') ? (
                <FileText className="h-12 w-12 mx-auto text-green-500" />
              ) : (
                <FileSpreadsheet className="h-12 w-12 mx-auto text-green-500" />
              )}
              <p className="font-medium">{file.name}</p>
              <p className="text-sm text-gray-500">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
              <div className="flex gap-2 justify-center">
                <Button type="button" onClick={handleUpload} disabled={uploading}>
                  {uploading ? 'Uploading...' : 'Upload'}
                </Button>
                <Button type="button" variant="outline" onClick={resetUpload}>
                  Remove
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {uploading && (
          <div className="space-y-2">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-center text-gray-600">
            {progress < 5 ? 'Preparing...' :
            progress < 10 ? 'Reading file...' :
            progress < 86 ? `Validating ${validatedRows} / ${totalRows} rows...` :
            progress < 93 ? 'Processing...' :
            'Uploading...'}
          </p>
          </div>
        )}

       {/* Validation Errors */}
        {/* {validationErrors.length > 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                
                <p className="font-medium">
                  Validation Errors Found ({validationErrors.length})
                </p>

                <div className="max-h-60 overflow-y-auto space-y-1 border rounded-md p-2 bg-gray-50">
                  {validationErrors.map((error, index) => (
                    <p key={index} className="text-sm text-black-600">
                      Row {error.row}: {error.message}
                    </p>
                  ))}
                </div>

              </div>
            </AlertDescription>
          </Alert>
        )} */}

        {/* Upload Result */}
        {result && (
          <Alert className={result.errors.length === 0 ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}>
            {result.errors.length === 0 ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-yellow-600" />
            )}
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">
                  {result.errors.length === 0 
                    ? `Successfully uploaded ${result.success} transactions!`
                    : result.success > 0
                      ? `Uploaded ${result.success} transactions with ${result.errors.length} errors`
                      : `Upload failed - ${result.errors.length} transactions could not be processed`
                  }
                </p>
                {result.records && result.records.length > 0 && (
                  <div className="text-sm text-gray-600">
                    <p>Total records processed: {result.records.length}</p>
                    <p>✅ Successful: {result.records.filter(r => r.status === 'success').length}</p>
                    {result.records.filter(r => r.status === 'error').length > 0 && (
                      <p>❌ Failed: {result.records.filter(r => r.status === 'error').length}</p>
                    )}
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Error Records Table */}
        {result && result.records && result.records.filter(r => r.status === 'error').length > 0 && (
          <Card className="border-red-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2 text-red-700">
                <XCircle className="h-5 w-5" />
                Failed Records ({result.records.filter(r => r.status === 'error').length})
              </CardTitle>
              <CardDescription>
                The following records failed to process. Please correct and re-upload.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-64 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-white border-b">
                    <tr>
                      <th className="text-left p-2">Row</th>
                      <th className="text-left p-2">Client Code</th>
                      <th className="text-left p-2">Amount</th>
                      <th className="text-left p-2">Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.records.filter(r => r.status === 'error').map((record, index) => (
                      <tr key={index} className="border-b hover:bg-red-50">
                        <td className="p-2">{record.row}</td>
                        <td className="p-2 font-medium">{record.clientCode}</td>
                        <td className="p-2">₹{record.amount.toLocaleString()}</td>
                        <td className="p-2 text-red-600">{record.message || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}