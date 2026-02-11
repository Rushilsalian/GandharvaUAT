import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

import { Upload, FileSpreadsheet, FileText, CheckCircle, XCircle, AlertCircle, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

interface TransactionRow {
  client_code: string;
  date: string;
  amount: number;
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
  status: 'success' | 'error' | 'skipped';
  message?: string;
  guiid?: string;
}

interface UploadResult {
  success: number;
  errors: Array<{ row: number; message: string }>;
  records?: RecordStatus[];
}

interface TransactionExcelUploadProps {
  transactionType: 'Withdrawal' | 'Payout' | 'Closure';
  onUploadComplete?: (result: UploadResult) => void;
}

export function TransactionExcelUpload({ transactionType, onUploadComplete }: TransactionExcelUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [recordStatuses, setRecordStatuses] = useState<RecordStatus[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateRow = (row: any, rowIndex: number): ValidationError[] => {
    const errors: ValidationError[] = [];
    
    // Use exact header names from your Excel file
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
    if (guiidField && typeof guiidField === 'string' && guiidField.length > 200) {
      errors.push({ row: rowIndex, field: 'guiid', message: 'Transaction GUID must be 200 characters or less' });
    }

    return errors;
  };

  const parseExcelFile = (file: File): Promise<TransactionRow[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          console.log('Excel parsing - Raw data:', jsonData);
          console.log('Excel parsing - First row keys:', jsonData.length > 0 ? Object.keys(jsonData[0] as any) : 'No data');
          
          if (!jsonData || jsonData.length === 0) {
            reject(new Error('No data found in the Excel file'));
            return;
          }

          resolve(jsonData as TransactionRow[]);
        } catch (error) {
          console.error('Excel parsing error:', error);
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
          console.log('Raw JSON data:', jsonData);
          
          let transactions: any[];
          
          // Handle nested structure with "Result" property
          if (jsonData.Result && Array.isArray(jsonData.Result)) {
            console.log('Found Result property with array:', jsonData.Result);
            transactions = jsonData.Result;
          } else if (Array.isArray(jsonData)) {
            console.log('Found direct array:', jsonData);
            transactions = jsonData;
          } else {
            console.log('Invalid JSON structure:', jsonData);
            console.log('jsonData.Result exists:', !!jsonData.Result);
            console.log('jsonData.Result is array:', Array.isArray(jsonData.Result));
            console.log('jsonData is array:', Array.isArray(jsonData));
            reject(new Error('JSON file must contain an array of transactions or have a "Result" property with an array'));
            return;
          }

          if (transactions.length === 0) {
            reject(new Error('No data found in the JSON file'));
            return;
          }

          // Map field names to expected format
          const mappedTransactions = transactions.map(transaction => {
            console.log('Parsing JSON transaction:', transaction);
            
            // Check if this looks like client data instead of transaction data
            if (transaction.user && !transaction.amount && !transaction.date) {
              throw new Error('This appears to be client data, not transaction data. Transaction data requires: Client Code, Transaction Date, Transaction Amount, Transaction Type.');
            }
            
            const mappedTransaction = {
              client_code: transaction['Client Code'] || transaction.client_code || transaction.clientCode,
              date: transaction['Transaction Date'] || transaction.date || transaction.transactionDate,
              amount: Math.abs(parseFloat(transaction['Transaction Amount'] || transaction.amount || transaction.transactionAmount || 0)), // Convert negative to positive
              remark: transaction['Remark'] || transaction.remark || transaction.narration || '',
              guiid: transaction['GUID'] || transaction.guiid || transaction.transactionGuid || ''
            };
            
            // Additional validation for required fields
            if (!mappedTransaction.client_code) {
              throw new Error('Client Code is required for each transaction');
            }
            if (!mappedTransaction.date) {
              throw new Error('Transaction Date is required for each transaction');
            }
            if (!mappedTransaction.amount || mappedTransaction.amount === 0) {
              throw new Error('Transaction Amount is required and must be greater than 0');
            }
            
            console.log('Mapped transaction:', mappedTransaction);
            return mappedTransaction;
          });

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
    if (!file) return;

    setUploading(true);
    setProgress(0);
    setValidationErrors([]);

    try {
      // Parse file based on type
      setProgress(20);
      let data: TransactionRow[];
      
      if (file.name.endsWith('.json')) {
        data = await parseJsonFile(file);
      } else {
        data = await parseExcelFile(file);
      }
      
      // Validate data
      setProgress(40);
      const allErrors: ValidationError[] = [];
      const validRows: any[] = [];
      const recordStatuses: RecordStatus[] = [];

      data.forEach((row, index) => {
        const rowNumber = index + 2; // +2 for Excel row numbering (1-based + header)
        console.log(`Validating row ${rowNumber}:`, row);
        console.log(`Row keys:`, Object.keys(row as any));
        const rowErrors = validateRow(row, rowNumber);
        if (rowErrors.length > 0) {
          allErrors.push(...rowErrors);
          recordStatuses.push({
            row: rowNumber,
            clientCode: (row as any)['Client Code'] || 'Unknown',
            amount: typeof (row as any)['Transaction Amount'] === 'number' ? (row as any)['Transaction Amount'] : parseFloat((row as any)['Transaction Amount']) || 0,
            status: 'error',
            message: rowErrors.map(e => e.message).join(', '),
            guiid: (row as any)['Transaction GUID']
          });
        } else {
          validRows.push(row);
          recordStatuses.push({
            row: rowNumber,
            clientCode: (row as any)['Client Code'],
            amount: typeof (row as any)['Transaction Amount'] === 'number' ? (row as any)['Transaction Amount'] : parseFloat((row as any)['Transaction Amount']),
            status: 'success',
            guiid: (row as any)['Transaction GUID']
          });
        }
      });

      setRecordStatuses(recordStatuses);

      if (allErrors.length > 0) {
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
      setProgress(60);
      console.log('Valid rows to process:', validRows);
      
      const transactions = validRows.map(row => {
        let transactionDate: Date;
        
        const dateField = (row as any)['Transaction Date'];
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
          clientCode: (row as any)['Client Code'],
          transactionType: transactionType,
          amount: parseFloat((row as any)['Transaction Amount']).toString(),
          remark: (row as any)['Narration'] || '',
          guiid: (row as any)['Transaction GUID'] || '',
          transactionDate: transactionDate.toISOString()
        };
        
        console.log('Prepared transaction:', transaction);
        return transaction;
      });

      // Upload to API
      setProgress(80);
      
      let response: Response;
      
      if (file.name.endsWith('.json')) {
        // Use JSON sync endpoint for JSON files
        console.log('Sending transactions to API:', JSON.stringify({ transactions }, null, 2));
        
        response = await fetch('/api/sync/transactions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer sync-api-token-2024'
          },
          body: JSON.stringify({ transactions })
        });
      } else {
        // Use Excel upload endpoint for Excel files
        console.log('Uploading Excel file to API');
        const formData = new FormData();
        formData.append('file', file);
        
        response = await fetch('/api/transactions/excel-upload', {
          method: 'POST',
          body: formData
        });
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`Failed to upload transactions: ${response.status} - ${errorText}`);
      }

      const uploadResult = await response.json();
      setProgress(100);
      
      console.log('=== FULL API RESPONSE ===');
      console.log('Raw API Response:', JSON.stringify(uploadResult, null, 2));
      console.log('uploadResult.results:', uploadResult.results);
      console.log('uploadResult.results?.success:', uploadResult.results?.success);
      console.log('uploadResult.results?.errors:', uploadResult.results?.errors);
      console.log('uploadResult.success:', uploadResult.success);
      console.log('uploadResult.message:', uploadResult.message);
      
      // Update record statuses based on API response
      const apiErrors = uploadResult.results?.errors || [];
      const updatedRecordStatuses = recordStatuses.map(record => {
        const apiError = apiErrors.find((err: any) => err.clientCode === record.clientCode);
        if (apiError) {
          return { ...record, status: 'error' as const, message: apiError.message };
        }
        // Ensure success records have a proper success message
        if (record.status === 'success') {
          return { ...record, message: 'Successfully processed and uploaded' };
        }
        return record;
      });
      
      const result: UploadResult = {
        success: uploadResult.results?.success || uploadResult.success || 0,
        errors: uploadResult.results?.errors || uploadResult.errors || [],
        records: updatedRecordStatuses
      };
      
      console.log('Final processed result:', result);
      
      setRecordStatuses(updatedRecordStatuses);
      setResult(result);
      onUploadComplete?.(result);

    } catch (error) {
      console.error('Upload error:', error);
      setResult({
        success: 0,
        errors: [{ row: 0, message: error instanceof Error ? error.message : 'Upload failed' }]
      });
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const resetUpload = () => {
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
      { 'Client Code': 'GF00000650', 'Transaction Type': `${transactionType} Data`, 'Transaction Amount': 50000, 'Transaction Date': '15-Jan-24', 'Narration': `Initial ${transactionType.toLowerCase()}`, 'Transaction GUID': 'TXN-001-2024' },
      { 'Client Code': 'GF00000651', 'Transaction Type': `${transactionType} Data`, 'Transaction Amount': 75000, 'Transaction Date': '16-Jan-24', 'Narration': `Additional ${transactionType.toLowerCase()}`, 'Transaction GUID': 'TXN-002-2024' },
      { 'Client Code': 'GF00000652', 'Transaction Type': `${transactionType} Data`, 'Transaction Amount': 100000, 'Transaction Date': '17-Jan-24', 'Narration': '', 'Transaction GUID': 'TXN-003-2024' }
    ];
    
    if (format === 'excel') {
      const ws = XLSX.utils.json_to_sheet(sampleData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, `${transactionType} Sample`);
      XLSX.writeFile(wb, `${transactionType.toLowerCase()}_sample.xlsx`);
    } else {
      // For JSON format, show the expected structure more clearly
      const jsonSample = {
        "Result": sampleData
      };
      const jsonString = JSON.stringify(jsonSample, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${transactionType.toLowerCase()}_sample.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          {transactionType} File Upload
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
          <Button type="button" variant="outline" onClick={() => downloadSample('json')} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Download JSON Sample
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
              {progress < 20 ? 'Preparing...' :
               progress < 40 ? 'Reading file...' :
               progress < 60 ? 'Validating data...' :
               progress < 80 ? 'Processing...' :
               'Uploading...'}
            </p>
          </div>
        )}

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">Validation Errors Found:</p>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {validationErrors.slice(0, 10).map((error, index) => (
                    <p key={index} className="text-sm">
                      Row {error.row}: {error.message}
                    </p>
                  ))}
                  {validationErrors.length > 10 && (
                    <p className="text-sm font-medium">
                      ... and {validationErrors.length - 10} more errors
                    </p>
                  )}
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

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
                    : `Uploaded ${result.success} transactions with ${result.errors.length} errors`
                  }
                </p>
                {result.records && result.records.length > 0 && (
                  <div className="text-sm text-gray-600">
                    <p>Total records processed: {result.records.length}</p>
                    <p>✅ Successful: {result.records.filter(r => r.status === 'success').length}</p>
                    {result.records.filter(r => r.status === 'error').length > 0 && (
                      <p>❌ Failed: {result.records.filter(r => r.status === 'error').length}</p>
                    )}
                    {result.records.filter(r => r.status === 'skipped').length > 0 && (
                      <p>⏭️ Skipped: {result.records.filter(r => r.status === 'skipped').length}</p>
                    )}
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Record Status Table - Always show when there are records */}
        {(recordStatuses.length > 0 || (result && result.records && result.records.length > 0)) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Record Processing Status</CardTitle>
              <CardDescription>
                Detailed status for each record in the uploaded file
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-60 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-white border-b">
                    <tr>
                      <th className="text-left p-2">Row</th>
                      <th className="text-left p-2">Client Code</th>
                      <th className="text-left p-2">Amount</th>
                      <th className="text-left p-2">Status</th>
                      <th className="text-left p-2">Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(result?.records || recordStatuses).map((record, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-2">{record.row}</td>
                        <td className="p-2">{record.clientCode}</td>
                        <td className="p-2">₹{record.amount.toLocaleString()}</td>
                        <td className="p-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            record.status === 'success' ? 'bg-green-100 text-green-800' :
                            record.status === 'error' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {record.status === 'success' ? (
                              <CheckCircle className="h-3 w-3" />
                            ) : record.status === 'error' ? (
                              <XCircle className="h-3 w-3" />
                            ) : (
                              <AlertCircle className="h-3 w-3" />
                            )}
                            {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                          </span>
                        </td>
                        <td className="p-2 text-gray-600">
                          {record.message || (record.status === 'success' ? 'Successfully processed and uploaded' : '-')}
                        </td>
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