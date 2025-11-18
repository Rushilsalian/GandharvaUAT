import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, FileSpreadsheet, FileText, CheckCircle, XCircle, AlertCircle, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

interface TransactionRow {
  client_code: string;
  date: string;
  amount: number;
  remark: string;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

interface UploadResult {
  success: number;
  errors: Array<{ row: number; message: string }>;
}

interface InvestmentExcelUploadProps {
  onUploadComplete?: (result: UploadResult) => void;
}

export function InvestmentExcelUpload({ onUploadComplete }: InvestmentExcelUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [activeTab, setActiveTab] = useState('excel');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateRow = (row: any, rowIndex: number): ValidationError[] => {
    const errors: ValidationError[] = [];
    
    // Validate client_code (Length = 50, Alpha Numeric, Mandatory)
    if (!row.client_code || typeof row.client_code !== 'string') {
      errors.push({ row: rowIndex, field: 'client_code', message: 'Client code is required' });
    } else if (row.client_code.length > 50) {
      errors.push({ row: rowIndex, field: 'client_code', message: 'Client code must be 50 characters or less' });
    } else if (!/^[a-zA-Z0-9]+$/.test(row.client_code)) {
      errors.push({ row: rowIndex, field: 'client_code', message: 'Client code must be alphanumeric' });
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
          
          if (!Array.isArray(jsonData)) {
            reject(new Error('JSON file must contain an array of transactions'));
            return;
          }

          if (jsonData.length === 0) {
            reject(new Error('No data found in the JSON file'));
            return;
          }

          resolve(jsonData as TransactionRow[]);
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
      // Validate file type based on active tab
      if (activeTab === 'excel') {
        const validTypes = [
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ];
        
        if (!validTypes.includes(selectedFile.type) && 
            !selectedFile.name.endsWith('.xls') && 
            !selectedFile.name.endsWith('.xlsx')) {
          alert('Please select a valid Excel file (.xls or .xlsx)');
          return;
        }
      } else if (activeTab === 'json') {
        if (!selectedFile.name.endsWith('.json')) {
          alert('Please select a valid JSON file (.json)');
          return;
        }
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
      
      if (activeTab === 'excel') {
        data = await parseExcelFile(file);
      } else {
        data = await parseJsonFile(file);
      }
      
      // Validate data
      setProgress(40);
      const allErrors: ValidationError[] = [];
      const validRows: any[] = [];

      data.forEach((row, index) => {
        const rowErrors = validateRow(row, index + 2); // +2 for Excel row numbering (1-based + header)
        if (rowErrors.length > 0) {
          allErrors.push(...rowErrors);
        } else {
          validRows.push(row);
        }
      });

      if (allErrors.length > 0) {
        setValidationErrors(allErrors);
        setUploading(false);
        return;
      }

      // Prepare transactions for API
      setProgress(60);
      
      console.log('Valid rows to process:', validRows);
      
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

        const transaction = {
          clientCode: row.client_code,
          indicatorName: 'Investment',
          amount: parseFloat(row.amount).toString(),
          remark: row.remark || '',
          transactionDate: transactionDate.toISOString()
        };
        
        console.log('Prepared transaction:', transaction);
        return transaction;
      });

      // Upload to API
      setProgress(80);
      
      console.log('Sending transactions to API:', JSON.stringify({ transactions }, null, 2));
      
      const response = await fetch('/api/sync/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer sync-api-token-2024'
        },
        body: JSON.stringify({ transactions })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`Failed to upload transactions: ${response.status} - ${errorText}`);
      }

      const uploadResult = await response.json();
      setProgress(100);
      
      const result: UploadResult = {
        success: uploadResult.results?.success || 0,
        errors: uploadResult.results?.errors || []
      };
      
      console.log('Upload result:', uploadResult);
      console.log('Processed result:', result);
      
      // Log the actual API response structure
      console.log('API Response Structure:', JSON.stringify(uploadResult, null, 2));
      
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
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const downloadSample = () => {
    const sampleData = [
      { client_code: 'CL001', date: '15-01-2024', amount: 50000, remark: 'Initial investment' },
      { client_code: 'CL001', date: '16-01-2024', amount: 75000, remark: 'Additional investment' },
      { client_code: 'CL001', date: '17-01-2024', amount: 100000, remark: '' }
    ];
    
    if (activeTab === 'excel') {
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
          Upload investment transactions from Excel or JSON files. Download sample format below.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="excel" className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              Excel Upload
            </TabsTrigger>
            <TabsTrigger value="json" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              JSON Upload
            </TabsTrigger>
          </TabsList>

          <TabsContent value="excel" className="space-y-4">
            <div className="flex justify-end">
              <Button variant="outline" onClick={downloadSample} className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Download Excel Sample
              </Button>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />
              {!file ? (
                <div className="space-y-2">
                  <FileSpreadsheet className="h-12 w-12 mx-auto text-gray-400" />
                  <div>
                    <Button onClick={() => fileInputRef.current?.click()}>
                      Select Excel File
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500">
                    Supported formats: .xlsx, .xls
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <FileSpreadsheet className="h-12 w-12 mx-auto text-green-500" />
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
          </TabsContent>

          <TabsContent value="json" className="space-y-4">
            {/* <div className="flex justify-end">
              <Button variant="outline" onClick={downloadSample} className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Download JSON Sample
              </Button>
            </div> */}

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                className="hidden"
              />
              {!file ? (
                <div className="space-y-2">
                  <FileText className="h-12 w-12 mx-auto text-gray-400" />
                  <div>
                    <Button onClick={() => fileInputRef.current?.click()}>
                      Select JSON File
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500">
                    Supported format: .json
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <FileText className="h-12 w-12 mx-auto text-green-500" />
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
          </TabsContent>
        </Tabs>

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
                {result.errors.length > 0 && (
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {result.errors.slice(0, 5).map((error, index) => (
                      <p key={index} className="text-sm">
                        {error.row > 0 ? `Row ${error.row}: ` : ''}{error.message}
                      </p>
                    ))}
                    {result.errors.length > 5 && (
                      <p className="text-sm font-medium">
                        ... and {result.errors.length - 5} more errors
                      </p>
                    )}
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}