
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  Factory, 
  Users, 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  BarChart, 
  PieChart as PieChartIcon,
  Layers,
  RefreshCw,
  Sparkles,
  LineChart as LineChartIcon,
  Share2,
  Download
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ResponsiveContainer, 
  BarChart as RechartsBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { cn } from "@/lib/utils";
import { useLocalStorage } from '@/hooks/use-local-storage';
import { toast } from 'sonner';
import RealTimeMetricsCard from './RealTimeMetricsCard';
import FactoryAnalyticsTable from './FactoryAnalyticsTable';

interface FactoryData {
  id: string;
  name: string;
  defectCount: number;
  reworkPercentage: number;
  aqlPassRate: number;
  trend: 'up' | 'down' | 'stable';
  lineData: {
    id: string;
    name: string;
    defects: number;
    operators: number;
    reworkRate: number;
  }[];
  defectByPart: {
    name: string;
    value: number;
  }[];
  defectByType: {
    name: string;
    value: number;
  }[];
  weeklyData: {
    day: string;
    defects: number;
    rework: number;
  }[];
  operators: {
    id: string;
    name: string;
    line: string;
    department: string;
    role: string;
    defectsFound: number;
    defectsFixed: number;
    reworkRate: number;
    efficiency: number;
    status: 'excellent' | 'good' | 'average' | 'poor';
  }[];
  hourlyTrend: {
    hour: string;
    defects: number;
    target: number;
  }[];
  garmentPartAnalysis: {
    part: string;
    sleeveDefects: number;
    collarDefects: number;
    seamDefects: number;
    pocketDefects: number;
    otherDefects: number;
  }[];
}

const COLORS = ['#9b87f5', '#14b8a6', '#f59e0b', '#3b82f6', '#8884D8', '#82ca9d'];

const demoFactoryData: FactoryData[] = [
  {
    id: 'f1',
    name: 'Factory Alpha',
    defectCount: 324,
    reworkPercentage: 3.8,
    aqlPassRate: 92,
    trend: 'up',
    lineData: [
      { id: 'L1', name: 'Line 1', defects: 78, operators: 12, reworkRate: 4.2 },
      { id: 'L2', name: 'Line 2', defects: 112, operators: 14, reworkRate: 5.1 },
      { id: 'L3', name: 'Line 3', defects: 134, operators: 15, reworkRate: 3.2 }
    ],
    defectByPart: [
      { name: 'Sleeve', value: 65 },
      { name: 'Collar', value: 78 },
      { name: 'Seam', value: 86 },
      { name: 'Pocket', value: 45 },
      { name: 'Label', value: 50 }
    ],
    defectByType: [
      { name: 'Broken Stitch', value: 102 },
      { name: 'Skip Stitch', value: 87 },
      { name: 'Stain', value: 64 },
      { name: 'Open Seam', value: 45 },
      { name: 'Puckering', value: 26 }
    ],
    weeklyData: [
      { day: 'Mon', defects: 42, rework: 18 },
      { day: 'Tue', defects: 38, rework: 15 },
      { day: 'Wed', defects: 55, rework: 22 },
      { day: 'Thu', defects: 47, rework: 19 },
      { day: 'Fri', defects: 65, rework: 28 },
      { day: 'Sat', defects: 58, rework: 24 },
      { day: 'Sun', defects: 19, rework: 8 }
    ],
    hourlyTrend: [
      { hour: '08:00', defects: 18, target: 15 },
      { hour: '09:00', defects: 24, target: 15 },
      { hour: '10:00', defects: 32, target: 15 },
      { hour: '11:00', defects: 28, target: 15 },
      { hour: '12:00', defects: 14, target: 15 },
      { hour: '13:00', defects: 20, target: 15 },
      { hour: '14:00', defects: 38, target: 15 },
      { hour: '15:00', defects: 42, target: 15 },
      { hour: '16:00', defects: 29, target: 15 },
      { hour: '17:00', defects: 15, target: 15 },
    ],
    garmentPartAnalysis: [
      { part: 'T-Shirt', sleeveDefects: 32, collarDefects: 45, seamDefects: 28, pocketDefects: 12, otherDefects: 18 },
      { part: 'Polo', sleeveDefects: 28, collarDefects: 52, seamDefects: 22, pocketDefects: 18, otherDefects: 15 },
      { part: 'Pants', sleeveDefects: 0, collarDefects: 0, seamDefects: 58, pocketDefects: 32, otherDefects: 25 },
    ],
    operators: [
      { id: 'op1', name: 'Elena Rodriguez', line: 'L1', department: 'Quality', role: 'Inspector', defectsFound: 23, defectsFixed: 18, reworkRate: 3.2, efficiency: 94, status: 'excellent' },
      { id: 'op2', name: 'Michael Chen', line: 'L2', department: 'Production', role: 'Operator', defectsFound: 31, defectsFixed: 26, reworkRate: 4.3, efficiency: 88, status: 'good' },
      { id: 'op3', name: 'Aisha Patel', line: 'L1', department: 'Quality', role: 'Inspector', defectsFound: 18, defectsFixed: 14, reworkRate: 2.8, efficiency: 91, status: 'excellent' },
      { id: 'op4', name: 'James Wilson', line: 'L3', department: 'Production', role: 'Operator', defectsFound: 29, defectsFixed: 20, reworkRate: 5.1, efficiency: 86, status: 'good' },
      { id: 'op5', name: 'Luis Gomez', line: 'L3', department: 'Quality', role: 'Inspector', defectsFound: 35, defectsFixed: 28, reworkRate: 3.7, efficiency: 92, status: 'excellent' },
      { id: 'op6', name: 'Sarah Johnson', line: 'L1', department: 'Production', role: 'Supervisor', defectsFound: 12, defectsFixed: 10, reworkRate: 2.5, efficiency: 95, status: 'excellent' },
      { id: 'op7', name: 'Ahmed Hassan', line: 'L2', department: 'Production', role: 'Operator', defectsFound: 27, defectsFixed: 19, reworkRate: 6.2, efficiency: 78, status: 'average' },
      { id: 'op8', name: 'Maria Garcia', line: 'L2', department: 'Quality', role: 'Inspector', defectsFound: 30, defectsFixed: 25, reworkRate: 3.9, efficiency: 90, status: 'good' },
      { id: 'op9', name: 'Olivia Smith', line: 'L3', department: 'Production', role: 'Operator', defectsFound: 15, defectsFixed: 8, reworkRate: 7.4, efficiency: 72, status: 'average' },
      { id: 'op10', name: 'David Kim', line: 'L1', department: 'Production', role: 'Operator', defectsFound: 21, defectsFixed: 12, reworkRate: 8.1, efficiency: 65, status: 'poor' },
    ]
  },
  {
    id: 'f2',
    name: 'Factory Beta',
    defectCount: 267,
    reworkPercentage: 2.9,
    aqlPassRate: 95,
    trend: 'stable',
    lineData: [
      { id: 'L1', name: 'Line 1', defects: 65, operators: 10, reworkRate: 3.5 },
      { id: 'L2', name: 'Line 2', defects: 98, operators: 12, reworkRate: 2.8 },
      { id: 'L3', name: 'Line 3', defects: 52, operators: 11, reworkRate: 2.3 },
      { id: 'L4', name: 'Line 4', defects: 52, operators: 9, reworkRate: 3.1 }
    ],
    defectByPart: [
      { name: 'Sleeve', value: 54 },
      { name: 'Collar', value: 61 },
      { name: 'Seam', value: 72 },
      { name: 'Pocket', value: 38 },
      { name: 'Label', value: 42 }
    ],
    defectByType: [
      { name: 'Broken Stitch', value: 85 },
      { name: 'Skip Stitch', value: 72 },
      { name: 'Stain', value: 53 },
      { name: 'Open Seam', value: 32 },
      { name: 'Puckering', value: 25 }
    ],
    weeklyData: [
      { day: 'Mon', defects: 36, rework: 12 },
      { day: 'Tue', defects: 42, rework: 14 },
      { day: 'Wed', defects: 38, rework: 13 },
      { day: 'Thu', defects: 45, rework: 15 },
      { day: 'Fri', defects: 49, rework: 16 },
      { day: 'Sat', defects: 41, rework: 14 },
      { day: 'Sun', defects: 16, rework: 5 }
    ],
    hourlyTrend: [
      { hour: '08:00', defects: 15, target: 12 },
      { hour: '09:00', defects: 19, target: 12 },
      { hour: '10:00', defects: 25, target: 12 },
      { hour: '11:00', defects: 21, target: 12 },
      { hour: '12:00', defects: 11, target: 12 },
      { hour: '13:00', defects: 16, target: 12 },
      { hour: '14:00', defects: 28, target: 12 },
      { hour: '15:00', defects: 32, target: 12 },
      { hour: '16:00', defects: 22, target: 12 },
      { hour: '17:00', defects: 14, target: 12 },
    ],
    garmentPartAnalysis: [
      { part: 'Dress Shirt', sleeveDefects: 24, collarDefects: 38, seamDefects: 22, pocketDefects: 15, otherDefects: 12 },
      { part: 'Blouse', sleeveDefects: 18, collarDefects: 32, seamDefects: 19, pocketDefects: 11, otherDefects: 8 },
      { part: 'Skirt', sleeveDefects: 0, collarDefects: 0, seamDefects: 42, pocketDefects: 25, otherDefects: 21 },
    ],
    operators: [
      { id: 'op6', name: 'Sarah Johnson', line: 'L1', department: 'Quality', role: 'Inspector', defectsFound: 19, defectsFixed: 15, reworkRate: 2.5, efficiency: 92, status: 'excellent' },
      { id: 'op7', name: 'David Kim', line: 'L2', department: 'Production', role: 'Operator', defectsFound: 27, defectsFixed: 21, reworkRate: 3.8, efficiency: 89, status: 'good' },
      { id: 'op8', name: 'Maria Garcia', line: 'L3', department: 'Production', role: 'Supervisor', defectsFound: 15, defectsFixed: 12, reworkRate: 2.1, efficiency: 94, status: 'excellent' },
      { id: 'op9', name: 'Robert Singh', line: 'L4', department: 'Production', role: 'Operator', defectsFound: 25, defectsFixed: 18, reworkRate: 4.2, efficiency: 87, status: 'good' },
      { id: 'op10', name: 'Sophia Lee', line: 'L2', department: 'Quality', role: 'Inspector', defectsFound: 31, defectsFixed: 26, reworkRate: 3.3, efficiency: 90, status: 'good' },
      { id: 'op11', name: 'John Doe', line: 'L1', department: 'Production', role: 'Operator', defectsFound: 22, defectsFixed: 14, reworkRate: 5.6, efficiency: 78, status: 'average' },
      { id: 'op12', name: 'Emily Zhang', line: 'L3', department: 'Quality', role: 'Inspector', defectsFound: 28, defectsFixed: 23, reworkRate: 2.8, efficiency: 91, status: 'excellent' },
      { id: 'op13', name: 'Jose Ramirez', line: 'L4', department: 'Production', role: 'Operator', defectsFound: 18, defectsFixed: 9, reworkRate: 6.9, efficiency: 71, status: 'average' },
      { id: 'op14', name: 'Fatima Ali', line: 'L2', department: 'Production', role: 'Operator', defectsFound: 15, defectsFixed: 7, reworkRate: 7.8, efficiency: 63, status: 'poor' },
      { id: 'op15', name: 'Thomas Brown', line: 'L1', department: 'Quality', role: 'Supervisor', defectsFound: 12, defectsFixed: 10, reworkRate: 2.2, efficiency: 93, status: 'excellent' },
    ]
  }
];

const FactoryMetrics: React.FC = () => {
  // Use localStorage to persist factory and line selection between sessions
  const [factoryData, setFactoryData] = useLocalStorage('factory-metrics-data', demoFactoryData);
  const [selectedFactory, setSelectedFactory] = useLocalStorage('selected-factory', factoryData[0].id);
  const [selectedLine, setSelectedLine] = useLocalStorage('selected-line', 'all');
  
  // Reactive states for UI feedback and tracking changes
  const [isUpdating, setIsUpdating] = useState(false);
  const [isAutoRefresh, setIsAutoRefresh] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  
  // Get current factory data
  const currentFactory = factoryData.find(f => f.id === selectedFactory) || factoryData[0];
  
  // Filter operators by line if needed
  const filteredOperators = selectedLine === 'all' 
    ? currentFactory.operators 
    : currentFactory.operators.filter(op => op.line === selectedLine);
  
  // Custom analytics data - simulating live data
  const calculateDefectRate = () => {
    return parseFloat((currentFactory.defectCount / 10000 * 100).toFixed(2));
  };
  
  const calculateAQLSuccessRate = () => {
    return currentFactory.aqlPassRate;
  };
  
  const calculateAverageRework = () => {
    return parseFloat(currentFactory.reworkPercentage.toFixed(1));
  };
  
  const metrics = {
    defectRate: calculateDefectRate(),
    aqlSuccessRate: calculateAQLSuccessRate(),
    averageRework: calculateAverageRework()
  };
  
  // Simulate real-time updates
  useEffect(() => {
    let refreshInterval: NodeJS.Timeout;
    
    if (isAutoRefresh) {
      refreshInterval = setInterval(() => {
        refreshData();
      }, 30000); // Update every 30 seconds
    }
    
    return () => {
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, [isAutoRefresh]);
  
  // Simulate updating data with small random changes
  const refreshData = () => {
    setIsUpdating(true);
    
    const updatedFactoryData = factoryData.map(factory => {
      if (factory.id === selectedFactory) {
        // Random fluctuation between -5% and +5%
        const fluctuation = 0.95 + Math.random() * 0.1; 
        
        // Update defect count
        const newDefectCount = Math.round(factory.defectCount * fluctuation);
        
        // Recalculate trend
        let newTrend: 'up' | 'down' | 'stable';
        if (newDefectCount > factory.defectCount) newTrend = 'up';
        else if (newDefectCount < factory.defectCount) newTrend = 'down';
        else newTrend = 'stable';
        
        // Update rework percentage
        const newReworkPercentage = parseFloat((factory.reworkPercentage * fluctuation).toFixed(1));
        
        // Update AQL pass rate (smaller fluctuation for stability)
        const aqlFluctuation = 0.98 + Math.random() * 0.04;
        const newAqlPassRate = Math.min(100, Math.round(factory.aqlPassRate * aqlFluctuation));
        
        // Update weekly data - add a small random change to the most recent days
        const newWeeklyData = [...factory.weeklyData];
        for (let i = 4; i < newWeeklyData.length; i++) {
          newWeeklyData[i] = {
            ...newWeeklyData[i],
            defects: Math.max(0, Math.round(newWeeklyData[i].defects * (0.95 + Math.random() * 0.1))),
            rework: Math.max(0, Math.round(newWeeklyData[i].rework * (0.95 + Math.random() * 0.1)))
          };
        }
        
        // Return updated factory
        return {
          ...factory,
          defectCount: newDefectCount,
          reworkPercentage: newReworkPercentage,
          aqlPassRate: newAqlPassRate,
          trend: newTrend,
          weeklyData: newWeeklyData
        };
      }
      return factory;
    });
    
    setFactoryData(updatedFactoryData);
    setLastUpdated(new Date());
    
    toast.success("Data refreshed", {
      description: `Latest metrics from ${currentFactory.name} updated at ${new Date().toLocaleTimeString()}`,
    });
    
    setTimeout(() => setIsUpdating(false), 800);
  };
  
  const formatLastUpdated = () => {
    return lastUpdated.toLocaleTimeString();
  };
  
  return (
    <div className={cn("space-y-4", isUpdating && "animate-pulse-subtle")}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-gradient flex items-center gap-2">
            Factory Metrics
            {isAutoRefresh && <Sparkles className="h-5 w-5 text-primary animate-pulse-subtle" />}
          </h2>
          <p className="text-muted-foreground">
            Real-time defect analytics and quality metrics
            {lastUpdated && (
              <span className="ml-2 text-xs opacity-70">Last updated: {formatLastUpdated()}</span>
            )}
          </p>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={selectedFactory} onValueChange={setSelectedFactory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select factory" />
            </SelectTrigger>
            <SelectContent>
              {factoryData.map(factory => (
                <SelectItem key={factory.id} value={factory.id}>
                  {factory.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            size="icon"
            className={cn(isAutoRefresh && "border-primary text-primary")}
            onClick={() => setIsAutoRefresh(!isAutoRefresh)}
            title={isAutoRefresh ? "Disable auto-refresh" : "Enable auto-refresh"}
          >
            <RefreshCw className={cn("h-4 w-4", isAutoRefresh && "animate-spin-slow")} />
          </Button>
          
          <Button 
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={isUpdating}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isUpdating && "animate-spin")} />
            Refresh Data
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <RealTimeMetricsCard
          title="Total Defects"
          description="Factory-wide"
          metricKey="defect-count"
          sourceData={{ 'defect-count': currentFactory.defectCount }}
          icon={<Factory className="h-4 w-4 text-primary" />}
          defaultMetric={{
            id: 'defect-count',
            name: 'Total Defects',
            value: currentFactory.defectCount,
            unit: '',
            target: 250,
            status: currentFactory.defectCount <= 250 ? 'success' : 'warning',
            trend: currentFactory.trend,
            trendValue: 5.2,
            lastUpdated: new Date().toISOString()
          }}
        />
        
        <RealTimeMetricsCard
          title="Rework Rate"
          description="Average percentage"
          metricKey="rework-rate"
          sourceData={{ 'rework-rate': currentFactory.reworkPercentage }}
          icon={<Layers className="h-4 w-4 text-primary" />}
          defaultMetric={{
            id: 'rework-rate',
            name: 'Rework Rate',
            value: currentFactory.reworkPercentage,
            unit: '%',
            target: 3.0,
            status: currentFactory.reworkPercentage <= 3.0 ? 'success' : 'warning',
            trend: currentFactory.reworkPercentage <= 3.0 ? 'down' : 'up',
            trendValue: 1.2,
            lastUpdated: new Date().toISOString()
          }}
        />
        
        <RealTimeMetricsCard
          title="AQL Pass Rate"
          description="Current month"
          metricKey="aql-pass-rate"
          sourceData={{ 'aql-pass-rate': currentFactory.aqlPassRate }}
          icon={<BarChart className="h-4 w-4 text-primary" />}
          defaultMetric={{
            id: 'aql-pass-rate',
            name: 'AQL Pass Rate',
            value: currentFactory.aqlPassRate,
            unit: '%',
            target: 95,
            status: currentFactory.aqlPassRate >= 95 ? 'success' : 'warning',
            trend: currentFactory.aqlPassRate >= 90 ? 'up' : 'down',
            trendValue: 2.5,
            lastUpdated: new Date().toISOString()
          }}
        />
        
        <RealTimeMetricsCard
          title="Active Operators"
          description="Across all lines"
          metricKey="active-operators"
          sourceData={{ 'active-operators': currentFactory.lineData.reduce((sum, line) => sum + line.operators, 0) }}
          icon={<Users className="h-4 w-4 text-primary" />}
          defaultMetric={{
            id: 'active-operators',
            name: 'Active Operators',
            value: currentFactory.lineData.reduce((sum, line) => sum + line.operators, 0),
            unit: '',
            target: 60,
            status: 'neutral',
            trend: 'stable',
            trendValue: 0,
            lastUpdated: new Date().toISOString()
          }}
        />
      </div>
      
      <Tabs defaultValue="overview" className="mt-6">
        <TabsList className="grid w-full grid-cols-4 mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="defect-analysis">Defect Analysis</TabsTrigger>
          <TabsTrigger value="operator-performance">Operator Stats</TabsTrigger>
          <TabsTrigger value="advanced-analytics">Advanced Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="shadow-sm analytics-card">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Weekly Defect Trend</CardTitle>
                    <CardDescription>Defects and rework over the past week</CardDescription>
                  </div>
                  <Button variant="ghost" size="icon">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={currentFactory.weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(155, 135, 245, 0.1)" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "rgba(255, 255, 255, 0.9)",
                        borderColor: "rgba(155, 135, 245, 0.2)",
                        borderRadius: "8px"
                      }} 
                    />
                    <Legend />
                    <Line type="monotone" dataKey="defects" stroke="#9b87f5" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="rework" stroke="#14b8a6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card className="shadow-sm analytics-card">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Line Performance</CardTitle>
                    <CardDescription>Defects and rework by production line</CardDescription>
                  </div>
                  <Button variant="ghost" size="icon">
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={currentFactory.lineData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(155, 135, 245, 0.1)" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "rgba(255, 255, 255, 0.9)",
                        borderColor: "rgba(155, 135, 245, 0.2)",
                        borderRadius: "8px"
                      }}  
                    />
                    <Legend />
                    <Bar dataKey="defects" fill="#9b87f5" name="Defects" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="reworkRate" fill="#14b8a6" name="Rework %" radius={[4, 4, 0, 0]} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          
          <Card className="shadow-sm highlight-card">
            <CardHeader className="pb-2">
              <CardTitle>Hourly Defect Tracking</CardTitle>
              <CardDescription>
                Real-time defect detection compared to target thresholds
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={currentFactory.hourlyTrend}>
                  <defs>
                    <linearGradient id="colorDefects" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#9b87f5" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#9b87f5" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(155, 135, 245, 0.1)" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "rgba(255, 255, 255, 0.9)",
                      borderColor: "rgba(155, 135, 245, 0.2)",
                      borderRadius: "8px"
                    }}  
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="defects" 
                    stroke="#9b87f5" 
                    fillOpacity={1} 
                    fill="url(#colorDefects)" 
                    name="Actual Defects"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="target" 
                    stroke="#f59e0b" 
                    strokeWidth={2} 
                    strokeDasharray="5 5" 
                    name="Target Threshold"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="defect-analysis" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="shadow-sm defect-card">
              <CardHeader>
                <CardTitle>Defects by Garment Part</CardTitle>
                <CardDescription>Distribution across different garment components</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={currentFactory.defectByPart}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {currentFactory.defectByPart.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "rgba(255, 255, 255, 0.9)",
                        borderColor: "rgba(155, 135, 245, 0.2)",
                        borderRadius: "8px"
                      }} 
                    />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card className="shadow-sm defect-card">
              <CardHeader>
                <CardTitle>Defects by Type</CardTitle>
                <CardDescription>Most common defect categories</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={currentFactory.defectByType}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {currentFactory.defectByType.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "rgba(255, 255, 255, 0.9)",
                        borderColor: "rgba(155, 135, 245, 0.2)",
                        borderRadius: "8px"
                      }} 
                    />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Defect Analysis by Garment Type</CardTitle>
              <CardDescription>
                Breakdown of defects by garment type and component
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart
                  data={currentFactory.garmentPartAnalysis}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(155, 135, 245, 0.1)" />
                  <XAxis dataKey="part" />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "rgba(255, 255, 255, 0.9)",
                      borderColor: "rgba(155, 135, 245, 0.2)",
                      borderRadius: "8px"
                    }} 
                  />
                  <Legend />
                  <Bar dataKey="sleeveDefects" name="Sleeve" fill="#9b87f5" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="collarDefects" name="Collar" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="seamDefects" name="Seam" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="pocketDefects" name="Pocket" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="otherDefects" name="Other" fill="#8884d8" radius={[4, 4, 0, 0]} />
                </RechartsBarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="operator-performance" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium">Operator Performance Metrics</h3>
            <Select value={selectedLine} onValueChange={setSelectedLine}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter by line" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Lines</SelectItem>
                {currentFactory.lineData.map(line => (
                  <SelectItem key={line.id} value={line.id}>
                    {line.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <FactoryAnalyticsTable data={filteredOperators} />
        </TabsContent>
        
        <TabsContent value="advanced-analytics" className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <RealTimeMetricsCard
              title="Defect Rate"
              description="Per 10,000 pieces"
              metricKey="defect-rate"
              sourceData={{ 'defect-rate': metrics.defectRate }}
              icon={<LineChartIcon className="h-4 w-4 text-primary" />}
              defaultMetric={{
                id: 'defect-rate',
                name: 'Defect Rate',
                value: metrics.defectRate,
                unit: '%',
                target: 2.5,
                status: metrics.defectRate <= 2.5 ? 'success' : 'warning',
                trend: metrics.defectRate <= 2.5 ? 'down' : 'up',
                trendValue: 1.8,
                lastUpdated: new Date().toISOString()
              }}
            />
            
            <RealTimeMetricsCard
              title="AQL Success Rate"
              description="Current performance"
              metricKey="aql-success-rate"
              sourceData={{ 'aql-success-rate': metrics.aqlSuccessRate }}
              icon={<PieChartIcon className="h-4 w-4 text-primary" />}
              defaultMetric={{
                id: 'aql-success',
                name: 'AQL Success',
                value: metrics.aqlSuccessRate,
                unit: '%',
                target: 95,
                status: metrics.aqlSuccessRate >= 95 ? 'success' : 'warning',
                trend: metrics.aqlSuccessRate >= 95 ? 'up' : 'down',
                trendValue: 2.2,
                lastUpdated: new Date().toISOString()
              }}
            />
            
            <RealTimeMetricsCard
              title="Average Rework"
              description="Factory average"
              metricKey="average-rework"
              sourceData={{ 'average-rework': metrics.averageRework }}
              icon={<Activity className="h-4 w-4 text-primary" />}
              defaultMetric={{
                id: 'avg-rework',
                name: 'Avg Rework',
                value: metrics.averageRework,
                unit: '%',
                target: 3.0,
                status: metrics.averageRework <= 3.0 ? 'success' : 'warning',
                trend: 'down',
                trendValue: 0.4,
                lastUpdated: new Date().toISOString()
              }}
            />
          </div>
          
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Quality Analytics Summary</CardTitle>
              <CardDescription>
                Comprehensive metrics and performance indicators
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium mb-2">Key Performance Indicators</h4>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Defect Rate</span>
                        <span className={cn(
                          metrics.defectRate <= 2.5 ? "text-success" : "text-warning"
                        )}>{metrics.defectRate}%</span>
                      </div>
                      <Progress 
                        value={Math.min(100, (metrics.defectRate / 5) * 100)} 
                        className={cn(
                          "h-2",
                          metrics.defectRate <= 2.5 ? "bg-success" : 
                          metrics.defectRate <= 3.5 ? "bg-warning" : "bg-destructive"
                        )}
                      />
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>AQL Success Rate</span>
                        <span className={cn(
                          metrics.aqlSuccessRate >= 95 ? "text-success" : "text-warning"
                        )}>{metrics.aqlSuccessRate}%</span>
                      </div>
                      <Progress 
                        value={metrics.aqlSuccessRate} 
                        className={cn(
                          "h-2",
                          metrics.aqlSuccessRate >= 95 ? "bg-success" : 
                          metrics.aqlSuccessRate >= 90 ? "bg-warning" : "bg-destructive"
                        )}
                      />
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Average Rework</span>
                        <span className={cn(
                          metrics.averageRework <= 3.0 ? "text-success" : "text-warning"
                        )}>{metrics.averageRework}%</span>
                      </div>
                      <Progress 
                        value={Math.min(100, (metrics.averageRework / 6) * 100)} 
                        className={cn(
                          "h-2",
                          metrics.averageRework <= 3.0 ? "bg-success" : 
                          metrics.averageRework <= 4.5 ? "bg-warning" : "bg-destructive"
                        )}
                      />
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <h4 className="text-sm font-medium mb-2">Line Efficiency Ranking</h4>
                    <div className="space-y-2">
                      {currentFactory.lineData
                        .sort((a, b) => a.reworkRate - b.reworkRate)
                        .map((line, index) => (
                          <div key={line.id} className="flex justify-between items-center p-2 rounded-md bg-muted/20">
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                                {index + 1}
                              </div>
                              <span>{line.name}</span>
                            </div>
                            <div>
                              <Badge variant="outline" className={cn(
                                line.reworkRate <= 3.0 ? "bg-success/10 text-success" : 
                                line.reworkRate <= 4.5 ? "bg-warning/10 text-warning" : 
                                "bg-destructive/10 text-destructive"
                              )}>
                                {line.reworkRate}% rework
                              </Badge>
                            </div>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-2">Quality Improvement Opportunities</h4>
                  <div className="space-y-3">
                    {currentFactory.defectByType
                      .sort((a, b) => b.value - a.value)
                      .slice(0, 3)
                      .map((defect, index) => (
                        <div key={index} className="p-3 rounded-lg border border-purple-light/30 bg-soft-purple/20">
                          <div className="flex justify-between items-center mb-1">
                            <div className="font-medium">{defect.name}</div>
                            <Badge>{defect.value} occurrences</Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            High priority improvement area - accounts for {((defect.value / currentFactory.defectCount) * 100).toFixed(1)}% of all defects
                          </div>
                        </div>
                      ))
                    }
                    
                    <div className="p-3 rounded-lg border border-purple-light/30 bg-soft-purple/10">
                      <h5 className="font-medium mb-2">Defect Reduction Potential</h5>
                      <div className="text-sm text-muted-foreground">
                        Focusing on top 3 defect types could reduce overall defect rate by approximately
                        <span className="font-medium text-primary ml-1">
                          {(((currentFactory.defectByType
                            .sort((a, b) => b.value - a.value)
                            .slice(0, 3)
                            .reduce((sum, defect) => sum + defect.value, 0)) / currentFactory.defectCount) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="p-3 rounded-lg border border-purple-light/30 bg-soft-purple/10">
                      <h5 className="font-medium mb-2">Line Performance Analysis</h5>
                      <div className="text-sm text-muted-foreground">
                        <div>Highest defect line: <span className="font-medium">{
                          currentFactory.lineData.sort((a, b) => b.defects - a.defects)[0].name
                        }</span></div>
                        <div>Highest rework line: <span className="font-medium">{
                          currentFactory.lineData.sort((a, b) => b.reworkRate - a.reworkRate)[0].name
                        }</span></div>
                        <div>Best performing line: <span className="font-medium">{
                          currentFactory.lineData.sort((a, b) => a.reworkRate - b.reworkRate)[0].name
                        }</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FactoryMetrics;
