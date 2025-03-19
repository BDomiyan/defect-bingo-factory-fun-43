
import { useState } from 'react';
import { BingoCell } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface BingoCardProps {
  cell: BingoCell;
  isHighlighted?: boolean;
  isBingoLine?: boolean;
  onCellClick: (cellId: string) => void;
}

const BingoCard = ({ cell, isHighlighted, isBingoLine, onCellClick }: BingoCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const handleClick = () => {
    onCellClick(cell.id);
    if (!cell.marked) {
      toast.success('Validating defect...', {
        description: `${cell.garmentPart.name} - ${cell.defectType.name}`,
        position: 'bottom-right',
      });
    }
  };

  return (
    <div
      className={cn(
        "relative aspect-square w-full overflow-hidden rounded-lg border transition-all duration-300 ease-in-out",
        cell.marked 
          ? "border-primary/30 bg-primary/5" 
          : "border-border bg-card hover:border-primary/20 hover:bg-accent/50",
        isHighlighted && !cell.marked && "bg-accent border-primary/20 shadow-sm",
        isBingoLine && cell.marked && "bg-primary/10 border-primary/50 shadow-md",
        "hover:shadow-md hover:scale-[1.02] hover:z-10",
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      <div className="flex h-full w-full flex-col items-center justify-center gap-1 p-1 sm:p-2">
        <div className={cn(
          "text-xs font-medium uppercase tracking-wider transition-colors duration-300",
          cell.marked ? "text-primary" : "text-muted-foreground"
        )}>
          {cell.garmentPart.code}
          <span className="mx-0.5">•</span>
          {cell.defectType.code}
        </div>
        
        <div className="text-center truncate w-full">
          <div className={cn(
            "text-xs sm:text-sm font-medium transition-colors duration-300",
            cell.marked ? "text-foreground" : "text-foreground/80"
          )}>
            {cell.garmentPart.name}
          </div>
          <div className={cn(
            "text-xs truncate w-full transition-colors duration-300",
            cell.marked ? "text-foreground/90" : "text-foreground/70"
          )}>
            {cell.defectType.name}
          </div>
        </div>
        
        {/* Marked indicator */}
        {cell.marked && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/0">
            <div className="absolute inset-0 bg-primary/5 animate-pulse-subtle"></div>
            <CheckCircle className="h-8 w-8 text-primary opacity-80" />
          </div>
        )}
        
        {/* Hover effect */}
        {isHovered && !cell.marked && (
          <div className="absolute inset-x-0 bottom-2 flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 bg-primary/10 text-primary hover:bg-primary/20 px-2 py-1 text-xs rounded-full animate-fade-in"
              onClick={(e) => {
                e.stopPropagation();
                handleClick();
              }}
            >
              Mark
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BingoCard;
