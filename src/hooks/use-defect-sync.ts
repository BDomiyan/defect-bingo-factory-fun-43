
import { useEffect } from 'react';
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
  
  // Function to add a new defect
  const addDefect = (defect: RecordedDefect) => {
    setRecentDefects((prev: RecordedDefect[]) => [defect, ...prev.slice(0, 19)]);
    return defect;
  };
  
  // Function to update a defect status
  const updateDefectStatus = (defectId: string, status: 'pending' | 'verified' | 'rejected') => {
    setRecentDefects((prev: RecordedDefect[]) => 
      prev.map(d => d.id === defectId ? { ...d, status } : d)
    );
  };
  
  // Function to mark a defect as reworked
  const markAsReworked = (defectId: string, reworkTime?: number) => {
    setRecentDefects((prev: RecordedDefect[]) => 
      prev.map(d => d.id === defectId ? { ...d, reworked: true, reworkTime } : d)
    );
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
  
  return {
    recentDefects,
    setRecentDefects,
    addDefect,
    updateDefectStatus,
    markAsReworked,
    defectsByFactory,
    totalDefects,
    verifiedDefects,
    rejectedDefects,
    reworkedDefects,
    getTopDefectType,
    getTopGarmentPart
  };
};
