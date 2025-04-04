import React, { useState, useEffect } from 'react';
import BingoCard from '@/components/BingoCard';
import DefectModal from '@/components/DefectModal';
import SupervisorNotification from '@/components/SupervisorNotification';
import { useDragDropGrid } from '@/hooks/use-drag-drop-grid';
import { DEFECT_TYPES, GARMENT_PARTS, COMMON_DEFECT_PAIRS } from '@/lib/game-data';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Trophy, RefreshCcw, Plus, CheckCircle, PartyPopper, Loader2 } from 'lucide-react';
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Player, GarmentPart, DefectType, BingoBoard as BingoBoardType, BingoCell, RecordedDefect } from '@/lib/types';

interface BingoBoardProps {
  boardSize?: number;
  playerName?: string;
  operation?: string;
}

export const BingoBoard: React.FC<BingoBoardProps> = ({ 
  boardSize = 5,
  playerName = "Guest Player",
  operation
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
  
  // Store defects locally
  const [localDefects, setLocalDefects] = useLocalStorage<RecordedDefect[]>('local-defects', []);
  
  // Initialize local board state
  const [localBoardState, setLocalBoardState] = useState<BingoBoardType | null>(null);
  
  // Initialize board from local storage on component mount
  useEffect(() => {
    const savedBoard = localStorage.getItem('bingo-board-state');
    if (savedBoard) {
      try {
        setLocalBoardState(JSON.parse(savedBoard));
      } catch (e) {
        console.error('Error parsing saved board state:', e);
        setLocalBoardState(null);
      }
    }
  }, []);
  
  // Add new state for drag and drop experience
  const [selectedGarmentPart, setSelectedGarmentPart] = useState<GarmentPart | null>(null);
  const [dragStep, setDragStep] = useState<'garment' | 'defect'>('garment');
  const [relevantDefects, setRelevantDefects] = useState<DefectType[]>([]);
  const [targetCell, setTargetCell] = useState<{ rowIndex: number; colIndex: number } | null>(null);
  const [selectedDefectType, setSelectedDefectType] = useState<DefectType | null>(null);
  
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
    onBingo: (newLines) => handleBingo(newLines),
    initialBoard: localBoardState || undefined
  });
  
  // Save board state to local storage whenever it changes
  useEffect(() => {
    if (board) {
      localStorage.setItem('bingo-board-state', JSON.stringify(board));
    }
  }, [board]);
  
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
  
  // Add effect to update relevant defects when garment part is selected
  useEffect(() => {
    if (selectedGarmentPart) {
      // Find relevant defects for this garment part from COMMON_DEFECT_PAIRS
      const pair = COMMON_DEFECT_PAIRS.find(p => p.garmentCode === selectedGarmentPart.code);
      
      if (pair) {
        // Filter defect types to only include those valid for this garment part
        const filteredDefects = DEFECT_TYPES.filter(defect => 
          pair.defectCodes.includes(defect.code)
        );
        setRelevantDefects(filteredDefects);
      } else {
        // If no specific rules, show all defects
        setRelevantDefects(DEFECT_TYPES);
      }
      
      // Update drag step to defect selection
      setDragStep('defect');
    } else {
      setDragStep('garment');
      setRelevantDefects([]);
    }
  }, [selectedGarmentPart]);
  
  // Custom drag and drop handlers for improved experience
  const handleGarmentPartSelect = (part: GarmentPart) => {
    setSelectedGarmentPart(part);
  };
  
  const handleDefectTypeSelect = (defect: DefectType) => {
    setSelectedDefectType(defect);
  };
  
  const handleCustomDragStart = (type: 'garment' | 'defect', item: any) => {
    if (type === 'garment') {
      setSelectedGarmentPart(item);
    } else if (type === 'defect') {
      setSelectedDefectType(item);
    }
    handleDragStart(type, item);
  };
  
  const handleCustomDrop = (rowIndex: number, colIndex: number) => {
    setTargetCell({ rowIndex, colIndex });
    
    if (dragStep === 'defect' && selectedGarmentPart && selectedDefectType) {
      // We have both garment part and defect type, so add them to the cell
      const success = addDefectToCell(rowIndex, colIndex, selectedGarmentPart, selectedDefectType);
      
      if (success) {
        toast.success("Defect pair added!", {
          description: `Added ${selectedGarmentPart.name} + ${selectedDefectType.name}`
        });
      }
      
      // Reset selection after drop
      setSelectedGarmentPart(null);
      setSelectedDefectType(null);
      setDragStep('garment');
      setTargetCell(null);
    } else if (dragStep === 'garment') {
      // If user tries to drop a garment directly, show guidance
      toast.info("First select a garment part, then a defect type");
    } else if (dragStep === 'defect' && !selectedDefectType) {
      // If we're on defect step but no defect is selected
      toast.info("Please select a defect type");
    }
  };
  
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
      
      const firstLine = newLines[0];
      setCurrentCompletedLine(firstLine);
      setCompletedLineCells(getCellsForLine(firstLine));
      setSupervisorModalOpen(true);
      
      updatePlayerStats(newLines.length);
      
      // Calculate points to add
      let pointsToAdd = 0;
      newLines.forEach(line => {
        if (line.type === 'diagonal') {
          pointsToAdd += 40; // Diagonal is worth more
        } else {
          pointsToAdd += 25; // Row or column
        }
      });
      
      // Update local score tracking
      const currentScore = Number(localStorage.getItem('bingo-score') || '0');
      localStorage.setItem('bingo-score', String(currentScore + pointsToAdd));
      
      const allCellsMarked = board.every(row => row.every(cell => cell.marked));
      if (allCellsMarked) {
        toast.success("FULL BOARD BINGO!", {
          description: "You've completed the entire board!",
          duration: 8000,
          icon: <Trophy className="h-5 w-5 text-yellow-400" />
        });
        
        updatePlayerStats(1);
        
        // Mark bingo card as completed locally
        localStorage.setItem('bingo-completed', 'true');
        localStorage.setItem('bingo-completed-at', new Date().toISOString());
        
        // Add full board bonus points
        const fullBoardBonus = 200;
        const currentScore = Number(localStorage.getItem('bingo-score') || '0');
        localStorage.setItem('bingo-score', String(currentScore + fullBoardBonus));
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
  
  // Define a local function to add defects
  const addDefectLocally = (defect: RecordedDefect) => {
    setLocalDefects([...localDefects, defect]);
  };
  
  const handleValidateDefect = async (garmentPart: GarmentPart | null, defectType: DefectType | null, isValid: boolean) => {
    if (!selectedCell || !garmentPart || !defectType) return;
    
    // First add the defect to the cell
    const pairIsValid = addDefectToCell(selectedCell.rowIndex, selectedCell.colIndex, garmentPart, defectType);
    
    if (!pairIsValid) {
      toast.warning("Unusual combination", {
        description: "This defect rarely occurs on this garment part. You can still proceed with validation."
      });
    }
    
    // If the defect was added successfully, proceed with marking it
    if (isValid) {
      const success = markCell(selectedCell.rowIndex, selectedCell.colIndex, playerName);
      
      if (success) {
        toast.success("Defect validated!", {
          description: "Cell marked as validated"
        });
        
        // Create a defect record with proper user information
        const defectRecord: RecordedDefect = {
          id: crypto.randomUUID(),
          defectType: defectType,
          garmentPart: garmentPart,
          timestamp: new Date().toISOString(),
          operatorId: crypto.randomUUID(),
          operatorName: playerName,
          factoryId: '00000000-0000-0000-0000-000000000001',
          lineNumber: 'L1',
          epfNumber: 'N/A',
          operation: operation || undefined,
          status: 'verified',
          reworked: false
        };
        
        // Add defect to local state only
        addDefectLocally(defectRecord);
        
        // Show success message
        toast.success("Defect recorded", {
          description: "Defect has been added to your game record",
          duration: 3000
        });
        
        // Show a toast with option to continue to next cell
        toast.success("Continue to next cell?", {
          description: "Click here to add next defect",
          duration: 5000,
          action: {
            label: "Next Cell",
            onClick: () => {
              const nextCell = findNextEmptyCell();
              if (nextCell) {
                setSelectedCell(nextCell);
                setModalOpen(true);
              } else {
                toast.info("No more empty cells", {
                  description: "All cells have defects added"
                });
              }
            }
          }
        });
      } else {
        // Keep the defect in the cell but show it needs validation
        toast.info("Defect added but needs validation", {
          description: "Click the cell again to validate this defect",
          duration: 5000
        });
      }
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
            bingoCount: p.bingoCount + newBingos,
            operation: operation || p.operation
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
          defectsFound: 1,
          operation: operation
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
      <div className="space-y-6">
        {/* Step indicator */}
        <div className="flex items-center justify-center mb-4">
          <div className={`flex items-center ${dragStep === 'garment' ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 mr-2">
              1
            </div>
            <span>Select Garment Part</span>
          </div>
          <div className="h-px w-12 bg-border mx-2"></div>
          <div className={`flex items-center ${dragStep === 'defect' ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 mr-2">
              2
            </div>
            <span>Select Defect Type</span>
          </div>
        </div>
        
        {dragStep === 'garment' ? (
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center">
                <span className="bg-primary/10 text-primary rounded-full h-6 w-6 flex items-center justify-center mr-2">1</span>
                Select a Garment Part
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {GARMENT_PARTS.map(part => (
                  <div
                    key={part.code}
                    className={`border rounded-md p-3 cursor-pointer bg-blue-50 hover:bg-blue-100 hover:shadow-md transition-all flex flex-col items-center justify-center space-y-1 ${selectedGarmentPart?.code === part.code ? 'ring-2 ring-primary' : ''}`}
                    onClick={() => handleGarmentPartSelect(part)}
                    draggable
                    onDragStart={() => handleCustomDragStart('garment', part)}
                    onDragEnd={handleDragEnd}
                  >
                    <span className="font-medium text-center text-sm">{part.name}</span>
                    <span className="text-xs text-muted-foreground bg-blue-200/50 px-2 py-0.5 rounded-full">{part.code}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium mb-2 flex items-center">
                <span className="bg-primary/10 text-primary rounded-full h-6 w-6 flex items-center justify-center mr-2">2</span>
                Select a Defect Type for {selectedGarmentPart?.name}
              </h4>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setSelectedGarmentPart(null);
                  setSelectedDefectType(null);
                  setDragStep('garment');
                }}
              >
                ← Back to Garment Parts
              </Button>
            </div>
            
            <div className="p-3 bg-blue-50 rounded-md mb-4 flex items-center">
              <div className="mr-3">
                <span className="text-sm font-medium">Selected Garment:</span>
                <div className="mt-1 bg-blue-200 text-blue-800 px-2 py-1 rounded text-xs inline-block">
                  {selectedGarmentPart?.name} ({selectedGarmentPart?.code})
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {relevantDefects.map(defect => (
                <div
                  key={defect.code}
                  className={`border rounded-md p-3 cursor-pointer bg-red-50 hover:bg-red-100 hover:shadow-md transition-all flex flex-col items-center justify-center space-y-1 ${selectedDefectType?.code === defect.code ? 'ring-2 ring-primary' : ''}`}
                  onClick={() => handleDefectTypeSelect(defect)}
                  draggable
                  onDragStart={() => handleCustomDragStart('defect', defect)}
                  onDragEnd={handleDragEnd}
                >
                  <span className="font-medium text-center text-sm">{defect.name}</span>
                  <span className="text-xs text-muted-foreground bg-red-200/50 px-2 py-0.5 rounded-full">Code: {defect.code}</span>
                </div>
              ))}
            </div>
            
            {selectedDefectType && (
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-blue-50 rounded-md">
                    <span className="text-xs font-medium">{selectedGarmentPart?.name}</span>
                  </div>
                  <span>+</span>
                  <div className="p-2 bg-red-50 rounded-md">
                    <span className="text-xs font-medium">{selectedDefectType.name}</span>
                  </div>
                </div>
                
                <Button 
                  size="sm" 
                  onClick={() => {
                    // Find first empty cell
                    for (let i = 0; i < boardSize; i++) {
                      for (let j = 0; j < boardSize; j++) {
                        if (!board[i][j].garmentPart || !board[i][j].defectType) {
                          handleCustomDrop(i, j);
                          return;
                        }
                      }
                    }
                    toast.info("No empty cells available");
                  }}
                >
                  Add to Next Empty Cell
                </Button>
              </div>
            )}
          </div>
        )}
        
        <div className="mt-6 p-4 bg-muted/30 rounded-md">
          <h4 className="text-sm font-medium mb-2">How to use:</h4>
          <ol className="text-sm text-muted-foreground space-y-1 list-decimal pl-4">
            <li>First select or drag a Garment Part</li>
            <li>Then select or drag a relevant Defect Type</li>
            <li>Drop the selection onto any empty cell in the board</li>
            <li>Complete rows, columns, or diagonals to score Bingo!</li>
          </ol>
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
  
  // Helper function to create an empty board
  const initializeEmptyBoard = () => {
    const emptyBoard: BingoBoardType = [];
    for (let i = 0; i < boardSize; i++) {
      const row = [];
      for (let j = 0; j < boardSize; j++) {
        row.push({
          id: `${i}-${j}`,
          marked: false
        });
      }
      emptyBoard.push(row);
    }
    return emptyBoard;
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
        {operation && (
          <Badge className="mt-2 bg-indigo-400/20 border-indigo-300/40">
            Operation: {operation}
          </Badge>
        )}
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
                  <h3 className="text-lg font-medium flex items-center mb-4">
                    <Sparkles className="mr-2 h-5 w-5 text-primary" />
                    Drag & Drop Mode
                  </h3>
                  
                  {renderDragDropItems()}
                </CardContent>
              </Card>
              
              <div className="bg-white rounded-md shadow-sm border overflow-hidden mt-4">
                <div className="grid grid-cols-5 gap-1 p-1">
                  {board.map((row, rowIndex) => (
                    row.map((cell, colIndex) => (
                      <div
                        key={`${rowIndex}-${colIndex}`}
                        className={`aspect-square min-h-[48px] bg-white border rounded-md overflow-hidden relative ${
                          targetCell?.rowIndex === rowIndex && targetCell?.colIndex === colIndex
                            ? 'ring-2 ring-primary'
                            : ''
                        }`}
                        onDragOver={handleDragOver}
                        onDrop={() => handleCustomDrop(rowIndex, colIndex)}
                        onClick={() => {
                          if (selectedGarmentPart && selectedDefectType) {
                            handleCustomDrop(rowIndex, colIndex);
                          }
                        }}
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
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/5 hover:bg-background/10 transition-colors text-center p-1">
                            <Plus className="h-4 w-4 text-primary/70 mb-1" />
                            <span className="text-[10px] text-muted-foreground">Drop here</span>
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
