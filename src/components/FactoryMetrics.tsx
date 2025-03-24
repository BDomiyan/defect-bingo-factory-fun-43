
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
import { Progress } from "@/components/ui/progress";
import { Calendar, Printer, FileSpreadsheet, BarChart3, ArrowUpRight, ArrowDownRight, Cog } from "lucide-react";
import FactoryAnalyticsTable from "@/components/FactoryAnalyticsTable";
import RealTimeMetricsCard from "@/components/RealTimeMetricsCard";
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useDefectSync } from '@/hooks/use-defect-sync';
import { format } from 'date-fns';

const FactoryMetrics = () => {
  const [activeTab, setActiveTab] = useState("production");
  const [currentDate] = useState(new Date());
  const { recentDefects, defectsByFactory, defectsByLine, totalDefects, verifiedDefects, rejectedDefects, reworkedDefects, getTopDefectType, getTopGarmentPart } = useDefectSync();
  const [incentiveRules, setIncentiveRules] = useLocalStorage('incentive-rules', {
    excellent: { rate: 5.00, threshold: 98 },
    good: { rate: 3.00, threshold: 95 },
    average: { rate: 1.50, threshold: 90 },
    poor: { rate: 0.00, threshold: 0 }
  });
  const [editingRules, setEditingRules] = useState(false);
  const [tempRules, setTempRules] = useState(incentiveRules);

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
    return Math.round((rejectedDefects / totalDefects) * 100) / 100;
  };

  const calculateReworkRate = () => {
    if (recentDefects.length === 0) return 0;
    return Math.round((reworkedDefects / totalDefects) * 100) / 100;
  };

  const calculateEfficiency = () => {
    const total = totalDefects;
    if (total === 0) return 100;
    const fixed = reworkedDefects;
    return Math.round(((total - fixed) / total) * 100);
  };

  const calculateAQLPassRate = () => {
    if (totalDefects === 0) return 100;
    const failedItems = rejectedDefects;
    return Math.round(((totalDefects - failedItems) / totalDefects) * 100);
  };

  const getCurrentIncentiveRate = () => {
    const passRate = calculateAQLPassRate();
    if (passRate >= incentiveRules.excellent.threshold) return incentiveRules.excellent.rate;
    if (passRate >= incentiveRules.good.threshold) return incentiveRules.good.rate;
    if (passRate >= incentiveRules.average.threshold) return incentiveRules.average.rate;
    return incentiveRules.poor.rate;
  };

  // Create source data for metrics cards
  const metricsData = {
    defectRate: calculateDefectRate(),
    rejectRate: calculateRejectRate(),
    reworkRate: calculateReworkRate(),
    totalDefects: totalDefects,
    factoryCount: defectsByFactory.length,
    efficiency: calculateEfficiency(),
    aqlPassRate: calculateAQLPassRate(),
    incentiveRate: getCurrentIncentiveRate()
  };

  const handleSaveIncentiveRules = () => {
    setIncentiveRules(tempRules);
    setEditingRules(false);
  };

  // Create efficiency tab content with progress bars
  const renderEfficiencyContent = () => {
    const plantEfficiencies = defectsByFactory.map(factory => {
      const total = factory.defects.length;
      const reworked = factory.defects.filter(d => d.reworked).length;
      const efficiency = total === 0 ? 100 : Math.round(((total - reworked) / total) * 100);
      
      return {
        id: factory.id,
        name: factory.name,
        efficiency,
        defectCount: total
      };
    });

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Plant Efficiency Metrics</h3>
          <div className="text-sm text-muted-foreground">
            Overall efficiency: <span className="font-bold">{calculateEfficiency()}%</span>
          </div>
        </div>
        
        <div className="space-y-4">
          {plantEfficiencies.length > 0 ? (
            plantEfficiencies.map(plant => (
              <div key={plant.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="font-medium">{plant.name}</div>
                  <div className="text-sm">
                    {plant.efficiency}% <span className="text-muted-foreground">({plant.defectCount} defects)</span>
                  </div>
                </div>
                <Progress value={plant.efficiency} className="h-2" />
              </div>
            ))
          ) : (
            <div className="text-center p-6 text-muted-foreground">
              No plant data available
            </div>
          )}
        </div>
        
        <div className="bg-muted/30 p-4 rounded-lg">
          <h4 className="font-medium mb-2">Efficiency Calculation</h4>
          <p className="text-sm text-muted-foreground">
            Efficiency is calculated based on the ratio of successfully processed items to total items.
            Lower rework rates indicate higher efficiency.
          </p>
        </div>
      </div>
    );
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
                      <div className="text-2xl font-bold">{totalDefects}</div>
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
                      <div className="text-2xl font-bold">{totalDefects > 0 ? (100 - calculateRejectRate() * 100).toFixed(1) : "100.0"}%</div>
                      <div className="flex items-center text-sm text-green-600">
                        <ArrowUpRight className="h-4 w-4 mr-1" />
                        +2%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-4">Top Defects by Plant</h3>
                
                <div className="space-y-4">
                  {defectsByFactory.map(factory => {
                    // Count defects by type for this factory
                    const typeCounts = {} as Record<string, number>;
                    factory.defects.forEach(d => {
                      const typeName = d.defectType.name;
                      typeCounts[typeName] = (typeCounts[typeName] || 0) + 1;
                    });
                    
                    // Find top defect type
                    let topType = 'None';
                    let topCount = 0;
                    
                    Object.entries(typeCounts).forEach(([type, count]) => {
                      if (count > topCount) {
                        topType = type;
                        topCount = count;
                      }
                    });
                    
                    return (
                      <div key={factory.id} className="border rounded-lg p-3">
                        <div className="flex justify-between items-center mb-2">
                          <div className="font-medium">{factory.name}</div>
                          <Badge variant="outline">{factory.defects.length} defects</Badge>
                        </div>
                        
                        <div className="text-sm">
                          <span className="text-muted-foreground">Top defect: </span>
                          <span className="font-medium">{topType} ({topCount})</span>
                        </div>
                        
                        <div className="mt-2">
                          <div className="text-sm text-muted-foreground mb-1">Defect distribution</div>
                          <Progress value={topCount / factory.defects.length * 100} className="h-2" />
                        </div>
                      </div>
                    );
                  })}
                  
                  {defectsByFactory.length === 0 && (
                    <div className="text-center p-4 text-muted-foreground">
                      No quality data available
                    </div>
                  )}
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
              {renderEfficiencyContent()}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FactoryMetrics;
