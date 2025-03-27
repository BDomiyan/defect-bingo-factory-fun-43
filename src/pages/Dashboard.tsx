
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
import { FACTORIES } from '@/lib/game-data';
import SupervisorValidation from '@/components/SupervisorValidation';
import OperatorManagement from '@/components/OperatorManagement';

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
  
  const [players, setPlayers] = useLocalStorage<Player[]>('defect-bingo-players', []);
  const [lineData, setLineData] = useLocalStorage('defect-bingo-line-data', defaultLineData);
  const [barData, setBarData] = useLocalStorage('defect-bingo-bar-data', defaultBarData);
  const [pieData, setPieData] = useLocalStorage('defect-bingo-pie-data', defaultPieData);
  const [defectRate, setDefectRate] = useLocalStorage('defect-rate', 0);
  const [recentlyRecordedDefect, setRecentlyRecordedDefect] = useState<any | null>(null);
  const { recentDefects, addDefect, totalDefects, verifiedDefects, pendingDefects, rejectedDefects } = useDefectSync();
  
  const avgDefectsPerPlayer = players.length ? Math.round(totalDefects / players.length) : 0;
  const topPlayer = [...players].sort((a, b) => b.score - a.score)[0] || defaultPlayers[0];
  
  useEffect(() => {
    if (recentDefects.length > 0) {
      const randomFactor = Math.random() * 0.5 + 0.8; // Random factor between 0.8 and 1.3
      setDefectRate(Math.min(5, Math.max(1, (recentDefects.length / 40) * randomFactor)));
    }
  }, [recentDefects, setDefectRate]);
  
  useEffect(() => {
    if (recentDefects.length === 0) return;
    
    const newLineData = [...lineData];
    recentDefects.forEach(defect => {
      const date = new Date(defect.timestamp);
      const day = date.getDay();
      const dayIndex = day === 0 ? 6 : day - 1; // Convert to 0-6 (Mon-Sun)
      newLineData[dayIndex].count += 1;
    });
    setLineData(newLineData);
    
    const newBarData = [...barData];
    recentDefects.forEach(defect => {
      const partIndex = newBarData.findIndex(item => 
        item.name.toLowerCase().includes(defect.garmentPart.name.toLowerCase())
      );
      if (partIndex >= 0) {
        newBarData[partIndex].count += 1;
      } else {
        newBarData[0].count += 1;
      }
    });
    setBarData(newBarData);
    
    const newPieData = [...pieData];
    recentDefects.forEach(defect => {
      const typeIndex = newPieData.findIndex(item => 
        item.name.toLowerCase().includes(defect.defectType.name.toLowerCase())
      );
      if (typeIndex >= 0) {
        newPieData[typeIndex].value += 1;
      } else {
        newPieData[newPieData.length - 1].value += 1; // Add to "Other" category
      }
    });
    setPieData(newPieData);
  }, [recentDefects]);
  
  const getQualityStatus = useCallback(() => {
    if (defectRate < 2.0) return { status: 'green', text: 'Excellent', icon: <CheckCircle className="h-5 w-5 text-green-500" /> };
    if (defectRate < 3.5) return { status: 'yellow', text: 'Average', icon: <AlertTriangle className="h-5 w-5 text-amber-500" /> };
    return { status: 'red', text: 'Critical', icon: <XCircle className="h-5 w-5 text-red-500" /> };
  }, [defectRate]);
  
  const qualityStatus = getQualityStatus();
  
  const handleDefectRecorded = (defect: any) => {
    setRecentlyRecordedDefect(defect);
    
    const newLineData = [...lineData];
    const today = new Date().getDay();
    const dayIndex = today === 0 ? 6 : today - 1; // Convert to 0-6 (Mon-Sun)
    newLineData[dayIndex].count += 1;
    setLineData(newLineData);
    
    const newBarData = [...barData];
    const partIndex = newBarData.findIndex(item => 
      item.name.toLowerCase().includes(defect.garmentPart.name.toLowerCase())
    );
    if (partIndex >= 0) {
      newBarData[partIndex].count += 1;
    } else {
      newBarData[0].count += 1;
    }
    setBarData(newBarData);
    
    const newPieData = [...pieData];
    const typeIndex = newPieData.findIndex(item => 
      item.name.toLowerCase().includes(defect.defectType.name.toLowerCase())
    );
    if (typeIndex >= 0) {
      newPieData[typeIndex].value += 1;
    } else {
      newPieData[newPieData.length - 1].value += 1; // Add to "Other" category
    }
    setPieData(newPieData);
    
    const randomFactor = Math.random() * 0.5 + 0.8; // Random factor between 0.8 and 1.3
    setDefectRate(Math.min(5, Math.max(1, ((recentDefects.length + 1) / 40) * randomFactor)));
    
    toast.success('Defect recorded successfully!', {
      description: `${defect.garmentPart.name} - ${defect.defectType.name}`,
    });
  };
  
  const addDemoData = () => {
    const newLineData = lineData.map(item => ({
      ...item,
      count: Math.floor(Math.random() * 100)
    }));
    
    const newBarData = barData.map(item => ({
      ...item,
      count: Math.floor(Math.random() * 30)
    }));
    
    const newPieData = pieData.map(item => ({
      ...item,
      value: Math.floor(Math.random() * 25)
    }));
    
    const demoPlayers: Player[] = [
      {
        id: '1',
        name: 'Elena Rodriguez',
        role: 'operator',
        score: 92,
        bingoCount: 3,
        defectsFound: 45
      },
      {
        id: '2',
        name: 'Michael Chen',
        role: 'supervisor',
        score: 78,
        bingoCount: 2,
        defectsFound: 38
      },
      {
        id: '3',
        name: 'Aisha Patel',
        role: 'operator',
        score: 65,
        bingoCount: 1,
        defectsFound: 29
      },
      {
        id: '4',
        name: 'Carlos Mendez',
        role: 'operator',
        score: 52,
        bingoCount: 1,
        defectsFound: 24
      }
    ];
    
    setLineData(newLineData);
    setBarData(newBarData);
    setPieData(newPieData);
    setPlayers(demoPlayers);
    setDefectRate(Math.random() * 5);
    
    for (let i = 0; i < 20; i++) {
      const randomGarmentIndex = Math.floor(Math.random() * FACTORIES.length);
      const randomDefectType = {
        code: Math.floor(Math.random() * 24) + 1,
        name: `Demo Defect ${i+1}`
      };
      const randomGarmentPart = {
        code: String.fromCharCode(65 + Math.floor(Math.random() * 24)),
        name: `Demo Part ${i+1}`
      };
      
      addDefect({
        id: crypto.randomUUID(),
        defectType: randomDefectType,
        garmentPart: randomGarmentPart,
        timestamp: new Date().toISOString(),
        operatorId: demoPlayers[Math.floor(Math.random() * demoPlayers.length)].id,
        operatorName: demoPlayers[Math.floor(Math.random() * demoPlayers.length)].name,
        factoryId: FACTORIES[randomGarmentIndex].id,
        lineNumber: FACTORIES[randomGarmentIndex].lines[0],
        status: 'verified',
        reworked: Math.random() > 0.7
      });
    }
    
    toast.success('Demo data loaded', {
      description: 'Dashboard has been populated with sample data'
    });
  };
  
  const resetData = () => {
    setLineData(defaultLineData);
    setBarData(defaultBarData);
    setPieData(defaultPieData);
    setPlayers(defaultPlayers);
    setDefectRate(2.5);
    
    toast.info('Data reset', {
      description: 'All dashboard data has been reset to defaults'
    });
  };
  
  const renderLeaderboard = () => {
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
            No players available. Record defects or play Bingo to see the leaderboard.
          </div>
        )}
      </div>
    );
  };
  
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
                "flex h-8 w-8 items-center justify-center rounded-full",
                qualityStatus.status === 'green' ? "bg-green-100" : 
                qualityStatus.status === 'yellow' ? "bg-amber-100" : "bg-red-100"
              )}>
                {qualityStatus.icon}
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
              <DefectRecorder onDefectRecorded={handleDefectRecorded} />
              
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
                      <div className="h-[180px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsPieChart>
                            <Pie
                              data={pieData.filter(item => item.value > 0)}
                              cx="50%"
                              cy="50%"
                              innerRadius={40}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                              label={({ name, percent }) => 
                                `${name}: ${(percent * 100).toFixed(0)}%`
                              }
                            >
                              {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
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
            <SupervisorValidation />
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
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={pieData.filter(item => item.value > 0)}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="factory-metrics" className="mt-4">
            <FactoryMetrics />
          </TabsContent>
          
          <TabsContent value="operators" className="mt-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <OperatorManagement />
              </div>
              <div>
                <Card className="shadow-md">
                  <CardHeader>
                    <CardTitle>Player Leaderboard</CardTitle>
                    <CardDescription>Top performers based on defect detection</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {renderLeaderboard()}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="mt-8 text-center text-sm text-muted-foreground">
          &copy; 2023 Jay Jay Quality Games. All rights reserved.
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
