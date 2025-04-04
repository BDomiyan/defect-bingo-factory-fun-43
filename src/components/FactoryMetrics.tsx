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
import { Calendar, Printer, FileSpreadsheet, BarChart3, ArrowUpRight, ArrowDownRight, Cog, Loader2 } from "lucide-react";
import FactoryAnalyticsTable from "@/components/FactoryAnalyticsTable";
import RealTimeMetricsCard from "@/components/RealTimeMetricsCard";
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useDefectSync } from '@/hooks/use-defect-sync';
import { format } from 'date-fns';
import { useDefects } from '@/lib/supabase/hooks';

interface FactoryMetricsProps {
  plants?: { id: string; name: string; lines: string[] }[];
}

const FactoryMetrics: React.FC<FactoryMetricsProps> = ({ plants = [] }) => {
  const [activeTab, setActiveTab] = useState("production");
  const [currentDate] = useState(new Date());
  
  // Use both defect sync (for compatibility) and Supabase hooks for real data
  const { defects, loading: loadingDefects } = useDefects();
  
  const { 
    recentDefects, 
    defectsByFactory, 
    defectsByLine, 
    totalDefects: localTotalDefects, 
    verifiedDefects: localVerifiedDefects, 
    rejectedDefects: localRejectedDefects, 
    reworkedDefects: localReworkedDefects, 
    getTopDefectType, 
    getTopGarmentPart,
    getAllowedPlants,
    getPlantStats
  } = useDefectSync();
  
  // Use Supabase data for real metrics
  const totalDefects = defects.length || localTotalDefects;
  const verifiedDefects = defects.filter(d => d.validated).length || localVerifiedDefects;
  const rejectedDefects = defects.filter(d => d.validated_by && !d.validated).length || localRejectedDefects;
  // Since 'reworked' property doesn't exist in defects, use localReworkedDefects or a default
  const reworkedDefects = localReworkedDefects || 0; // Use local data or default to 0
  
  const [incentiveRules, setIncentiveRules] = useLocalStorage('incentive-rules', {
    excellent: { rate: 5.00, threshold: 98 },
    good: { rate: 3.00, threshold: 95 },
    average: { rate: 1.50, threshold: 90 },
    poor: { rate: 0.00, threshold: 0 }
  });
  
  const [editingRules, setEditingRules] = useState(false);
  const [tempRules, setTempRules] = useState(incentiveRules);
  
  // Use plants from props if available, otherwise use getAllowedPlants
  const availablePlants = plants.length > 0 
    ? plants.map(p => p.id) 
    : getAllowedPlants();
    
  const [plantFilters, setPlantFilters] = useState<string[]>(availablePlants);

  // Update plant filters when plants change
  useEffect(() => {
    if (plants.length > 0) {
      setPlantFilters(plants.map(p => p.id));
    }
  }, [plants]);

  // Toggle plant filter
  const togglePlantFilter = (plantId: string) => {
    if (plantFilters.includes(plantId)) {
      setPlantFilters(plantFilters.filter(id => id !== plantId));
    } else {
      setPlantFilters([...plantFilters, plantId]);
    }
  };

  // Calculate metrics based on Supabase defects
  const calculateDefectRate = () => {
    if (defects.length === 0) return 0;
    
    // Count defects created today
    const todayDefects = defects.filter(d => {
      const defectDate = new Date(d.created_at);
      const today = new Date();
      return defectDate.getDate() === today.getDate() && 
             defectDate.getMonth() === today.getMonth() && 
             defectDate.getFullYear() === today.getFullYear();
    });
    
    return todayDefects.length;
  };

  const calculateRejectRate = () => {
    if (totalDefects === 0) return "0";
    return (rejectedDefects / totalDefects).toFixed(2);
  };

  const calculateReworkRate = () => {
    if (totalDefects === 0) return "0";
    return (reworkedDefects / totalDefects).toFixed(2);
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

  // Process Supabase defects for factory analysis
  const processDefectsByFactory = () => {
    if (defects.length === 0) return [];
    
    return defects.reduce((acc, defect) => {
      // Find factory in accumulator, or create it
      const factoryId = defect.factory_id;
      const factory = acc.find(f => f.id === factoryId);
      
      // Find the plant name from the plants array
      const plantName = plants.find(p => p.id === factoryId)?.name || `Plant ${factoryId}`;
      
      if (factory) {
        factory.defects.push(defect);
      } else {
        acc.push({
          id: factoryId,
          name: plantName,
          defects: [defect],
        });
      }
      return acc;
    }, [] as Array<{id: string, name: string, defects: any[]}>);
  };
  
  // Get processed defects by factory
  const supabaseDefectsByFactory = processDefectsByFactory();

  // Create source data for metrics cards
  const metricsData = {
    defectRate: calculateDefectRate(),
    rejectRate: calculateRejectRate(),
    reworkRate: calculateReworkRate(),
    totalDefects: totalDefects,
    factoryCount: supabaseDefectsByFactory.length || defectsByFactory.length,
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
    // Use Supabase data for factories first, fall back to local data
    const dataSource = supabaseDefectsByFactory.length > 0 ? supabaseDefectsByFactory : defectsByFactory;
    
    // Filter factories based on plant filters
    const filteredFactories = dataSource.filter(factory => 
      plantFilters.includes(factory.id)
    );
    
    const plantEfficiencies = filteredFactories.map(factory => {
      const total = factory.defects.length;
      // Check if defect has reworked property before using it
      const reworked = factory.defects.filter(d => d.reworked || false).length;
      const efficiency = total === 0 ? 100 : Math.round(((total - reworked) / total) * 100);
      
      return {
        id: factory.id,
        name: factory.name,
        efficiency,
        defectCount: total,
        // Add required properties for FactoryAnalyticsTable
        line: '',
        department: '',
        role: '',
        defectsFound: total,
        defectsFixed: reworked,
        reworkRate: total === 0 ? 0 : Math.round((reworked / total) * 100),
        status: efficiency >= 95 ? 'excellent' as const : 
                efficiency >= 85 ? 'good' as const : 
                efficiency >= 75 ? 'average' as const : 'poor' as const
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
        
        <div className="flex flex-wrap gap-2 mb-4">
          {plants.map(plant => (
            <Button 
              key={plant.id}
              variant={plantFilters.includes(plant.id) ? "default" : "outline"}
              size="sm"
              onClick={() => togglePlantFilter(plant.id)}
            >
              {plant.name}
            </Button>
          ))}
        </div>
        
        {plantEfficiencies.length > 0 ? (
          <div className="space-y-4">
            {plantEfficiencies.map(plant => (
              <div key={plant.id} className="space-y-1">
                <div className="flex justify-between items-center">
                  <div className="font-medium">{plant.name}</div>
                  <div className="text-sm">{plant.efficiency}% efficient</div>
                </div>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-full ${plant.efficiency > 90 ? 'bg-green-500' : plant.efficiency > 70 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${plant.efficiency}%` }}
                  ></div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Defects: {plant.defectCount} · Reworked: {plant.defectCount - Math.round(plant.defectCount * (plant.efficiency / 100))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 text-center text-muted-foreground">
            No efficiency data available for the selected plants.
          </div>
        )}
        
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-2">Efficiency Breakdown</h4>
          <FactoryAnalyticsTable 
            data={plantEfficiencies} 
            title="Plant Efficiency Analytics"
            description="Quality metrics for each plant"
          />
        </div>
      </div>
    );
  };

  if (loadingDefects && plants.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading factory metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gradient">Factory Metrics</h2>
          <p className="text-muted-foreground">
            Monitor factory performance and quality metrics
          </p>
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
      
      <div className="flex flex-wrap gap-2 mb-4">
        {plants.map(plant => (
          <Button 
            key={plant.id}
            variant={plantFilters.includes(plant.id) ? "default" : "outline"}
            size="sm"
            onClick={() => togglePlantFilter(plant.id)}
          >
            {plant.name}
          </Button>
        ))}
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
            {supabaseDefectsByFactory.filter(factory => plantFilters.includes(factory.id)).length > 0 ? (
              supabaseDefectsByFactory
                .filter(factory => plantFilters.includes(factory.id))
                .map(factory => (
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
                            <p className="text-lg font-semibold">
                              {factory.defects[0].defect_type?.name || 
                               (typeof factory.defects[0].defect_type === 'number' ? 
                                `Type ${factory.defects[0].defect_type}` : 
                                'Unknown')}
                            </p>
                          ) : (
                            <p className="text-lg font-semibold">None</p>
                          )}
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-muted-foreground">Lines Affected</p>
                          <p className="text-lg font-semibold">
                            {new Set(factory.defects.map(d => d.line_number)).size}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-2">
                        <p className="text-sm font-medium text-muted-foreground mb-1">Defect Distribution</p>
                        <div className="h-2 bg-muted overflow-hidden rounded-full">
                          <div 
                            className="h-full bg-primary"
                            style={{ width: `${Math.min(100, (factory.defects.length / Math.max(1, totalDefects)) * 100)}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>0</span>
                          <span>{totalDefects}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
            ) : (
              <div className="md:col-span-2 lg:col-span-3 text-center p-6 text-muted-foreground">
                No production data available for the selected plants.
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="quality" className="space-y-4">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Quality Analytics</CardTitle>
              <CardDescription>
                Analyze quality metrics and defect trends
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
                      <div className="flex items-center text-xs text-green-600">
                        <ArrowUpRight className="mr-1 h-3 w-3" />
                        +12%
                      </div>
                    </div>
                  </div>
                  
                  <div className="border rounded-md p-4">
                    <div className="text-sm text-muted-foreground mb-1">Defect Rate</div>
                    <div className="flex justify-between">
                      <div className="text-2xl font-bold">{(parseFloat(calculateRejectRate()) * 100).toFixed(1)}%</div>
                      <div className="flex items-center text-xs text-red-600">
                        <ArrowDownRight className="mr-1 h-3 w-3" />
                        -3%
                      </div>
                    </div>
                  </div>
                  
                  <div className="border rounded-md p-4">
                    <div className="text-sm text-muted-foreground mb-1">AQL Pass Rate</div>
                    <div className="flex justify-between">
                      <div className="text-2xl font-bold">{calculateAQLPassRate()}%</div>
                      <div className="flex items-center text-xs text-green-600">
                        <ArrowUpRight className="mr-1 h-3 w-3" />
                        +5%
                      </div>
                    </div>
                  </div>
                </div>
                
                <h3 className="text-lg font-medium mt-6 mb-4">Plant Quality Reports</h3>
                
                <div className="space-y-4">
                  {supabaseDefectsByFactory
                    .filter(factory => plantFilters.includes(factory.id))
                    .map(factory => {
                      // Count defects by type for this factory
                      const defectsByType: Record<string, number> = factory.defects.reduce((acc: Record<string, number>, defect) => {
                        // Get the defect type - which might be a number, a string, or an object
                        const type = defect.defect_type;
                        let typeName = 'Unknown';
                        
                        if (type) {
                          if (typeof type === 'object' && type !== null && type.name) {
                            typeName = type.name;
                          } else if (typeof type === 'number') {
                            typeName = `Type ${type}`;
                          } else {
                            typeName = String(type);
                          }
                        }
                        
                        acc[typeName] = (acc[typeName] || 0) + 1;
                        return acc;
                      }, {});
                      
                      // Get the top defect type
                      let topType = 'None';
                      let topCount = 0;
                      
                      Object.entries(defectsByType).forEach(([type, count]) => {
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
                            <Progress value={factory.defects.length > 0 ? topCount / factory.defects.length * 100 : 0} className="h-2" />
                          </div>
                        </div>
                      );
                    })}
                  
                  {supabaseDefectsByFactory.filter(factory => plantFilters.includes(factory.id)).length === 0 && (
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
