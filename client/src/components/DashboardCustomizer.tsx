import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog, DialogContent, DialogDescription, DialogHeader, 
  DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { 
  Settings, Layout, Palette, Bell, Download, 
  Eye, EyeOff, GripVertical, Plus, Trash2
} from "lucide-react";
import { useState } from "react";

interface WidgetConfig {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  position: { x: number; y: number };
  size: 'small' | 'medium' | 'large';
  category: 'stats' | 'charts' | 'tables' | 'realtime';
}

interface DashboardConfig {
  theme: 'light' | 'dark' | 'auto';
  layout: 'grid' | 'masonry' | 'custom';
  refreshInterval: number;
  notifications: boolean;
  widgets: WidgetConfig[];
}

const defaultWidgets: WidgetConfig[] = [
  {
    id: 'total-clients',
    name: 'Total Clients',
    description: 'Display total number of active clients',
    enabled: true,
    position: { x: 0, y: 0 },
    size: 'small',
    category: 'stats'
  },
  {
    id: 'total-aum',
    name: 'Total AUM',
    description: 'Assets under management overview',
    enabled: true,
    position: { x: 1, y: 0 },
    size: 'small',
    category: 'stats'
  },
  {
    id: 'portfolio-distribution',
    name: 'Portfolio Distribution',
    description: 'Pie chart showing asset allocation',
    enabled: true,
    position: { x: 0, y: 1 },
    size: 'medium',
    category: 'charts'
  },
  {
    id: 'investment-performance',
    name: 'Investment Performance',
    description: 'Performance comparison with benchmarks',
    enabled: true,
    position: { x: 1, y: 1 },
    size: 'medium',
    category: 'charts'
  },
  {
    id: 'recent-transactions',
    name: 'Recent Transactions',
    description: 'Latest transaction activities',
    enabled: true,
    position: { x: 0, y: 2 },
    size: 'large',
    category: 'tables'
  },
  {
    id: 'live-market-data',
    name: 'Live Market Data',
    description: 'Real-time market indices',
    enabled: false,
    position: { x: 1, y: 2 },
    size: 'medium',
    category: 'realtime'
  },
  {
    id: 'client-demographics',
    name: 'Client Demographics',
    description: 'Age and segment distribution',
    enabled: false,
    position: { x: 0, y: 3 },
    size: 'medium',
    category: 'charts'
  },
  {
    id: 'branch-performance',
    name: 'Branch Performance',
    description: 'Performance metrics by branch',
    enabled: false,
    position: { x: 1, y: 3 },
    size: 'medium',
    category: 'charts'
  }
];

function WidgetCard({ widget, onToggle, onSizeChange }: {
  widget: WidgetConfig;
  onToggle: (id: string) => void;
  onSizeChange: (id: string, size: 'small' | 'medium' | 'large') => void;
}) {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'stats': return 'bg-blue-100 text-blue-800';
      case 'charts': return 'bg-green-100 text-green-800';
      case 'tables': return 'bg-purple-100 text-purple-800';
      case 'realtime': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className={`transition-all ${widget.enabled ? 'border-primary' : 'border-muted'}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
            <div>
              <h4 className="font-medium">{widget.name}</h4>
              <p className="text-sm text-muted-foreground">{widget.description}</p>
            </div>
          </div>
          <Switch
            checked={widget.enabled}
            onCheckedChange={() => onToggle(widget.id)}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <Badge className={getCategoryColor(widget.category)}>
            {widget.category}
          </Badge>
          
          <Select
            value={widget.size}
            onValueChange={(size: 'small' | 'medium' | 'large') => onSizeChange(widget.id, size)}
            disabled={!widget.enabled}
          >
            <SelectTrigger className="w-20 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="small">S</SelectItem>
              <SelectItem value="medium">M</SelectItem>
              <SelectItem value="large">L</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}

function LayoutPreview({ layout }: { layout: 'grid' | 'masonry' | 'custom' }) {
  const getLayoutDescription = () => {
    switch (layout) {
      case 'grid':
        return 'Organized in a structured grid layout';
      case 'masonry':
        return 'Dynamic masonry layout with varying heights';
      case 'custom':
        return 'Fully customizable drag-and-drop layout';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium capitalize">{layout} Layout</div>
      <div className="text-xs text-muted-foreground">{getLayoutDescription()}</div>
      <div className="border rounded-lg p-4 bg-muted/20">
        {layout === 'grid' && (
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-primary/20 rounded h-8" />
            ))}
          </div>
        )}
        {layout === 'masonry' && (
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-primary/20 rounded h-12" />
            <div className="bg-primary/20 rounded h-8" />
            <div className="bg-primary/20 rounded h-16" />
            <div className="bg-primary/20 rounded h-8" />
            <div className="bg-primary/20 rounded h-12" />
            <div className="bg-primary/20 rounded h-8" />
          </div>
        )}
        {layout === 'custom' && (
          <div className="relative">
            <div className="bg-primary/20 rounded h-8 w-1/2 mb-2" />
            <div className="bg-primary/20 rounded h-12 w-3/4 absolute top-0 right-0" />
            <div className="bg-primary/20 rounded h-6 w-1/3 mt-8" />
          </div>
        )}
      </div>
    </div>
  );
}

export function DashboardCustomizer() {
  const [config, setConfig] = useState<DashboardConfig>({
    theme: 'auto',
    layout: 'grid',
    refreshInterval: 30,
    notifications: true,
    widgets: defaultWidgets
  });

  const [isOpen, setIsOpen] = useState(false);

  const handleWidgetToggle = (widgetId: string) => {
    setConfig(prev => ({
      ...prev,
      widgets: prev.widgets.map(widget =>
        widget.id === widgetId
          ? { ...widget, enabled: !widget.enabled }
          : widget
      )
    }));
  };

  const handleWidgetSizeChange = (widgetId: string, size: 'small' | 'medium' | 'large') => {
    setConfig(prev => ({
      ...prev,
      widgets: prev.widgets.map(widget =>
        widget.id === widgetId
          ? { ...widget, size }
          : widget
      )
    }));
  };

  const handleSaveConfig = () => {
    // Save configuration to localStorage or API
    localStorage.setItem('dashboardConfig', JSON.stringify(config));
    setIsOpen(false);
    // Trigger dashboard refresh
    window.location.reload();
  };

  const handleResetConfig = () => {
    setConfig({
      theme: 'auto',
      layout: 'grid',
      refreshInterval: 30,
      notifications: true,
      widgets: defaultWidgets
    });
  };

  const enabledWidgets = config.widgets.filter(w => w.enabled);
  const availableWidgets = config.widgets.filter(w => !w.enabled);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Customize Dashboard
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Dashboard Customization</DialogTitle>
          <DialogDescription>
            Personalize your dashboard layout, widgets, and preferences
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="widgets" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="widgets">Widgets</TabsTrigger>
            <TabsTrigger value="layout">Layout</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="widgets" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Active Widgets ({enabledWidgets.length})
                </h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {enabledWidgets.map(widget => (
                    <WidgetCard
                      key={widget.id}
                      widget={widget}
                      onToggle={handleWidgetToggle}
                      onSizeChange={handleWidgetSizeChange}
                    />
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <EyeOff className="h-4 w-4" />
                  Available Widgets ({availableWidgets.length})
                </h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {availableWidgets.map(widget => (
                    <WidgetCard
                      key={widget.id}
                      widget={widget}
                      onToggle={handleWidgetToggle}
                      onSizeChange={handleWidgetSizeChange}
                    />
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="layout" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              {(['grid', 'masonry', 'custom'] as const).map(layoutType => (
                <Card 
                  key={layoutType}
                  className={`cursor-pointer transition-all ${
                    config.layout === layoutType ? 'border-primary bg-primary/5' : ''
                  }`}
                  onClick={() => setConfig(prev => ({ ...prev, layout: layoutType }))}
                >
                  <CardContent className="p-4">
                    <LayoutPreview layout={layoutType} />
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Theme</CardTitle>
                  <CardDescription>Choose your preferred color scheme</CardDescription>
                </CardHeader>
                <CardContent>
                  <Select
                    value={config.theme}
                    onValueChange={(theme: 'light' | 'dark' | 'auto') => 
                      setConfig(prev => ({ ...prev, theme }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="auto">Auto (System)</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Color Scheme</CardTitle>
                  <CardDescription>Customize dashboard colors</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-5 gap-2">
                    {['blue', 'green', 'purple', 'orange', 'red'].map(color => (
                      <div
                        key={color}
                        className={`w-8 h-8 rounded-full bg-${color}-500 cursor-pointer border-2 border-transparent hover:border-gray-300`}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Refresh Settings</CardTitle>
                  <CardDescription>Configure automatic data refresh</CardDescription>
                </CardHeader>
                <CardContent>
                  <Select
                    value={config.refreshInterval.toString()}
                    onValueChange={(interval) => 
                      setConfig(prev => ({ ...prev, refreshInterval: parseInt(interval) }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 seconds</SelectItem>
                      <SelectItem value="30">30 seconds</SelectItem>
                      <SelectItem value="60">1 minute</SelectItem>
                      <SelectItem value="300">5 minutes</SelectItem>
                      <SelectItem value="0">Manual only</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Notifications</CardTitle>
                  <CardDescription>Manage dashboard notifications</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4" />
                      <span>Enable notifications</span>
                    </div>
                    <Switch
                      checked={config.notifications}
                      onCheckedChange={(notifications) =>
                        setConfig(prev => ({ ...prev, notifications }))
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="outline" onClick={handleResetConfig}>
            Reset to Default
          </Button>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveConfig}>
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}