
import { useState } from 'react';
import { BingoBoard, GarmentPart, DefectType } from '@/lib/types';

interface UseDragDropGridProps {
  boardSize: number;
  onBoardChange?: (board: BingoBoard) => void;
}

export const useDragDropGrid = ({ boardSize, onBoardChange }: UseDragDropGridProps) => {
  // Initialize an empty board
  const initializeEmptyBoard = () => {
    const board: BingoBoard = [];
    for (let i = 0; i < boardSize; i++) {
      const row = [];
      for (let j = 0; j < boardSize; j++) {
        row.push({
          id: `${i}-${j}`,
          marked: false
        });
      }
      board.push(row);
    }
    return board;
  };

  const [board, setBoard] = useState<BingoBoard>(initializeEmptyBoard());
  const [draggedItem, setDraggedItem] = useState<{
    type: 'defect' | 'garment' | null;
    data: DefectType | GarmentPart | null;
  } | null>(null);

  // Handle starting to drag an item (either defect or garment part)
  const handleDragStart = (type: 'defect' | 'garment', data: DefectType | GarmentPart) => {
    setDraggedItem({ type, data });
    // Set the drag operation as successful
    return true;
  };

  // Handle dragging over a cell
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    // Necessary to allow dropping
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // Handle dropping an item onto a cell
  const handleDrop = (rowIndex: number, colIndex: number) => {
    if (!draggedItem || !draggedItem.data) return;
    
    // Create a copy of the board
    const newBoard = [...board.map(row => [...row])];
    
    // Update the cell with the dragged item data
    if (draggedItem.type === 'defect') {
      newBoard[rowIndex][colIndex] = {
        ...newBoard[rowIndex][colIndex],
        defectType: draggedItem.data as DefectType
      };
    } else if (draggedItem.type === 'garment') {
      newBoard[rowIndex][colIndex] = {
        ...newBoard[rowIndex][colIndex],
        garmentPart: draggedItem.data as GarmentPart
      };
    }
    
    setBoard(newBoard);
    
    // Call the onBoardChange callback if provided
    if (onBoardChange) {
      onBoardChange(newBoard);
    }
    
    // Reset the dragged item
    setDraggedItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  // Mark a cell as validated
  const markCell = (rowIndex: number, colIndex: number, playerName: string) => {
    // Only mark cells that have both garment part and defect type
    if (!board[rowIndex][colIndex].garmentPart || !board[rowIndex][colIndex].defectType) {
      return false;
    }

    const newBoard = [...board.map(row => [...row])];
    newBoard[rowIndex][colIndex] = {
      ...newBoard[rowIndex][colIndex],
      marked: true,
      validatedBy: playerName,
      validatedAt: new Date().toISOString()
    };
    
    setBoard(newBoard);
    
    if (onBoardChange) {
      onBoardChange(newBoard);
    }
    
    return true;
  };

  // Reset the board to empty cells
  const resetBoard = () => {
    const emptyBoard = initializeEmptyBoard();
    setBoard(emptyBoard);
    if (onBoardChange) {
      onBoardChange(emptyBoard);
    }
  };

  return {
    board,
    setBoard,
    draggedItem,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
    markCell,
    resetBoard
  };
};
