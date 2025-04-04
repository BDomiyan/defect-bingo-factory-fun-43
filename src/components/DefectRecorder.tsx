import React, { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Check, Clock, AlertTriangle, Save, Loader2, Calendar, PartyPopper } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DEFECT_TYPES, GARMENT_PARTS, COMMON_DEFECT_PAIRS } from '@/lib/game-data';
import { toast } from "sonner";
import { DefectType, GarmentPart, RecordedDefect } from '@/lib/types';
import { useAuth } from '@/context/auth-context';
import { format } from 'date-fns';
import { useDefects, useOperatorsByFactoryLine } from '@/lib/supabase/hooks';

interface DefectRecorderProps {
  onDefectRecorded?: (defect: RecordedDefect) => void;
  factoryList?: { id: string; name: string; lines: string[] }[];
  operatorId?: string;
  operatorName?: string;
  plantsList?: { id: string; name: string; lines: string[] }[];
  operationsList?: { id: string; name: string }[];
}

const DefectRecorder: React.FC<DefectRecorderProps> = ({ 
  onDefectRecorded,
  factoryList = [],
  operatorId = '',
  operatorName = '',
  plantsList = [],
  operationsList = []
}) => {
  const { user } = useAuth();
  
  // Use Supabase hooks for defects and operators
  const { addDefect: addDefectToSupabase, defects } = useDefects();
  const { operators: supabaseOperators, loading: operatorsLoading, fetchOperatorsByFactoryLine } = useOperatorsByFactoryLine();
  
  const [defectType, setDefectType] = useState<string>('');
  const [garmentPart, setGarmentPart] = useState<string>('');
  const [factoryId, setFactoryId] = useState<string>('');
  const [lineNumber, setLineNumber] = useState<string>('');
  const [operatorInput, setOperatorInput] = useState<string>(operatorName || user?.name || '');
  const [operatorIdInput, setOperatorIdInput] = useState<string>(operatorId || user?.employeeId || '');
  const [epfNumber, setEpfNumber] = useState<string>('');
  const [operation, setOperation] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentDate] = useState(new Date());
  const [showConfetti, setShowConfetti] = useState(false);
  const [operators, setOperators] = useState<any[]>([]);
  const [selectedOperator, setSelectedOperator] = useState<string>('');
  const [operations, setOperations] = useState<any[]>([]);
  const [availableFactories, setAvailableFactories] = useState<any[]>([]);
  const [availableLines, setAvailableLines] = useState<string[]>([]);
  
  // Set initial values when user or plants data is loaded
  useEffect(() => {
    // Set user defaults if available
    if (user?.plantId && !factoryId) {
      console.log("Setting factoryId from user:", user.plantId);
      setFactoryId(user.plantId);
    }
    
    if (user?.lineNumber && !lineNumber) {
      console.log("Setting lineNumber from user:", user.lineNumber);
      setLineNumber(user.lineNumber);
    }
  }, [user]);
  
  // Initialize factories from props
  useEffect(() => {
    if (plantsList && plantsList.length > 0) {
      console.log("Setting factories from props:", plantsList);
      
      // Create a mapping between local IDs and UUIDs
      const idMapping: Record<string, string> = {};
      plantsList.forEach(plant => {
        if (plant.id && plant.id.includes('-')) {
          // This is already a UUID, keep track of name to ID mapping
          idMapping[plant.name.toLowerCase().replace(/\s+/g, '_')] = plant.id;
          
          // If this is Jay Jay Main Factory, also map A6 to it
          if (plant.name === 'Jay Jay Main Factory') {
            idMapping['a6'] = plant.id;
          }
        }
      });
      
      console.log("Factory ID mapping:", idMapping);
      
      // Store the mapping in local storage for persistence
      localStorage.setItem('factory-id-mapping', JSON.stringify(idMapping));
      
      setAvailableFactories(plantsList);
      
      // If no factory is selected but we have factories available, select the first one
      if (!factoryId && plantsList.length > 0) {
        console.log("Auto-selecting first factory:", plantsList[0].id);
        setFactoryId(plantsList[0].id);
      }
    }
    
    // Debug to verify factory IDs
    if (plantsList && plantsList.length > 0) {
      console.log("Factory IDs from props:", plantsList.map(p => ({ id: p.id, name: p.name })));
    }
    
    // Get operations from props
    if (operationsList && operationsList.length > 0) {
      setOperations(operationsList);
    }
  }, [plantsList, operationsList, factoryId]);
  
  // Helper function to get the proper UUID for a factory
  const getProperFactoryId = (id: string): string => {
    // If it's already a UUID, return it
    if (id && id.includes('-')) {
      return id;
    }
    
    // Check if we have a mapping for this ID
    const mapping = JSON.parse(localStorage.getItem('factory-id-mapping') || '{}');
    if (mapping[id.toLowerCase()]) {
      return mapping[id.toLowerCase()];
    }
    
    // If this is 'A6', return the Jay Jay Main Factory UUID
    if (id.toLowerCase() === 'a6') {
      return '00000000-0000-0000-0000-000000000001';
    }
    
    // Return the original ID as a fallback
    return id;
  };
  
  // When factory changes, update available lines
  useEffect(() => {
    if (factoryId) {
      console.log("Factory ID changed to:", factoryId);
      console.log("Available factories:", availableFactories.map(f => ({id: f.id, name: f.name})));
      
      const selectedFactory = availableFactories.find(f => f.id === factoryId);
      console.log("Selected factory:", selectedFactory);
      
      if (selectedFactory && selectedFactory.lines && selectedFactory.lines.length > 0) {
        setAvailableLines(selectedFactory.lines);
        
        // If current line number doesn't exist in this factory's lines, select the first one
        if (!lineNumber || !selectedFactory.lines.includes(lineNumber)) {
          console.log("Setting lineNumber to first available:", selectedFactory.lines[0]);
          setLineNumber(selectedFactory.lines[0]);
        }
      } else {
        // If factory has no lines, clear line selection
        setAvailableLines([]);
        setLineNumber('');
      }
    } else {
      // If no factory selected, clear line selection
      setAvailableLines([]);
      setLineNumber('');
    }
  }, [factoryId, availableFactories]);

  // Update operators when factory or line changes - use Supabase
  useEffect(() => {
    if (factoryId && lineNumber) {
      const supabaseFactoryId = getProperFactoryId(factoryId);
      console.log(`Getting operators for factory ${factoryId} (Supabase ID: ${supabaseFactoryId}), line ${lineNumber}`);
      // Use the new hook to fetch operators from Supabase
      fetchOperatorsByFactoryLine(supabaseFactoryId, lineNumber);
    }
  }, [factoryId, lineNumber, fetchOperatorsByFactoryLine]);

  // Update operators list when Supabase query returns results
  useEffect(() => {
    if (!operatorsLoading && supabaseOperators.length > 0) {
      console.log("Received operators from Supabase:", supabaseOperators);
      setOperators(supabaseOperators);
    } else if (!operatorsLoading) {
      console.log("No operators found for this factory and line");
      setOperators([]);
    }
  }, [supabaseOperators, operatorsLoading]);

  // Filter defect types based on selected garment part
  const filteredDefectTypes = useMemo(() => {
    if (!garmentPart) return DEFECT_TYPES;
    
    const pair = COMMON_DEFECT_PAIRS.find(pair => pair.garmentCode === garmentPart);
    if (!pair) return DEFECT_TYPES;
    
    return DEFECT_TYPES.filter(defect => pair.defectCodes.includes(defect.code));
  }, [garmentPart]);
  
  const selectedFactory = availableFactories.find(f => f.id === factoryId);

  // Reset defect type when garment part changes
  useEffect(() => {
    setDefectType('');
  }, [garmentPart]);

  // If operatorId is provided as prop, select that operator automatically
  useEffect(() => {
    if (operatorId) {
      setSelectedOperator(operatorId);
      const selectedOp = operators.find(op => op.id === operatorId);
      if (selectedOp) {
        setOperatorInput(selectedOp.name);
        setOperatorIdInput(selectedOp.id);
        setEpfNumber(selectedOp.epf_number || '');
        if (selectedOp.operation) {
          setOperation(selectedOp.operation);
        }
      }
    }
  }, [operatorId, operators]);

  const handleOperatorSelect = (operatorId: string) => {
    console.log("Selected operator ID:", operatorId);
    setSelectedOperator(operatorId);
    const selectedOp = operators.find(op => op.id === operatorId);
    if (selectedOp) {
      console.log("Selected operator details:", selectedOp);
      setOperatorInput(selectedOp.name);
      setOperatorIdInput(selectedOp.id);
      setEpfNumber(selectedOp.epf_number || '');
      if (selectedOp.operation) {
        setOperation(selectedOp.operation);
      }
    }
  };

  const resetForm = () => {
    setDefectType('');
    setGarmentPart('');
    if (!selectedOperator) {
      setOperatorIdInput('');
      setOperatorInput('');
      setEpfNumber('');
      setOperation('');
    }
  };

  const triggerSuccessAnimation = () => {
    setShowConfetti(true);
    setTimeout(() => {
      setShowConfetti(false);
    }, 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form fields
    if (!defectType || !garmentPart) {
      toast.error("Please select garment part and defect type", {
        description: "Both fields are required to record a defect"
      });
      return;
    }
    
    if (!factoryId || !lineNumber) {
      toast.error("Please select factory and line", {
        description: "Factory and line are required to record a defect"
      });
      return;
    }
    
    if (!operatorInput && !selectedOperator) {
      toast.error("Please select or enter an operator", {
        description: "Operator information is required"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const selectedDefectType = DEFECT_TYPES.find(d => d.code.toString() === defectType);
      const selectedGarmentPart = GARMENT_PARTS.find(p => p.code === garmentPart);
      
      if (!selectedDefectType || !selectedGarmentPart) {
        toast.error("Invalid defect or garment selection");
        setIsSubmitting(false);
        return;
      }
      
      // Find the matching factory object
      const factory = availableFactories.find(f => f.id === factoryId);
      console.log("Selected factory for submission:", factory);
      
      if (!factory) {
        toast.error("Selected factory not found");
        setIsSubmitting(false);
        return;
      }
      
      // Ensure we have a valid operator ID (UUID format)
      const validOperatorId = selectedOperator || user?.employeeId || 'guest';
      console.log("Using operator ID for submission:", validOperatorId);
      
      // Convert the factory ID to a proper UUID if needed
      const supabaseFactoryId = getProperFactoryId(factory.id);
      console.log("Using Supabase factory ID:", supabaseFactoryId);
      
      // Create the defect record
      const newDefect: RecordedDefect = {
        id: crypto.randomUUID(),
        defectType: selectedDefectType,
        garmentPart: selectedGarmentPart,
        timestamp: new Date().toISOString(),
        operatorId: validOperatorId,
        operatorName: operatorInput || user?.name || 'Guest User',
        factoryId: supabaseFactoryId, // Use the converted ID
        lineNumber,
        epfNumber: epfNumber || 'N/A',
        operation: operation || undefined,
        status: 'pending',
        reworked: false
      };
      
      console.log("Recording defect:", newDefect);
      
      // Now try to save to Supabase
      try {
        const result = await addDefectToSupabase(newDefect);
        console.log("Supabase result:", result);
        
        triggerSuccessAnimation();
        
        toast.success("Defect recorded successfully!", {
          description: `${selectedGarmentPart.name} - ${selectedDefectType.name}`,
          action: {
            label: "View",
            onClick: () => console.log("Viewed defect", newDefect.id)
          }
        });
        
        if (onDefectRecorded) {
          onDefectRecorded(newDefect);
        }
        
        resetForm();
      } catch (error: any) {
        console.error("Error recording defect:", error);
        
        // Provide more specific error messages based on error type
        if (error.code === '23503') {
          toast.error("Invalid reference data", {
            description: "One of the selected values (factory, operator, etc.) is not valid."
          });
        } else if (error.message?.includes('factory_id')) {
          toast.error("Factory ID issue", {
            description: "There was a problem with the selected factory. Please try selecting a different factory."
          });
        } else if (error.message?.includes('created_by')) {
          toast.error("Operator ID issue", {
            description: "There was a problem with the selected operator. Please check operator information."
          });
        } else if (error.message?.includes('network')) {
          toast.error("Network error", {
            description: "Please check your internet connection and try again."
          });
        } else {
          toast.error("Error recording defect", {
            description: error.message || "An unexpected error occurred. Please check your inputs and try again."
          });
        }
      } finally {
        setIsSubmitting(false);
      }
    } catch (error: any) {
      toast.error("Error recording defect", {
        description: error.message || "An unexpected error occurred"
      });
      console.error("Error recording defect:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const updatePlayerStats = (defect: RecordedDefect) => {
    const players = JSON.parse(localStorage.getItem('defect-bingo-players') || '[]');
    const playerName = defect.operatorName;
    
    const playerExists = players.some((p: any) => p.name === playerName);
    
    if (playerExists) {
      const updatedPlayers = players.map((p: any) => {
        if (p.name === playerName) {
          return {
            ...p,
            defectsFound: p.defectsFound + 1,
            score: p.score + 5,
            epfNumber: defect.epfNumber || p.epfNumber,
            line: defect.lineNumber || p.line,
            factory: defect.factoryId || p.factory,
            operation: defect.operation || p.operation
          };
        }
        return p;
      });
      localStorage.setItem('defect-bingo-players', JSON.stringify(updatedPlayers));
    } else {
      const newPlayer = {
        id: defect.operatorId || crypto.randomUUID(),
        name: playerName,
        role: 'operator',
        score: 5,
        bingoCount: 0,
        defectsFound: 1,
        epfNumber: defect.epfNumber,
        line: defect.lineNumber,
        factory: defect.factoryId,
        operation: defect.operation
      };
      localStorage.setItem('defect-bingo-players', JSON.stringify([...players, newPlayer]));
    }
  };

  // Update factory dropdown onValueChange
  const handleFactoryChange = (value: string) => {
    console.log("Setting factory ID to:", value);
    setFactoryId(value);
  };

  return (
    <div className="w-full bg-card rounded-lg border shadow-md overflow-hidden relative">
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
          <div className="animate-confetti-explosion">
            <PartyPopper className="h-16 w-16 text-primary animate-spin" />
          </div>
        </div>
      )}
      
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-4 border-b">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-medium text-white text-lg">Quick Defect Recorder</h3>
          <Badge variant="outline" className="bg-white/10 text-white border-white/20">
            <Calendar className="mr-1 h-3 w-3" />
            {format(currentDate, 'MMM dd, yyyy')}
          </Badge>
        </div>
        <p className="text-sm text-blue-100">Record defects to earn points and complete your Bingo board!</p>
      </div>
      
      <form onSubmit={handleSubmit} className="p-5 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="factory" className="text-blue-800">Factory</Label>
            <Select 
              value={factoryId || undefined} 
              onValueChange={handleFactoryChange}
              disabled={user?.role === 'qc'}
            >
              <SelectTrigger id="factory" className="border-blue-200">
                <SelectValue placeholder="Select factory">
                  {selectedFactory ? selectedFactory.name : "Select factory"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {availableFactories.map(factory => (
                  <SelectItem key={factory.id} value={factory.id}>
                    {factory.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {availableFactories.length === 0 && (
              <p className="text-xs text-red-500 mt-1">No factories available</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="line" className="text-blue-800">Line Number</Label>
            <Select 
              value={lineNumber} 
              onValueChange={setLineNumber}
              disabled={!selectedFactory || (user?.role === 'qc' && !!user?.lineNumber)}
            >
              <SelectTrigger id="line" className="border-blue-200">
                <SelectValue placeholder="Select line" />
              </SelectTrigger>
              <SelectContent>
                {availableLines.map(line => (
                  <SelectItem key={line} value={line}>
                    Line {line}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="operator" className="text-blue-800">Operator</Label>
          <Select
            value={selectedOperator}
            onValueChange={handleOperatorSelect}
          >
            <SelectTrigger id="operator" className="border-blue-200">
              <SelectValue placeholder="Select operator" />
            </SelectTrigger>
            <SelectContent>
              {operators.length > 0 ? (
                operators.map(op => (
                  <SelectItem key={op.id} value={op.id}>
                    {op.name} - {op.epfNumber} {op.operation ? `(${op.operation})` : ''}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="none" disabled>No operators found</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
        
        {(!selectedOperator && !user) && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="operatorName" className="text-blue-800">Operator Name</Label>
              <Input 
                id="operatorName" 
                value={operatorInput} 
                onChange={e => setOperatorInput(e.target.value)}
                placeholder="Enter name"
                className="border-blue-200"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="epfNumber" className="text-blue-800">EPF Number</Label>
              <Input 
                id="epfNumber" 
                value={epfNumber} 
                onChange={e => setEpfNumber(e.target.value)}
                placeholder="Enter EPF No."
                className="border-blue-200"
              />
            </div>
          </div>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="operation" className="text-blue-800">Operation</Label>
          <Select 
            value={operation} 
            onValueChange={setOperation}
          >
            <SelectTrigger id="operation" className="border-blue-200">
              <SelectValue placeholder="Select operation" />
            </SelectTrigger>
            <SelectContent>
              {operations.map(op => (
                <SelectItem key={op.id} value={op.id}>
                  {op.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="garmentPart" className="text-blue-800">Garment Part</Label>
            <Select value={garmentPart} onValueChange={setGarmentPart}>
              <SelectTrigger id="garmentPart" className="border-blue-200">
                <SelectValue placeholder="Select part" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {GARMENT_PARTS.map(part => (
                  <SelectItem key={part.code} value={part.code}>
                    {part.code}: {part.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="defectType" className="text-blue-800">Defect Type</Label>
            <Select 
              value={defectType} 
              onValueChange={setDefectType}
              disabled={!garmentPart}
            >
              <SelectTrigger id="defectType" className="border-blue-200">
                <SelectValue placeholder={garmentPart ? "Select defect" : "Select a garment part first"} />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {filteredDefectTypes.map(defect => (
                  <SelectItem key={defect.code} value={defect.code.toString()}>
                    {defect.code}: {defect.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {garmentPart && filteredDefectTypes.length < DEFECT_TYPES.length && (
              <p className="text-xs text-muted-foreground mt-1">
                Showing only defects applicable to this garment part
              </p>
            )}
          </div>
        </div>
        
        <Button 
          type="submit" 
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 transition-opacity h-12 group" 
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Recording...
            </>
          ) : (
            <>
              <Save className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
              Record Defect
            </>
          )}
        </Button>
      </form>
      
      <div className="border-t p-4 bg-blue-50/50">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-blue-800">Recent Defects</h4>
          <Badge variant="outline" className="text-xs bg-blue-100/50 border-blue-200 text-blue-800">
            <Clock className="mr-1 h-3 w-3" />
            Last {defects.length}
          </Badge>
        </div>
        
        <div className="max-h-[200px] overflow-y-auto space-y-2 pr-1">
          {defects.length > 0 ? (
            defects
              .filter(d => user?.role === 'qc' || user?.role === 'admin' ? true : d.factory_id === user?.plantId)
              .map(defect => (
                <div key={defect.id} className="flex items-center justify-between p-3 rounded-md text-sm bg-white shadow-sm border border-blue-100 hover:border-blue-200 transition-colors">
                  <div className="flex items-center gap-2">
                    {defect.validated ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Clock className="h-4 w-4 text-amber-500" />
                    )}
                    <div>
                      <span className="font-medium text-blue-900">
                        {defect.garment_part} - {defect.defect_type}
                      </span>
                      <div className="text-xs text-muted-foreground">
                        {defect.created_by} • EPF: {defect.epf_number || 'N/A'}
                        {defect.operation && ` • ${defect.operation}`}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground flex flex-col items-end">
                    <span>{new Date(defect.created_at).toLocaleTimeString()}</span>
                    {!defect.validated && (
                      <Badge variant="outline" className="mt-1 bg-amber-50 text-amber-700 border-amber-200">
                        Awaiting Validation
                      </Badge>
                    )}
                  </div>
                </div>
              ))
          ) : (
            <div className="text-center p-6 text-sm text-muted-foreground bg-white/70 rounded-lg border border-blue-100">
              No defects recorded yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DefectRecorder;
