
import React from 'react';
import { GarmentPart, DefectType } from '@/lib/types';
import { cn } from '@/lib/utils';

interface DraggableItemProps {
  type: 'defect' | 'garment';
  item: GarmentPart | DefectType;
  onDragStart: (type: 'defect' | 'garment', item: GarmentPart | DefectType) => void;
}

const DraggableItem = ({ type, item, onDragStart }: DraggableItemProps) => {
  const isDefect = type === 'defect';
  const defectItem = isDefect ? item as DefectType : null;
  const garmentItem = !isDefect ? item as GarmentPart : null;
  
  return (
    <div
      className={cn(
        "p-2 rounded-md border cursor-grab transition-all hover:shadow-md hover:scale-105",
        isDefect ? "bg-red-50 border-red-200" : "bg-blue-50 border-blue-200"
      )}
      draggable={true}
      onDragStart={() => onDragStart(type, item)}
    >
      <div className="flex items-center gap-2">
        <div className={cn(
          "flex items-center justify-center h-6 w-6 rounded-full text-white font-medium text-xs",
          isDefect ? "bg-red-500" : "bg-blue-500"
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
