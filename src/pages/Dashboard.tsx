import { useState, useEffect } from 'react';
import { Calendar, LineChart, BarChart3, PieChart, ArrowUpRight, Download, Trophy, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  
  const [players, setPlayers] = useLocalStorage<Player[]>('defect-bingo-players', defaultPlayers);
  const [lineData, setLineData] = useLocalStorage('defect-bingo-line-data', defaultLineData);
  const [barData, setBarData] = useLocalStorage('defect-bingo-bar-data', defaultBarData);
  const [pieData, setPieData] = useLocalStorage('defect-bingo-pie-data', defaultPieData);
  const [defectRate, setDefectRate] = useLocalStorage('defect-rate', 2.5);
  
  const totalDefects = players.reduce((sum, player) => sum + player.defectsFound, 0);
  const avgDefectsPerPlayer = players.length ? Math.round(totalDefects / players.length) : 0;
  const topPlayer = [...players].sort((a, b) => b.score - a.score)[0] || defaultPlayers[0];
  
  const getQualityStatus = () => {
    if (defectRate < 2.0) return { status: 'green', text: 'Excellent', icon: <CheckCircle className="h-5 w-5 text-green-500" /> };
    if (defectRate < 3.5) return { status: 'yellow', text: 'Average', icon: <AlertTriangle className="h-5 w-5 text-amber-500" /> };
    return { status: 'red', text: 'Critical', icon: <XCircle className="h-5 w-5 text-red-500" /> };
  };
  
  const qualityStatus = getQualityStatus();
  
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
              <span>June 2023</span>
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
                  AQL Success Rate
                </CardTitle>
                <CardDescription>This month</CardDescription>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <PieChart className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalDefects > 0 ? '92%' : '0%'}</div>
              <div className="mt-1 flex items-center text-xs text-muted-foreground">
                <ArrowUpRight className="mr-1 h-3 w-3 text-green-500" />
                <span className="text-green-500 mr-1">+8.7%</span>
                from last month
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="defect-detection" className="mt-6" onValueChange={setActiveTab}>
          <TabsList className="w-full sm:w-auto grid grid-cols-2 sm:grid-cols-4 sm:inline-flex">
            <TabsTrigger value="defect-detection">Defect Detection</TabsTrigger>
            <TabsTrigger value="trends">Quality Trends</TabsTrigger>
            <TabsTrigger value="incentives">Incentives</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>
          
          <TabsContent value="defect-detection" className="mt-4">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle>Defect Detection</CardTitle>
                <CardDescription>
                  Record and track defects across different quality control phases
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Quality Control Role</h3>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button 
                          variant={qcRole === 'inline' ? 'default' : 'outline'} 
                          onClick={() => setQCRole('inline')}
                          className="flex-1"
                        >
                          Inline QC
                        </Button>
                        <Button 
                          variant={qcRole === 'endline' ? 'default' : 'outline'} 
                          onClick={() => setQCRole('endline')}
                          className="flex-1"
                        >
                          End Line QC
                        </Button>
                        <Button 
                          variant={qcRole === 'aql' ? 'default' : 'outline'} 
                          onClick={() => setQCRole('aql')}
                          className="flex-1"
                        >
                          AQL
                        </Button>
                      </div>
                    </div>
                    
                    {qcRole === 'aql' && (
                      <div>
                        <h3 className="text-lg font-medium mb-2">AQL Level</h3>
                        <div className="flex gap-2">
                          <Button 
                            variant={aqlLevel === 'first' ? 'default' : 'outline'} 
                            onClick={() => setAQLLevel('first')}
                            className="flex-1"
                          >
                            First AQL
                          </Button>
                          <Button 
                            variant={aqlLevel === 'second' ? 'default' : 'outline'} 
                            onClick={() => setAQLLevel('second')}
                            className="flex-1"
                          >
                            Second AQL
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <h3 className="text-lg font-medium mb-2">Operator Information</h3>
                      <div className="space-y-2">
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select operator" />
                          </SelectTrigger>
                          <SelectContent>
                            {players.map(player => (
                              <SelectItem key={player.id} value={player.id}>
                                {player.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-sm font-medium">Line Number</label>
                            <Input placeholder="Line #" />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Operation</label>
                            <Input placeholder="Operation" />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-2">Defect Information</h3>
                      <div className="space-y-2">
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select defect type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="broken-stitch">Broken Stitch</SelectItem>
                            <SelectItem value="skip-stitch">Skip Stitch</SelectItem>
                            <SelectItem value="open-seam">Open Seam</SelectItem>
                            <SelectItem value="stain">Stain</SelectItem>
                            <SelectItem value="puckering">Puckering</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select garment part" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sleeve">Sleeve</SelectItem>
                            <SelectItem value="collar">Collar</SelectItem>
                            <SelectItem value="body">Body</SelectItem>
                            <SelectItem value="seam">Seam</SelectItem>
                            <SelectItem value="pocket">Pocket</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <div className="pt-2">
                          <Button className="w-full">Record Defect</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border rounded-lg p-4 bg-accent/30">
                    <h3 className="text-lg font-medium mb-4">Recent Defects</h3>
                    
                    <div className="space-y-2">
                      {totalDefects > 0 ? (
                        <>
                          <div className="flex justify-between p-2 bg-muted rounded-md">
                            <div>
                              <Badge className="bg-red-500">01</Badge>
                              <span className="ml-2">Broken Stitch - Collar</span>
                            </div>
                            <span className="text-sm text-muted-foreground">5 min ago</span>
                          </div>
                          
                          <div className="flex justify-between p-2 bg-muted rounded-md">
                            <div>
                              <Badge className="bg-yellow-500">03</Badge>
                              <span className="ml-2">Skip Stitch - Sleeve</span>
                            </div>
                            <span className="text-sm text-muted-foreground">12 min ago</span>
                          </div>
                          
                          <div className="flex justify-between p-2 bg-muted rounded-md">
                            <div>
                              <Badge className="bg-blue-500">07</Badge>
                              <span className="ml-2">Stain - Body</span>
                            </div>
                            <span className="text-sm text-muted-foreground">25 min ago</span>
                          </div>
                        </>
                      ) : (
                        <div className="text-center p-8 text-muted-foreground">
                          No defects recorded yet
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="font-medium mb-2">Quality Traffic Light</h4>
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
                </div>
              </CardContent>
            </Card>
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
                        data={pieData}
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
          
          <TabsContent value="incentives" className="mt-4">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle>Operator Incentives</CardTitle>
                <CardDescription>
                  Incentive tracking based on quality performance and AQL pass rates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Top Performers</h3>
                    
                    <div className="space-y-3">
                      {totalDefects > 0 ? players.slice(0, 3).map((player, index) => (
                        <div key={player.id} className="flex items-center justify-between border rounded-lg p-3 bg-accent/20">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary font-bold">
                              {index + 1}
                            </div>
                            <div>
                              <div className="font-medium">{player.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {player.defectsFound} defects found
                              </div>
                            </div>
                          </div>
                          <div>
                            <Badge className="bg-green-500/90">+${(player.score / 10).toFixed(2)}</Badge>
                          </div>
                        </div>
                      )) : (
                        <div className="text-center p-8 text-muted-foreground">
                          No performer data available
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-4">Incentive Structure</h3>
                    
                    <div className="space-y-3">
                      <div className="rounded-lg border bg-accent/30 p-3">
                        <div className="font-medium">AQL Pass Rate 98-100%</div>
                        <div className="text-sm text-muted-foreground">$5.00 incentive per day</div>
                      </div>
                      
                      <div className="rounded-lg border bg-accent/20 p-3">
                        <div className="font-medium">AQL Pass Rate 95-97%</div>
                        <div className="text-sm text-muted-foreground">$3.00 incentive per day</div>
                      </div>
                      
                      <div className="rounded-lg border bg-accent/10 p-3">
                        <div className="font-medium">AQL Pass Rate 90-94%</div>
                        <div className="text-sm text-muted-foreground">$1.50 incentive per day</div>
                      </div>
                      
                      <div className="rounded-lg border p-3">
                        <div className="font-medium">AQL Pass Rate < 90%</div>
                        <div className="text-sm text-muted-foreground">No incentive</div>
                      </div>
                    </div>
                    
                    <div className="mt-4 p-3 rounded-lg bg-primary/10 border-primary/20 border">
                      <h4 className="font-medium mb-1">Current Line Incentive Status</h4>
                      <div className="flex items-center justify-between">
                        <div>Pass Rate: <span className="font-bold">92%</span></div>
                        <Badge className="bg-green-500/90">$1.50 per operator</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="reports" className="mt-4">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle>Quality Reports</CardTitle>
                <CardDescription>
                  Summary of quality performance metrics and AQL results
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <Card className="flex-1 shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">First AQL Pass Rate</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">95%</div>
                      </CardContent>
                    </Card>
                    
                    <Card className="flex-1 shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Second AQL Pass Rate</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">98%</div>
                      </CardContent>
                    </Card>
                    
                    <Card className="flex-1 shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Incentive Payout</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">$245.50</div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="rounded-lg border p-4">
                    <h3 className="text-lg font-medium mb-3">Quality Trend Analysis</h3>
                    <p className="text-muted-foreground mb-4">
                      The quality has shown significant improvement over the last 4 weeks.
                      Inline defect detection has increased by 15%, leading to fewer issues
                      reaching the final AQL stage.
                    </p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-3 bg-accent/20 rounded-lg">
                        <div className="text-sm text-muted-foreground">Defects Found</div>
                        <div className="text-xl font-bold">432</div>
                      </div>
                      <div className="p-3 bg-accent/20 rounded-lg">
                        <div className="text-sm text-muted-foreground">Rework Rate</div>
                        <div className="text-xl font-bold">3.2%</div>
                      </div>
                      <div className="p-3 bg-accent/20 rounded-lg">
                        <div className="text-sm text-muted-foreground">Rejection Rate</div>
                        <div className="text-xl font-bold">0.8%</div>
                      </div>
                      <div className="p-3 bg-accent/20 rounded-lg">
                        <div className="text-sm text-muted-foreground">On-time Delivery</div>
                        <div className="text-xl font-bold">99.5%</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
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
