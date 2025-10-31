import { useAuth } from "@/contexts/AuthContext";
import { EnhancedDashboard } from "./EnhancedDashboard";
import { AnalyticsDashboard } from "./AnalyticsDashboard";
import { DashboardWidgets } from "./DashboardWidgets";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Users, User, BarChart3, PieChart, Activity } from "lucide-react";

export function RoleBasedDashboard() {
  const { user, session, role } = useAuth();
  
  // Determine user role from multiple sources
  const userRole = session?.roleName?.toLowerCase() || 
                   role?.roleName?.toLowerCase() || 
                   user?.role?.toLowerCase() || 
                   'client';

  // Role-based access control
  const hasAdminAccess = userRole === 'admin';
  const hasLeaderAccess = userRole === 'leader' || hasAdminAccess;
  const hasClientAccess = userRole === 'client' || hasLeaderAccess;

  // Get role display info
  const getRoleInfo = () => {
    switch (userRole) {
      case 'admin':
        return {
          icon: Shield,
          label: 'Administrator',
          description: 'Full system access - All clients and data',
          color: 'bg-red-100 text-red-800'
        };
      case 'leader':
        return {
          icon: Users,
          label: 'Team Leader',
          description: 'Team access - Your clients and referrals',
          color: 'bg-blue-100 text-blue-800'
        };
      default:
        return {
          icon: User,
          label: 'Client',
          description: 'Personal access - Your own data only',
          color: 'bg-green-100 text-green-800'
        };
    }
  };

  const roleInfo = getRoleInfo();
  const RoleIcon = roleInfo.icon;

  return (
    <div className="space-y-6">
      {/* Role Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <RoleIcon className="h-6 w-6" />
              <div>
                <CardTitle>Dashboard - {roleInfo.label}</CardTitle>
                <CardDescription>{roleInfo.description}</CardDescription>
              </div>
            </div>
            <Badge className={roleInfo.color}>
              {roleInfo.label}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Role-based Dashboard Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          {hasLeaderAccess && (
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          )}
          <TabsTrigger value="widgets" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Widgets
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab - Enhanced Dashboard */}
        <TabsContent value="overview">
          <EnhancedDashboard userRole={userRole as "admin" | "leader" | "client"} />
        </TabsContent>

        {/* Analytics Tab - Only for Admin and Leader */}
        {hasLeaderAccess && (
          <TabsContent value="analytics">
            <AnalyticsDashboard />
          </TabsContent>
        )}

        {/* Widgets Tab - Role-based widgets */}
        <TabsContent value="widgets">
          <DashboardWidgets userRole={userRole as "admin" | "leader" | "client"} />
        </TabsContent>
      </Tabs>

      {/* Access Level Info */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          You are viewing data based on your {roleInfo.label.toLowerCase()} access level. 
          {userRole === 'admin' && ' You can see all system data.'}
          {userRole === 'leader' && ' You can see your team and client data.'}
          {userRole === 'client' && ' You can see your personal investment data.'}
        </AlertDescription>
      </Alert>
    </div>
  );
}