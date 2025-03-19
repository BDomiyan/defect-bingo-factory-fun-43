
import { useState } from 'react';
import { BingoBoard } from '@/lib/types';

interface UseDragDropProps {
  initialBoard: BingoBoard;
  onBoardChange?: (board: BingoBoard) => void;
}

export const useDragDrop = ({ initialBoard, onBoardChange }: UseDragDropProps) => {
  const [board, setBoard] = useState<BingoBoard>(initialBoard);
  const [draggedCell, setDraggedCell] = useState<{ rowIndex: number; colIndex: number } | null>(null);

  const handleDragStart = (rowIndex: number, colIndex: number) => {
    setDraggedCell({ rowIndex, colIndex });
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); // Necessary to allow dropping
  };

  const handleDrop = (targetRowIndex: number, targetColIndex: number) => {
    if (!draggedCell) return;

    const { rowIndex: sourceRowIndex, colIndex: sourceColIndex } = draggedCell;
    
    // Don't do anything if dropping on the same cell
    if (sourceRowIndex === targetRowIndex && sourceColIndex === targetColIndex) {
      setDraggedCell(null);
      return;
    }

    // Create a copy of the board
    const newBoard = [...board.map(row => [...row])];
    
    // Swap cells
    const temp = { ...newBoard[sourceRowIndex][sourceColIndex] };
    newBoard[sourceRowIndex][sourceColIndex] = { ...newBoard[targetRowIndex][targetColIndex] };
    newBoard[targetRowIndex][targetColIndex] = temp;
    
    // Update IDs to maintain consistency (but preserve mark status)
    newBoard[sourceRowIndex][sourceColIndex].id = `${sourceRowIndex}-${sourceColIndex}`;
    newBoard[targetRowIndex][targetColIndex].id = `${targetRowIndex}-${targetColIndex}`;
    
    setBoard(newBoard);
    setDraggedCell(null);
    
    // Call the onBoardChange callback if provided
    if (onBoardChange) {
      onBoardChange(newBoard);
    }
  };

  const handleDragEnd = () => {
    setDraggedCell(null);
  };

  return {
    board,
    setBoard,
    draggedCell,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd
  };
};
