import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, AlertCircle, CheckCircle, Loader2, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const TRANSACTION_TYPES = [
  { value: "investment", label: "Investment", fields: ["Client PAN No", "Investment Date", "Investment No", "Investment Details", "Amount"] },
  { value: "withdrawal", label: "Withdrawal", fields: ["Client PAN No", "Withdrawal Date", "Withdrawal No", "Withdrawal Details", "Amount"] },
  { value: "payout", label: "Payout", fields: ["Client PAN No", "Payout Date", "Payout No", "Payout Details", "Amount"] },
  { value: "closure", label: "Closure", fields: ["Client PAN No", "Closure Date", "Closure No", "Closure Details", "Amount"] }
];

interface UploadResult {
  success: boolean;
  message: string;
  processed: number;
  errors: Array<{ row: number; message: string }>;
}

export function FileUpload() {
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async ({ file, type }: { file: File; type: string }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      
      const response = await fetch('/api/transactions/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }
      
      return response.json();
    },
    onSuccess: (data: UploadResult) => {
      setUploadResult(data);
      if (data.success) {
        toast({
          title: "Upload Successful",
          description: `${data.processed} transactions processed successfully`,
        });
      } else {
        toast({
          title: "Upload Completed with Errors",
          description: data.message,
          variant: "destructive",
        });
      }
      setSelectedFile(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      
      if (!validTypes.includes(file.type) && !file.name.endsWith('.xls') && !file.name.endsWith('.xlsx')) {
        toast({
          title: "Invalid File Type",
          description: "Please select an Excel file (.xls or .xlsx)",
          variant: "destructive",
        });
        return;
      }
      
      setSelectedFile(file);
      setUploadResult(null);
    }
  };

  const handleUpload = () => {
    if (!selectedFile || !selectedType) {
      toast({
        title: "Missing Information",
        description: "Please select both a file and transaction type",
        variant: "destructive",
      });
      return;
    }
    
    uploadMutation.mutate({ file: selectedFile, type: selectedType });
  };

  const downloadTemplate = (type: string) => {
    const selectedTypeData = TRANSACTION_TYPES.find(t => t.value === type);
    if (!selectedTypeData) return;

    // Create CSV template
    const headers = selectedTypeData.fields.join(',');
    const sampleRow = selectedTypeData.fields.map(field => {
      switch (field) {
        case 'Client PAN No': return 'ABCDE1234F';
        case 'Amount': return '50000';
        default: return field.includes('Date') ? '2024-01-15' : `Sample ${field}`;
      }
    }).join(',');
    
    const csvContent = `${headers}\n${sampleRow}`;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_template.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const selectedTypeData = TRANSACTION_TYPES.find(t => t.value === selectedType);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bulk Transaction Import</h1>
        <p className="text-muted-foreground">
          Upload Excel files to import transaction data in bulk
        </p>
      </div>

      {/* Upload Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Transaction File
          </CardTitle>
          <CardDescription>
            Select transaction type and upload your Excel file
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="transactionType">Transaction Type *</Label>
              <Select 
                value={selectedType} 
                onValueChange={setSelectedType}
              >
                <SelectTrigger data-testid="select-transaction-type">
                  <SelectValue placeholder="Select transaction type" />
                </SelectTrigger>
                <SelectContent>
                  {TRANSACTION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fileUpload">Excel File *</Label>
              <Input
                id="fileUpload"
                type="file"
                accept=".xls,.xlsx"
                onChange={handleFileChange}
                data-testid="input-file-upload"
              />
            </div>
          </div>

          {selectedFile && (
            <div className="flex items-center gap-2 p-2 bg-muted rounded">
              <FileText className="h-4 w-4" />
              <span className="text-sm">{selectedFile.name}</span>
              <Badge variant="outline">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </Badge>
            </div>
          )}

          <div className="flex gap-2">
            <Button 
              onClick={handleUpload}
              disabled={!selectedFile || !selectedType || uploadMutation.isPending}
              data-testid="button-upload-file"
            >
              {uploadMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              {uploadMutation.isPending ? "Uploading..." : "Upload File"}
            </Button>

            {selectedType && (
              <Button
                variant="outline"
                onClick={() => downloadTemplate(selectedType)}
                data-testid="button-download-template"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Field Requirements */}
      {selectedTypeData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Required Fields for {selectedTypeData.label}</CardTitle>
            <CardDescription>
              Your Excel file must contain these columns in this exact order
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {selectedTypeData.fields.map((field, index) => (
                <Badge key={field} variant="outline" className="justify-center p-2">
                  {index + 1}. {field}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Results */}
      {uploadResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {uploadResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              Upload Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Status:</span>
                <Badge variant={uploadResult.success ? "default" : "destructive"}>
                  {uploadResult.success ? "Success" : "Completed with Errors"}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span>Processed Records:</span>
                <Badge variant="outline">{uploadResult.processed}</Badge>
              </div>

              {uploadResult.message && (
                <div className="p-3 bg-muted rounded">
                  <p className="text-sm">{uploadResult.message}</p>
                </div>
              )}

              {uploadResult.errors && uploadResult.errors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-red-600">Errors:</h4>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {uploadResult.errors.map((error, index) => (
                      <div key={index} className="text-sm p-2 bg-red-50 dark:bg-red-900/20 rounded">
                        <span className="font-medium">Row {error.row}:</span> {error.message}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}