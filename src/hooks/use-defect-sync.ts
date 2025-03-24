
import { useState, useEffect } from 'react';
import { useLocalStorage } from './use-local-storage';
import { DefectType, GarmentPart } from '@/lib/types';

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

/**
 * Custom hook to synchronize defect data across all components
 * Ensures consistent data between DefectRecorder, FactoryMetrics, and Dashboard
 */
export const useDefectSync = () => {
  const [recentDefects, setRecentDefects] = useLocalStorage<RecordedDefect[]>('recent-defects', []);
  
  // Update dashboard data whenever defects change
  useEffect(() => {
    updateDashboardData();
  }, [recentDefects]);
  
  // Function to add a new defect
  const addDefect = (defect: RecordedDefect) => {
    // Create a new array with the new defect at the beginning and limit to 20 items
    const updatedDefects = [defect, ...recentDefects.slice(0, 19)];
    setRecentDefects(updatedDefects);
    
    // Also update leaderboard data with the new defect
    updateLeaderboardData(defect);
    
    return defect;
  };
  
  // Function to update a defect status
  const updateDefectStatus = (defectId: string, status: 'pending' | 'verified' | 'rejected') => {
    const updatedDefects = recentDefects.map(d => 
      d.id === defectId ? { ...d, status } : d
    );
    setRecentDefects(updatedDefects);
  };
  
  // Function to mark a defect as reworked
  const markAsReworked = (defectId: string, reworkTime?: number) => {
    const updatedDefects = recentDefects.map(d => 
      d.id === defectId ? { ...d, reworked: true, reworkTime } : d
    );
    setRecentDefects(updatedDefects);
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
            score: p.score + 5
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
        defectsFound: 1
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
  
  // Function to update dashboard data in localStorage
  const updateDashboardData = () => {
    // Update line chart data
    const lineData = JSON.parse(localStorage.getItem('defect-bingo-line-data') || '[]');
    if (lineData.length > 0) {
      const today = new Date().getDay();
      const dayIndex = today === 0 ? 6 : today - 1; // Convert to 0-6 (Mon-Sun)
      lineData[dayIndex].count = recentDefects.length;
      localStorage.setItem('defect-bingo-line-data', JSON.stringify(lineData));
    }
    
    // Update bar chart data for garment parts
    if (recentDefects.length > 0) {
      const barData = JSON.parse(localStorage.getItem('defect-bingo-bar-data') || '[]');
      if (barData.length > 0) {
        // Count defects by garment part
        const partCounts: Record<string, number> = {};
        recentDefects.forEach(defect => {
          const partName = defect.garmentPart.name;
          partCounts[partName] = (partCounts[partName] || 0) + 1;
        });
        
        // Update bar data with new counts
        barData.forEach((item: any, index: number) => {
          const matchingPart = Object.keys(partCounts).find(part => 
            item.name.toLowerCase().includes(part.toLowerCase())
          );
          if (matchingPart) {
            barData[index].count = partCounts[matchingPart];
          }
        });
        
        localStorage.setItem('defect-bingo-bar-data', JSON.stringify(barData));
      }
      
      // Update pie chart data for defect types
      const pieData = JSON.parse(localStorage.getItem('defect-bingo-pie-data') || '[]');
      if (pieData.length > 0) {
        // Count defects by type
        const typeCounts: Record<string, number> = {};
        recentDefects.forEach(defect => {
          const typeName = defect.defectType.name;
          typeCounts[typeName] = (typeCounts[typeName] || 0) + 1;
        });
        
        // Update pie data with new counts
        pieData.forEach((item: any, index: number) => {
          const matchingType = Object.keys(typeCounts).find(type => 
            item.name.toLowerCase().includes(type.toLowerCase())
          );
          if (matchingType) {
            pieData[index].value = typeCounts[matchingType];
          }
        });
        
        localStorage.setItem('defect-bingo-pie-data', JSON.stringify(pieData));
      }
      
      // Update defect rate
      const randomFactor = Math.random() * 0.5 + 0.8; // Random factor between 0.8 and 1.3
      const newDefectRate = Math.min(5, Math.max(1, (recentDefects.length / 40) * randomFactor));
      localStorage.setItem('defect-rate', newDefectRate.toString());
    }
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
  const reworkedDefects = recentDefects.filter(d => d.reworked).length;
  
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
    
    recentDefects.forEach(defect => {
      if (!result[defect.factoryId]) {
        result[defect.factoryId] = {};
      }
      
      if (!result[defect.factoryId][defect.lineNumber]) {
        result[defect.factoryId][defect.lineNumber] = [];
      }
      
      result[defect.factoryId][defect.lineNumber].push(defect);
    });
    
    return result;
  };
  
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
    reworkedDefects,
    getTopDefectType,
    getTopGarmentPart,
    updateDashboardData,
    getDefectsByPlantAndLine
  };
};
