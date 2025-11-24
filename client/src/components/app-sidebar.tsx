import { BarChart3, Building2, DollarSign, FileText, Home, Settings, TrendingUp, TrendingDown, Users, UserCheck, LogOut, Upload, Send, Banknote, HandCoins, UserPlus, ChevronDown, Gift, Edit3 } from "lucide-react";
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarMenuAction,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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

// Static menu items that appear for all users
const staticMenuItems: MenuItem[] = [
  {
    title: "View Offers",
    url: "/offers",
    icon: Gift
  }
];

// Generate menu items based on module access
const getMenuItems = (moduleAccess: Record<string, any>, userRole: string): MenuItem[] => {
  const menuItems: MenuItem[] = [...staticMenuItems];
  
  // Define allowed modules for client and manager roles
  const clientManagerAllowedModules = ["Dashboard", "Transactions", "Request"];
  
  Object.values(moduleAccess).forEach((module: any) => {
    if (module.accessRead === 1 && module.moduleName !== "Content Management" && module.moduleName !== "Clients") {
      // For client and manager roles, only allow specific modules and exclude individual request modules
      if ((userRole === 'client' || userRole === 'manager') && (!clientManagerAllowedModules.includes(module.moduleName) || 
          ["Withdrawal Request", "Investment Request", "Referral Request"].includes(module.moduleName))) {
        return;
      }
      
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
  
  // Add admin-only modules
  if (userRole === 'admin') {
    menuItems.push(
      {
        title: "Clients",
        url: "/clients",
        icon: UserCheck
      },
      {
        title: "Content Management",
        url: "/content-management",
        icon: Edit3
      }
    );
  }
  
  return menuItems;
};

interface AppSidebarProps {
  userRole: string;
  onLogout: () => void;
}

export function AppSidebar({ userRole, onLogout }: AppSidebarProps) {
  const { user, session, client } = useAuth();
  const [, setLocation] = useLocation();
  
  // Determine actual role - prioritize session roleId over userRole prop
  const actualRole = session?.roleId === 3 ? 'client' : session?.roleId === 2 ? 'manager' : session?.roleId === 1 ? 'admin' : userRole;
  
  const menuItems = session?.moduleAccess ? getMenuItems(session.moduleAccess, actualRole) : 
    actualRole === 'admin' ? [...staticMenuItems, { title: "Clients", url: "/clients", icon: UserCheck }, { title: "Content Management", url: "/content-management", icon: Edit3 }] : 
    (actualRole === 'client' || actualRole === 'manager') ? [...staticMenuItems, { title: "Dashboard", url: "/dashboard", icon: Home }, { title: "Transactions", url: "/transactions", icon: DollarSign, children: [{ title: "Investments", url: "/investments", icon: TrendingUp }, { title: "Withdrawals", url: "/withdrawals", icon: TrendingDown }, { title: "Payouts", url: "/payouts", icon: BarChart3 }, { title: "Closures", url: "/closures", icon: FileText }] }, { title: "Request", url: "/requests", icon: Send, children: [{ title: "Withdrawal Request", url: "/withdrawal-request", icon: Banknote }, { title: "Investment Request", url: "/investment-request", icon: HandCoins }, { title: "Referral Request", url: "/referral-request", icon: UserPlus }] }] : staticMenuItems;
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
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-2">
        <div className="flex flex-col space-y-1">
          <div className="flex items-center -ml-1">
            <img 
              src="/icons/Gandharva.png" 
              alt="Gandharva Logo" 
              className="group-data-[collapsible=icon]:hidden"
            />
            <img 
              src="/icons/Gandharva_Logo_2.png" 
              alt="Gandharva Logo" 
              className="group-data-[collapsible=icon]:block hidden"
            />
          </div>
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
                    <>
                      <div className="group-data-[collapsible=icon]:hidden">
                        <Collapsible open={expandedItems[item.title]} onOpenChange={() => toggleExpanded(item.title)}>
                          <SidebarMenuButton asChild>
                            <CollapsibleTrigger className="w-full hover:bg-[#f15a24] hover:text-white">
                              <item.icon />
                              <span>{item.title}</span>
                              <ChevronDown className={`h-4 w-4 ml-auto transition-transform ${expandedItems[item.title] ? 'rotate-180' : ''}`} />
                            </CollapsibleTrigger>
                          </SidebarMenuButton>
                          <CollapsibleContent>
                            <SidebarMenuSub>
                              {item.children.map((child) => (
                                <SidebarMenuSubItem key={child.title}>
                                  <SidebarMenuSubButton asChild className="hover:bg-[#f15a24] hover:text-white">
                                    <Link href={child.url!} data-testid={`link-${child.title.toLowerCase().replace(/\\s+/g, '-')}`}>
                                      <child.icon className="h-4 w-4" />
                                      <span>{child.title}</span>
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </Collapsible>
                      </div>
                      <div className="group-data-[collapsible=icon]:block hidden">
                        {item.children.map((child) => (
                          <SidebarMenuButton key={child.title} asChild className="hover:bg-[#f15a24] hover:text-white">
                            <Link href={child.url!} data-testid={`link-${child.title.toLowerCase().replace(/\\s+/g, '-')}`} title={child.title}>
                              <child.icon />
                            </Link>
                          </SidebarMenuButton>
                        ))}
                      </div>
                    </>
                  ) : (
                    <SidebarMenuButton asChild className="hover:bg-[#f15a24] hover:text-white">
                      <Link href={item.url!} data-testid={`link-${item.title.toLowerCase().replace(/\\s+/g, '-')}`} title={item.title}>
                        <item.icon />
                        <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
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
          <div className="text-sm group-data-[collapsible=icon]:hidden">
            <p className="font-medium">{client?.name || user?.userName}</p>
            <p className="text-muted-foreground capitalize">{session?.roleName === 'manager' || actualRole === 'manager' ? 'Leader' : (session?.roleName || actualRole)}</p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full justify-start"
            data-testid="button-logout"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            <span className="group-data-[collapsible=icon]:hidden">Logout</span>
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}