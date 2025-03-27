import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Check, Clock, AlertTriangle, Save, Loader2, Calendar } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DEFECT_TYPES, GARMENT_PARTS, FACTORIES } from '@/lib/game-data';
import { toast } from "sonner";
import { useLocalStorage } from '@/hooks/use-local-storage';
import { DefectType, GarmentPart } from '@/lib/types';
import { useAuth } from '@/context/auth-context';
import { format } from 'date-fns';
import { useDefectSync } from '@/hooks/use-defect-sync';

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
  onDefectRecorded?: (defect: RecordedDefect) => void;
  factoryList?: FactoryData[];
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
  const { addDefect, recentDefects } = useDefectSync();
  const [defectType, setDefectType] = useState<string>('');
  const [garmentPart, setGarmentPart] = useState<string>('');
  const [factoryId, setFactoryId] = useState<string>(user?.plantId || 'A6');
  const [lineNumber, setLineNumber] = useState<string>(user?.lineNumber || 'L1');
  const [operatorInput, setOperatorInput] = useState<string>(operatorName || user?.name || '');
  const [operatorIdInput, setOperatorIdInput] = useState<string>(operatorId || user?.employeeId || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentDate] = useState(new Date());
  
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
        status: 'verified',
        reworked: false
      };
      
      addDefect(newDefect);
      
      if (onDefectRecorded) {
        onDefectRecorded(newDefect);
      }
      
      updatePlayerStats(newDefect);
      
      toast.success("Defect recorded successfully", {
        description: `${selectedGarmentPart.name} - ${selectedDefectType.name}`
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
            score: p.score + 5
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
        defectsFound: 1
      };
      localStorage.setItem('defect-bingo-players', JSON.stringify([...players, newPlayer]));
    }
  };

  return (
    <div className="w-full bg-card rounded-lg border shadow-md overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-4 border-b">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-medium text-white text-lg">Quick Defect Recorder</h3>
          <Badge variant="outline" className="bg-white/10 text-white border-white/20">
            <Calendar className="mr-1 h-3 w-3" />
            {format(currentDate, 'MMM dd, yyyy')}
          </Badge>
        </div>
        <p className="text-sm text-blue-100">Record defects as you find them in real-time</p>
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
        
        {(!operatorId && !user) && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="operatorId" className="text-blue-800">Operator ID</Label>
              <Input 
                id="operatorId" 
                value={operatorIdInput} 
                onChange={e => setOperatorIdInput(e.target.value)}
                placeholder="Enter operator ID"
                className="border-blue-200"
              />
            </div>
            
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
          </div>
        )}
        
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
          className="w-full bg-gradient-button hover:opacity-90 transition-opacity h-12" 
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Recording...
            </>
          ) : (
            <>
              <Save className="mr-2 h-5 w-5" />
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
                    <span className="font-medium text-blue-900">
                      {defect.garmentPart.name} - {defect.defectType.name}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(defect.timestamp).toLocaleTimeString()}
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
