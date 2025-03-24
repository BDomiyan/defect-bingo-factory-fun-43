
import React, { useState } from 'react';
import { GarmentPart, DefectType } from '@/lib/types';
import { cn } from '@/lib/utils';
import { DragHandleDots2Icon } from '@radix-ui/react-icons';
import { useIsMobile } from '@/hooks/use-mobile';

interface DraggableItemProps {
  type: 'defect' | 'garment';
  data?: GarmentPart | DefectType;
  item?: GarmentPart | DefectType;
  onDragStart: (type: 'defect' | 'garment', item: GarmentPart | DefectType) => void;
  onDragEnd?: () => void;
}

const DraggableItem = ({ type, item, data, onDragStart, onDragEnd }: DraggableItemProps) => {
  const isDefect = type === 'defect';
  const itemToUse = item || data;
  const defectItem = isDefect ? itemToUse as DefectType : null;
  const garmentItem = !isDefect ? itemToUse as GarmentPart : null;
  const [isPressed, setIsPressed] = useState(false);
  const isMobile = useIsMobile();
  
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.effectAllowed = 'move';
    
    // Create a custom drag image
    const dragImage = document.createElement('div');
    dragImage.className = 'w-12 h-12 rounded-full bg-primary/80 flex items-center justify-center text-white';
    dragImage.textContent = isDefect ? defectItem?.code.toString() : garmentItem?.code;
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 20, 20);
    
    // Call the provided onDragStart handler
    onDragStart(type, itemToUse!);
    
    // Clean up the drag image element after a short delay
    setTimeout(() => {
      document.body.removeChild(dragImage);
    }, 0);
  };
  
  const handleTouchStart = () => {
    setIsPressed(true);
    // For mobile, we'll simulate drag start
    if (isMobile) {
      onDragStart(type, itemToUse!);
    }
  };
  
  const handleTouchEnd = () => {
    setIsPressed(false);
    if (onDragEnd) {
      onDragEnd();
    }
  };
  
  return (
    <div
      className={cn(
        "p-2 rounded-md border cursor-grab transition-all shadow-sm",
        isDefect 
          ? "bg-gradient-to-r from-rose-50 to-rose-100 border-rose-200 hover:shadow-rose-100" 
          : "bg-gradient-to-r from-sky-50 to-sky-100 border-sky-200 hover:shadow-sky-100",
        "relative group",
        isPressed ? "scale-95 opacity-80" : "hover:shadow-md hover:scale-105",
        isMobile && "active:scale-95 transition-transform"
      )}
      draggable={!isMobile}
      onDragStart={handleDragStart}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onDragEnd={onDragEnd}
    >
      <DragHandleDots2Icon className="absolute right-1 top-1 w-3 h-3 text-muted-foreground opacity-40 group-hover:opacity-100" />
      <div className="flex items-center gap-2">
        <div className={cn(
          "flex items-center justify-center h-7 w-7 rounded-full text-white font-medium text-xs shadow-sm",
          isDefect 
            ? "bg-gradient-to-br from-rose-500 to-rose-600" 
            : "bg-gradient-to-br from-sky-500 to-sky-600"
        )}>
          {isDefect ? defectItem?.code : garmentItem?.code}
        </div>
        <div className="text-sm font-medium truncate">
          {isDefect ? defectItem?.name : garmentItem?.name}
        </div>
      </div>
    </div>
  );
};

export default DraggableItem;
