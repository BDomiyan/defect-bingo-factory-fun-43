
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle } from 'lucide-react';
import { GarmentPart, DefectType } from '@/lib/types';
import { toast } from 'sonner';

interface DefectModalProps {
  isOpen: boolean;
  onClose: () => void;
  garmentPart: GarmentPart | null;
  defectType: DefectType | null;
  onValidate: (valid: boolean) => void;
}

const DefectModal = ({ 
  isOpen, 
  onClose, 
  garmentPart, 
  defectType, 
  onValidate 
}: DefectModalProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleValidate = (isValid: boolean) => {
    setIsLoading(true);
    
    // Simulate validation delay
    setTimeout(() => {
      onValidate(isValid);
      setIsLoading(false);
      
      if (isValid) {
        toast.success('Defect validated!', {
          description: 'You earned points for this detection',
        });
      } else {
        toast.error('Validation failed', {
          description: 'This defect was not confirmed',
        });
      }
      
      onClose();
    }, 800);
  };

  if (!garmentPart || !defectType) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Validate Defect</DialogTitle>
          <DialogDescription>
            Confirm that this defect has been correctly identified before marking it.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border bg-accent/50 p-3">
              <p className="text-xs text-muted-foreground">Garment Part</p>
              <p className="font-medium">{garmentPart.name}</p>
              <p className="text-xs text-muted-foreground mt-1">Code: {garmentPart.code}</p>
            </div>
            
            <div className="rounded-lg border bg-accent/50 p-3">
              <p className="text-xs text-muted-foreground">Defect Type</p>
              <p className="font-medium">{defectType.name}</p>
              <p className="text-xs text-muted-foreground mt-1">Code: {defectType.code}</p>
            </div>
          </div>
          
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground mb-2">Validation Criteria</p>
            <ul className="space-y-1 text-sm">
              <li className="flex items-start">
                <CheckCircle className="mr-2 h-4 w-4 text-green-500 mt-0.5" />
                <span>Defect must be visible and match the specified type</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="mr-2 h-4 w-4 text-green-500 mt-0.5" />
                <span>Location must match the specified garment part</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="mr-2 h-4 w-4 text-green-500 mt-0.5" />
                <span>Defect must affect product quality or appearance</span>
              </li>
            </ul>
          </div>
        </div>
        
        <DialogFooter className="flex flex-row justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => handleValidate(false)}
            disabled={isLoading}
            className="gap-1"
          >
            <XCircle className="h-4 w-4 text-destructive" />
            Reject
          </Button>
          <Button
            onClick={() => handleValidate(true)}
            disabled={isLoading}
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
