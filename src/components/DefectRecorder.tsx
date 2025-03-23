
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Check, Clock, AlertTriangle, Save, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DEFECT_TYPES, GARMENT_PARTS } from '@/lib/game-data';
import { toast } from "sonner";
import { useLocalStorage } from '@/hooks/use-local-storage';
import { DefectType, GarmentPart } from '@/lib/types';
import { useAuth } from '@/context/auth-context';

interface RecordedDefect {
  id: string;
  defectType: DefectType;
  garmentPart: GarmentPart;
  timestamp: string;
  operatorId: string;
  operatorName: string;
  factoryId: string;
  lineNumber: string;
  status: 'pending' | 'verified' | 'rejected';
  reworked: boolean;
  reworkTime?: number;
}

interface FactoryData {
  id: string;
  name: string;
  lines: string[];
}

interface DefectRecorderProps {
  onDefectRecorded: (defect: RecordedDefect) => void;
  factoryList?: FactoryData[];
  operatorId?: string;
  operatorName?: string;
}

const DefectRecorder: React.FC<DefectRecorderProps> = ({ 
  onDefectRecorded,
  factoryList = [
    { id: 'f1', name: 'Factory Alpha', lines: ['L1', 'L2', 'L3'] },
    { id: 'f2', name: 'Factory Beta', lines: ['L1', 'L2', 'L3', 'L4'] }
  ],
  operatorId = '',
  operatorName = ''
}) => {
  const { user } = useAuth();
  const [defectType, setDefectType] = useState<string>('');
  const [garmentPart, setGarmentPart] = useState<string>('');
  const [factoryId, setFactoryId] = useState<string>(user?.plantId || '');
  const [lineNumber, setLineNumber] = useState<string>(user?.lineNumber || '');
  const [operatorInput, setOperatorInput] = useState<string>(operatorName || user?.name || '');
  const [operatorIdInput, setOperatorIdInput] = useState<string>(operatorId || user?.employeeId || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recentDefects, setRecentDefects] = useLocalStorage<RecordedDefect[]>('recent-defects', []);
  
  // Use the plant from the logged-in user or fall back to the provided factoryList
  const actualFactoryList = user?.plant 
    ? [user.plant, ...factoryList.filter(f => f.id !== user.plantId)]
    : factoryList;
  
  const selectedFactory = actualFactoryList.find(f => f.id === factoryId);

  // Update factory and line when user changes
  useEffect(() => {
    if (user?.plantId) {
      setFactoryId(user.plantId);
    }
    if (user?.lineNumber) {
      setLineNumber(user.lineNumber);
    }
  }, [user]);

  const resetForm = () => {
    setDefectType('');
    setGarmentPart('');
    if (!operatorId && !user?.employeeId) setOperatorIdInput('');
    if (!operatorName && !user?.name) setOperatorInput('');
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
    
    // Simulate a small delay for realistic feedback
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
        status: 'pending',
        reworked: false
      };
      
      // Add to recent defects
      const updatedDefects = [newDefect, ...recentDefects.slice(0, 19)];
      setRecentDefects(updatedDefects);
      
      // Call the callback
      onDefectRecorded(newDefect);
      
      toast.success("Defect recorded successfully", {
        description: `${selectedGarmentPart.name} - ${selectedDefectType.name}`
      });
      
      resetForm();
      setIsSubmitting(false);
    }, 500);
  };

  return (
    <div className="w-full bg-card rounded-lg border shadow-sm overflow-hidden">
      <div className="bg-gradient-dark-blue p-3 border-b">
        <h3 className="font-medium text-white">Quick Defect Recorder</h3>
        <p className="text-xs text-blue-100">Record defects as you find them in real-time</p>
      </div>
      
      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="factory">Factory</Label>
            <Select 
              value={factoryId} 
              onValueChange={setFactoryId}
              disabled={user?.role === 'qc'}
            >
              <SelectTrigger id="factory">
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
            <Label htmlFor="line">Line Number</Label>
            <Select 
              value={lineNumber} 
              onValueChange={setLineNumber}
              disabled={!selectedFactory || (user?.role === 'qc' && !!user?.lineNumber)}
            >
              <SelectTrigger id="line">
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
        
        {(!operatorId && !user) && (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="operatorId">Operator ID</Label>
              <Input 
                id="operatorId" 
                value={operatorIdInput} 
                onChange={e => setOperatorIdInput(e.target.value)}
                placeholder="Enter operator ID"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="operatorName">Operator Name</Label>
              <Input 
                id="operatorName" 
                value={operatorInput} 
                onChange={e => setOperatorInput(e.target.value)}
                placeholder="Enter name"
              />
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="defectType">Defect Type</Label>
            <Select value={defectType} onValueChange={setDefectType}>
              <SelectTrigger id="defectType">
                <SelectValue placeholder="Select defect" />
              </SelectTrigger>
              <SelectContent>
                {DEFECT_TYPES.map(defect => (
                  <SelectItem key={defect.code} value={defect.code.toString()}>
                    {defect.code}: {defect.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="garmentPart">Garment Part</Label>
            <Select value={garmentPart} onValueChange={setGarmentPart}>
              <SelectTrigger id="garmentPart">
                <SelectValue placeholder="Select part" />
              </SelectTrigger>
              <SelectContent>
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
          className="w-full bg-gradient-dark-blue hover:opacity-90 transition-opacity" 
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Recording...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Record Defect
            </>
          )}
        </Button>
      </form>
      
      <div className="border-t p-3">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium">Recent Defects</h4>
          <Badge variant="outline" className="text-xs">
            <Clock className="mr-1 h-3 w-3" />
            Last {recentDefects.length}
          </Badge>
        </div>
        
        <div className="max-h-[200px] overflow-y-auto space-y-2">
          {recentDefects.length > 0 ? (
            recentDefects
              .filter(d => user?.role === 'qc' || user?.role === 'admin' ? true : d.factoryId === user?.plantId)
              .map(defect => (
                <div key={defect.id} className="flex items-center justify-between p-2 rounded-md text-sm bg-accent/30">
                  <div className="flex items-center gap-2">
                    {defect.status === 'verified' ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : defect.status === 'rejected' ? (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    ) : (
                      <Clock className="h-4 w-4 text-amber-500" />
                    )}
                    <span>
                      {defect.garmentPart.name} - {defect.defectType.name}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(defect.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))
          ) : (
            <div className="text-center p-4 text-sm text-muted-foreground">
              No defects recorded yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DefectRecorder;
