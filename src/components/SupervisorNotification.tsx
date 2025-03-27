
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CheckCircle, XCircle, Eye, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BingoCell } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useLocalStorage } from '@/hooks/use-local-storage';

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
  
  if (!completedLine || !cells.length) return null;
  
  return (
    <>
      <AlertDialog open={isOpen} onOpenChange={onClose}>
        <AlertDialogContent className="max-w-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl text-purple-600 flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-500" />
              Bingo Line Completion!
            </AlertDialogTitle>
            <AlertDialogDescription>
              <p className="mb-2">
                <span className="font-semibold text-foreground">{playerName}</span> has completed a 
                <Badge variant="outline" className="mx-1 bg-primary/10">
                  {completedLine.type === 'row' ? 'Row' : 
                   completedLine.type === 'column' ? 'Column' : 'Diagonal'} {completedLine.index + 1}
                </Badge>
                line on their Bingo board.
              </p>
              <p className="text-muted-foreground mb-4">
                Please verify that all defects in this line are valid before approving.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="max-h-72 overflow-auto p-1">
            <div className="grid gap-3">
              {cells.map((cell, index) => (
                <Card key={index} className="p-3 shadow-sm grid grid-cols-[auto_1fr] gap-3 items-center border-l-4 border-l-primary">
                  <div className="rounded-full bg-primary/10 w-8 h-8 flex items-center justify-center text-primary font-medium">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium text-sm">
                      {cell.garmentPart?.name} - {cell.defectType?.name}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                      <span>
                        Validated at: {cell.validatedAt ? new Date(cell.validatedAt).toLocaleTimeString() : 'N/A'}
                      </span>
                      <span className="flex items-center">
                        <Eye className="h-3 w-3 mr-1" />
                        {cell.validatedBy || playerName}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
          
          <AlertDialogFooter className="gap-2 sm:gap-0 mt-4">
            <AlertDialogCancel asChild>
              <Button variant="outline" className="flex items-center gap-1">
                <XCircle className="h-4 w-4 text-destructive" />
                Reject Line
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button className="bg-green-600 hover:bg-green-700 flex items-center gap-1" onClick={handleValidate}>
                <CheckCircle className="h-4 w-4" />
                Validate Line
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
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
