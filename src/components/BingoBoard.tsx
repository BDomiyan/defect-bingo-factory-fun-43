
import { useState, useEffect } from 'react';
import BingoCard from './BingoCard';
import { generateBingoBoard, checkForBingo, calculateCompletion } from '@/lib/game-data';
import { BingoBoard as BoardType, BingoStatus } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Award, Sparkles, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface BingoBoardProps {
  boardSize?: number;
  playerName?: string;
}

const BingoBoard = ({ boardSize = 5, playerName = "Player" }: BingoBoardProps) => {
  const [board, setBoard] = useState<BoardType>([]);
  const [bingoLines, setBingoLines] = useState<string[]>([]);
  const [status, setStatus] = useState<BingoStatus>('none');
  const [completion, setCompletion] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isActive, setIsActive] = useState(false);
  
  // Initialize board
  useEffect(() => {
    resetGame();
  }, [boardSize]);
  
  // Timer logic
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
    const newBoard = generateBingoBoard(boardSize);
    setBoard(newBoard);
    setBingoLines([]);
    setStatus('none');
    setCompletion(0);
    setStartTime(null);
    setElapsedTime(0);
    setIsActive(false);
  };
  
  const handleCellClick = (cellId: string) => {
    if (!startTime) {
      setStartTime(new Date());
      setIsActive(true);
    }
    
    setBoard(prevBoard => {
      const newBoard = [...prevBoard];
      
      // Find and mark the cell
      for (let i = 0; i < newBoard.length; i++) {
        for (let j = 0; j < newBoard[i].length; j++) {
          if (newBoard[i][j].id === cellId && !newBoard[i][j].marked) {
            newBoard[i][j] = {
              ...newBoard[i][j],
              marked: true,
              validatedBy: playerName,
              validatedAt: new Date()
            };
            break;
          }
        }
      }
      
      // Check for bingo
      const bingos = checkForBingo(newBoard);
      const completionPercentage = calculateCompletion(newBoard);
      setCompletion(completionPercentage);
      
      if (bingos.length > 0 && bingoLines.length === 0) {
        // First bingo
        setStatus('bingo');
        toast.success('BINGO!', {
          description: "You've completed a line!",
          icon: <Award className="h-5 w-5 text-yellow-500" />,
        });
        setIsActive(false);
      } else if (completionPercentage === 100) {
        // Full board
        setStatus('fullBoard');
        toast.success('FULL BOARD!', {
          description: "You've marked every defect!",
          icon: <Sparkles className="h-5 w-5 text-yellow-500" />,
        });
        setIsActive(false);
      }
      
      setBingoLines(bingos);
      
      return newBoard;
    });
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

  if (!board.length) return <div>Loading board...</div>;

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Board header */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Defect Bingo</h2>
          <p className="text-sm text-muted-foreground">
            Find and mark defects to complete a line
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            onClick={resetGame}
          >
            <RefreshCw className="mr-1 h-3.5 w-3.5" />
            Reset
          </Button>
        </div>
      </div>
      
      {/* Status indicators */}
      <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="flex flex-col space-y-1 rounded-lg border p-3">
          <span className="text-xs text-muted-foreground">Timer</span>
          <span className="font-medium text-lg">
            {formatTime(elapsedTime)}
          </span>
        </div>
        
        <div className="flex flex-col space-y-1 rounded-lg border p-3">
          <span className="text-xs text-muted-foreground">Status</span>
          <div>
            {status === 'none' && <Badge variant="outline">In Progress</Badge>}
            {status === 'bingo' && <Badge variant="default">Bingo!</Badge>}
            {status === 'fullBoard' && <Badge variant="default">Full Board!</Badge>}
          </div>
        </div>
        
        <div className="flex flex-col space-y-1 rounded-lg border p-3">
          <span className="text-xs text-muted-foreground">Completion</span>
          <div className="flex items-center gap-2">
            <Progress value={completion} className="h-2" />
            <span className="text-sm font-medium">{completion}%</span>
          </div>
        </div>
        
        <div className="flex flex-col space-y-1 rounded-lg border p-3">
          <span className="text-xs text-muted-foreground">Bingo Lines</span>
          <span className="font-medium text-lg">{bingoLines.length}</span>
        </div>
      </div>
      
      {/* Bingo grid */}
      <div className={cn(
        "grid gap-1.5 transition-all duration-500 sm:gap-2",
        `grid-cols-${boardSize}`
      )}>
        {board.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <BingoCard
              key={cell.id}
              cell={cell}
              isHighlighted={false}
              isBingoLine={isCellInBingoLine(rowIndex, colIndex)}
              onCellClick={handleCellClick}
            />
          ))
        )}
      </div>
      
      {/* Status message */}
      {status !== 'none' && (
        <div className="mt-6 rounded-lg border bg-card p-4 text-center shadow-sm animate-scale-in">
          <div className="flex flex-col items-center justify-center">
            {status === 'bingo' && (
              <>
                <Award className="h-10 w-10 text-yellow-500 mb-2" />
                <h3 className="text-xl font-medium">BINGO!</h3>
                <p className="text-muted-foreground">
                  You've completed a line in {formatTime(elapsedTime)}
                </p>
              </>
            )}
            {status === 'fullBoard' && (
              <>
                <Sparkles className="h-10 w-10 text-yellow-500 mb-2" />
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
