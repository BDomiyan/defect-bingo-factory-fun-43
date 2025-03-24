
import React, { useState, useEffect } from 'react';
import BingoCard from '@/components/BingoCard';
import DraggableItem from '@/components/DraggableItem';
import DefectModal from '@/components/DefectModal';
import { useDragDropGrid } from '@/hooks/use-drag-drop-grid';
import { DEFECT_TYPES, GARMENT_PARTS } from '@/lib/game-data';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Trophy, RefreshCcw } from 'lucide-react';
import { toast } from "sonner";
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Player } from '@/lib/types';

interface BingoBoardProps {
  boardSize?: number;
  playerName?: string;
}

const BingoBoard: React.FC<BingoBoardProps> = ({ 
  boardSize = 5,
  playerName = "Guest Player"
}) => {
  const [activeTab, setActiveTab] = useState("defects");
  const [selectedCell, setSelectedCell] = useState<{ rowIndex: number; colIndex: number } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [players, setPlayers] = useLocalStorage<Player[]>('defect-bingo-players', []);
  const [bingoLines, setBingoLines] = useState<number>(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  // Initialize the drag and drop grid
  const { 
    board, 
    setBoard, 
    handleDragStart, 
    handleDragOver, 
    handleDrop,
    handleDragEnd,
    markCell,
    resetBoard
  } = useDragDropGrid({ boardSize });
  
  // Update isMobile state when window is resized
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Handle cell click to open the modal
  const handleCellClick = (rowIndex: number, colIndex: number) => {
    setSelectedCell({ rowIndex, colIndex });
    setModalOpen(true);
  };
  
  // Handle validating a defect
  const handleValidateDefect = () => {
    if (!selectedCell) return;
    
    const success = markCell(selectedCell.rowIndex, selectedCell.colIndex, playerName);
    
    if (success) {
      toast.success("Defect validated!", {
        description: "Cell marked as validated"
      });
      
      // Check for bingo
      checkForBingo();
      
      // Update player stats
      const currentPlayer = players.find(p => p.name === playerName);
      if (currentPlayer) {
        const updatedPlayers = players.map(p => {
          if (p.name === playerName) {
            return {
              ...p,
              score: p.score + 10,
              defectsFound: p.defectsFound + 1
            };
          }
          return p;
        });
        setPlayers(updatedPlayers);
      } else {
        // Create new player record if doesn't exist
        setPlayers([
          ...players,
          {
            id: crypto.randomUUID(),
            name: playerName,
            role: 'operator',
            score: 10,
            bingoCount: 0,
            defectsFound: 1
          }
        ]);
      }
    } else {
      toast.error("Cannot validate this cell", {
        description: "Make sure cell has both garment part and defect type"
      });
    }
    
    setModalOpen(false);
    setSelectedCell(null);
  };
  
  // Check for bingo (horizontal, vertical, diagonal)
  const checkForBingo = () => {
    const completedLines = [];
    
    // Check horizontal lines
    for (let i = 0; i < boardSize; i++) {
      if (board[i].every(cell => cell.marked)) {
        completedLines.push({ type: 'row', index: i });
      }
    }
    
    // Check vertical lines
    for (let j = 0; j < boardSize; j++) {
      if (board.every(row => row[j].marked)) {
        completedLines.push({ type: 'column', index: j });
      }
    }
    
    // Check diagonals
    const diag1 = [];
    const diag2 = [];
    for (let i = 0; i < boardSize; i++) {
      diag1.push(board[i][i]);
      diag2.push(board[i][boardSize - 1 - i]);
    }
    
    if (diag1.every(cell => cell.marked)) {
      completedLines.push({ type: 'diagonal', index: 1 });
    }
    
    if (diag2.every(cell => cell.marked)) {
      completedLines.push({ type: 'diagonal', index: 2 });
    }
    
    if (completedLines.length > bingoLines) {
      // New bingo!
      setBingoLines(completedLines.length);
      
      // Update player's bingo count
      const updatedPlayers = players.map(p => {
        if (p.name === playerName) {
          return {
            ...p,
            bingoCount: p.bingoCount + (completedLines.length - bingoLines),
            score: p.score + ((completedLines.length - bingoLines) * 50)
          };
        }
        return p;
      });
      
      setPlayers(updatedPlayers);
      
      toast.success("BINGO!", {
        description: `You completed a ${completedLines[completedLines.length - 1].type}!`,
        duration: 5000,
        icon: <Sparkles className="h-5 w-5 text-yellow-400" />
      });
    }
  };
  
  // Handle board reset
  const handleReset = () => {
    resetBoard();
    setBingoLines(0);
    toast.info("Bingo board reset", {
      description: "You can start a new game"
    });
  };
  
  return (
    <div className="w-full max-w-5xl mx-auto bg-card rounded-xl shadow-md overflow-hidden border">
      <div className="bg-gradient-professional p-4 text-white">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-bold">Defect Bingo Game</h3>
          <Badge variant="outline" className="bg-white/10 text-white border-white/20">
            <Trophy className="mr-1 h-3.5 w-3.5" />
            {bingoLines} Lines Completed
          </Badge>
        </div>
        <p className="text-sm text-blue-100">
          Drag defects and garment parts to the board and match them with real defects you find
        </p>
      </div>
      
      <div className="p-4">
        {/* Mobile-friendly tabs for defects and garment parts */}
        <Tabs defaultValue="board" className="mb-6">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="board">Bingo Board</TabsTrigger>
            <TabsTrigger value="defects">Defect Types</TabsTrigger>
            <TabsTrigger value="garments">Garment Parts</TabsTrigger>
          </TabsList>
          
          <TabsContent value="board" className="mt-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-white rounded-md shadow-sm border overflow-hidden">
                <div className="grid grid-cols-5 gap-1 p-1">
                  {board.map((row, rowIndex) => (
                    row.map((cell, colIndex) => (
                      <div
                        key={`${rowIndex}-${colIndex}`}
                        className="aspect-square min-h-[48px] bg-white border rounded-md overflow-hidden relative"
                        onDragOver={handleDragOver}
                        onDrop={() => handleDrop(rowIndex, colIndex)}
                        onClick={() => handleCellClick(rowIndex, colIndex)}
                      >
                        <BingoCard
                          cell={cell}
                          size="sm"
                        />
                      </div>
                    ))
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end">
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
            </div>
          </TabsContent>
          
          <TabsContent value="defects" className="mt-4">
            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium mb-3 text-sm">Drag Defect Types to Board</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {DEFECT_TYPES.map(defect => (
                    <DraggableItem
                      key={defect.code}
                      type="defect"
                      data={defect}
                      onDragStart={() => handleDragStart('defect', defect)}
                      onDragEnd={handleDragEnd}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="garments" className="mt-4">
            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium mb-3 text-sm">Drag Garment Parts to Board</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {GARMENT_PARTS.map(part => (
                    <DraggableItem
                      key={part.code}
                      type="garment"
                      data={part}
                      onDragStart={() => handleDragStart('garment', part)}
                      onDragEnd={handleDragEnd}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {!isMobile && (
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium mb-3 text-sm">Drag Defect Types to Board</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {DEFECT_TYPES.map(defect => (
                    <DraggableItem
                      key={defect.code}
                      type="defect"
                      data={defect}
                      onDragStart={() => handleDragStart('defect', defect)}
                      onDragEnd={handleDragEnd}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium mb-3 text-sm">Drag Garment Parts to Board</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {GARMENT_PARTS.map(part => (
                    <DraggableItem
                      key={part.code}
                      type="garment"
                      data={part}
                      onDragStart={() => handleDragStart('garment', part)}
                      onDragEnd={handleDragEnd}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      
      {/* Defect validation modal */}
      <DefectModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedCell(null);
        }}
        onValidate={handleValidateDefect}
        cell={selectedCell ? board[selectedCell.rowIndex][selectedCell.colIndex] : null}
      />
    </div>
  );
};

export default BingoBoard;
