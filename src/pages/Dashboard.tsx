import { useState, useEffect, useCallback } from 'react';
import { Calendar, LineChart, BarChart3, PieChart as PieChartIcon, ArrowUpRight, Download, Trophy, AlertTriangle, CheckCircle, XCircle, User, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Header from '@/components/Header';
import FactoryMetrics from '@/components/FactoryMetrics';
import DefectRecorder from '@/components/DefectRecorder';
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
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Player, DefectType, GarmentPart } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import BingoBoard from '@/components/BingoBoard';
import IncentiveConfig from '@/components/IncentiveConfig';
import { useDefectSync } from '@/hooks/use-defect-sync';
import SupervisorValidation from '@/components/SupervisorValidation';
import OperatorManagement from '@/components/OperatorManagement';
// Import Supabase hooks
import { usePlants, useOperations, useUserManagement, useDefects } from '@/lib/supabase/hooks';
import { DEFECT_TYPES, GARMENT_PARTS } from '@/lib/game-data';

interface DefectAnalysisData {
  name: string;
  count: number;
}

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

const defaultPlayers: Player[] = [
  {
    id: 'default-player',
    name: 'New Player',
    role: 'operator',
    score: 0,
    bingoCount: 0,
    defectsFound: 0
  }
];

const COLORS = ['#FF8042', '#0088FE', '#00C49F', '#FFBB28', '#A569BD', '#D3D3D3'];

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('defect-detection');
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year'>('week');
  const [qcRole, setQCRole] = useState<'inline' | 'endline' | 'aql'>('inline');
  const [aqlLevel, setAQLLevel] = useState<'first' | 'second'>('first');
  
  // Replace localStorage with Supabase hooks
  const { users: supabaseUsers, loading: loadingUsers } = useUserManagement();
  const { plants, loading: loadingPlants } = usePlants();
  const { operations, loading: loadingOperations } = useOperations();
  const { defects, loading: loadingDefects, addDefect: addDefectToSupabase } = useDefects();
  
  // Keep the local storage for charts data for now
  const [lineData, setLineData] = useState(defaultLineData);
  const [barData, setBarData] = useState(defaultBarData);
  const [pieData, setPieData] = useState(defaultPieData);
  const [defectRate, setDefectRate] = useState(0);
  const [recentlyRecordedDefect, setRecentlyRecordedDefect] = useState<any | null>(null);
  
  // Use Supabase data for validation stats
  const totalDefects = defects.length;
  const verifiedDefects = defects.filter(d => d.validated).length;
  const pendingDefects = defects.filter(d => !d.validated && !d.validated_by).length;
  const rejectedDefects = defects.filter(d => !d.validated && d.validated_by).length;
  
  // Map Supabase users to players
  const players: Player[] = supabaseUsers ? supabaseUsers.map(user => ({
    id: user.id,
    name: user.name,
    role: user.role as 'operator' | 'supervisor' | 'admin', // Cast to specific roles
    score: 0, // We could add this to the users table if needed
    bingoCount: 0, // We could add this to the users table if needed
    defectsFound: 0, // We could add this to the users table if needed
    epfNumber: user.epf_number,
    operation: undefined // No direct mapping in the users table yet
  })) : [];
  
  const avgDefectsPerPlayer = players.length ? Math.round(totalDefects / players.length) : 0;
  const topPlayer = [...players].sort((a, b) => b.score - a.score)[0] || defaultPlayers[0];
  
  useEffect(() => {
    if (defects.length === 0) return;
    
    // Create fresh copies of default data structures to avoid accumulation
    const newLineData = JSON.parse(JSON.stringify(defaultLineData));
    const garmentPartCounts: Record<string, number> = {};
    const defectTypeCounts: Record<string, number> = {};
    
    console.log(`Processing ${defects.length} defects for charts`);
    
    // Process each defect to collect data
    defects.forEach(defect => {
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
      let garmentPartName = 'Unknown';
      if (defect.garment_part !== null && defect.garment_part !== undefined) {
        const garmentPart = defect.garment_part as any;
        if (typeof garmentPart === 'object' && garmentPart !== null && 'name' in garmentPart) {
          garmentPartName = garmentPart.name;
        } else {
          garmentPartName = String(garmentPart);
        }
      }
      
      // Increment count for this garment part
      if (!garmentPartCounts[garmentPartName]) {
        garmentPartCounts[garmentPartName] = 0;
      }
      garmentPartCounts[garmentPartName]++;
      
      // Process defect types for pie chart
      let defectTypeName = 'Other';
      if (defect.defect_type !== null && defect.defect_type !== undefined) {
        const defectType = defect.defect_type as any;
        if (typeof defectType === 'object' && defectType !== null) {
          if (defectType.name) {
            defectTypeName = defectType.name;
          } else if (defectType.code) {
            // Look up the defect type name from DEFECT_TYPES
            const foundDefectType = DEFECT_TYPES.find(dt => dt.code === Number(defectType.code));
            defectTypeName = foundDefectType ? foundDefectType.name : 'Other';
          }
        } else if (typeof defectType === 'number') {
          // If defect_type is just a number, look up the name
          const foundDefectType = DEFECT_TYPES.find(dt => dt.code === defectType);
          defectTypeName = foundDefectType ? foundDefectType.name : 'Other';
        } else {
          defectTypeName = String(defectType);
        }
      }
      
      // Increment count for this defect type
      if (!defectTypeCounts[defectTypeName]) {
        defectTypeCounts[defectTypeName] = 0;
      }
      defectTypeCounts[defectTypeName]++;
    });
    
    // Log the processed data for debugging
    console.log("Daily counts:", newLineData);
    console.log("Garment part counts:", garmentPartCounts);
    console.log("Defect type counts:", defectTypeCounts);
    
    // Generate bar data dynamically from counts (top 5 garment parts)
    const dynamicBarData = Object.entries(garmentPartCounts)
      .map(([code, count]) => {
        const garmentPart = GARMENT_PARTS.find(part => part.code === code);
        return {
          name: garmentPart ? garmentPart.name : 'Unknown',
          count: count
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Limit to top 5 for readability
    
    // Generate pie data dynamically from counts (top 6 defect types)
    const dynamicPieData = Object.entries(defectTypeCounts)
      .map(([type, count]) => {
        // If the type is a number, look up the name from DEFECT_TYPES
        if (!isNaN(Number(type))) {
          const defectType = DEFECT_TYPES.find(dt => dt.code === Number(type));
          return {
            name: defectType ? defectType.name : 'Other',
            value: count
          };
        }
        // If it's already a name, use it as is
        return { name: type, value: count };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 6); // Limit to top 6 for readability
    
    // If we have less than 5 garment parts, use default ones to fill the gap
    if (dynamicBarData.length < 5) {
      const existingNames = new Set(dynamicBarData.map(item => item.name));
      defaultBarData.forEach(item => {
        if (!existingNames.has(item.name) && dynamicBarData.length < 5) {
          dynamicBarData.push({ ...item, count: 0 });
        }
      });
    }
    
    // If we have less than 6 defect types, use default ones to fill the gap
    if (dynamicPieData.length < 6) {
      const existingNames = new Set(dynamicPieData.map(item => item.name));
      defaultPieData.forEach(item => {
        if (!existingNames.has(item.name) && dynamicPieData.length < 6) {
          dynamicPieData.push({ ...item, value: 0 });
        }
      });
    }
    
    // Update state with processed data
    setLineData(newLineData);
    setBarData(dynamicBarData);
    setPieData(dynamicPieData);
    
    // Calculate defect rate based on actual data
    if (defects.length > 0) {
      // Calculate defect rate as a percentage of total defects
      // This is a more accurate representation of quality status
      const defectRateValue = (defects.length / 100) * 100; // Convert to percentage
      setDefectRate(Math.min(100, Math.max(0, defectRateValue))); // Ensure it's between 0-100%
    }
  }, [defects]);
  
  const getQualityStatus = useCallback(() => {
    // Updated thresholds for quality status based on defect rate percentage
    if (defectRate < 5.0) return { 
      status: 'green', 
      text: 'Excellent', 
      icon: <CheckCircle className="h-5 w-5 text-green-500" />,
      emoji: '😄' // Happy face for excellent quality
    };
    if (defectRate < 10.0) return { 
      status: 'yellow', 
      text: 'Average', 
      icon: <AlertTriangle className="h-5 w-5 text-amber-500" />,
      emoji: '😐' // Neutral face for average quality
    };
    return { 
      status: 'red', 
      text: 'Critical', 
      icon: <XCircle className="h-5 w-5 text-red-500" />,
      emoji: '😡' // Angry face for critical quality issues
    };
  }, [defectRate]);
  
  const qualityStatus = getQualityStatus();
  
  const handleDefectRecorded = async (defect: any) => {
    setRecentlyRecordedDefect(defect);
    
    // The defect has already been added to Supabase by the DefectRecorder component
    // No need to add it again here
    toast.success('Defect recorded successfully!', {
      description: `${defect.garmentPart.name} - ${defect.defectType.name}`,
    });
    
    // The useEffect will automatically update all charts when defects state updates
  };
  
  const addDemoData = async () => {
    try {
      if (supabaseUsers.length > 0 && plants.length > 0 && operations.length > 0) {
        toast.info('Adding demo data...', {
          description: 'Creating 20 sample defects for testing'
        });
    
    for (let i = 0; i < 20; i++) {
          const randomPlant = plants[Math.floor(Math.random() * plants.length)];
          const randomUser = supabaseUsers[Math.floor(Math.random() * supabaseUsers.length)];
          const randomOperation = operations[Math.floor(Math.random() * operations.length)];
          
      const randomDefectType = {
        code: Math.floor(Math.random() * 24) + 1,
        name: `Demo Defect ${i+1}`
      };
      const randomGarmentPart = {
        code: String.fromCharCode(65 + Math.floor(Math.random() * 24)),
        name: `Demo Part ${i+1}`
      };
      
          // Create a demo defect in the correct format for Supabase
          const demoDefect = {
        id: crypto.randomUUID(),
        defectType: randomDefectType,
        garmentPart: randomGarmentPart,
        timestamp: new Date().toISOString(),
            operatorId: randomUser.id,
            operatorName: randomUser.name,
            factoryId: randomPlant.id,
            lineNumber: randomPlant.lines[Math.floor(Math.random() * randomPlant.lines.length)],
            epfNumber: randomUser.epf_number,
            operation: randomOperation.name,
            status: 'verified' as 'verified' | 'pending' | 'rejected',
        reworked: Math.random() > 0.7
          };
          
          // Use the addDefectToSupabase function from the useDefects hook
          await addDefectToSupabase(demoDefect);
    }
    
    toast.success('Demo data loaded', {
      description: 'Dashboard has been populated with sample data'
    });
      } else {
        toast.error("Cannot create demo data", {
          description: "Make sure you have users, plants, and operations in the database"
        });
      }
    } catch (error) {
      console.error("Error adding demo defects:", error);
      toast.error("Failed to load demo data", {
        description: "An error occurred while creating sample defects."
      });
    }
  };
  
  const resetData = async () => {
    try {
      // We don't want to actually delete the defects from Supabase
      // Instead, we'll just reset the chart displays to their defaults
      setLineData(JSON.parse(JSON.stringify(defaultLineData)));
      setBarData(JSON.parse(JSON.stringify(defaultBarData)));
      setPieData(JSON.parse(JSON.stringify(defaultPieData)));
    setDefectRate(2.5);
    
    toast.info('Data reset', {
      description: 'All dashboard data has been reset to defaults'
    });
    } catch (error) {
      console.error("Error resetting data:", error);
      toast.error("Failed to reset data", {
        description: "An error occurred while resetting the dashboard."
      });
    }
  };
  
  const renderLeaderboard = () => {
    if (loadingUsers) {
      return (
        <div className="text-center p-6 text-muted-foreground">
          Loading player data...
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Top Players</h3>
        
        {players.length > 0 ? (
          <>
            <div className="bg-muted/30 p-3 rounded-lg mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  <span className="font-medium">{topPlayer.name}</span>
                </div>
                <Badge variant="outline">{topPlayer.score} points</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <div className="text-muted-foreground">Defects found: {topPlayer.defectsFound}</div>
                <div className="text-muted-foreground">Bingos: {topPlayer.bingoCount}</div>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {topPlayer.epfNumber && `EPF: ${topPlayer.epfNumber}`}
                {topPlayer.operation && ` • Operation: ${topPlayer.operation}`}
              </div>
              <Progress value={(topPlayer.score / 100) * 100} className="h-2 mt-2" />
            </div>
          
            <div className="space-y-2">
              {players
                .sort((a, b) => b.score - a.score)
                .slice(0, 5)
                .map((player, index) => (
                  <div 
                    key={player.id} 
                    className={cn(
                      "flex items-center justify-between p-2 rounded-md",
                      index === 0 ? "bg-yellow-50 border border-yellow-200" : "bg-card border"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 flex items-center justify-center bg-muted rounded-full text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{player.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {player.defectsFound} defects · {player.bingoCount} bingos
                          {player.epfNumber && ` · EPF: ${player.epfNumber}`}
                          {player.operation && ` · ${player.operation}`}
                        </div>
                      </div>
                    </div>
                    <div className="font-bold">{player.score}</div>
                  </div>
                ))
              }
            </div>
          </>
        ) : (
          <div className="text-center p-6 text-muted-foreground">
            No players available. Add users in the Admin panel to see them here.
          </div>
        )}
      </div>
    );
  };
  
  const defectCountsByType = defects.reduce((acc, defect) => {
    let typeName = 'Unknown';
    
    if (defect.defect_type !== null && defect.defect_type !== undefined) {
      const defectType = defect.defect_type as any;
      
      if (typeof defectType === 'object' && defectType !== null && defectType.name) {
        typeName = defectType.name;
      } else {
        typeName = String(defectType);
      }
    }
    
    if (!acc[typeName]) {
      acc[typeName] = 0;
    }
    
    acc[typeName]++;
    return acc;
  }, {});

  console.log("Defect Counts by Type:", defectCountsByType);

  const defectAnalysisData: DefectAnalysisData[] = Object.entries(defectCountsByType).map(([type, count]) => {
    const defectType = DEFECT_TYPES.find(defect => defect.code === Number(type));
    return {
      name: defectType ? defectType.name : type,
      count: count as number,
    };
  });

  console.log("Defect Analysis Data:", defectAnalysisData);
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Header />
      
      <main className="container py-8">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-gradient">Jay Jay Quality Games</h1>
            <p className="text-muted-foreground">
              Monitor defect trends and quality performance
            </p>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <Button variant="outline" size="sm" className="h-9 gap-1">
              <Calendar className="h-4 w-4" />
              <span>{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-9"
              onClick={addDemoData}
              disabled={loadingUsers || loadingPlants || loadingOperations}
            >
              <Download className="h-4 w-4" />
              <span className="ml-1">Load Demo Data</span>
            </Button>
            <Button 
              variant="destructive" 
              size="sm" 
              className="h-9"
              onClick={resetData}
            >
              Reset
            </Button>
          </div>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="space-y-1">
                <CardTitle className="text-sm font-medium">
                  Total Defects Found
                </CardTitle>
                <CardDescription>This {period}</CardDescription>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <LineChart className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalDefects}</div>
              <div className="mt-1 flex items-center text-xs text-muted-foreground">
                <ArrowUpRight className="mr-1 h-3 w-3 text-green-500" />
                <span className="text-green-500 mr-1">+12.5%</span>
                from last {period}
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="space-y-1">
                <CardTitle className="text-sm font-medium">
                  Defect Detection Rate
                </CardTitle>
                <CardDescription>Per hour</CardDescription>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <BarChart3 className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalDefects > 0 ? (totalDefects / 7).toFixed(1) : '0.0'}</div>
              <div className="mt-1 flex items-center text-xs text-muted-foreground">
                <ArrowUpRight className="mr-1 h-3 w-3 text-green-500" />
                <span className="text-green-500 mr-1">+3.1%</span>
                from last {period}
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="space-y-1">
                <CardTitle className="text-sm font-medium">
                  Quality Status
                </CardTitle>
                <CardDescription>Current AQL status</CardDescription>
              </div>
              <div className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full",
                qualityStatus.status === 'green' ? "bg-green-100" : 
                qualityStatus.status === 'yellow' ? "bg-amber-100" : "bg-red-100"
              )}>
                <span className="text-2xl" role="img" aria-label={qualityStatus.text}>
                  {qualityStatus.emoji}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className={cn(
                  "h-3 w-3 rounded-full",
                  qualityStatus.status === 'green' ? "bg-green-500" : 
                  qualityStatus.status === 'yellow' ? "bg-amber-500" : "bg-red-500"
                )}></div>
                <div className="text-lg font-bold">{qualityStatus.text}</div>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                Defect rate: {defectRate.toFixed(1)}%
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="space-y-1">
                <CardTitle className="text-sm font-medium">
                  Validation Rate
                </CardTitle>
                <CardDescription>Defect verification</CardDescription>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <PieChartIcon className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalDefects > 0 ? ((verifiedDefects / totalDefects) * 100).toFixed(0) + '%' : '0%'}
              </div>
              <div className="mt-1 text-xs text-muted-foreground flex flex-col">
                <span>{verifiedDefects} verified • {pendingDefects} pending • {rejectedDefects} rejected</span>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="defect-detection" className="mt-6" onValueChange={setActiveTab}>
          <TabsList className="w-full sm:w-auto grid grid-cols-2 sm:grid-cols-5 sm:inline-flex">
            <TabsTrigger value="defect-detection">Defect Recording</TabsTrigger>
            <TabsTrigger value="supervisor">Supervisor</TabsTrigger>
            <TabsTrigger value="trends">Quality Trends</TabsTrigger>
            <TabsTrigger value="factory-metrics">Factory Metrics</TabsTrigger>
            <TabsTrigger value="operators">Operators</TabsTrigger>
          </TabsList>
          
          <TabsContent value="defect-detection" className="mt-4">
            <div className="grid gap-4 md:grid-cols-2">
              <DefectRecorder 
                onDefectRecorded={handleDefectRecorded} 
                plantsList={plants} 
                operationsList={operations}
              />
              
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>Defect Analysis</CardTitle>
                  <CardDescription>
                    View trends and distributions of recorded defects
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium mb-2">Defect Distribution by Type</h3>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsPieChart>
                            <Pie
                              data={defectAnalysisData.filter(item => item.count > 0)}
                              cx="50%"
                              cy="45%"
                              innerRadius={60}
                              outerRadius={90}
                              paddingAngle={2}
                              fill="#8884d8"
                              dataKey="count"
                              nameKey="name"
                              labelLine={{ stroke: '#666666', strokeWidth: 1 }}
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            >
                              {defectAnalysisData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip 
                              formatter={(value, name) => [`${value} defects`, name]}
                              contentStyle={{
                                backgroundColor: 'white',
                                border: '1px solid #ccc',
                                borderRadius: '4px',
                                padding: '8px'
                              }}
                            />
                          </RechartsPieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    
                    {recentlyRecordedDefect && (
                      <div className="border rounded-lg p-3 bg-green-50 border-green-200 animate-fade-in">
                        <h4 className="font-medium text-sm text-green-800 mb-1">Recently Recorded Defect</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Garment Part:</span>
                            <div className="font-medium">{recentlyRecordedDefect.garmentPart.name}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Defect Type:</span>
                            <div className="font-medium">{recentlyRecordedDefect.defectType.name}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Operator:</span>
                            <div className="font-medium">{recentlyRecordedDefect.operatorName}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">EPF Number:</span>
                            <div className="font-medium">{recentlyRecordedDefect.epfNumber || 'N/A'}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Status:</span>
                            <div className="font-medium flex items-center">
                              {recentlyRecordedDefect.status === 'verified' ? (
                                <>
                                  <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                                  Verified
                                </>
                              ) : recentlyRecordedDefect.status === 'rejected' ? (
                                <>
                                  <XCircle className="h-3 w-3 text-red-500 mr-1" />
                                  Rejected
                                </>
                              ) : (
                                <>
                                  <AlertTriangle className="h-3 w-3 text-amber-500 mr-1" />
                                  Pending
                                </>
                              )}
                            </div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Time:</span>
                            <div className="font-medium">
                              {new Date(recentlyRecordedDefect.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="border-t pt-3">
                      <h4 className="font-medium text-sm mb-2">Quality Traffic Light</h4>
                      <div className="flex justify-between items-center">
                        <div className="flex gap-2">
                          <div className={cn(
                            "h-6 w-6 rounded-full",
                            qualityStatus.status === 'green' ? "bg-green-500" : "bg-gray-200"
                          )}></div>
                          <div className={cn(
                            "h-6 w-6 rounded-full",
                            qualityStatus.status === 'yellow' ? "bg-amber-500" : "bg-gray-200"
                          )}></div>
                          <div className={cn(
                            "h-6 w-6 rounded-full",
                            qualityStatus.status === 'red' ? "bg-red-500" : "bg-gray-200"
                          )}></div>
                        </div>
                        <div className="text-sm">
                          Current status: <span className="font-bold">{qualityStatus.text}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <div className="md:col-span-2 mt-4">
                <BingoBoard />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="supervisor" className="mt-4">
            <SupervisorValidation users={supabaseUsers} />
          </TabsContent>
          
          <TabsContent value="trends" className="mt-4">
            <div className="flex justify-between items-center mb-4">
              <div></div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className={period === 'day' ? 'bg-accent' : ''}
                  onClick={() => setPeriod('day')}
                >
                  Day
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className={period === 'week' ? 'bg-accent' : ''}
                  onClick={() => setPeriod('week')}
                >
                  Week
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className={period === 'month' ? 'bg-accent' : ''}
                  onClick={() => setPeriod('month')}
                >
                  Month
                </Button>
              </div>
            </div>
            
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle>Daily Defect Detection</CardTitle>
                <CardDescription>
                  Number of defects detected per day
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart data={lineData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} activeDot={{ r: 8 }} />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle>Top Defect Locations</CardTitle>
                  <CardDescription>
                    Garment parts with the most detected defects
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={barData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle>Defect Type Distribution</CardTitle>
                  <CardDescription>
                    Breakdown of detected defect types
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={pieData.filter(item => item.value > 0)}
                        cx="50%"
                        cy="45%"
                        innerRadius={70}
                        outerRadius={120}
                        paddingAngle={2}
                        fill="#8884d8"
                        dataKey="value"
                        labelLine={{ stroke: '#666666', strokeWidth: 1 }}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value, name) => [`${value} defects`, name]}
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #ccc',
                          borderRadius: '4px',
                          padding: '8px'
                        }}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="factory-metrics" className="mt-4">
            <FactoryMetrics plants={plants} />
          </TabsContent>
          
          <TabsContent value="operators" className="mt-4">
                <OperatorManagement />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;