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

interface WithdrawalExcelUploadProps {
  onUploadComplete?: (result: UploadResult) => void;
}

export function WithdrawalExcelUpload({ onUploadComplete }: WithdrawalExcelUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [recordStatuses, setRecordStatuses] = useState<RecordStatus[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [totalRows, setTotalRows] = useState(0);
  const [validatedRows, setValidatedRows] = useState(0);


  const validateRow = async (row: any, rowIndex: number): Promise<ValidationError[]> => {
    const errors: ValidationError[] = [];
    
    // Validate client_code (Length = 50, Alpha Numeric, Mandatory)
    if (!row.client_code || typeof row.client_code !== 'string') {
      errors.push({ row: rowIndex, field: 'client_code', message: 'Client code is required' });
    } else if (row.client_code.length > 50) {
      errors.push({ row: rowIndex, field: 'client_code', message: 'Client code must be 50 characters or less' });
    } else if (!/^[a-zA-Z0-9]+$/.test(row.client_code)) {
      errors.push({ row: rowIndex, field: 'client_code', message: 'Client code must be alphanumeric' });
    } else {
      // Check if client exists in database
      try {
        const client = await clientAPI.getClientByCode(row.client_code);
        if (!client) {
          errors.push({ row: rowIndex, field: 'client_code', message: `Client with code '${row.client_code}' not found in database` });
        }
      } catch (error) {
        errors.push({ row: rowIndex, field: 'client_code', message: `Unable to validate client code '${row.client_code}'` });
      }
    }

    // Validate date (DD-MM-YYYY, Mandatory)
    if (!row.date) {
      errors.push({ row: rowIndex, field: 'date', message: 'Date is required' });
    } else {
      let dateValue: Date;
      
      if (typeof row.date === 'number') {
        // Excel serial date
        dateValue = new Date((row.date - 25569) * 86400 * 1000);
      } else if (typeof row.date === 'string') {
        // Try DD-MM-YYYY format first
        const ddmmyyyy = /^(\d{2})-(\d{2})-(\d{4})$/;
        const match = row.date.match(ddmmyyyy);
        if (match) {
          const [, day, month, year] = match;
          dateValue = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        } else {
          // Try other date formats like "11-Jan-25"
          dateValue = new Date(row.date);
        }
      } else {
        dateValue = new Date(row.date);
      }
      
      if (isNaN(dateValue.getTime())) {
        errors.push({ row: rowIndex, field: 'date', message: 'Invalid date format. Use DD-MM-YYYY' });
      }
    }

    // Validate amount (999999999.99, Numeric, Mandatory)
    if (!row.amount && row.amount !== 0) {
      errors.push({ row: rowIndex, field: 'amount', message: 'Amount is required' });
    } else {
      const amount = parseFloat(row.amount);
      if (isNaN(amount)) {
        errors.push({ row: rowIndex, field: 'amount', message: 'Amount must be numeric' });
      } else if (amount <= 0) {
        errors.push({ row: rowIndex, field: 'amount', message: 'Amount must be positive' });
      } else if (amount > 999999999.99) {
        errors.push({ row: rowIndex, field: 'amount', message: 'Amount exceeds maximum limit (999999999.99)' });
      }
    }

    // Validate remark (Length = 500, Alpha Numeric, Optional)
    if (row.remark && typeof row.remark === 'string' && row.remark.length > 500) {
      errors.push({ row: rowIndex, field: 'remark', message: 'Remark must be 500 characters or less' });
    }

    // Validate guiid (Optional, but if provided should be valid)
    if (row.guiid && typeof row.guiid === 'string' && row.guiid.length > 100) {
      errors.push({ row: rowIndex, field: 'guiid', message: 'GUID must be 100 characters or less' });
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
          
          if (!jsonData || jsonData.length === 0) {
            reject(new Error('No data found in the Excel file'));
            return;
          }

          resolve(jsonData as TransactionRow[]);
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
            const mappedTransaction = {
              client_code: transaction['Client Code'] || transaction.client_code,
              date: transaction['Transaction Date'] || transaction.date,
              amount: Math.abs(parseFloat(transaction['Transaction Amount'] || transaction.amount)), // Convert negative to positive
              remark: transaction['Remark'] || transaction.remark || '',
              guiid: transaction['GUID'] || transaction.guiid || ''
            };
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
      
      console.log('Parsed data:', data);
      setTotalRows(data.length);
      setValidatedRows(0);
      // Validate data
      setProgress(40);
      const allErrors: ValidationError[] = [];
      const validRows: any[] = [];
      const recordStatuses: RecordStatus[] = [];

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const rowNumber = i + 2;

        const rowErrors = await validateRow(row, rowNumber);

        // ✅ ADD THIS (counter)
        setValidatedRows(i + 1);

        // ✅ ADD THIS (progress sync 40 → 60)
        const percent = 40 + ((i + 1) / data.length) * 20;
        setProgress(percent);

        if (rowErrors.length > 0) {
          allErrors.push(...rowErrors);
          recordStatuses.push({
            row: rowNumber,
            clientCode: row.client_code || 'Unknown',
            amount: typeof row.amount === 'number' ? row.amount : parseFloat(row.amount) || 0,
            status: 'error',
            message: rowErrors.map(e => e.message).join(', '),
            guiid: row.guiid
          });
        } else {
          validRows.push({ ...row, originalRowNumber: rowNumber });
          recordStatuses.push({
            row: rowNumber,
            clientCode: row.client_code,
            amount: typeof row.amount === 'number' ? row.amount : parseFloat(row.amount),
            status: 'success',
            guiid: row.guiid
          });
        }
      }

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
      const transactions = validRows.map(row => {
        let transactionDate: Date;
        
        if (typeof row.date === 'number') {
          transactionDate = new Date((row.date - 25569) * 86400 * 1000);
        } else if (typeof row.date === 'string') {
          const ddmmyyyy = /^(\d{2})-(\d{2})-(\d{4})$/;
          const match = row.date.match(ddmmyyyy);
          if (match) {
            const [, day, month, year] = match;
            transactionDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          } else {
            transactionDate = new Date(row.date);
          }
        } else {
          transactionDate = new Date(row.date);
        }

        return {
          clientCode: row.client_code,
          indicatorName: 'Withdrawal',
          amount: (typeof row.amount === 'number' ? row.amount : parseFloat(row.amount)).toString(),
          remark: row.remark || '',
          guiid: row.guiid || '',
          transactionDate: transactionDate.toISOString()
        };
      });

      // Upload to API
      setProgress(80);
      const response = await fetch('/api/sync/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer sync-api-token-2024'
        },
        body: JSON.stringify({ transactions })
      });

      if (!response.ok) {
        throw new Error('Failed to upload transactions');
      }

      const uploadResult = await response.json();
      setProgress(100);
      
      // Update record statuses based on API response
      const apiErrors = uploadResult.results?.errors || [];
      const updatedRecordStatuses = recordStatuses.map(record => {
        const apiError = apiErrors.find((err: any) => err.clientCode === record.clientCode);
        if (apiError) {
          return { ...record, status: 'error' as const, message: apiError.message };
        }
        return record;
      });
      
      const result: UploadResult = {
        success: uploadResult.results?.success || 0,
        errors: uploadResult.results?.errors || [],
        records: updatedRecordStatuses
      };
      
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
      { guiid: 'WTH-001-2024-001', client_code: 'CLI001', date: '15-01-2024', amount: 25000, remark: 'Partial withdrawal' },
      { guiid: 'WTH-001-2024-002', client_code: 'CLI002', date: '16-01-2024', amount: 15000, remark: 'Emergency withdrawal' },
      { guiid: '', client_code: 'CLI003', date: '17-01-2024', amount: 30000, remark: '' }
    ];
    
    if (format === 'excel') {
      const ws = XLSX.utils.json_to_sheet(sampleData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Withdrawal Sample');
      XLSX.writeFile(wb, 'withdrawal_sample.xlsx');
    } else {
      const jsonString = JSON.stringify(sampleData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'withdrawal_sample.json';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Withdrawal File Upload
        </CardTitle>
        <CardDescription>
          Upload withdrawal transactions from Excel (.xlsx, .xls) or JSON files. Download sample format below.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => downloadSample('excel')} className="flex items-center gap-2">
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
                <Button onClick={handleUpload} disabled={uploading}>
                  {uploading ? 'Uploading...' : 'Upload'}
                </Button>
                <Button variant="outline" onClick={resetUpload}>
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
                progress <= 60 ? `Validating ${validatedRows} / ${totalRows} rows...`:
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
                
                {/* Header with count */}
                <p className="font-medium">
                  Validation Errors Found ({validationErrors.length})
                </p>

                {/* Scrollable list */}
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
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Record Status Table */}
        {recordStatuses.length > 0 && (
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
                    {recordStatuses.map((record, index) => (
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
                          {record.message || (record.status === 'success' ? 'Successfully processed' : '-')}
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