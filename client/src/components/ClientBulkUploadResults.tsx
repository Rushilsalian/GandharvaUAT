import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, AlertCircle, XCircle, Users, UserPlus, Mail, MailX, RefreshCw } from 'lucide-react';

interface UploadResults {
  success: boolean;
  message: string;
  summary?: {
    total: number;
    created: number;
    updated: number;
    failed: number;
    emailsSent: number;
    emailsFailed: number;
    mobileOnlyUsers?: number;
    credentialsNeedManualDistribution?: number;
  };
  failures?: Array<{ clientCode: string; reason: string }>;
  emailResults?: {
    sent: number;
    failed: number;
    failedEmails: Array<{ email: string; credentials: string }>;
  };
}

interface ClientBulkUploadResultsProps {
  results: UploadResults;
}

export function ClientBulkUploadResults({ results }: ClientBulkUploadResultsProps) {
  const summary = results.summary;
  const totalRecords   = summary?.total ?? 0;
  const createdCount   = summary?.created ?? 0;
  const updatedCount   = summary?.updated ?? 0;
  const failedCount    = summary?.failed ?? 0;
  const emailsSent     = summary?.emailsSent ?? results.emailResults?.sent ?? 0;
  const emailsFailed   = summary?.emailsFailed ?? results.emailResults?.failed ?? 0;

  const failures     = results.failures ?? [];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <UserPlus className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-600">{createdCount}</p>
                <p className="text-sm text-gray-600">Created</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-blue-600">{updatedCount}</p>
                <p className="text-sm text-gray-600">Updated</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-2xl font-bold text-red-600">{failedCount}</p>
                <p className="text-sm text-gray-600">Failed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Second row: Emails Sent */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

        {emailsFailed > 0 && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <MailX className="h-8 w-8 text-orange-600" />
                <div>
                  <p className="text-2xl font-bold text-orange-600">{emailsFailed}</p>
                  <p className="text-sm text-gray-600">Email Failures</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Overall Status */}
      <Alert variant={results.success ? 'default' : 'destructive'}>
        {results.success ? (
          <CheckCircle className="h-4 w-4" />
        ) : (
          <AlertCircle className="h-4 w-4" />
        )}
        <AlertDescription>{results.message}</AlertDescription>
      </Alert>

      {/* Failure Details */}
      {failures.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Processing Failures ({failures.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64 w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client Code</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {failures.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono text-sm">
                        {item.clientCode || 'N/A'}
                      </TableCell>
                      <TableCell className="text-red-600 text-sm">
                        {item.reason}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Email Credential Failures */}
      {results.emailResults?.failedEmails && results.emailResults.failedEmails.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MailX className="h-5 w-5 text-orange-600" />
              Credentials Needing Manual Distribution ({results.emailResults.failedEmails.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {results.emailResults.failedEmails.map((item, index) => (
                <div key={index} className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <p className="text-sm"><strong>Contact:</strong> {item.email}</p>
                  <p className="text-sm"><strong>Credentials:</strong> {item.credentials}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Processing Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Processing Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Client Records</h4>
              <ul className="space-y-1">
                <li>Total in File: {totalRecords}</li>
                <li>Successfully Created: {createdCount}</li>
                <li>Updated (Existing): {updatedCount}</li>
                <li>Failed: {failedCount}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">User Accounts & Emails</h4>
              <ul className="space-y-1">
                <li>Welcome Emails Sent: {emailsSent}</li>
                <li>Email Failures: {emailsFailed}</li>
                <li>Auto-generated Passwords: {createdCount}</li>
                <li>Client Role Assigned: {createdCount}</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
