import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Factory, 
  Users, 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  BarChart, 
  PieChart,
  Layers
} from "lucide-react";
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
  Line
} from 'recharts';
import { cn } from "@/lib/utils";

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
    defectsFound: number;
    efficiency: number;
  }[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

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
    operators: [
      { id: 'op1', name: 'Elena Rodriguez', line: 'L1', defectsFound: 23, efficiency: 94 },
      { id: 'op2', name: 'Michael Chen', line: 'L2', defectsFound: 31, efficiency: 88 },
      { id: 'op3', name: 'Aisha Patel', line: 'L1', defectsFound: 18, efficiency: 91 },
      { id: 'op4', name: 'James Wilson', line: 'L3', defectsFound: 29, efficiency: 86 },
      { id: 'op5', name: 'Luis Gomez', line: 'L3', defectsFound: 35, efficiency: 92 }
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
    operators: [
      { id: 'op6', name: 'Sarah Johnson', line: 'L1', defectsFound: 19, efficiency: 92 },
      { id: 'op7', name: 'David Kim', line: 'L2', defectsFound: 27, efficiency: 89 },
      { id: 'op8', name: 'Maria Garcia', line: 'L3', defectsFound: 15, efficiency: 94 },
      { id: 'op9', name: 'Robert Singh', line: 'L4', defectsFound: 25, efficiency: 87 },
      { id: 'op10', name: 'Sophia Lee', line: 'L2', defectsFound: 31, efficiency: 90 }
    ]
  }
];

const FactoryMetrics: React.FC = () => {
  const [selectedFactory, setSelectedFactory] = useState<string>(demoFactoryData[0].id);
  const [selectedLine, setSelectedLine] = useState<string>('all');
  
  const factoryData = demoFactoryData.find(f => f.id === selectedFactory) || demoFactoryData[0];
  
  const filteredOperators = selectedLine === 'all' 
    ? factoryData.operators 
    : factoryData.operators.filter(op => op.line === selectedLine);
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-gradient">Factory Metrics</h2>
          <p className="text-muted-foreground">Real-time defect analytics and quality metrics</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={selectedFactory} onValueChange={setSelectedFactory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select factory" />
            </SelectTrigger>
            <SelectContent>
              {demoFactoryData.map(factory => (
                <SelectItem key={factory.id} value={factory.id}>
                  {factory.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <CardTitle className="text-sm font-medium">
                Total Defects
              </CardTitle>
              <CardDescription>Factory-wide</CardDescription>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <Factory className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{factoryData.defectCount}</div>
            <div className="mt-1 flex items-center text-xs text-muted-foreground">
              {factoryData.trend === 'up' ? (
                <TrendingUp className="mr-1 h-3 w-3 text-red-500" />
              ) : factoryData.trend === 'down' ? (
                <TrendingDown className="mr-1 h-3 w-3 text-green-500" />
              ) : (
                <Activity className="mr-1 h-3 w-3 text-yellow-500" />
              )}
              <span className={`mr-1 ${
                factoryData.trend === 'up' ? 'text-red-500' : 
                factoryData.trend === 'down' ? 'text-green-500' : 
                'text-yellow-500'
              }`}>
                {factoryData.trend === 'up' ? '+5.2%' : 
                 factoryData.trend === 'down' ? '-3.1%' : 
                 '±0.8%'}
              </span>
              from last week
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <CardTitle className="text-sm font-medium">
                Rework Rate
              </CardTitle>
              <CardDescription>Average percentage</CardDescription>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <Layers className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{factoryData.reworkPercentage}%</div>
            <Progress value={factoryData.reworkPercentage * 10} className="h-2 mt-2" />
          </CardContent>
        </Card>
        
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <CardTitle className="text-sm font-medium">
                AQL Pass Rate
              </CardTitle>
              <CardDescription>Current month</CardDescription>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <BarChart className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{factoryData.aqlPassRate}%</div>
            <Progress 
              value={factoryData.aqlPassRate} 
              className={cn("h-2 mt-2", factoryData.aqlPassRate > 90 ? "bg-green-600" : "bg-amber-500")} 
            />
          </CardContent>
        </Card>
        
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <CardTitle className="text-sm font-medium">
                Active Operators
              </CardTitle>
              <CardDescription>Across all lines</CardDescription>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <Users className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {factoryData.lineData.reduce((sum, line) => sum + line.operators, 0)}
            </div>
            <div className="mt-1 flex flex-wrap gap-1">
              {factoryData.lineData.map(line => (
                <Badge key={line.id} variant="outline" className="text-xs">
                  {line.name}: {line.operators}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="overview" className="mt-6">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="defect-analysis">Defect Analysis</TabsTrigger>
          <TabsTrigger value="operator-performance">Operator Performance</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Weekly Defect Trend</CardTitle>
                <CardDescription>Defects and rework over the past week</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={factoryData.weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="defects" stroke="#8884d8" />
                    <Line type="monotone" dataKey="rework" stroke="#82ca9d" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Line Performance</CardTitle>
                <CardDescription>Defects by production line</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={factoryData.lineData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="defects" fill="#8884d8" name="Defects" />
                    <Bar dataKey="reworkRate" fill="#82ca9d" name="Rework %" />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="defect-analysis" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Defects by Garment Part</CardTitle>
                <CardDescription>Distribution across different garment components</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={factoryData.defectByPart}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {factoryData.defectByPart.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Defects by Type</CardTitle>
                <CardDescription>Most common defect categories</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={factoryData.defectByType}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {factoryData.defectByType.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
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
                {factoryData.lineData.map(line => (
                  <SelectItem key={line.id} value={line.id}>
                    {line.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-3">
            {filteredOperators.map(operator => (
              <Card key={operator.id} className="shadow-sm">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div>
                      <div className="font-medium">{operator.name}</div>
                      <div className="text-sm text-muted-foreground">
                        <Badge variant="outline" className="mr-2">Line {operator.line}</Badge>
                        <span>ID: {operator.id}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Defects Found</div>
                        <div className="font-medium">{operator.defectsFound}</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Efficiency</div>
                        <div className="font-medium">{operator.efficiency}%</div>
                      </div>
                      
                      <div className="w-24">
                        <Progress 
                          value={operator.efficiency} 
                          className={cn(
                            "h-2",
                            operator.efficiency >= 90 ? "bg-green-500" :
                            operator.efficiency >= 80 ? "bg-amber-500" :
                            "bg-red-500"
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FactoryMetrics;
