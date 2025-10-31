import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserCheck, Shield, Users, Crown } from "lucide-react";

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  userCount: number;
}

export function RolesPage() {
  //todo: remove mock functionality - replace with real role data
  const roles: Role[] = [
    {
      id: "1",
      name: "Admin",
      description: "Full system access with all administrative privileges",
      permissions: [
        "Manage Branches", "Manage Clients", "Manage Users", "Import Data",
        "View All Transactions", "Generate Reports", "System Configuration"
      ],
      userCount: 3
    },
    {
      id: "2", 
      name: "Leader",
      description: "Team management with access to team performance data",
      permissions: [
        "View Team Clients", "View Team Performance", "Generate Team Reports",
        "Track Referrals", "View Commissions"
      ],
      userCount: 12
    },
    {
      id: "3",
      name: "Client", 
      description: "Individual client access to personal investment portfolio",
      permissions: [
        "View Personal Dashboard", "Request Withdrawals", "Make Payments",
        "Submit Referrals", "View Personal Reports", "Update Profile"
      ],
      userCount: 1247
    }
  ];

  const getRoleIcon = (roleName: string) => {
    switch (roleName.toLowerCase()) {
      case "admin": return <Crown className="h-6 w-6 text-primary" />;
      case "leader": return <Shield className="h-6 w-6 text-chart-2" />;
      case "client": return <Users className="h-6 w-6 text-muted-foreground" />;
      default: return <UserCheck className="h-6 w-6" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Role Management</h1>
        <p className="text-muted-foreground">
          View and understand system roles and their permissions
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
        {roles.map((role) => (
          <Card key={role.id} className="hover-elevate" data-testid={`role-card-${role.name.toLowerCase()}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                {getRoleIcon(role.name)}
                <div>
                  <div className="text-xl">{role.name}</div>
                  <Badge variant="secondary" className="mt-1">
                    {role.userCount} users
                  </Badge>
                </div>
              </CardTitle>
              <CardDescription>{role.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div>
                <h4 className="font-medium mb-3 text-sm text-muted-foreground uppercase tracking-wide">
                  Permissions
                </h4>
                <div className="space-y-2">
                  {role.permissions.map((permission, index) => (
                    <div 
                      key={index} 
                      className="flex items-center gap-2 text-sm"
                      data-testid={`permission-${permission.toLowerCase().replace(/\\s+/g, '-')}`}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-chart-1"></div>
                      <span>{permission}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}