import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { CheckCircle, XCircle, Plus } from 'lucide-react';
import { GarmentPart, DefectType, BingoCell } from '@/lib/types';
import { toast } from 'sonner';
import { DEFECT_TYPES, GARMENT_PARTS, COMMON_DEFECT_PAIRS } from '@/lib/game-data';

interface DefectModalProps {
  isOpen: boolean;
  onClose: () => void;
  cell: BingoCell | null;
  onValidate: (garmentPart: GarmentPart | null, defectType: DefectType | null, valid: boolean) => void;
}

const DefectModal: React.FC<DefectModalProps> = ({
  isOpen,
  onClose,
  cell,
  onValidate
}) => {
  const [activeTab, setActiveTab] = useState('garment');
  const [selectedGarmentPart, setSelectedGarmentPart] = useState<GarmentPart | null>(null);
  const [selectedDefectType, setSelectedDefectType] = useState<DefectType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasTriedToSubmit, setHasTriedToSubmit] = useState(false);

  // Check if we're in validation mode (cell has defect but not marked)
  const isValidationMode = Boolean(
    cell?.garmentPart && 
    cell?.defectType && 
    !cell?.marked
  );

  // Check if cell is already validated
  const isAlreadyValidated = Boolean(
    cell?.garmentPart && 
    cell?.defectType && 
    cell?.marked
  );

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      setSelectedGarmentPart(null);
      setSelectedDefectType(null);
      setActiveTab('garment');
      setHasTriedToSubmit(false);
      return;
    }

    if (cell) {
      // If cell has data, use it
      setSelectedGarmentPart(cell.garmentPart || null);
      setSelectedDefectType(cell.defectType || null);
      
      if (!isValidationMode && !isAlreadyValidated) {
        // Only switch tabs if we're adding a new defect
        setActiveTab(cell.garmentPart ? 'defect' : 'garment');
      }
    }
  }, [isOpen, cell, isValidationMode, isAlreadyValidated]);

  const getAvailableDefectTypes = () => {
    if (!selectedGarmentPart) return [];
    
    const commonPair = COMMON_DEFECT_PAIRS.find(p => p.garmentCode === selectedGarmentPart.code);
    if (!commonPair) return DEFECT_TYPES;
    
    return DEFECT_TYPES.filter(defect => 
      commonPair.defectCodes.includes(defect.code)
    );
  };

  const handleGarmentSelect = (part: GarmentPart) => {
    setSelectedGarmentPart(part);
    setSelectedDefectType(null); // Reset defect selection when garment changes
    setActiveTab('defect'); // Automatically switch to defect tab
  };

  const validateFormCompleteness = (): boolean => {
    // In validation mode, we already have both garment part and defect type
    if (isValidationMode) return true;
    
    // Check if both garment part and defect type are selected
    if (!selectedGarmentPart || !selectedDefectType) {
      setHasTriedToSubmit(true);
      
      if (!selectedGarmentPart) {
        toast.error("Garment part required", {
          description: "Please select a garment part first"
        });
        setActiveTab('garment');
      } else if (!selectedDefectType) {
        toast.error("Defect type required", {
          description: "Please select a defect type"
        });
        setActiveTab('defect');
      }
      
      return false;
    }
    
    return true;
  };

  const handleValidate = () => {
    if (!validateFormCompleteness()) return;
    
    setIsLoading(true);
    
    try {
      if (isValidationMode && cell) {
        // In validation mode, use the cell's existing data
        onValidate(cell.garmentPart, cell.defectType, true);
      } else if (!isAlreadyValidated) {
        // In add mode, use the selected data
        onValidate(selectedGarmentPart, selectedDefectType, true);
      }
    } finally {
      setIsLoading(false);
      onClose(); // Close the modal after validation
    }
  };

  // Handle already validated cells silently without error messages
  useEffect(() => {
    if (isOpen && isAlreadyValidated) {
      onClose();
    }
  }, [isOpen, isAlreadyValidated, onClose]);

  const canProceed = isValidationMode ? true : (selectedGarmentPart && selectedDefectType);
  const availableDefects = getAvailableDefectTypes();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle>
            {isValidationMode ? "Validate Defect" : "Add New Defect"}
          </DialogTitle>
          <DialogDescription>
            {isValidationMode ? (
              "Confirm this defect has been properly identified."
            ) : (
              <>
                Choose the garment part and defect type for this cell.
                {selectedGarmentPart && (
                  <div className="mt-1 text-xs text-primary">
                    Showing defect types commonly associated with {selectedGarmentPart.name}
                  </div>
                )}
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {isValidationMode ? (
          <div className="space-y-4">
            <div className="rounded-lg border p-4">
              <div className="text-sm font-medium">Current Defect:</div>
              <div className="mt-2 space-y-2">
                <div className="text-sm">
                  <span className="font-medium">Garment Part:</span> {cell?.garmentPart?.name} ({cell?.garmentPart?.code})
                </div>
                <div className="text-sm">
                  <span className="font-medium">Defect Type:</span> {cell?.defectType?.name} ({cell?.defectType?.code})
                </div>
              </div>
            </div>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="garment">Garment Part</TabsTrigger>
              <TabsTrigger value="defect" disabled={!selectedGarmentPart}>
                Defect Type {!selectedGarmentPart && "(Select Garment First)"}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="garment" className="mt-4">
              <div className="grid grid-cols-2 gap-2 max-h-[400px] overflow-y-auto p-1">
                {GARMENT_PARTS.map(part => (
                  <Button
                    key={part.code}
                    variant={selectedGarmentPart?.code === part.code ? "default" : "outline"}
                    className="justify-start h-auto py-2"
                    onClick={() => handleGarmentSelect(part)}
                  >
                    <div className="text-left">
                      <div className="font-medium">{part.name}</div>
                      <div className="text-xs text-muted-foreground">{part.code}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="defect" className="mt-4">
              <div className="grid grid-cols-2 gap-2 max-h-[400px] overflow-y-auto p-1">
                {availableDefects.map(defect => (
                  <Button
                    key={defect.code}
                    variant={selectedDefectType?.code === defect.code ? "default" : "outline"}
                    className="justify-start h-auto py-2"
                    onClick={() => setSelectedDefectType(defect)}
                  >
                    <div className="text-left">
                      <div className="font-medium">{defect.name}</div>
                      <div className="text-xs text-muted-foreground">{defect.code}</div>
                    </div>
                  </Button>
                ))}
              </div>
              {availableDefects.length === 0 && selectedGarmentPart && (
                <div className="text-center text-sm text-muted-foreground py-4">
                  No common defects found for {selectedGarmentPart.name}. Please select a different garment part.
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
        
        <DialogFooter className="flex flex-row justify-end gap-2 mt-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="gap-1"
          >
            <XCircle className="h-4 w-4 text-destructive" />
            Cancel
          </Button>
          <Button
            onClick={handleValidate}
            disabled={isLoading || !canProceed}
            className="gap-1"
          >
            {isValidationMode ? (
              <>
                <CheckCircle className="h-4 w-4" />
                Validate
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Add Defect
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DefectModal;
