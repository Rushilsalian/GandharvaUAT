import { BarChart3, Building2, DollarSign, FileText, Home, Settings, TrendingUp, TrendingDown, Users, UserCheck, LogOut, Upload, Send, Banknote, HandCoins, UserPlus, ChevronDown } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

type MenuItem = {
  title: string;
  url?: string;
  icon: any;
  children?: MenuItem[];
};

// Module mapping with icons and routes
const moduleConfig: Record<string, { icon: any; url: string; children?: Record<string, { icon: any; url: string }> }> = {
  "Dashboard": { icon: Home, url: "/dashboard" },
  "Users": { icon: Users, url: "/users" },
  "Clients": { icon: UserCheck, url: "/clients" },
  "Transactions": { 
    icon: DollarSign, 
    url: "/transactions",
    children: {
      "Investments": { icon: TrendingUp, url: "/investments" },
      "Withdrawals": { icon: TrendingDown, url: "/withdrawals" },
      "Payouts": { icon: BarChart3, url: "/payouts" },
      "Closures": { icon: FileText, url: "/closures" }
    }
  },
  "Request": {
    icon: Send,
    url: "/requests",
    children: {
      "Withdrawal Request": { icon: Banknote, url: "/withdrawal-request" },
      "Investment Request": { icon: HandCoins, url: "/investment-request" },
      "Referral Request": { icon: UserPlus, url: "/referral-request" }
    }
  },
  "Reports": { icon: FileText, url: "/reports" }
};

// Generate menu items based on module access
const getMenuItems = (moduleAccess: Record<string, any>): MenuItem[] => {
  const menuItems: MenuItem[] = [];
  
  Object.values(moduleAccess).forEach((module: any) => {
    if (module.accessRead === 1) {
      const config = moduleConfig[module.moduleName];
      if (config) {
        const menuItem: MenuItem = {
          title: module.moduleName,
          url: config.url,
          icon: config.icon
        };
        
        // Add children if module has sub-items and user has access
        if (config.children) {
          menuItem.children = Object.entries(config.children).map(([name, childConfig]) => ({
            title: name,
            url: childConfig.url,
            icon: childConfig.icon
          }));
        }
        
        menuItems.push(menuItem);
      }
    }
  });
  
  return menuItems;
};

interface AppSidebarProps {
  userRole: string;
  onLogout: () => void;
}

export function AppSidebar({ userRole, onLogout }: AppSidebarProps) {
  const { user, session, client } = useAuth();
  const [, setLocation] = useLocation();
  const menuItems = session?.moduleAccess ? getMenuItems(session.moduleAccess) : [];
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>(
    menuItems.reduce((acc, item) => ({ ...acc, [item.title]: false }), {})
  );

  const handleLogout = () => {
    onLogout();
    setLocation('/');
  };

  const toggleExpanded = (title: string) => {
    setExpandedItems(prev => ({ ...prev, [title]: !prev[title] }));
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex flex-col space-y-1">
          <div className="flex items-center space-x-2">
            <img src="/icons/Gandharva_Logo_2.png" alt="Gandharva Logo" className="h-8 w-8" />
            <h2 className="text-lg font-semibold">Gandharva Finchart LLP</h2>
          </div>
          {/* <p className="text-sm text-muted-foreground">Investment Platform</p> */}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {item.children ? (
                    <div>
                      <SidebarMenuButton 
                        className="font-medium cursor-pointer" 
                        onClick={() => toggleExpanded(item.title)}
                      >
                        <item.icon />
                        <span>{item.title}</span>
                        <ChevronDown className={`h-4 w-4 ml-auto transition-transform ${expandedItems[item.title] ? 'rotate-180' : ''}`} />
                      </SidebarMenuButton>
                      {expandedItems[item.title] && (
                        <div className="ml-6 mt-1 space-y-1">
                          {item.children.map((child) => (
                            <SidebarMenuButton key={child.title} asChild size="sm">
                              <Link href={child.url!} data-testid={`link-${child.title.toLowerCase().replace(/\\s+/g, '-')}`}>
                                <child.icon className="h-4 w-4" />
                                <span>{child.title}</span>
                              </Link>
                            </SidebarMenuButton>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <SidebarMenuButton asChild>
                      <Link href={item.url!} data-testid={`link-${item.title.toLowerCase().replace(/\\s+/g, '-')}`}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="space-y-2">
          <div className="text-sm">
            <p className="font-medium">{client?.name || user?.userName}</p>
            <p className="text-muted-foreground capitalize">{session?.roleName || userRole}</p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full justify-start"
            data-testid="button-logout"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}