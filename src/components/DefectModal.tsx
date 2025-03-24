
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { CheckCircle, XCircle } from 'lucide-react';
import { GarmentPart, DefectType, BingoCell } from '@/lib/types';
import { toast } from 'sonner';
import { DEFECT_TYPES, GARMENT_PARTS } from '@/lib/game-data';

interface DefectModalProps {
  isOpen: boolean;
  onClose: () => void;
  cell?: BingoCell | null;
  onValidate: (garmentPart: GarmentPart | null, defectType: DefectType | null, valid: boolean) => void;
}

const DefectModal = ({ 
  isOpen, 
  onClose, 
  cell,
  onValidate 
}: DefectModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('garment');
  const [selectedGarmentPart, setSelectedGarmentPart] = useState<GarmentPart | null>(cell?.garmentPart || null);
  const [selectedDefectType, setSelectedDefectType] = useState<DefectType | null>(cell?.defectType || null);
  
  // Reset selections when modal opens with new cell
  React.useEffect(() => {
    if (isOpen) {
      setSelectedGarmentPart(cell?.garmentPart || null);
      setSelectedDefectType(cell?.defectType || null);
      setActiveTab('garment');
    }
  }, [isOpen, cell]);

  const handleValidate = () => {
    if (!selectedGarmentPart || !selectedDefectType) {
      toast.error('Please select both garment part and defect type');
      return;
    }
    
    setIsLoading(true);
    
    // Simulate validation delay
    setTimeout(() => {
      onValidate(selectedGarmentPart, selectedDefectType, true);
      setIsLoading(false);
      
      toast.success('Defect validated!', {
        description: 'You earned points for this detection',
      });
      
      onClose();
    }, 800);
  };

  const handleGarmentPartSelect = (part: GarmentPart) => {
    setSelectedGarmentPart(part);
    setActiveTab('defect');
  };

  const handleDefectTypeSelect = (defect: DefectType) => {
    setSelectedDefectType(defect);
  };

  const canProceed = selectedGarmentPart && selectedDefectType;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select Defect</DialogTitle>
          <DialogDescription>
            Choose the garment part and defect type for this cell.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="garment">Garment Part</TabsTrigger>
            <TabsTrigger value="defect">Defect Type</TabsTrigger>
          </TabsList>
          
          <TabsContent value="garment" className="mt-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-[300px] overflow-y-auto p-1">
              {GARMENT_PARTS.map((part) => (
                <div
                  key={part.code}
                  className={`p-2 border rounded-md cursor-pointer transition-all ${
                    selectedGarmentPart?.code === part.code 
                      ? 'bg-primary/20 border-primary' 
                      : 'hover:bg-accent'
                  }`}
                  onClick={() => handleGarmentPartSelect(part)}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center h-7 w-7 rounded-full bg-primary/10 text-primary font-medium text-xs">
                      {part.code}
                    </div>
                    <span className="text-sm">{part.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="defect" className="mt-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-[300px] overflow-y-auto p-1">
              {DEFECT_TYPES.map((defect) => (
                <div
                  key={defect.code}
                  className={`p-2 border rounded-md cursor-pointer transition-all ${
                    selectedDefectType?.code === defect.code 
                      ? 'bg-primary/20 border-primary' 
                      : 'hover:bg-accent'
                  }`}
                  onClick={() => handleDefectTypeSelect(defect)}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center h-7 w-7 rounded-full bg-primary/10 text-primary font-medium text-xs">
                      {defect.code}
                    </div>
                    <span className="text-sm">{defect.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="mt-4">
          <h4 className="text-sm font-medium mb-2">Selected Items:</h4>
          <div className="flex flex-wrap gap-2">
            {selectedGarmentPart && (
              <div className="bg-accent rounded-md py-1 px-2 text-xs flex items-center gap-1">
                <span className="font-medium">{selectedGarmentPart.code}:</span> 
                <span>{selectedGarmentPart.name}</span>
              </div>
            )}
            
            {selectedDefectType && (
              <div className="bg-accent rounded-md py-1 px-2 text-xs flex items-center gap-1">
                <span className="font-medium">{selectedDefectType.code}:</span> 
                <span>{selectedDefectType.name}</span>
              </div>
            )}
          </div>
        </div>
        
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
            <CheckCircle className="h-4 w-4" />
            Validate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DefectModal;
