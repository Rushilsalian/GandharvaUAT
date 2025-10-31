import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, AlertCircle, XCircle, Users, UserPlus, Mail, MailX } from 'lucide-react';

interface UploadResults {
  success: boolean;
  message: string;
  processed: number;
  errors: Array<{
    client: any;
    error: string;
  }>;
  results?: {
    success: number;
    skipped: number;
    errors: Array<{
      client: any;
      error: string;
    }>;
  };
  emailResults?: {
    sent: number;
    failed: number;
    failedEmails: Array<{
      email: string;
      credentials: string;
    }>;
  };
}

interface ClientBulkUploadResultsProps {
  results: UploadResults;
}

export function ClientBulkUploadResults({ results }: ClientBulkUploadResultsProps) {
  const totalProcessed = results.processed || 0;
  const successCount = results.results?.success || 0;
  const skippedCount = results.results?.skipped || 0;
  const errorCount = results.errors?.length || 0;
  
  const emailsSent = results.emailResults?.sent || 0;
  const emailsFailed = results.emailResults?.failed || 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-600">{successCount}</p>
                <p className="text-sm text-gray-600">Created</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-blue-600">{skippedCount}</p>
                <p className="text-sm text-gray-600">Skipped</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-2xl font-bold text-red-600">{errorCount}</p>
                <p className="text-sm text-gray-600">Errors</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Mail className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold text-purple-600">{emailsSent}</p>
                <p className="text-sm text-gray-600">Emails Sent</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overall Status */}
      <Alert variant={results.success ? "default" : "destructive"}>
        {results.success ? (
          <CheckCircle className="h-4 w-4" />
        ) : (
          <AlertCircle className="h-4 w-4" />
        )}
        <AlertDescription>
          {results.message}
        </AlertDescription>
      </Alert>

      {/* Email Results */}
      {(emailsSent > 0 || emailsFailed > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Badge variant="default" className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {emailsSent} Sent
                </Badge>
                {emailsFailed > 0 && (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <MailX className="h-3 w-3" />
                    {emailsFailed} Failed
                  </Badge>
                )}
              </div>
              
              {results.emailResults?.failedEmails && results.emailResults.failedEmails.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Failed Email Credentials</h4>
                  <div className="space-y-2">
                    {results.emailResults.failedEmails.map((item, index) => (
                      <div key={index} className="p-3 bg-red-50 rounded-lg border border-red-200">
                        <p className="text-sm">
                          <strong>Email:</strong> {item.email}
                        </p>
                        <p className="text-sm">
                          <strong>Credentials:</strong> {item.credentials}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Details */}
      {errorCount > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              Processing Errors ({errorCount})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64 w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Error</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.errors.map((error, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono text-sm">
                        {error.client?.code || 'N/A'}
                      </TableCell>
                      <TableCell>{error.client?.name || 'N/A'}</TableCell>
                      <TableCell>{error.client?.email || 'N/A'}</TableCell>
                      <TableCell className="text-red-600 text-sm">
                        {error.error}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Success Summary */}
      {successCount > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Successfully Processed ({successCount})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p>✅ {successCount} client records created successfully</p>
              <p>👤 User accounts created for clients with email addresses</p>
              <p>📧 Welcome emails sent with login credentials</p>
              <p>🔐 Secure passwords generated automatically</p>
              {skippedCount > 0 && (
                <p>⏭️ {skippedCount} existing clients were skipped</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Processing Details */}
      <Card>
        <CardHeader>
          <CardTitle>Processing Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Client Records</h4>
              <ul className="space-y-1">
                <li>Total Processed: {totalProcessed}</li>
                <li>Successfully Created: {successCount}</li>
                <li>Existing (Skipped): {skippedCount}</li>
                <li>Errors: {errorCount}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">User Accounts & Emails</h4>
              <ul className="space-y-1">
                <li>Welcome Emails Sent: {emailsSent}</li>
                <li>Email Failures: {emailsFailed}</li>
                <li>Auto-generated Passwords: {successCount}</li>
                <li>Client Role Assigned: {successCount}</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}