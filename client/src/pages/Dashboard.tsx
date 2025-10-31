import { RoleBasedDashboard } from "@/components/RoleBasedDashboard";
import { useAuth } from "@/contexts/AuthContext";

export default function Dashboard() {
  const { user, session, role } = useAuth();
  
  // Determine user role from auth context
  const userRole = session?.roleName?.toLowerCase() || 
                   role?.roleName?.toLowerCase() || 
                   user?.role?.toLowerCase() || 
                   'client';

  return <RoleBasedDashboard />;
}