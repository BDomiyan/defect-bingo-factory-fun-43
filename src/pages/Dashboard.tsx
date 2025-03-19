
import { useState, useEffect } from 'react';
import { Layout, Calendar, LineChart, BarChart3, PieChart, ArrowUpRight, Download, Trophy } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
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

// Initial data for charts if no user data exists
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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A569BD', '#D3D3D3'];

const Dashboard = () => {
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year'>('week');
  
  // Use localStorage to persist user data
  const [players, setPlayers] = useLocalStorage<Player[]>('defect-bingo-players', defaultPlayers);
  const [lineData, setLineData] = useLocalStorage('defect-bingo-line-data', defaultLineData);
  const [barData, setBarData] = useLocalStorage('defect-bingo-bar-data', defaultBarData);
  const [pieData, setPieData] = useLocalStorage('defect-bingo-pie-data', defaultPieData);
  
  // Calculate statistics based on user data
  const totalDefects = players.reduce((sum, player) => sum + player.defectsFound, 0);
  const avgDefectsPerPlayer = players.length ? Math.round(totalDefects / players.length) : 0;
  const topPlayer = [...players].sort((a, b) => b.score - a.score)[0] || defaultPlayers[0];
  
  // Sample function to add demo data - would be replaced with actual user actions
  const addDemoData = () => {
    // Generate random data
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
    
    // Update demo players
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
    
    // Update the state
    setLineData(newLineData);
    setBarData(newBarData);
    setPieData(newPieData);
    setPlayers(demoPlayers);
    
    toast.success('Demo data loaded', {
      description: 'Dashboard has been populated with sample data'
    });
  };
  
  // Reset data to defaults
  const resetData = () => {
    setLineData(defaultLineData);
    setBarData(defaultBarData);
    setPieData(defaultPieData);
    setPlayers(defaultPlayers);
    
    toast.info('Data reset', {
      description: 'All dashboard data has been reset to defaults'
    });
  };
  
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Quality Dashboard</h1>
            <p className="text-muted-foreground">
              Monitor defect trends and quality performance
            </p>
          </div>
          
          <div className="flex items-center gap-2">
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
        
        {/* Analytics cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="space-y-1">
                <CardTitle className="text-sm font-medium">
                  Total Defects Found
                </CardTitle>
                <CardDescription>This {period}</CardDescription>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <Layout className="h-4 w-4 text-primary" />
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
          
          <Card>
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
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="space-y-1">
                <CardTitle className="text-sm font-medium">
                  Avg. Defects Per Player
                </CardTitle>
                <CardDescription>All time</CardDescription>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <LineChart className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgDefectsPerPlayer}</div>
              <div className="mt-1 flex items-center text-xs text-muted-foreground">
                <ArrowUpRight className="mr-1 h-3 w-3 text-green-500" />
                <span className="text-green-500 mr-1">+5.2%</span>
                from last {period}
              </div>
            </CardContent>
          </Card>
          
          <Card>
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
        
        {/* Charts */}
        <Tabs defaultValue="trends" className="mt-6">
          <div className="flex justify-between items-center">
            <TabsList>
              <TabsTrigger value="trends">Trends</TabsTrigger>
              <TabsTrigger value="garments">Garment Parts</TabsTrigger>
              <TabsTrigger value="defects">Defect Types</TabsTrigger>
            </TabsList>
            
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
          
          <TabsContent value="trends" className="mt-4">
            <Card>
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
          </TabsContent>
          
          <TabsContent value="garments" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Top Defect Locations</CardTitle>
                <CardDescription>
                  Garment parts with the most detected defects
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
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
          </TabsContent>
          
          <TabsContent value="defects" className="mt-4">
            <Card>
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
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={130}
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
          </TabsContent>
        </Tabs>
        
        {/* Info cards */}
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Top Performer</CardTitle>
              <CardDescription>
                This week's quality champion
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border bg-primary/10">
                  <Trophy className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-lg font-semibold">{topPlayer.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {topPlayer.defectsFound} defects found • {topPlayer.bingoCount} bingos
                  </p>
                  <div className="mt-4 flex gap-2">
                    <div className="rounded-md bg-accent/50 px-2 py-1">
                      <p className="text-xs">Score</p>
                      <p className="font-medium">{topPlayer.score}</p>
                    </div>
                    <div className="rounded-md bg-accent/50 px-2 py-1">
                      <p className="text-xs">Awards</p>
                      <p className="font-medium">{topPlayer.score > 0 ? '3' : '0'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Quality Improvement</CardTitle>
              <CardDescription>
                Impact of Defect Bingo on AQL metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">AQL Pass Rate</p>
                    <p className="text-2xl font-bold">{totalDefects > 0 ? '92%' : '0%'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">Previous</p>
                    <p className="text-xl">{totalDefects > 0 ? '84%' : '0%'}</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-700">
                    <ArrowUpRight className="h-4 w-4" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Defects found early</span>
                    <span className="font-medium">{totalDefects > 0 ? '+35%' : '0%'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Quality awareness</span>
                    <span className="font-medium">{totalDefects > 0 ? '+42%' : '0%'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Team engagement</span>
                    <span className="font-medium">{totalDefects > 0 ? '+28%' : '0%'}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
