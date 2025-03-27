
import React, { useState, useEffect } from 'react';
import BingoCard from '@/components/BingoCard';
import DefectModal from '@/components/DefectModal';
import SupervisorNotification from '@/components/SupervisorNotification';
import { useDragDropGrid } from '@/hooks/use-drag-drop-grid';
import { DEFECT_TYPES, GARMENT_PARTS } from '@/lib/game-data';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Trophy, RefreshCcw, Plus, CheckCircle, PartyPopper } from 'lucide-react';
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Player, GarmentPart, DefectType, BingoBoard as BingoBoardType, BingoCell } from '@/lib/types';
import { useDefectSync } from '@/hooks/use-defect-sync';

interface BingoBoardProps {
  boardSize?: number;
  playerName?: string;
}

const BingoBoard: React.FC<BingoBoardProps> = ({ 
  boardSize = 5,
  playerName = "Guest Player"
}) => {
  const [activeTab, setActiveTab] = useState("board");
  const [selectedCell, setSelectedCell] = useState<{ rowIndex: number; colIndex: number } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [players, setPlayers] = useLocalStorage<Player[]>('defect-bingo-players', []);
  const [bingoLines, setBingoLines] = useState<number>(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [boardCompletion, setBoardCompletion] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [supervisorModalOpen, setSupervisorModalOpen] = useState(false);
  const [currentCompletedLine, setCurrentCompletedLine] = useState<{type: string, index: number} | null>(null);
  const [completedLineCells, setCompletedLineCells] = useState<BingoCell[]>([]);
  const { addDefect } = useDefectSync();
  
  const { 
    board, 
    setBoard, 
    handleDragStart, 
    handleDragOver, 
    handleDrop,
    handleDragEnd,
    markCell,
    resetBoard,
    addDefectToCell,
    getBoardCompletion,
    completedLines
  } = useDragDropGrid({ 
    boardSize,
    onBingo: (newLines) => handleBingo(newLines)
  });
  
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setBoardCompletion(getBoardCompletion());
    setBingoLines(completedLines.length);
  }, [board, completedLines, getBoardCompletion]);
  
  const handleCellClick = (rowIndex: number, colIndex: number) => {
    setSelectedCell({ rowIndex, colIndex });
    setModalOpen(true);
  };
  
  const findNextEmptyCell = () => {
    for (let i = 0; i < boardSize; i++) {
      for (let j = 0; j < boardSize; j++) {
        const cell = board[i][j];
        if (!cell.garmentPart || !cell.defectType) {
          return { rowIndex: i, colIndex: j };
        }
      }
    }
    return null;
  };
  
  const getCellsForLine = (line: {type: string, index: number}): BingoCell[] => {
    const cells: BingoCell[] = [];
    
    if (line.type === 'row') {
      for (let j = 0; j < boardSize; j++) {
        cells.push(board[line.index][j]);
      }
    } else if (line.type === 'column') {
      for (let i = 0; i < boardSize; i++) {
        cells.push(board[i][line.index]);
      }
    } else if (line.type === 'diagonal' && line.index === 1) {
      for (let i = 0; i < boardSize; i++) {
        cells.push(board[i][i]);
      }
    } else if (line.type === 'diagonal' && line.index === 2) {
      for (let i = 0; i < boardSize; i++) {
        cells.push(board[i][boardSize - 1 - i]);
      }
    }
    
    return cells;
  };
  
  const handleBingo = (newLines: Array<{type: string, index: number}>) => {
    if (newLines.length > 0) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
      
      // Show supervisor notification for the first line
      const firstLine = newLines[0];
      setCurrentCompletedLine(firstLine);
      setCompletedLineCells(getCellsForLine(firstLine));
      setSupervisorModalOpen(true);
      
      updatePlayerStats(newLines.length);
      
      const allCellsMarked = board.every(row => row.every(cell => cell.marked));
      if (allCellsMarked) {
        toast.success("FULL BOARD BINGO!", {
          description: "You've completed the entire board!",
          duration: 8000,
          icon: <Trophy className="h-5 w-5 text-yellow-400" />
        });
        
        updatePlayerStats(1);
      }
    }
  };
  
  const handleSupervisorValidation = (isValid: boolean) => {
    if (isValid) {
      toast.success("Bingo line validated by supervisor!", {
        description: "Points awarded to your account",
        duration: 5000,
      });
    } else {
      // Unmark cells in the line if not valid
      if (currentCompletedLine) {
        const newBoard = [...board];
        
        if (currentCompletedLine.type === 'row') {
          newBoard[currentCompletedLine.index] = newBoard[currentCompletedLine.index].map(cell => ({
            ...cell,
            marked: false
          }));
        } else if (currentCompletedLine.type === 'column') {
          for (let i = 0; i < boardSize; i++) {
            newBoard[i][currentCompletedLine.index] = {
              ...newBoard[i][currentCompletedLine.index],
              marked: false
            };
          }
        } else if (currentCompletedLine.type === 'diagonal' && currentCompletedLine.index === 1) {
          for (let i = 0; i < boardSize; i++) {
            newBoard[i][i] = {
              ...newBoard[i][i],
              marked: false
            };
          }
        } else if (currentCompletedLine.type === 'diagonal' && currentCompletedLine.index === 2) {
          for (let i = 0; i < boardSize; i++) {
            newBoard[i][boardSize - 1 - i] = {
              ...newBoard[i][boardSize - 1 - i],
              marked: false
            };
          }
        }
        
        setBoard(newBoard);
        setBingoLines(prevLines => Math.max(0, prevLines - 1));
      }
    }
  };
  
  const handleValidateDefect = (garmentPart: GarmentPart | null, defectType: DefectType | null, isValid: boolean) => {
    if (!selectedCell || !garmentPart || !defectType) return;
    
    const pairIsValid = addDefectToCell(selectedCell.rowIndex, selectedCell.colIndex, garmentPart, defectType);
    
    if (!pairIsValid) {
      toast.warning("Unusual combination", {
        description: "This defect rarely occurs on this garment part"
      });
    }
    
    if (isValid) {
      const success = markCell(selectedCell.rowIndex, selectedCell.colIndex, playerName);
      
      if (success) {
        toast.success("Defect validated!", {
          description: "Cell marked as validated"
        });
        
        const defectRecord = {
          id: crypto.randomUUID(),
          defectType: defectType,
          garmentPart: garmentPart,
          timestamp: new Date().toISOString(),
          operatorId: crypto.randomUUID(),
          operatorName: playerName,
          factoryId: 'A6',
          lineNumber: 'L1',
          status: 'verified' as const,
          reworked: false
        };
        
        addDefect(defectRecord);
        
        setTimeout(() => {
          const nextCell = findNextEmptyCell();
          if (nextCell) {
            setSelectedCell(nextCell);
            setModalOpen(true);
          }
        }, 1000);
      } else {
        toast.error("Cannot validate this cell", {
          description: "There was an error validating the defect"
        });
      }
    } else {
      toast.error("Invalid defect combination", {
        description: "This combination is not valid for this garment part"
      });
    }
    
    setModalOpen(false);
    setSelectedCell(null);
  };
  
  const updatePlayerStats = (newBingos: number) => {
    if (newBingos <= 0) return;
    
    const currentPlayer = players.find(p => p.name === playerName);
    if (currentPlayer) {
      const updatedPlayers = players.map(p => {
        if (p.name === playerName) {
          return {
            ...p,
            score: p.score + 10 + (newBingos * 50),
            defectsFound: p.defectsFound + 1,
            bingoCount: p.bingoCount + newBingos
          };
        }
        return p;
      });
      setPlayers(updatedPlayers);
    } else {
      setPlayers([
        ...players,
        {
          id: crypto.randomUUID(),
          name: playerName,
          role: 'operator',
          score: 10 + (newBingos * 50),
          bingoCount: newBingos,
          defectsFound: 1
        }
      ]);
    }
    
    localStorage.setItem('current-bingo-lines', (bingoLines + newBingos).toString());
  };
  
  const handleReset = () => {
    resetBoard();
    setBingoLines(0);
    setBoardCompletion(0);
    toast.info("Bingo board reset", {
      description: "You can start a new game"
    });
  };
  
  const renderDragDropItems = () => {
    return (
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div>
          <h4 className="text-sm font-medium mb-2">Garment Parts</h4>
          <div className="grid grid-cols-2 gap-2">
            {GARMENT_PARTS.slice(0, 6).map(part => (
              <div
                key={part.code}
                className="border rounded-md p-2 cursor-move bg-blue-50 shadow-sm hover:shadow-md transition-all"
                draggable
                onDragStart={() => handleDragStart('garment', part)}
                onDragEnd={handleDragEnd}
              >
                <span className="text-xs font-medium block truncate">{part.name}</span>
                <span className="text-xs text-muted-foreground">{part.code}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h4 className="text-sm font-medium mb-2">Defect Types</h4>
          <div className="grid grid-cols-2 gap-2">
            {DEFECT_TYPES.slice(0, 6).map(defect => (
              <div
                key={defect.code}
                className="border rounded-md p-2 cursor-move bg-red-50 shadow-sm hover:shadow-md transition-all"
                draggable
                onDragStart={() => handleDragStart('defect', defect)}
                onDragEnd={handleDragEnd}
              >
                <span className="text-xs font-medium block truncate">{defect.name}</span>
                <span className="text-xs text-muted-foreground">{defect.code}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };
  
  const renderConfetti = () => {
    if (!showConfetti) return null;
    
    return (
      <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
        <div className="absolute">
          <PartyPopper className="h-40 w-40 text-primary animate-pulse" />
        </div>
        <div className="text-4xl font-bold text-primary animate-bounce">
          BINGO!
        </div>
      </div>
    );
  };
  
  return (
    <div className="w-full max-w-5xl mx-auto bg-card rounded-xl shadow-md overflow-hidden border">
      {renderConfetti()}
      <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-4 text-white">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-bold">Defect Bingo Game</h3>
          <Badge variant="outline" className="bg-white/10 text-white border-white/20">
            <Trophy className="mr-1 h-3.5 w-3.5" />
            {bingoLines} Lines Completed
          </Badge>
        </div>
        <p className="text-sm text-blue-100">
          Tap on any cell with a + sign to add a defect. Complete lines to win!
        </p>
      </div>
      
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Board Completion:</span>
            <span className="text-sm">{boardCompletion}%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm">
              {bingoLines > 0 ? 
                <span className="flex items-center text-green-600">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  {bingoLines} Bingo{bingoLines > 1 ? 's' : ''} Found
                </span> : 
                "No Bingos Yet"}
            </span>
          </div>
        </div>
        
        <Progress value={boardCompletion} className="h-2 mb-4" />
        
        <Tabs defaultValue="board" value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="board">Bingo Board</TabsTrigger>
            <TabsTrigger value="drag-drop">Drag & Drop Mode</TabsTrigger>
          </TabsList>
          
          <TabsContent value="board" className="mt-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="flex justify-between items-center mb-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex items-center gap-1"
                  onClick={() => {
                    const nextCell = findNextEmptyCell();
                    if (nextCell) {
                      setSelectedCell(nextCell);
                      setModalOpen(true);
                    } else {
                      toast.info("All cells are filled", {
                        description: "Reset the board to start a new game"
                      });
                    }
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Add Defect
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  className="flex items-center gap-1"
                >
                  <RefreshCcw className="h-4 w-4" />
                  Reset Board
                </Button>
              </div>
              
              <div className="bg-white rounded-md shadow-sm border overflow-hidden">
                <div className="grid grid-cols-5 gap-1 p-1">
                  {board.map((row, rowIndex) => (
                    row.map((cell, colIndex) => (
                      <div
                        key={`${rowIndex}-${colIndex}`}
                        className="aspect-square min-h-[48px] bg-white border rounded-md overflow-hidden relative"
                        onClick={() => handleCellClick(rowIndex, colIndex)}
                      >
                        <BingoCard
                          cell={cell}
                          size="sm"
                          isBingoLine={completedLines.some(line => 
                            (line.type === 'row' && line.index === rowIndex) ||
                            (line.type === 'column' && line.index === colIndex) ||
                            (line.type === 'diagonal' && line.index === 1 && rowIndex === colIndex) ||
                            (line.type === 'diagonal' && line.index === 2 && rowIndex === (boardSize - 1 - colIndex))
                          )}
                        />
                        {(!cell.garmentPart || !cell.defectType) && (
                          <div className="absolute inset-0 flex items-center justify-center bg-background/5 hover:bg-background/10 transition-colors cursor-pointer">
                            <Plus className="h-5 w-5 text-primary/50" />
                          </div>
                        )}
                      </div>
                    ))
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="drag-drop" className="mt-4">
            <div className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-medium mb-4">Drag & Drop Mode</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Drag items from below and drop them onto the board to create your bingo!
                  </p>
                  
                  {renderDragDropItems()}
                </CardContent>
              </Card>
              
              <div className="bg-white rounded-md shadow-sm border overflow-hidden mt-4">
                <div className="grid grid-cols-5 gap-1 p-1">
                  {board.map((row, rowIndex) => (
                    row.map((cell, colIndex) => (
                      <div
                        key={`${rowIndex}-${colIndex}`}
                        className="aspect-square min-h-[48px] bg-white border rounded-md overflow-hidden relative"
                        onDragOver={handleDragOver}
                        onDrop={() => handleDrop(rowIndex, colIndex)}
                      >
                        <BingoCard
                          cell={cell}
                          size="sm"
                          isBingoLine={completedLines.some(line => 
                            (line.type === 'row' && line.index === rowIndex) ||
                            (line.type === 'column' && line.index === colIndex) ||
                            (line.type === 'diagonal' && line.index === 1 && rowIndex === colIndex) ||
                            (line.type === 'diagonal' && line.index === 2 && rowIndex === (boardSize - 1 - colIndex))
                          )}
                        />
                        {(!cell.garmentPart || !cell.defectType) && (
                          <div className="absolute inset-0 flex items-center justify-center bg-background/5 hover:bg-background/10 transition-colors">
                            <span className="text-xs text-muted-foreground">Drop here</span>
                          </div>
                        )}
                      </div>
                    ))
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      <DefectModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedCell(null);
        }}
        onValidate={handleValidateDefect}
        cell={selectedCell ? board[selectedCell.rowIndex][selectedCell.colIndex] : null}
      />
      
      <SupervisorNotification
        isOpen={supervisorModalOpen}
        onClose={() => setSupervisorModalOpen(false)}
        completedLine={currentCompletedLine}
        cells={completedLineCells}
        playerName={playerName}
        onValidate={handleSupervisorValidation}
      />
    </div>
  );
};

export default BingoBoard;
