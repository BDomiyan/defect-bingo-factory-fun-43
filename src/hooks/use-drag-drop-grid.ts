import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { BingoBoard, GarmentPart, DefectType } from '@/lib/types';
import { COMMON_DEFECT_PAIRS, isValidCombination } from '@/lib/game-data';

interface UseDragDropGridProps {
  boardSize: number;
  onBoardChange?: (board: BingoBoard) => void;
  onBingo?: (lines: Array<{type: string, index: number}>) => void;
  initialBoard?: BingoBoard;
}

export const useDragDropGrid = ({ boardSize, onBoardChange, onBingo, initialBoard }: UseDragDropGridProps) => {
  // Initialize an empty board
  const initializeEmptyBoard = useCallback(() => {
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
  }, [boardSize]);

  const [board, setBoard] = useState<BingoBoard>(initialBoard || initializeEmptyBoard());
  const [draggedItem, setDraggedItem] = useState<{
    type: 'defect' | 'garment' | null;
    data: DefectType | GarmentPart | null;
  } | null>(null);
  const [completedLines, setCompletedLines] = useState<Array<{type: string, index: number}>>([]);

  // Check if the defect and garment part combination is valid based on common pairs
  const isValidDefectPair = useCallback((garmentPart: GarmentPart, defectType: DefectType) => {
    return isValidCombination(garmentPart, defectType);
  }, []);

  // Handle starting to drag an item (either defect or garment part)
  const handleDragStart = useCallback((type: 'defect' | 'garment', data: DefectType | GarmentPart) => {
    setDraggedItem({ type, data });
    // Set the drag operation as successful
    return true;
  }, []);

  // Handle dragging over a cell
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    // Necessary to allow dropping
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  // Handle dropping an item onto a cell
  const handleDrop = useCallback((rowIndex: number, colIndex: number) => {
    if (!draggedItem || !draggedItem.data) return;
    
    // Create a copy of the board
    const newBoard: BingoBoard = JSON.parse(JSON.stringify(board));
    
    // Update the cell with the dragged item data
    if (draggedItem.type === 'defect') {
      newBoard[rowIndex][colIndex] = {
        ...newBoard[rowIndex][colIndex],
        defectType: draggedItem.data as DefectType
      };
      
      // If both parts are present, check if it's a valid pair
      if (newBoard[rowIndex][colIndex].garmentPart) {
        const garmentPart = newBoard[rowIndex][colIndex].garmentPart!;
        const defectType = draggedItem.data as DefectType;
        
        if (isValidDefectPair(garmentPart, defectType)) {
          toast.success("Perfect match!", {
            description: `${garmentPart.name} + ${defectType.name} is a common defect pair`
          });
        }
      }
    } else if (draggedItem.type === 'garment') {
      newBoard[rowIndex][colIndex] = {
        ...newBoard[rowIndex][colIndex],
        garmentPart: draggedItem.data as GarmentPart
      };
      
      // If both parts are present, check if it's a valid pair
      if (newBoard[rowIndex][colIndex].defectType) {
        const garmentPart = draggedItem.data as GarmentPart;
        const defectType = newBoard[rowIndex][colIndex].defectType!;
        
        if (isValidDefectPair(garmentPart, defectType)) {
          toast.success("Perfect match!", {
            description: `${garmentPart.name} + ${defectType.name} is a common defect pair`
          });
        }
      }
    }
    
    setBoard(newBoard);
    
    // Call the onBoardChange callback if provided
    if (onBoardChange) {
      onBoardChange(newBoard);
    }
    
    // Reset the dragged item
    setDraggedItem(null);
  }, [board, draggedItem, isValidDefectPair, onBoardChange]);

  const handleDragEnd = useCallback(() => {
    setDraggedItem(null);
  }, []);
  
  // Add both defect type and garment part to a cell
  const addDefectToCell = useCallback((rowIndex: number, colIndex: number, garmentPart: GarmentPart, defectType: DefectType) => {
    const newBoard: BingoBoard = JSON.parse(JSON.stringify(board));
    
    // Check if it's a valid pair before adding
    const isValid = isValidDefectPair(garmentPart, defectType);
    
    newBoard[rowIndex][colIndex] = {
      ...newBoard[rowIndex][colIndex],
      garmentPart,
      defectType
    };
    
    setBoard(newBoard);
    
    if (onBoardChange) {
      onBoardChange(newBoard);
    }
    
    return isValid;
  }, [board, isValidDefectPair, onBoardChange]);
  
  // Reset the board to empty cells
  const resetBoard = useCallback(() => {
    const emptyBoard = initializeEmptyBoard();
    setBoard(emptyBoard);
    setCompletedLines([]);
    if (onBoardChange) {
      onBoardChange(emptyBoard);
    }
  }, [initializeEmptyBoard, onBoardChange]);
  
  // Calculate board completion percentage
  const getBoardCompletion = useCallback(() => {
    const totalCells = boardSize * boardSize;
    const filledCells = board.flat().filter(cell => cell.marked).length;
    return Math.round((filledCells / totalCells) * 100);
  }, [board, boardSize]);

  // Check for bingo (horizontal, vertical, diagonal)
  const checkForBingo = useCallback((currentBoard: BingoBoard = board) => {
    const newCompletedLines: Array<{type: string, index: number}> = [];
    
    // Check horizontal lines
    for (let i = 0; i < boardSize; i++) {
      if (currentBoard[i].every(cell => cell.marked)) {
        const lineObj = { type: 'row', index: i };
        // Check if this line is already in completedLines
        if (!completedLines.some(line => line.type === lineObj.type && line.index === lineObj.index)) {
          newCompletedLines.push(lineObj);
        }
      }
    }
    
    // Check vertical lines
    for (let j = 0; j < boardSize; j++) {
      if (currentBoard.every(row => row[j].marked)) {
        const lineObj = { type: 'column', index: j };
        if (!completedLines.some(line => line.type === lineObj.type && line.index === lineObj.index)) {
          newCompletedLines.push(lineObj);
        }
      }
    }
    
    // Check diagonals
    const diag1 = [];
    const diag2 = [];
    for (let i = 0; i < boardSize; i++) {
      diag1.push(currentBoard[i][i]);
      diag2.push(currentBoard[i][boardSize - 1 - i]);
    }
    
    if (diag1.every(cell => cell.marked)) {
      const lineObj = { type: 'diagonal', index: 1 };
      if (!completedLines.some(line => line.type === lineObj.type && line.index === lineObj.index)) {
        newCompletedLines.push(lineObj);
      }
    }
    
    if (diag2.every(cell => cell.marked)) {
      const lineObj = { type: 'diagonal', index: 2 };
      if (!completedLines.some(line => line.type === lineObj.type && line.index === lineObj.index)) {
        newCompletedLines.push(lineObj);
      }
    }
    
    // If we found new completed lines
    if (newCompletedLines.length > 0) {
      // Combine old and new completed lines
      const allCompletedLines = [...completedLines, ...newCompletedLines];
      setCompletedLines(allCompletedLines);
      
      // Notify parent component if callback provided
      if (onBingo) {
        onBingo(newCompletedLines);
      }
      
      // Show toast notification for bingo
      newCompletedLines.forEach(line => {
        toast.success("BINGO!", {
          description: `You completed a ${line.type} line!`,
        });
      });
    }
    
    return [...completedLines, ...newCompletedLines];
  }, [board, boardSize, completedLines, onBingo]);
  
  // Mark a cell as validated
  const markCell = useCallback((rowIndex: number, colIndex: number, playerName: string) => {
    // Only mark cells that have both garment part and defect type
    // This check should be silent without error message because it was already validated by DefectModal
    if (!board[rowIndex][colIndex].garmentPart || !board[rowIndex][colIndex].defectType) {
      console.log("Cell validation failed: Cell is incomplete (missing garment part or defect type)");
      return false;
    }
    
    // Check if the pair is valid
    const garmentPart = board[rowIndex][colIndex].garmentPart!;
    const defectType = board[rowIndex][colIndex].defectType!;
    
    if (!isValidDefectPair(garmentPart, defectType)) {
      // This error is less likely since we already checked in addDefectToCell
      console.log("Cell validation failed: Invalid defect pair");
      return false;
    }

    const newBoard: BingoBoard = JSON.parse(JSON.stringify(board));
    newBoard[rowIndex][colIndex] = {
      ...newBoard[rowIndex][colIndex],
      marked: true,
      validatedBy: playerName,
      validatedAt: new Date()
    };
    
    setBoard(newBoard);
    
    if (onBoardChange) {
      onBoardChange(newBoard);
    }
    
    // Check for bingo after marking the cell
    checkForBingo(newBoard);
    
    return true;
  }, [board, isValidDefectPair, onBoardChange, checkForBingo]);

  // Effect to check for bingo when board changes
  useEffect(() => {
    checkForBingo();
  }, [board, checkForBingo]);

  return {
    board,
    setBoard,
    draggedItem,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
    markCell,
    resetBoard,
    addDefectToCell,
    getBoardCompletion,
    completedLines
  };
};
