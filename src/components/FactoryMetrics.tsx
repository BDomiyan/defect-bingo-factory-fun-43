
import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar, Printer, FileSpreadsheet, BarChart3, ArrowUpRight, ArrowDownRight } from "lucide-react";
import FactoryAnalyticsTable from "@/components/FactoryAnalyticsTable";
import RealTimeMetricsCard from "@/components/RealTimeMetricsCard";
import { useLocalStorage } from '@/hooks/use-local-storage';
import { format } from 'date-fns';

interface RecordedDefect {
  id: string;
  defectType: any;
  garmentPart: any;
  timestamp: string;
  operatorId: string;
  operatorName: string;
  factoryId: string;
  lineNumber: string;
  status: 'pending' | 'verified' | 'rejected';
  reworked: boolean;
  reworkTime?: number;
}

const FactoryMetrics = () => {
  const [activeTab, setActiveTab] = useState("production");
  const [currentDate] = useState(new Date());
  const [recentDefects] = useLocalStorage<RecordedDefect[]>('recent-defects', []);

  // Calculate metrics based on recorded defects
  const calculateDefectRate = () => {
    if (recentDefects.length === 0) return 0;
    const todayDefects = recentDefects.filter(d => {
      const defectDate = new Date(d.timestamp);
      const today = new Date();
      return defectDate.getDate() === today.getDate() && 
             defectDate.getMonth() === today.getMonth() && 
             defectDate.getFullYear() === today.getFullYear();
    });
    return todayDefects.length;
  };

  const calculateRejectRate = () => {
    if (recentDefects.length === 0) return 0;
    const rejected = recentDefects.filter(d => d.status === 'rejected');
    return Math.round((rejected.length / recentDefects.length) * 100) / 100;
  };

  const calculateReworkRate = () => {
    if (recentDefects.length === 0) return 0;
    const reworked = recentDefects.filter(d => d.reworked);
    return Math.round((reworked.length / recentDefects.length) * 100) / 100;
  };

  // Group defects by factory
  const defectsByFactory = recentDefects.reduce((acc, defect) => {
    const factory = acc.find(f => f.id === defect.factoryId);
    if (factory) {
      factory.defects.push(defect);
    } else {
      acc.push({
        id: defect.factoryId,
        name: `Factory ${defect.factoryId}`,
        defects: [defect],
      });
    }
    return acc;
  }, [] as Array<{id: string, name: string, defects: RecordedDefect[]}>);

  // Create source data for metrics cards
  const metricsData = {
    defectRate: calculateDefectRate(),
    rejectRate: calculateRejectRate(),
    reworkRate: calculateReworkRate(),
    totalDefects: recentDefects.length,
    factoryCount: defectsByFactory.length
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gradient">Factory Metrics</h2>
          <p className="text-muted-foreground">Monitor factory performance and quality metrics</p>
        </div>
        <div className="flex items-center gap-2 mt-2 sm:mt-0">
          <Button variant="outline" size="sm" className="h-9 gap-1">
            <Calendar className="h-4 w-4" />
            <span>{format(currentDate, 'MMMM yyyy')}</span>
          </Button>
          <Button variant="outline" size="sm" className="h-9 gap-1">
            <Printer className="h-4 w-4" />
            <span>Print</span>
          </Button>
          <Button variant="outline" size="sm" className="h-9 gap-1">
            <FileSpreadsheet className="h-4 w-4" />
            <span>Export</span>
          </Button>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <RealTimeMetricsCard
          title="Daily Defect Count"
          description="Defects found today"
          metricKey="defectRate"
          sourceData={metricsData}
          icon={<BarChart3 className="h-4 w-4 text-primary" />}
          defaultMetric={{
            id: 'defect-rate',
            name: 'Defect Count',
            value: 0,
            unit: '',
            target: 10,
            status: 'success',
            trend: 'stable',
            trendValue: 0,
            lastUpdated: new Date().toISOString(),
          }}
        />
        
        <RealTimeMetricsCard
          title="Rejection Rate"
          description="Defects rejected vs total"
          metricKey="rejectRate"
          sourceData={metricsData}
          icon={<ArrowDownRight className="h-4 w-4 text-primary" />}
          defaultMetric={{
            id: 'reject-rate',
            name: 'Rejection Rate',
            value: 0,
            unit: '%',
            target: 5,
            status: 'success',
            trend: 'stable',
            trendValue: 0,
            lastUpdated: new Date().toISOString(),
          }}
        />
        
        <RealTimeMetricsCard
          title="Rework Rate"
          description="Items requiring rework"
          metricKey="reworkRate"
          sourceData={metricsData}
          icon={<ArrowUpRight className="h-4 w-4 text-primary" />}
          defaultMetric={{
            id: 'rework-rate',
            name: 'Rework Rate',
            value: 0,
            unit: '%',
            target: 3,
            status: 'success',
            trend: 'stable',
            trendValue: 0,
            lastUpdated: new Date().toISOString(),
          }}
        />
        
        <RealTimeMetricsCard
          title="Total QC Checks"
          description="All quality checks today"
          metricKey="totalDefects"
          sourceData={metricsData}
          icon={<BarChart3 className="h-4 w-4 text-primary" />}
          defaultMetric={{
            id: 'total-checks',
            name: 'QC Checks',
            value: 0,
            unit: '',
            target: 100,
            status: 'warning',
            trend: 'up',
            trendValue: 0,
            lastUpdated: new Date().toISOString(),
          }}
        />
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-3 w-full sm:w-auto sm:inline-flex">
          <TabsTrigger value="production">Production</TabsTrigger>
          <TabsTrigger value="quality">Quality</TabsTrigger>
          <TabsTrigger value="efficiency">Efficiency</TabsTrigger>
        </TabsList>
        
        <TabsContent value="production" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {defectsByFactory.length > 0 ? (
              defectsByFactory.map(factory => (
                <Card key={factory.id} className="shadow-sm">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle>{factory.name}</CardTitle>
                      <Badge variant="outline">{factory.defects.length} Defects</Badge>
                    </div>
                    <CardDescription>
                      Production metrics for {factory.name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Top Defect</p>
                        {factory.defects.length > 0 ? (
                          <p className="text-lg font-semibold">{factory.defects[0].defectType.name}</p>
                        ) : (
                          <p className="text-lg font-semibold">None</p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Lines Affected</p>
                        <p className="text-lg font-semibold">
                          {new Set(factory.defects.map(d => d.lineNumber)).size}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="col-span-full shadow-sm">
                <CardHeader>
                  <CardTitle>No Production Data</CardTitle>
                  <CardDescription>Record defects to see factory metrics</CardDescription>
                </CardHeader>
                <CardContent className="text-center py-6">
                  <p className="text-muted-foreground">No defects have been recorded yet. Start recording defects to see factory metrics.</p>
                </CardContent>
              </Card>
            )}
          </div>
          
          <FactoryAnalyticsTable defects={recentDefects} />
        </TabsContent>
        
        <TabsContent value="quality" className="space-y-4">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Quality Metrics</CardTitle>
              <CardDescription>
                Monitor quality performance and defect rates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="start-date">Start Date</Label>
                  <Input type="date" id="start-date" />
                </div>
                <div className="flex-1 space-y-2">
                  <Label htmlFor="end-date">End Date</Label>
                  <Input type="date" id="end-date" />
                </div>
                <div className="flex items-end">
                  <Button>Filter</Button>
                </div>
              </div>
              
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-4">Quality Summary</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="border rounded-md p-4">
                    <div className="text-sm text-muted-foreground mb-1">Total Defects</div>
                    <div className="flex justify-between">
                      <div className="text-2xl font-bold">{recentDefects.length}</div>
                      <div className="flex items-center text-sm text-green-600">
                        <ArrowUpRight className="h-4 w-4 mr-1" />
                        +12%
                      </div>
                    </div>
                  </div>
                  
                  <div className="border rounded-md p-4">
                    <div className="text-sm text-muted-foreground mb-1">Defect Rate</div>
                    <div className="flex justify-between">
                      <div className="text-2xl font-bold">{(calculateRejectRate() * 100).toFixed(1)}%</div>
                      <div className="flex items-center text-sm text-red-600">
                        <ArrowDownRight className="h-4 w-4 mr-1" />
                        -3%
                      </div>
                    </div>
                  </div>
                  
                  <div className="border rounded-md p-4">
                    <div className="text-sm text-muted-foreground mb-1">First-Time Pass</div>
                    <div className="flex justify-between">
                      <div className="text-2xl font-bold">{recentDefects.length > 0 ? (100 - calculateRejectRate() * 100).toFixed(1) : "100.0"}%</div>
                      <div className="flex items-center text-sm text-green-600">
                        <ArrowUpRight className="h-4 w-4 mr-1" />
                        +2%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="efficiency" className="space-y-4">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Efficiency Metrics</CardTitle>
              <CardDescription>
                Track factory efficiency and productivity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">Efficiency metrics will be calculated based on defect records.</p>
                <Button>View Detailed Report</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FactoryMetrics;
