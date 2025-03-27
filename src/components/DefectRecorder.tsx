
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Check, Clock, AlertTriangle, Save, Loader2, Calendar, Award, PartyPopper } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DEFECT_TYPES, GARMENT_PARTS, FACTORIES, OPERATIONS } from '@/lib/game-data';
import { toast } from "sonner";
import { useLocalStorage } from '@/hooks/use-local-storage';
import { DefectType, GarmentPart, RecordedDefect } from '@/lib/types';
import { useAuth } from '@/context/auth-context';
import { format } from 'date-fns';
import { useDefectSync } from '@/hooks/use-defect-sync';

interface DefectRecorderProps {
  onDefectRecorded?: (defect: RecordedDefect) => void;
  factoryList?: typeof FACTORIES;
  operatorId?: string;
  operatorName?: string;
}

const DefectRecorder: React.FC<DefectRecorderProps> = ({ 
  onDefectRecorded,
  factoryList = FACTORIES,
  operatorId = '',
  operatorName = ''
}) => {
  const { user } = useAuth();
  const { 
    addDefect, 
    recentDefects, 
    getOperatorsByLine, 
    getAllOperators, 
    getOperatorById 
  } = useDefectSync();
  
  const [defectType, setDefectType] = useState<string>('');
  const [garmentPart, setGarmentPart] = useState<string>('');
  const [factoryId, setFactoryId] = useState<string>(user?.plantId || 'A6');
  const [lineNumber, setLineNumber] = useState<string>(user?.lineNumber || 'L1');
  const [operatorInput, setOperatorInput] = useState<string>(operatorName || user?.name || '');
  const [operatorIdInput, setOperatorIdInput] = useState<string>(operatorId || user?.employeeId || '');
  const [epfNumber, setEpfNumber] = useState<string>('');
  const [operation, setOperation] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentDate] = useState(new Date());
  const [showConfetti, setShowConfetti] = useState(false);
  const [operators, setOperators] = useState<any[]>([]);
  const [selectedOperator, setSelectedOperator] = useState<string>('');
  
  const actualFactoryList = user?.plant 
    ? [user.plant, ...factoryList.filter(f => f.id !== user.plantId)]
    : factoryList;
  
  const selectedFactory = actualFactoryList.find(f => f.id === factoryId);

  useEffect(() => {
    if (user?.plantId) {
      setFactoryId(user.plantId);
    }
    if (user?.lineNumber) {
      setLineNumber(user.lineNumber);
    }

    const lineOperators = getOperatorsByLine(factoryId, lineNumber);
    setOperators(lineOperators);
  }, [user, factoryId, lineNumber]);

  useEffect(() => {
    const lineOperators = getOperatorsByLine(factoryId, lineNumber);
    setOperators(lineOperators);
    setSelectedOperator('');
  }, [factoryId, lineNumber]);

  // If operatorId is provided as prop, select that operator automatically
  useEffect(() => {
    if (operatorId) {
      setSelectedOperator(operatorId);
      const selectedOp = getOperatorById(operatorId);
      if (selectedOp) {
        setOperatorInput(selectedOp.name);
        setOperatorIdInput(selectedOp.id);
        setEpfNumber(selectedOp.epfNumber || '');
        if (selectedOp.operation) {
          setOperation(selectedOp.operation);
        }
      }
    }
  }, [operatorId]);

  const handleOperatorSelect = (operatorId: string) => {
    setSelectedOperator(operatorId);
    const selectedOp = operators.find(op => op.id === operatorId);
    if (selectedOp) {
      setOperatorInput(selectedOp.name);
      setOperatorIdInput(selectedOp.id);
      setEpfNumber(selectedOp.epfNumber || '');
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!defectType || !garmentPart || !factoryId || !lineNumber) {
      toast.error("Please fill all required fields", {
        description: "All fields are required to record a defect"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    setTimeout(() => {
      const selectedDefectType = DEFECT_TYPES.find(d => d.code.toString() === defectType);
      const selectedGarmentPart = GARMENT_PARTS.find(p => p.code === garmentPart);
      
      if (!selectedDefectType || !selectedGarmentPart) {
        toast.error("Invalid defect or garment selection");
        setIsSubmitting(false);
        return;
      }
      
      const newDefect: RecordedDefect = {
        id: crypto.randomUUID(),
        defectType: selectedDefectType,
        garmentPart: selectedGarmentPart,
        timestamp: new Date().toISOString(),
        operatorId: operatorIdInput || user?.employeeId || 'guest',
        operatorName: operatorInput || user?.name || 'Guest User',
        factoryId,
        lineNumber,
        epfNumber: epfNumber || 'N/A',
        operation: operation || undefined,
        status: 'pending',
        reworked: false
      };
      
      addDefect(newDefect);
      
      if (onDefectRecorded) {
        onDefectRecorded(newDefect);
      }
      
      updatePlayerStats(newDefect);
      
      triggerSuccessAnimation();
      
      toast.success("Defect recorded successfully!", {
        description: `${selectedGarmentPart.name} - ${selectedDefectType.name}`,
        action: {
          label: "View",
          onClick: () => console.log("Viewed defect", newDefect.id)
        }
      });
      
      resetForm();
      setIsSubmitting(false);
    }, 500);
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
              value={factoryId} 
              onValueChange={setFactoryId}
              disabled={user?.role === 'qc'}
            >
              <SelectTrigger id="factory" className="border-blue-200">
                <SelectValue placeholder="Select factory" />
              </SelectTrigger>
              <SelectContent>
                {actualFactoryList.map(factory => (
                  <SelectItem key={factory.id} value={factory.id}>
                    {factory.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                {selectedFactory?.lines.map(line => (
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
              {OPERATIONS.map(op => (
                <SelectItem key={op.id} value={op.id}>
                  {op.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="defectType" className="text-blue-800">Defect Type</Label>
            <Select value={defectType} onValueChange={setDefectType}>
              <SelectTrigger id="defectType" className="border-blue-200">
                <SelectValue placeholder="Select defect" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {DEFECT_TYPES.map(defect => (
                  <SelectItem key={defect.code} value={defect.code.toString()}>
                    {defect.code}: {defect.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
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
            Last {recentDefects.length}
          </Badge>
        </div>
        
        <div className="max-h-[200px] overflow-y-auto space-y-2 pr-1">
          {recentDefects.length > 0 ? (
            recentDefects
              .filter(d => user?.role === 'qc' || user?.role === 'admin' ? true : d.factoryId === user?.plantId)
              .map(defect => (
                <div key={defect.id} className="flex items-center justify-between p-3 rounded-md text-sm bg-white shadow-sm border border-blue-100 hover:border-blue-200 transition-colors">
                  <div className="flex items-center gap-2">
                    {defect.status === 'verified' ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : defect.status === 'rejected' ? (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    ) : (
                      <Clock className="h-4 w-4 text-amber-500" />
                    )}
                    <div>
                      <span className="font-medium text-blue-900">
                        {defect.garmentPart.name} - {defect.defectType.name}
                      </span>
                      <div className="text-xs text-muted-foreground">
                        {defect.operatorName} • EPF: {defect.epfNumber || 'N/A'}
                        {defect.operation && ` • ${defect.operation}`}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground flex flex-col items-end">
                    <span>{new Date(defect.timestamp).toLocaleTimeString()}</span>
                    {defect.status === 'pending' && (
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
