import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CheckCircle, XCircle, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BingoCell } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Textarea } from '@/components/ui/textarea';

interface SupervisorNotificationProps {
  isOpen: boolean;
  onClose: () => void;
  completedLine: {
    type: string;
    index: number;
  } | null;
  cells: BingoCell[];
  playerName: string;
  onValidate: (isValid: boolean) => void;
}

const SupervisorNotification: React.FC<SupervisorNotificationProps> = ({
  isOpen,
  onClose,
  completedLine,
  cells,
  playerName,
  onValidate
}) => {
  const [awards, setAwards] = useLocalStorage('quality-awards', []);
  const [showAward, setShowAward] = useState(false);
  const [comment, setComment] = useState('');
  
  // Show award animation when a line is validated
  useEffect(() => {
    if (showAward) {
      const timer = setTimeout(() => {
        setShowAward(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [showAward]);
  
  const handleValidate = () => {
    onValidate(true);
    
    // Add award
    const newAwards = [...awards];
    const lightningAward = newAwards.find(a => a.id === "lightning-spotter");
    
    if (lightningAward && !lightningAward.recipients.includes(playerName)) {
      lightningAward.recipients.push(playerName);
      setAwards(newAwards);
      setShowAward(true);
      
      toast.success("Award earned!", {
        description: `${playerName} earned the Lightning Spotter award!`,
        duration: 5000,
      });
    }
    
    onClose();
  };
  
  const handleReject = () => {
    onValidate(false);
    toast.error("Bingo line rejected", {
      description: "Supervisor has rejected this Bingo line",
    });
    onClose();
  };
  
  // Get the selected cell to display details
  const selectedCell = cells.length > 0 ? cells[0] : null;
  
  if (!completedLine || !cells.length) return null;
  
  return (
    <>
      <AlertDialog open={isOpen} onOpenChange={onClose}>
        <AlertDialogContent className="max-w-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex justify-between items-center">
              <h2 className="text-xl">Validate Defect</h2>
              <button 
                className="text-gray-500 hover:text-gray-700" 
                onClick={onClose}
              >
                ✕
              </button>
            </AlertDialogTitle>
            <p className="text-gray-500 mt-2">
              Review the defect information and provide feedback
            </p>
          </AlertDialogHeader>
          
          <div className="my-6">
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
              <div className="flex items-start">
                <div className="text-amber-500 mr-3">
                  <Award size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-4">Defect Details</h3>
                  
                  <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                    <div>
                      <p className="text-gray-500">Garment Part:</p>
                      <p className="font-medium">{selectedCell?.garmentPart?.code || 'B'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Defect Type:</p>
                      <p className="font-medium">{selectedCell?.defectType?.code || '2'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Operator:</p>
                      <p className="font-medium truncate">{playerName}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Factory:</p>
                      <p className="font-medium">SCASCADC</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Line:</p>
                      <p className="font-medium">Line L2</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Time:</p>
                      <p className="font-medium">{new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-200 pt-4 mb-4">
            <h3 className="text-lg font-medium mb-2">Supervisor Comment</h3>
            <Textarea
              placeholder="Add a comment (required for rejection)"
              className="w-full"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
          
          <div className="flex justify-between mt-4">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="w-24"
            >
              Cancel
            </Button>
            
            <div className="flex gap-2">
              <Button 
                variant="destructive"
                onClick={handleReject}
                className="flex items-center gap-1 w-24"
              >
                <XCircle className="h-4 w-4" />
                Reject
              </Button>
              
              <Button 
                className="bg-blue-950 hover:bg-blue-900 flex items-center gap-1 w-24"
                onClick={handleValidate}
              >
                <CheckCircle className="h-4 w-4" />
                Verify
              </Button>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>
      
      {showAward && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="bg-black/80 text-white p-8 rounded-lg animate-scale-in">
            <div className="text-center">
              <Award className="h-20 w-20 text-yellow-500 mx-auto mb-4 animate-bounce" />
              <h2 className="text-2xl font-bold mb-2">Award Earned!</h2>
              <p className="text-lg mb-4">Lightning Spotter</p>
              <p className="text-sm opacity-80">First to complete a Bingo line</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SupervisorNotification;
