import { useState, useEffect } from 'react';
import BingoCard from './BingoCard';
import DraggableItem from './DraggableItem';
import { GARMENT_PARTS, DEFECT_TYPES, checkForBingo, calculateCompletion } from '@/lib/game-data';
import { BingoBoard as BoardType, BingoStatus } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Award, Sparkles, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useDragDropGrid } from '@/hooks/use-drag-drop-grid';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLocalStorage } from '@/hooks/use-local-storage';

interface BingoBoardProps {
  boardSize?: number;
  playerName?: string;
}

const BingoBoard = ({ boardSize = 5, playerName = "Player" }: BingoBoardProps) => {
  const [bingoLines, setBingoLines] = useState<string[]>([]);
  const [status, setStatus] = useState<BingoStatus>('none');
  const [completion, setCompletion] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [gameHistory, setGameHistory] = useLocalStorage<any[]>('gameHistory', []);
  
  const {
    board,
    draggedItem,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
    markCell,
    resetBoard
  } = useDragDropGrid({
    boardSize,
    onBoardChange: (newBoard) => {
      checkBoardStatus(newBoard);
    }
  });
  
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isActive && startTime) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((new Date().getTime() - startTime.getTime()) / 1000));
      }, 1000);
    } else if (!isActive && interval) {
      clearInterval(interval);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, startTime]);
  
  const resetGame = () => {
    resetBoard();
    setBingoLines([]);
    setStatus('none');
    setCompletion(0);
    setStartTime(null);
    setElapsedTime(0);
    setIsActive(false);
  };
  
  const checkBoardStatus = (currentBoard: BoardType) => {
    const hasCells = currentBoard.some(row => 
      row.some(cell => cell.garmentPart && cell.defectType)
    );
    
    if (hasCells && !startTime) {
      setStartTime(new Date());
      setIsActive(true);
    }
    
    const bingos = checkForBingo(currentBoard);
    const completionPercentage = calculateCompletion(currentBoard);
    setCompletion(completionPercentage);
    
    if (bingos.length > 0 && bingoLines.length === 0) {
      setStatus('bingo');
      toast.success('BINGO!', {
        description: "You've completed a line!",
        icon: <Award className="h-5 w-5 text-yellow-500" />,
      });
      setIsActive(false);
      
      const gameResult = {
        id: Date.now(),
        playerName,
        type: 'bingo',
        time: elapsedTime,
        date: new Date().toISOString(),
        lines: bingos.length,
        completion: completionPercentage
      };
      setGameHistory([gameResult, ...gameHistory]);
    } else if (completionPercentage === 100) {
      setStatus('fullBoard');
      toast.success('FULL BOARD!', {
        description: "You've marked every defect!",
        icon: <Sparkles className="h-5 w-5 text-yellow-500" />,
      });
      setIsActive(false);
      
      const gameResult = {
        id: Date.now(),
        playerName,
        type: 'fullBoard',
        time: elapsedTime,
        date: new Date().toISOString(),
        lines: bingos.length,
        completion: 100
      };
      setGameHistory([gameResult, ...gameHistory]);
    }
    
    setBingoLines(bingos);
  };
  
  const handleCellClick = (rowIndex: number, colIndex: number) => {
    const cell = board[rowIndex][colIndex];
    
    if (!cell.garmentPart || !cell.defectType) {
      return;
    }
    
    if (!startTime) {
      setStartTime(new Date());
      setIsActive(true);
    }
    
    markCell(rowIndex, colIndex, playerName);
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  const isCellInBingoLine = (rowIndex: number, colIndex: number) => {
    return bingoLines.some(line => {
      if (line.startsWith('row-')) {
        const row = parseInt(line.split('-')[1]);
        return row === rowIndex;
      }
      if (line.startsWith('col-')) {
        const col = parseInt(line.split('-')[1]);
        return col === colIndex;
      }
      if (line === 'diag-1') {
        return rowIndex === colIndex;
      }
      if (line === 'diag-2') {
        return rowIndex === (boardSize - 1 - colIndex);
      }
      return false;
    });
  };

  return (
    <div className="w-full max-w-6xl mx-auto animate-fade-in">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-gradient">Defect Bingo</h2>
          <p className="text-sm text-muted-foreground">
            Drag defects and garment parts to the grid to create a bingo pattern
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 glass-hover"
            onClick={resetGame}
          >
            <RefreshCw className="mr-1 h-3.5 w-3.5" />
            Reset
          </Button>
        </div>
      </div>
      
      <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="flex flex-col space-y-1 rounded-lg border p-3 glass-card transition-all hover:shadow-md">
          <span className="text-xs text-muted-foreground">Timer</span>
          <span className="font-medium text-lg">
            {formatTime(elapsedTime)}
          </span>
        </div>
        
        <div className="flex flex-col space-y-1 rounded-lg border p-3 glass-card transition-all hover:shadow-md">
          <span className="text-xs text-muted-foreground">Status</span>
          <div>
            {status === 'none' && <Badge variant="outline">In Progress</Badge>}
            {status === 'bingo' && <Badge variant="default" className="animate-pulse">Bingo!</Badge>}
            {status === 'fullBoard' && <Badge variant="default" className="animate-pulse">Full Board!</Badge>}
          </div>
        </div>
        
        <div className="flex flex-col space-y-1 rounded-lg border p-3 glass-card transition-all hover:shadow-md">
          <span className="text-xs text-muted-foreground">Completion</span>
          <div className="flex items-center gap-2">
            <Progress value={completion} className="h-2" />
            <span className="text-sm font-medium">{completion}%</span>
          </div>
        </div>
        
        <div className="flex flex-col space-y-1 rounded-lg border p-3 glass-card transition-all hover:shadow-md">
          <span className="text-xs text-muted-foreground">Bingo Lines</span>
          <span className="font-medium text-lg">{bingoLines.length}</span>
        </div>
      </div>
      
      <div className="flex flex-col gap-4">
        <div className="flex gap-4">
          <div className="w-1/4 border rounded-lg p-2 glass-card">
            <h3 className="font-medium text-sm mb-2 px-2">Defect Types</h3>
            <ScrollArea className="h-[460px]">
              <div className="flex flex-col gap-2 px-2">
                {DEFECT_TYPES.map((defect) => (
                  <DraggableItem 
                    key={defect.code}
                    type="defect"
                    item={defect}
                    onDragStart={handleDragStart}
                  />
                ))}
              </div>
            </ScrollArea>
          </div>
          
          <div className="flex-1">
            <div 
              className="grid gap-1.5 sm:gap-2 border rounded-lg p-4 glass-card"
              style={{ 
                gridTemplateColumns: `repeat(${boardSize}, 1fr)`,
                gridTemplateRows: `repeat(${boardSize}, 1fr)`
              }}
            >
              {board.map((row, rowIndex) =>
                row.map((cell, colIndex) => (
                  <BingoCard
                    key={cell.id}
                    cell={cell}
                    rowIndex={rowIndex}
                    colIndex={colIndex}
                    isHighlighted={false}
                    isDragging={draggedItem !== null}
                    isBingoLine={isCellInBingoLine(rowIndex, colIndex)}
                    onCellClick={handleCellClick}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(rowIndex, colIndex)}
                  />
                ))
              )}
            </div>
          </div>
        </div>
        
        <div className="border rounded-lg p-2 glass-card">
          <h3 className="font-medium text-sm mb-2 px-2">Garment Parts</h3>
          <ScrollArea className="w-full">
            <div className="flex gap-2 p-2">
              {GARMENT_PARTS.map((part) => (
                <DraggableItem 
                  key={part.code}
                  type="garment"
                  item={part}
                  onDragStart={handleDragStart}
                />
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
      
      {status !== 'none' && (
        <div className="mt-6 rounded-lg border bg-card p-4 text-center shadow-sm animate-scale-in glass-card">
          <div className="flex flex-col items-center justify-center">
            {status === 'bingo' && (
              <>
                <Award className="h-10 w-10 text-yellow-500 mb-2 animate-bounce" />
                <h3 className="text-xl font-medium">BINGO!</h3>
                <p className="text-muted-foreground">
                  You've completed a line in {formatTime(elapsedTime)}
                </p>
              </>
            )}
            {status === 'fullBoard' && (
              <>
                <Sparkles className="h-10 w-10 text-yellow-500 mb-2 animate-pulse" />
                <h3 className="text-xl font-medium">FULL BOARD COMPLETED!</h3>
                <p className="text-muted-foreground">
                  You've marked all defects in {formatTime(elapsedTime)}
                </p>
              </>
            )}
            <Button className="mt-3" variant="outline" onClick={resetGame}>
              Play Again
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BingoBoard;
