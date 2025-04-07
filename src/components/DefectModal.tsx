import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { CheckCircle, XCircle, Plus, Save } from 'lucide-react';
import { GarmentPart, DefectType, BingoCell } from '@/lib/types';
import { toast } from 'sonner';
import { DEFECT_TYPES, GARMENT_PARTS, COMMON_DEFECT_PAIRS } from '@/lib/game-data';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
  
  // New state for custom parts/defects
  const [newGarmentPartName, setNewGarmentPartName] = useState('');
  const [newDefectTypeName, setNewDefectTypeName] = useState('');
  const [customGarmentParts, setCustomGarmentParts] = useState<GarmentPart[]>([]);
  const [customDefectTypes, setCustomDefectTypes] = useState<DefectType[]>([]);
  const [isAddingGarmentPart, setIsAddingGarmentPart] = useState(false);
  const [isAddingDefectType, setIsAddingDefectType] = useState(false);

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

  // Load custom parts and defects from localStorage
  useEffect(() => {
    const savedGarmentParts = localStorage.getItem('custom-garment-parts');
    const savedDefectTypes = localStorage.getItem('custom-defect-types');
    
    if (savedGarmentParts) {
      try {
        setCustomGarmentParts(JSON.parse(savedGarmentParts));
      } catch (e) {
        console.error('Error parsing custom garment parts:', e);
      }
    }
    
    if (savedDefectTypes) {
      try {
        setCustomDefectTypes(JSON.parse(savedDefectTypes));
      } catch (e) {
        console.error('Error parsing custom defect types:', e);
      }
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      setSelectedGarmentPart(null);
      setSelectedDefectType(null);
      setActiveTab('garment');
      setHasTriedToSubmit(false);
      setIsAddingGarmentPart(false);
      setIsAddingDefectType(false);
      setNewGarmentPartName('');
      setNewDefectTypeName('');
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

  // Get all garment parts (predefined + custom)
  const getAllGarmentParts = () => {
    return [...GARMENT_PARTS, ...customGarmentParts];
  };

  // Get all defect types (predefined + custom)
  const getAllDefectTypes = () => {
    return [...DEFECT_TYPES, ...customDefectTypes];
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

  // Handle adding a new garment part
  const handleAddGarmentPart = () => {
    if (!newGarmentPartName.trim()) {
      toast.error("Name required", {
        description: "Please enter a name for the new garment part"
      });
      return;
    }
    
    // Generate a unique code (use next letter or combination if we run out)
    const existingCodes = new Set([...GARMENT_PARTS, ...customGarmentParts].map(p => p.code));
    let code = '';
    
    // Try to find an available letter code (A-Z)
    for (let i = 65; i <= 90; i++) {
      const potentialCode = String.fromCharCode(i);
      if (!existingCodes.has(potentialCode)) {
        code = potentialCode;
        break;
      }
    }
    
    // If all single letters are taken, use AA, AB, etc.
    if (!code) {
      let attempt = 'AA';
      while (existingCodes.has(attempt)) {
        // Get the last character and increment it
        const lastChar = attempt.charCodeAt(attempt.length - 1);
        if (lastChar < 90) { // Z
          attempt = attempt.substring(0, attempt.length - 1) + String.fromCharCode(lastChar + 1);
        } else {
          // If we hit Z, increment the previous letter and reset the last one to A
          const prevChar = attempt.charCodeAt(attempt.length - 2);
          attempt = String.fromCharCode(prevChar + 1) + 'A';
        }
      }
      code = attempt;
    }
    
    const newPart: GarmentPart = {
      code,
      name: newGarmentPartName.trim()
    };
    
    const updatedCustomParts = [...customGarmentParts, newPart];
    setCustomGarmentParts(updatedCustomParts);
    localStorage.setItem('custom-garment-parts', JSON.stringify(updatedCustomParts));
    
    toast.success("Garment part added", {
      description: `${newPart.name} (${newPart.code}) has been added to your list`
    });
    
    // Select the new part
    handleGarmentSelect(newPart);
    
    // Reset the form
    setNewGarmentPartName('');
    setIsAddingGarmentPart(false);
  };

  // Handle adding a new defect type
  const handleAddDefectType = () => {
    if (!newDefectTypeName.trim()) {
      toast.error("Name required", {
        description: "Please enter a name for the new defect type"
      });
      return;
    }
    
    // Generate a code (next available number)
    const existingCodes = new Set([...DEFECT_TYPES, ...customDefectTypes].map(d => d.code));
    let code = 1;
    
    while (existingCodes.has(code)) {
      code++;
    }
    
    const newDefect: DefectType = {
      code,
      name: newDefectTypeName.trim()
    };
    
    const updatedCustomDefects = [...customDefectTypes, newDefect];
    setCustomDefectTypes(updatedCustomDefects);
    localStorage.setItem('custom-defect-types', JSON.stringify(updatedCustomDefects));
    
    toast.success("Defect type added", {
      description: `${newDefect.name} (${newDefect.code}) has been added to your list`
    });
    
    // Select the new defect
    setSelectedDefectType(newDefect);
    
    // Reset the form
    setNewDefectTypeName('');
    setIsAddingDefectType(false);
  };

  const canProceed = isValidationMode ? true : (selectedGarmentPart && selectedDefectType);
  const allGarmentParts = getAllGarmentParts();
  const allDefectTypes = getAllDefectTypes();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle>
            {isValidationMode ? "Validate Defect" : "Select Defect"}
          </DialogTitle>
          <DialogDescription>
            {isValidationMode ? (
              "Confirm this defect has been properly identified."
            ) : (
              "Choose the garment part and defect type for this cell."
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
              {isAddingGarmentPart ? (
                <div className="mb-4 space-y-4 p-4 border rounded-md">
                  <Label htmlFor="new-garment-part">Add New Garment Part</Label>
                  <Input
                    id="new-garment-part"
                    placeholder="Enter garment part name"
                    value={newGarmentPartName}
                    onChange={(e) => setNewGarmentPartName(e.target.value)}
                  />
                  <div className="flex space-x-2 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsAddingGarmentPart(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleAddGarmentPart}
                    >
                      <Save className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="mb-4 w-full"
                  onClick={() => setIsAddingGarmentPart(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add New Garment Part
                </Button>
              )}
              
              <div className="grid grid-cols-2 gap-2 max-h-[400px] overflow-y-auto p-1">
                {allGarmentParts.map(part => (
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
              {isAddingDefectType ? (
                <div className="mb-4 space-y-4 p-4 border rounded-md">
                  <Label htmlFor="new-defect-type">Add New Defect Type</Label>
                  <Input
                    id="new-defect-type"
                    placeholder="Enter defect type name"
                    value={newDefectTypeName}
                    onChange={(e) => setNewDefectTypeName(e.target.value)}
                  />
                  <div className="flex space-x-2 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsAddingDefectType(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleAddDefectType}
                    >
                      <Save className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="mb-4 w-full"
                  onClick={() => setIsAddingDefectType(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add New Defect Type
                </Button>
              )}
              
              <div className="grid grid-cols-2 gap-2 max-h-[400px] overflow-y-auto p-1">
                {allDefectTypes.map(defect => (
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
                <Save className="h-4 w-4" />
                Record Defect
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DefectModal;
