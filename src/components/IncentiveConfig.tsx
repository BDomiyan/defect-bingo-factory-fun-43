
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useLocalStorage } from '@/hooks/use-local-storage';
import { toast } from "sonner";
import { Cog, RefreshCcw, ArrowUpRight, Trophy } from "lucide-react";
import { useDefectSync } from '@/hooks/use-defect-sync';

interface IncentiveRule {
  rate: number;
  threshold: number;
}

interface IncentiveRules {
  excellent: IncentiveRule;
  good: IncentiveRule;
  average: IncentiveRule;
  poor: IncentiveRule;
}

const IncentiveConfig = () => {
  const { totalDefects, getDefectsByPlantAndLine } = useDefectSync();
  const [incentiveRules, setIncentiveRules] = useLocalStorage<IncentiveRules>('incentive-rules', {
    excellent: { rate: 5.00, threshold: 98 },
    good: { rate: 3.00, threshold: 95 },
    average: { rate: 1.50, threshold: 90 },
    poor: { rate: 0.00, threshold: 0 }
  });
  
  const [editMode, setEditMode] = useState(false);
  const [tempRules, setTempRules] = useState<IncentiveRules>(incentiveRules);
  
  // Calculate the AQL pass rate for a plant/line
  const calculateAQLPassRate = (plantId: string, lineNumber: string) => {
    const defectsByPlantAndLine = getDefectsByPlantAndLine();
    const defects = defectsByPlantAndLine[plantId]?.[lineNumber] || [];
    
    if (defects.length === 0) return 100;
    
    const rejectedDefects = defects.filter(d => d.status === 'rejected').length;
    return Math.round(((defects.length - rejectedDefects) / defects.length) * 100);
  };
  
  // Get the incentive amount based on the AQL pass rate
  const getIncentiveAmount = (passRate: number) => {
    if (passRate >= incentiveRules.excellent.threshold) return incentiveRules.excellent.rate;
    if (passRate >= incentiveRules.good.threshold) return incentiveRules.good.rate;
    if (passRate >= incentiveRules.average.threshold) return incentiveRules.average.rate;
    return incentiveRules.poor.rate;
  };
  
  // Create example plants and lines for demonstration
  const examplePlants = [
    { id: 'A6', name: 'Plant A6', lines: ['L1', 'L2', 'L3', 'L4'] },
    { id: 'B2', name: 'Plant B2', lines: ['L1', 'L2', 'L3'] },
    { id: 'C4', name: 'Plant C4', lines: ['L1', 'L2', 'L3', 'L4', 'L5'] }
  ];
  
  const handleSaveRules = () => {
    // Validate that thresholds are in descending order
    if (
      tempRules.excellent.threshold <= tempRules.good.threshold ||
      tempRules.good.threshold <= tempRules.average.threshold ||
      tempRules.average.threshold <= tempRules.poor.threshold
    ) {
      toast.error("Invalid threshold values", {
        description: "Thresholds must be in descending order"
      });
      return;
    }
    
    // Validate that rates are in descending order
    if (
      tempRules.excellent.rate < tempRules.good.rate ||
      tempRules.good.rate < tempRules.average.rate ||
      tempRules.average.rate < tempRules.poor.rate
    ) {
      toast.error("Invalid rate values", {
        description: "Incentive rates must be in descending order"
      });
      return;
    }
    
    setIncentiveRules(tempRules);
    setEditMode(false);
    
    toast.success("Incentive rules updated", {
      description: "The new incentive rules have been applied"
    });
  };
  
  const handleReset = () => {
    setTempRules(incentiveRules);
    setEditMode(false);
  };
  
  return (
    <div className="space-y-6">
      <Card className="shadow-md">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle>Incentive Configuration</CardTitle>
            <CardDescription>
              Configure incentive rules based on quality performance
            </CardDescription>
          </div>
          <Button 
            variant={editMode ? "destructive" : "outline"} 
            size="sm"
            onClick={() => {
              if (editMode) {
                handleReset();
              } else {
                setEditMode(true);
              }
            }}
          >
            {editMode ? (
              <>
                <RefreshCcw className="h-4 w-4 mr-1" />
                Cancel
              </>
            ) : (
              <>
                <Cog className="h-4 w-4 mr-1" />
                Edit Rules
              </>
            )}
          </Button>
        </CardHeader>
        <CardContent>
          {editMode ? (
            <>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="excellent-threshold">Excellent Threshold (%)</Label>
                    <Input 
                      id="excellent-threshold" 
                      type="number" 
                      value={tempRules.excellent.threshold}
                      onChange={(e) => setTempRules({
                        ...tempRules,
                        excellent: {
                          ...tempRules.excellent,
                          threshold: Number(e.target.value)
                        }
                      })}
                      min="0"
                      max="100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="excellent-rate">Excellent Rate ($)</Label>
                    <Input 
                      id="excellent-rate" 
                      type="number" 
                      value={tempRules.excellent.rate}
                      onChange={(e) => setTempRules({
                        ...tempRules,
                        excellent: {
                          ...tempRules.excellent,
                          rate: parseFloat(parseFloat(e.target.value).toFixed(2))
                        }
                      })}
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="good-threshold">Good Threshold (%)</Label>
                    <Input 
                      id="good-threshold" 
                      type="number" 
                      value={tempRules.good.threshold}
                      onChange={(e) => setTempRules({
                        ...tempRules,
                        good: {
                          ...tempRules.good,
                          threshold: Number(e.target.value)
                        }
                      })}
                      min="0"
                      max="100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="good-rate">Good Rate ($)</Label>
                    <Input 
                      id="good-rate" 
                      type="number" 
                      value={tempRules.good.rate}
                      onChange={(e) => setTempRules({
                        ...tempRules,
                        good: {
                          ...tempRules.good,
                          rate: parseFloat(parseFloat(e.target.value).toFixed(2))
                        }
                      })}
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="average-threshold">Average Threshold (%)</Label>
                    <Input 
                      id="average-threshold" 
                      type="number" 
                      value={tempRules.average.threshold}
                      onChange={(e) => setTempRules({
                        ...tempRules,
                        average: {
                          ...tempRules.average,
                          threshold: Number(e.target.value)
                        }
                      })}
                      min="0"
                      max="100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="average-rate">Average Rate ($)</Label>
                    <Input 
                      id="average-rate" 
                      type="number" 
                      value={tempRules.average.rate}
                      onChange={(e) => setTempRules({
                        ...tempRules,
                        average: {
                          ...tempRules.average,
                          rate: parseFloat(parseFloat(e.target.value).toFixed(2))
                        }
                      })}
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="poor-threshold">Poor Threshold (%)</Label>
                    <Input 
                      id="poor-threshold" 
                      type="number" 
                      value={tempRules.poor.threshold}
                      onChange={(e) => setTempRules({
                        ...tempRules,
                        poor: {
                          ...tempRules.poor,
                          threshold: Number(e.target.value)
                        }
                      })}
                      min="0"
                      max="100"
                      disabled
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="poor-rate">Poor Rate ($)</Label>
                    <Input 
                      id="poor-rate" 
                      type="number" 
                      value={tempRules.poor.rate}
                      onChange={(e) => setTempRules({
                        ...tempRules,
                        poor: {
                          ...tempRules.poor,
                          rate: parseFloat(parseFloat(e.target.value).toFixed(2))
                        }
                      })}
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end mt-4">
                  <Button onClick={handleSaveRules}>Save Rules</Button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-4">
                <div className="space-y-4">
                  <div className="rounded-lg bg-gradient-to-r from-green-50 to-green-100 p-3 border border-green-200">
                    <div className="flex justify-between items-center mb-1">
                      <div className="font-medium flex items-center">
                        <Trophy className="h-4 w-4 text-green-600 mr-1" />
                        Excellent Quality
                      </div>
                      <div className="text-sm text-green-700">${incentiveRules.excellent.rate.toFixed(2)} per operator</div>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <div>Pass Rate ≥ {incentiveRules.excellent.threshold}%</div>
                      <div>Highest incentive tier</div>
                    </div>
                  </div>
                  
                  <div className="rounded-lg bg-gradient-to-r from-blue-50 to-blue-100 p-3 border border-blue-200">
                    <div className="flex justify-between items-center mb-1">
                      <div className="font-medium">Good Quality</div>
                      <div className="text-sm text-blue-700">${incentiveRules.good.rate.toFixed(2)} per operator</div>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <div>Pass Rate {incentiveRules.good.threshold}% - {incentiveRules.excellent.threshold - 0.1}%</div>
                      <div>Standard incentive tier</div>
                    </div>
                  </div>
                  
                  <div className="rounded-lg bg-gradient-to-r from-amber-50 to-amber-100 p-3 border border-amber-200">
                    <div className="flex justify-between items-center mb-1">
                      <div className="font-medium">Average Quality</div>
                      <div className="text-sm text-amber-700">${incentiveRules.average.rate.toFixed(2)} per operator</div>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <div>Pass Rate {incentiveRules.average.threshold}% - {incentiveRules.good.threshold - 0.1}%</div>
                      <div>Minimal incentive tier</div>
                    </div>
                  </div>
                  
                  <div className="rounded-lg bg-gradient-to-r from-red-50 to-red-100 p-3 border border-red-200">
                    <div className="flex justify-between items-center mb-1">
                      <div className="font-medium">Poor Quality</div>
                      <div className="text-sm text-red-700">${incentiveRules.poor.rate.toFixed(2)} per operator</div>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <div>Pass Rate < {incentiveRules.average.threshold}%</div>
                      <div>No incentive tier</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-3">Current Incentive Status</h3>
                
                <div className="space-y-4">
                  {examplePlants.map(plant => (
                    <div key={plant.id} className="space-y-3">
                      <h4 className="font-medium">{plant.name}</h4>
                      
                      {plant.lines.map(line => {
                        const passRate = calculateAQLPassRate(plant.id, line);
                        const incentiveAmount = getIncentiveAmount(passRate);
                        
                        return (
                          <div key={`${plant.id}-${line}`} className="flex items-center justify-between p-2 bg-muted/30 rounded-md">
                            <div className="text-sm">Line {line}</div>
                            <div className="text-sm">
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1">
                                  <span className="text-muted-foreground">AQL:</span>
                                  <span className={
                                    passRate >= incentiveRules.excellent.threshold ? "text-green-600" :
                                    passRate >= incentiveRules.good.threshold ? "text-blue-600" :
                                    passRate >= incentiveRules.average.threshold ? "text-amber-600" :
                                    "text-red-600"
                                  }>{passRate}%</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="text-muted-foreground">Incentive:</span>
                                  <span className="font-medium">${incentiveAmount.toFixed(2)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                  
                  {totalDefects === 0 && (
                    <div className="text-center p-4 text-muted-foreground">
                      No defect data available to calculate incentives
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default IncentiveConfig;
