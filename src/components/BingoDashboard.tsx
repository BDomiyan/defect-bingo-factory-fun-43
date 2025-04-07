import { useState, useEffect, useCallback } from 'react';
import { Calendar, LineChart, BarChart3, PieChartIcon, ArrowUpRight, Download, Trophy, AlertTriangle, CheckCircle, XCircle, User, Users, PartyPopper, Percent, Target, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ResponsiveContainer, 
  LineChart as RechartsLineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from 'recharts';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { DEFECT_TYPES, GARMENT_PARTS } from '@/lib/game-data';
import { useBingoDefects } from '@/lib/supabase/hooks';
import { BingoSupervisorValidation } from './BingoSupervisorValidation';

// Colors for charts
const COLORS = ['#FF8042', '#0088FE', '#00C49F', '#FFBB28', '#A569BD', '#D3D3D3'];

// Default data structures for charts
const defaultLineData = [
  { day: 'Mon', count: 0 },
  { day: 'Tue', count: 0 },
  { day: 'Wed', count: 0 },
  { day: 'Thu', count: 0 },
  { day: 'Fri', count: 0 },
  { day: 'Sat', count: 0 },
  { day: 'Sun', count: 0 }
];

const defaultBarData = [
  { name: 'Sleeve Attach', count: 0 },
  { name: 'Neck Binding', count: 0 },
  { name: 'Bottom Attach', count: 0 },
  { name: 'Zipper', count: 0 },
  { name: 'Label Attach', count: 0 }
];

const defaultPieData = [
  { name: 'Broken Stitches', value: 0 },
  { name: 'Skip Stitches', value: 0 },
  { name: 'Open Seam', value: 0 },
  { name: 'Puckering', value: 0 },
  { name: 'Stain', value: 0 },
  { name: 'Other', value: 0 }
];

interface BingoDashboardProps {
  className?: string;
}

export const BingoDashboard = ({ className }: BingoDashboardProps) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('week');
  const [lineData, setLineData] = useState(defaultLineData);
  const [barData, setBarData] = useState(defaultBarData);
  const [pieData, setPieData] = useState(defaultPieData);
  const { bingoDefects, loading, getBingoDefectsStats } = useBingoDefects();
  const [stats, setStats] = useState({
    total: 0,
    validated: 0,
    bingoLines: 0
  });
  const [quality, setQuality] = useState({
    defectDetectionRate: 0,
    inspectionEfficiency: 0,
    firstTimeQuality: 0
  });
  
  // Calculate derivative stats
  const validationRate = stats.total > 0 ? Math.round((stats.validated / stats.total) * 100) : 0;
  const bingoLineRate = stats.total > 0 ? Math.round((stats.bingoLines / stats.total) * 100) : 0;
  
  // Fetch stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const result = await getBingoDefectsStats();
        setStats(result);
      } catch (error) {
        console.error('Error fetching bingo stats:', error);
      }
    };
    
    fetchStats();
  }, [getBingoDefectsStats]);
  
  // Process defects data for charts and calculate quality metrics
  useEffect(() => {
    if (!bingoDefects.length) return;
    
    // Create fresh copies of default data structures
    const newLineData = JSON.parse(JSON.stringify(defaultLineData));
    const garmentPartCounts: Record<string, number> = {};
    const defectTypeCounts: Record<string, number> = {};
    
    // Track quality metrics
    let totalOperators = 0;
    const operatorIds = new Set();
    let totalDefects = bingoDefects.length;
    let verifiedDefects = 0;
    let bingoLineDefects = 0;
    
    // Process each defect
    bingoDefects.forEach(defect => {
      // Process daily counts for line chart
      try {
        const date = new Date(defect.created_at);
        const day = date.getDay();
        const dayIndex = day === 0 ? 6 : day - 1; // Convert to 0-6 (Mon-Sun)
        newLineData[dayIndex].count += 1;
      } catch (e) {
        console.error("Error processing date for defect:", defect.id, e);
      }
      
      // Process garment parts for bar chart
      const garmentPart = defect.garment_part || 'Unknown';
      if (!garmentPartCounts[garmentPart]) {
        garmentPartCounts[garmentPart] = 0;
      }
      garmentPartCounts[garmentPart]++;
      
      // Process defect types for pie chart
      const defectType = defect.defect_type || 'Other';
      if (!defectTypeCounts[defectType]) {
        defectTypeCounts[defectType] = 0;
      }
      defectTypeCounts[defectType]++;
      
      // Track player stats for quality metrics
      const userId = defect.created_by;
      
      // Track unique operators
      if (userId) {
        operatorIds.add(userId);
      }
      
      // Count verified defects and bingo lines
      if (defect.validated) {
        verifiedDefects++;
      }
      
      if (defect.is_bingo_line) {
        bingoLineDefects += 1;
      }
    });
    
    // Calculate quality metrics
    totalOperators = operatorIds.size;
    
    // Defect Detection Rate: Percentage of defects that are detected through Bingo
    const defectDetectionRate = totalDefects > 0 ? Math.round((verifiedDefects / totalDefects) * 100) : 0;
    
    // Inspection Efficiency: Average defects found per operator
    const inspectionEfficiency = totalOperators > 0 ? Math.round(totalDefects / totalOperators) : 0;
    
    // First Time Quality: Percentage of defects that are verified on first inspection
    const firstTimeQuality = totalDefects > 0 ? Math.round((bingoLineDefects / totalDefects) * 100) : 0;
    
    setQuality({
      defectDetectionRate,
      inspectionEfficiency,
      firstTimeQuality
    });
    
    // Generate bar data from counts (top 5 garment parts)
    const sortedGarmentParts = Object.entries(garmentPartCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([code, count]) => {
        // Try to find the garment part name from the code
        const garmentPart = GARMENT_PARTS.find(p => p.code === code);
        return {
          name: garmentPart ? garmentPart.name : code,
          count
        };
      });
    
    // Generate pie data from counts (top 5 defect types)
    const sortedDefectTypes = Object.entries(defectTypeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([code, count]) => {
        // Try to find the defect type name from the code
        const defectType = DEFECT_TYPES.find(d => d.code === Number(code));
        return {
          name: defectType ? defectType.name : code,
          value: count
        };
      });
    
    // Add "Other" category if there are more than 5 defect types
    if (Object.keys(defectTypeCounts).length > 5) {
      const otherValue = Object.entries(defectTypeCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(5)
        .reduce((sum, [_, count]) => sum + count, 0);
      
      sortedDefectTypes.push({
        name: 'Other',
        value: otherValue
      });
    }
    
    // Update the chart data state
    setLineData(newLineData);
    setBarData(sortedGarmentParts);
    setPieData(sortedDefectTypes);
  }, [bingoDefects]);
  
  // Custom tooltip for line chart
  const CustomLineTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border rounded shadow-sm">
          <p className="font-medium">{label}</p>
          <p>
            Defects: <span className="font-medium">{payload[0].value}</span>
          </p>
        </div>
      );
    }
    return null;
  };
  
  // Custom tooltip for bar chart
  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border rounded shadow-sm">
          <p className="font-medium">{label}</p>
          <p>
            Defects: <span className="font-medium">{payload[0].value}</span>
          </p>
        </div>
      );
    }
    return null;
  };
  
  // Custom tooltip for pie chart
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border rounded shadow-sm">
          <p className="font-medium">{payload[0].name}</p>
          <p>
            Defects: <span className="font-medium">{payload[0].value}</span>
          </p>
        </div>
      );
    }
    return null;
  };
  
  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Bingo Dashboard</h2>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={(value: any) => setPeriod(value)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="defect-analysis">Defect Analysis</TabsTrigger>
          <TabsTrigger value="quality-trends">Quality Trends</TabsTrigger>
          <TabsTrigger value="supervisor">Supervisor Validation</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Defects Found
                </CardTitle>
                <div className="rounded-full p-1 bg-primary/10">
                  <AlertTriangle className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground">
                  Defects recorded through Bingo
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Validation Rate
                </CardTitle>
                <div className="rounded-full p-1 bg-primary/10">
                  <CheckCircle className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{validationRate}%</div>
                <div className="mt-2">
                  <Progress value={validationRate} className="h-2" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {stats.validated} out of {stats.total} defects validated
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Defect Detection Rate
                </CardTitle>
                <div className="rounded-full p-1 bg-primary/10">
                  <Percent className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{quality.defectDetectionRate}%</div>
                <div className="mt-2">
                  <Progress value={quality.defectDetectionRate} className="h-2" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Accuracy of defect identification
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Bingo Success Rate
                </CardTitle>
                <div className="rounded-full p-1 bg-primary/10">
                  <PartyPopper className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{bingoLineRate}%</div>
                <div className="mt-2">
                  <Progress value={bingoLineRate} className="h-2" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {stats.bingoLines} out of {stats.total} defects were Bingo discoveries
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* Daily Trends Chart */}
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Daily Defect Trends</CardTitle>
              <CardDescription>
                Number of defects recorded per day through Bingo
              </CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart data={lineData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip content={<CustomLineTooltip />} />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#8884d8" 
                      activeDot={{ r: 8 }} 
                      name="Defects" 
                    />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="defect-analysis" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Garment Parts Bar Chart */}
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Top Garment Parts</CardTitle>
                <CardDescription>
                  Most common garment parts with defects
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={barData} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={80} />
                      <Tooltip content={<CustomBarTooltip />} />
                      <Bar dataKey="count" fill="#8884d8" name="Defects">
                        {barData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            {/* Defect Types Pie Chart */}
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Defect Types Distribution</CardTitle>
                <CardDescription>
                  Distribution of different types of defects
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomPieTooltip />} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="quality-trends" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            {/* Defect Detection Rate */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-sm font-medium">
                  <Percent className="h-4 w-4 mr-2" />
                  Defect Detection Rate
                </CardTitle>
                <CardDescription>
                  Percentage of defects correctly identified
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{quality.defectDetectionRate}%</div>
                <div className="mt-2">
                  <Progress value={quality.defectDetectionRate} className="h-2" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Higher is better
                </p>
              </CardContent>
            </Card>
            
            {/* Inspection Efficiency */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-sm font-medium">
                  <Target className="h-4 w-4 mr-2" />
                  Inspection Efficiency
                </CardTitle>
                <CardDescription>
                  Average defects found per operator
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{quality.inspectionEfficiency}</div>
                <div className="flex items-center mt-2 text-xs">
                  <TrendingUp className="h-4 w-4 mr-1 text-green-500" />
                  <span className="text-green-500 font-medium">Efficient</span>
                  <span className="text-muted-foreground ml-1">defect detection</span>
                </div>
              </CardContent>
            </Card>
            
            {/* First Time Quality */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-sm font-medium">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  First Time Quality
                </CardTitle>
                <CardDescription>
                  Defects verified on first inspection
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{quality.firstTimeQuality}%</div>
                <div className="mt-2">
                  <Progress value={quality.firstTimeQuality} className="h-2" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {quality.firstTimeQuality < 50 ? 'Needs improvement' : 'Good performance'}
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* Monthly trend comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Quality Improvement Trend</CardTitle>
              <CardDescription>
                Showing quality metrics over time
              </CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart 
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    data={[
                      { month: 'Jan', detection: 45, success: 30, quality: 50 },
                      { month: 'Feb', detection: 52, success: 35, quality: 55 },
                      { month: 'Mar', detection: 58, success: 42, quality: 60 },
                      { month: 'Apr', detection: 65, success: 48, quality: 68 },
                      { month: 'May', detection: quality.defectDetectionRate, success: bingoLineRate, quality: quality.firstTimeQuality },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="detection" stroke="#8884d8" name="Detection Rate" />
                    <Line type="monotone" dataKey="success" stroke="#82ca9d" name="Bingo Success" />
                    <Line type="monotone" dataKey="quality" stroke="#ffc658" name="First Time Quality" />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="supervisor" className="space-y-6">
          <BingoSupervisorValidation />
        </TabsContent>
      </Tabs>
    </div>
  );
}; 