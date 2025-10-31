import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Upload, FileSpreadsheet, CheckCircle, XCircle, AlertCircle, Download } from 'lucide-react';
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

interface ClosureExcelUploadProps {
  onUploadComplete?: (result: UploadResult) => void;
}

export function ClosureExcelUpload({ onUploadComplete }: ClosureExcelUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      // Validate file type
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
      // Parse Excel file
      setProgress(20);
      const data = await parseExcelFile(file);
      
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
          indicatorName: 'Closure',
          amount: parseFloat(row.amount).toString(),
          remark: row.remark || '',
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
      
      const result: UploadResult = {
        success: uploadResult.results.success,
        errors: uploadResult.results.errors || []
      };
      
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
      { client_code: 'CLI001', date: '15-01-2024', amount: 125000, remark: 'Account closure - maturity' },
      { client_code: 'CLI002', date: '16-01-2024', amount: 85000, remark: 'Early closure' },
      { client_code: 'CLI003', date: '17-01-2024', amount: 200000, remark: '' }
    ];
    
    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Closure Sample');
    XLSX.writeFile(wb, 'closure_sample.xlsx');
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Excel Upload - Closure Transactions
        </CardTitle>
        <CardDescription>
          Upload Excel file with closure transaction data. Indicator ID: 4 (Closure)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Sample File Download */}
        <div className="flex justify-end">
          <Button onClick={downloadSample} variant="ghost" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Download Sample File
          </Button>
        </div>

        {/* File Selection */}
        <div className="space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            className="w-full"
            disabled={uploading}
          >
            <Upload className="h-4 w-4 mr-2" />
            Select Excel File
          </Button>
          {file && (
            <p className="text-sm text-muted-foreground">
              Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
            </p>
          )}
        </div>

        {/* Format Requirements */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Required Excel Format:</strong>
            <ul className="mt-2 space-y-1 text-sm">
              <li>• <strong>client_code:</strong> Alphanumeric, max 50 characters (Mandatory)</li>
              <li>• <strong>date:</strong> DD-MM-YYYY format (Mandatory)</li>
              <li>• <strong>amount:</strong> Numeric, max 999999999.99 (Mandatory)</li>
              <li>• <strong>remark:</strong> Text, max 500 characters (Optional)</li>
            </ul>
          </AlertDescription>
        </Alert>

        {/* Upload Progress */}
        {uploading && (
          <div className="space-y-2">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-muted-foreground text-center">
              Processing... {progress}%
            </p>
          </div>
        )}

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Validation Errors Found:</strong>
              <div className="mt-2 max-h-40 overflow-y-auto">
                {validationErrors.slice(0, 10).map((error, index) => (
                  <div key={index} className="text-sm">
                    Row {error.row}, {error.field}: {error.message}
                  </div>
                ))}
                {validationErrors.length > 10 && (
                  <div className="text-sm font-medium">
                    ... and {validationErrors.length - 10} more errors
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Upload Result */}
        {result && (
          <Alert variant={result.errors.length === 0 ? "default" : "destructive"}>
            {result.errors.length === 0 ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            <AlertDescription>
              <strong>Upload Complete:</strong>
              <div className="mt-2">
                <p>Successfully processed: {result.success} closure transactions</p>
                {result.errors.length > 0 && (
                  <div className="mt-2">
                    <p>Errors: {result.errors.length}</p>
                    <div className="max-h-32 overflow-y-auto text-sm">
                      {result.errors.slice(0, 5).map((error, index) => (
                        <div key={index}>
                          {error.row > 0 ? `Row ${error.row}: ` : ''}{error.message}
                        </div>
                      ))}
                      {result.errors.length > 5 && (
                        <div>... and {result.errors.length - 5} more errors</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleUpload}
            disabled={!file || uploading || validationErrors.length > 0}
            className="flex-1"
          >
            {uploading ? 'Uploading...' : 'Upload Closure Transactions'}
          </Button>
          {(file || result) && (
            <Button onClick={resetUpload} variant="outline" disabled={uploading}>
              Reset
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}