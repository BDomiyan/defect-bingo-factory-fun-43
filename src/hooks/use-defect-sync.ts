import { useState, useEffect } from 'react';
import { useLocalStorage } from './use-local-storage';
import { DefectType, GarmentPart, Operator } from '@/lib/types';
import { toast } from 'sonner';
import { FACTORIES } from '@/lib/game-data';

// Define the allowed plants
const ALLOWED_PLANTS = ['A6', 'C5', 'M1', 'B7', 'D2', 'E4', 'F8', 'G3', 'H9', 'J5', 'K1', 'L6', 'N2'];

interface RecordedDefect {
  id: string;
  defectType: DefectType;
  garmentPart: GarmentPart;
  timestamp: string;
  operatorId: string;
  operatorName: string;
  factoryId: string;
  lineNumber: string;
  epfNumber: string;
  operation?: string;
  status: 'pending' | 'verified' | 'rejected';
  reworked: boolean;
  reworkTime?: number;
  supervisorComment?: string;
}

/**
 * Custom hook to synchronize defect data across all components
 * Ensures consistent data between DefectRecorder, FactoryMetrics, and Dashboard
 */
export const useDefectSync = () => {
  const [recentDefects, setRecentDefects] = useLocalStorage<RecordedDefect[]>('recent-defects', []);
  const [operators, setOperators] = useLocalStorage<Operator[]>('operators', []);
  
  // Initialize some operators if none exist
  useEffect(() => {
    if (operators.length === 0) {
      const defaultOperators: Operator[] = [
        { id: '1', name: 'Elena Rodriguez', epfNumber: 'EPF001', line: 'L1', factory: 'A6' },
        { id: '2', name: 'Michael Chen', epfNumber: 'EPF002', line: 'L1', factory: 'A6' },
        { id: '3', name: 'Aisha Patel', epfNumber: 'EPF003', line: 'L2', factory: 'A6' },
        { id: '4', name: 'Carlos Mendez', epfNumber: 'EPF004', line: 'L1', factory: 'C5' },
      ];
      setOperators(defaultOperators);
    }
  }, []);
  
  // Filter defects to only include the allowed plants
  useEffect(() => {
    // If there are defects from plants we want to remove, filter them out
    const filteredDefects = recentDefects.filter(d => 
      ALLOWED_PLANTS.includes(d.factoryId)
    );
    
    if (filteredDefects.length !== recentDefects.length) {
      setRecentDefects(filteredDefects);
      toast.info("Defect data updated", {
        description: "Some plant data has been removed"
      });
    }
  }, []);
  
  // Update dashboard data whenever defects change
  useEffect(() => {
    updateDashboardData();
  }, [recentDefects]);
  
  // Function to add a new defect
  const addDefect = (defect: RecordedDefect) => {
    // Ensure the factoryId is one of the allowed plants
    if (!ALLOWED_PLANTS.includes(defect.factoryId)) {
      defect.factoryId = 'A6'; // Default to A6 if an invalid plant is provided
    }
    
    // Create a new array with the new defect at the beginning and limit to 30 items
    const updatedDefects = [defect, ...recentDefects.slice(0, 29)];
    setRecentDefects(updatedDefects);
    
    // Also update leaderboard data with the new defect
    updateLeaderboardData(defect);
    
    return defect;
  };
  
  // Function to update a defect status
  const updateDefectStatus = (defectId: string, status: 'pending' | 'verified' | 'rejected', supervisorComment?: string) => {
    const updatedDefects = recentDefects.map(d => 
      d.id === defectId ? { ...d, status, supervisorComment } : d
    );
    setRecentDefects(updatedDefects);
    updateDashboardData();
    
    // If rejected, update player stats
    const defect = recentDefects.find(d => d.id === defectId);
    if (defect && status === 'rejected') {
      updatePlayerStatsOnRejection(defect);
    } else if (defect && status === 'verified') {
      updatePlayerStatsOnVerification(defect);
    }
    
    return status;
  };
  
  // Function to update player stats when a defect is rejected
  const updatePlayerStatsOnRejection = (defect: RecordedDefect) => {
    const players = JSON.parse(localStorage.getItem('defect-bingo-players') || '[]');
    const playerName = defect.operatorName;
    
    const updatedPlayers = players.map((p: any) => {
      if (p.name === playerName) {
        return {
          ...p,
          score: Math.max(0, p.score - 2), // Deduct 2 points, but don't go below 0
        };
      }
      return p;
    });
    
    localStorage.setItem('defect-bingo-players', JSON.stringify(updatedPlayers));
  };
  
  // Function to update player stats when a defect is verified
  const updatePlayerStatsOnVerification = (defect: RecordedDefect) => {
    const players = JSON.parse(localStorage.getItem('defect-bingo-players') || '[]');
    const playerName = defect.operatorName;
    
    const updatedPlayers = players.map((p: any) => {
      if (p.name === playerName) {
        return {
          ...p,
          score: p.score + 3, // Add 3 bonus points for verified defect
        };
      }
      return p;
    });
    
    localStorage.setItem('defect-bingo-players', JSON.stringify(updatedPlayers));
  };
  
  // Function to mark a defect as reworked
  const markAsReworked = (defectId: string, reworkTime?: number) => {
    const updatedDefects = recentDefects.map(d => 
      d.id === defectId ? { ...d, reworked: true, reworkTime } : d
    );
    setRecentDefects(updatedDefects);
    updateDashboardData();
  };
  
  // Function to update leaderboard data when new defects are added
  const updateLeaderboardData = (defect: RecordedDefect) => {
    // Update player stats in leaderboard
    const players = JSON.parse(localStorage.getItem('defect-bingo-players') || '[]');
    const playerName = defect.operatorName;
    
    // Check if player exists in leaderboard
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
            factory: defect.factoryId || p.factory
          };
        }
        return p;
      });
      localStorage.setItem('defect-bingo-players', JSON.stringify(updatedPlayers));
    } else {
      // Create new player
      const newPlayer = {
        id: defect.operatorId || crypto.randomUUID(),
        name: playerName,
        role: 'operator',
        score: 5,
        bingoCount: 0,
        defectsFound: 1,
        epfNumber: defect.epfNumber,
        line: defect.lineNumber,
        factory: defect.factoryId
      };
      localStorage.setItem('defect-bingo-players', JSON.stringify([...players, newPlayer]));
    }
    
    // Also update plant and line performance data
    updatePlantPerformanceData(defect);
  };
  
  // Function to update plant performance data with new defects
  const updatePlantPerformanceData = (defect: RecordedDefect) => {
    // Get existing performance data or initialize empty
    const plantPerformance = JSON.parse(localStorage.getItem('plant-performance') || '{}');
    
    // Initialize plant if doesn't exist
    if (!plantPerformance[defect.factoryId]) {
      plantPerformance[defect.factoryId] = {
        totalDefects: 0,
        defectsByLine: {},
        linePerformance: {}
      };
    }
    
    // Update plant data
    plantPerformance[defect.factoryId].totalDefects += 1;
    
    // Initialize line if doesn't exist
    if (!plantPerformance[defect.factoryId].defectsByLine[defect.lineNumber]) {
      plantPerformance[defect.factoryId].defectsByLine[defect.lineNumber] = 0;
      plantPerformance[defect.factoryId].linePerformance[defect.lineNumber] = {
        efficiency: 100,
        quality: 100,
        lastUpdated: new Date().toISOString()
      };
    }
    
    // Update line data
    plantPerformance[defect.factoryId].defectsByLine[defect.lineNumber] += 1;
    
    // Simulate line performance changes
    const efficiency = Math.max(70, 100 - (plantPerformance[defect.factoryId].defectsByLine[defect.lineNumber] * 2));
    const quality = Math.max(80, 100 - (plantPerformance[defect.factoryId].defectsByLine[defect.lineNumber] * 1.5));
    
    plantPerformance[defect.factoryId].linePerformance[defect.lineNumber] = {
      efficiency,
      quality,
      lastUpdated: new Date().toISOString()
    };
    
    // Save updated performance data
    localStorage.setItem('plant-performance', JSON.stringify(plantPerformance));
  };
  
  // Operator management functions
  const addOperator = (newOperator: Operator) => {
    // Generate an ID if not provided
    if (!newOperator.id) {
      newOperator.id = crypto.randomUUID();
    }
    
    // Check if operator with same EPF number already exists
    const existingOperator = operators.find(op => op.epfNumber === newOperator.epfNumber);
    if (existingOperator) {
      toast.error("Operator with this EPF number already exists", {
        description: `EPF ${newOperator.epfNumber} is already assigned to ${existingOperator.name}`
      });
      return null;
    }
    
    // Add the new operator
    const updatedOperators = [...operators, newOperator];
    setOperators(updatedOperators);
    
    toast.success("Operator added successfully", {
      description: `${newOperator.name} (${newOperator.epfNumber}) added to ${newOperator.factory} - Line ${newOperator.line}`
    });
    
    return newOperator;
  };
  
  const updateOperator = (operatorId: string, updatedData: Partial<Operator>) => {
    // Check if operator exists
    const operatorExists = operators.some(op => op.id === operatorId);
    if (!operatorExists) {
      toast.error("Operator not found", {
        description: "Cannot update non-existent operator"
      });
      return null;
    }
    
    // Check if EPF number is being changed and is unique
    if (updatedData.epfNumber) {
      const existingOperator = operators.find(op => 
        op.epfNumber === updatedData.epfNumber && op.id !== operatorId
      );
      if (existingOperator) {
        toast.error("EPF number already in use", {
          description: `EPF ${updatedData.epfNumber} is already assigned to ${existingOperator.name}`
        });
        return null;
      }
    }
    
    // Update the operator
    const updatedOperators = operators.map(op => 
      op.id === operatorId ? { ...op, ...updatedData } : op
    );
    setOperators(updatedOperators);
    
    const updatedOperator = updatedOperators.find(op => op.id === operatorId);
    
    toast.success("Operator updated successfully", {
      description: `${updatedOperator?.name} updated`
    });
    
    return updatedOperator;
  };
  
  const removeOperator = (operatorId: string) => {
    const operatorToRemove = operators.find(op => op.id === operatorId);
    if (!operatorToRemove) {
      toast.error("Operator not found", {
        description: "Cannot remove non-existent operator"
      });
      return false;
    }
    
    const updatedOperators = operators.filter(op => op.id !== operatorId);
    setOperators(updatedOperators);
    
    toast.success("Operator removed", {
      description: `${operatorToRemove.name} has been removed from the system`
    });
    
    return true;
  };
  
  const getOperatorsByLine = (factoryId: string, lineNumber: string) => {
    return operators.filter(op => op.factory === factoryId && op.line === lineNumber);
  };
  
  const getOperatorsByFactory = (factoryId: string) => {
    return operators.filter(op => op.factory === factoryId);
  };
  
  const getAllOperators = () => {
    return operators;
  };
  
  // Function to update dashboard data in localStorage
  const updateDashboardData = () => {
    // Get most common defect type
    const getTopDefectType = () => {
      const defectCounts = {} as Record<string, number>;
      
      recentDefects.forEach(defect => {
        const defectCode = defect.defectType.code.toString();
        defectCounts[defectCode] = (defectCounts[defectCode] || 0) + 1;
      });
      
      let topDefectCode = '';
      let topCount = 0;
      
      for (const [code, count] of Object.entries(defectCounts)) {
        if (count > topCount) {
          topCount = count;
          topDefectCode = code;
        }
      }
      
      return recentDefects.find(d => d.defectType.code.toString() === topDefectCode)?.defectType || null;
    };
    
    // Get most common garment part
    const getTopGarmentPart = () => {
      const partCounts = {} as Record<string, number>;
      
      recentDefects.forEach(defect => {
        const partCode = defect.garmentPart.code;
        partCounts[partCode] = (partCounts[partCode] || 0) + 1;
      });
      
      let topPartCode = '';
      let topCount = 0;
      
      for (const [code, count] of Object.entries(partCounts)) {
        if (count > topCount) {
          topCount = count;
          topPartCode = code;
        }
      }
      
      return recentDefects.find(d => d.garmentPart.code === topPartCode)?.garmentPart || null;
    };
    
    // Get defects by plant and line for incentive calculations
    const getDefectsByPlantAndLine = () => {
      const result = {} as Record<string, Record<string, RecordedDefect[]>>;
      
      // Initialize the allowed plants
      ALLOWED_PLANTS.forEach(plantId => {
        result[plantId] = {};
        // Get factory info
        const factory = FACTORIES.find(f => f.id === plantId);
        // Initialize with available lines
        if (factory) {
          factory.lines.forEach(line => {
            result[plantId][line] = [];
          });
        } else {
          // Default lines if factory not found
          ['L1', 'L2', 'L3', 'L4'].forEach(line => {
            result[plantId][line] = [];
          });
        }
      });
      
      // Populate with actual defects
      recentDefects.forEach(defect => {
        if (ALLOWED_PLANTS.includes(defect.factoryId)) {
          if (!result[defect.factoryId][defect.lineNumber]) {
            result[defect.factoryId][defect.lineNumber] = [];
          }
          
          result[defect.factoryId][defect.lineNumber].push(defect);
        }
      });
      
      return result;
    };
  };
  
  // Helper function to convert day abbreviation to index
  const getDayIndex = (dayAbbr: string) => {
    const map: Record<string, number> = {
      'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6
    };
    return map[dayAbbr] !== undefined ? map[dayAbbr] : -1;
  };
  
  // Group defects by factory
  const defectsByFactory = recentDefects.reduce((acc, defect) => {
    const factory = acc.find(f => f.id === defect.factoryId);
    if (factory) {
      factory.defects.push(defect);
    } else {
      acc.push({
        id: defect.factoryId,
        name: `Plant ${defect.factoryId}`,
        defects: [defect],
      });
    }
    return acc;
  }, [] as Array<{id: string, name: string, defects: RecordedDefect[]}>);
  
  // Group defects by production line
  const defectsByLine = recentDefects.reduce((acc, defect) => {
    const lineKey = `${defect.factoryId}-${defect.lineNumber}`;
    const line = acc.find(l => l.id === lineKey);
    if (line) {
      line.defects.push(defect);
    } else {
      acc.push({
        id: lineKey,
        factoryId: defect.factoryId,
        lineNumber: defect.lineNumber,
        defects: [defect],
      });
    }
    return acc;
  }, [] as Array<{id: string, factoryId: string, lineNumber: string, defects: RecordedDefect[]}>);
  
  // Calculate important metrics
  const totalDefects = recentDefects.length;
  const verifiedDefects = recentDefects.filter(d => d.status === 'verified').length;
  const rejectedDefects = recentDefects.filter(d => d.status === 'rejected').length;
  const pendingDefects = recentDefects.filter(d => d.status === 'pending').length;
  const reworkedDefects = recentDefects.filter(d => d.reworked).length;
  
  // Get the defect validation rate
  const getValidationRate = () => {
    if (totalDefects === 0) return 0;
    return (verifiedDefects / totalDefects) * 100;
  };
  
  // Get defect stats for a specific plant
  const getPlantStats = (plantId: string) => {
    const plantDefects = recentDefects.filter(d => d.factoryId === plantId);
    
    return {
      totalDefects: plantDefects.length,
      verifiedDefects: plantDefects.filter(d => d.status === 'verified').length,
      rejectedDefects: plantDefects.filter(d => d.status === 'rejected').length,
      pendingDefects: plantDefects.filter(d => d.status === 'pending').length,
      reworkedDefects: plantDefects.filter(d => d.reworked).length,
    };
  };
  
  // Get the allowed plants
  const getAllowedPlants = () => ALLOWED_PLANTS;
  
  return {
    recentDefects,
    setRecentDefects,
    addDefect,
    updateDefectStatus,
    markAsReworked,
    defectsByFactory,
    defectsByLine,
    totalDefects,
    verifiedDefects,
    rejectedDefects,
    pendingDefects,
    reworkedDefects,
    getValidationRate,
    updateDashboardData,
    getPlantStats,
    getAllowedPlants,
    // Operator management
    operators,
    addOperator,
    updateOperator,
    removeOperator,
    getOperatorsByLine,
    getOperatorsByFactory,
    getAllOperators
  };
};
