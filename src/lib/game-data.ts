import { GarmentPart, DefectType, Award, BingoBoard } from "./types";

export const GARMENT_PARTS: GarmentPart[] = [
  { code: "A", name: "Label Attach" },
  { code: "B", name: "Neck Binding" },
  { code: "C", name: "Sleeve Attach" },
  { code: "D", name: "Side Seam" },
  { code: "E", name: "Side Seam" },
  { code: "F", name: "Zipper Bar Tack" },
  { code: "G", name: "Sleeve Tack" },
  { code: "H", name: "Croch Attach" },
  { code: "I", name: "Foot Attach" },
  { code: "J", name: "Heat Seal" },
  { code: "K", name: "Zipper Outline" },
  { code: "L", name: "In Seam" },
  { code: "M", name: "Neck Tack" },
  { code: "N", name: "Bottom Attach" },
  { code: "O", name: "Sleeve Dart" },
  { code: "P", name: "Sleeve Cuff" },
  { code: "Q", name: "Tab" },
  { code: "R", name: "Foot Bartack" },
  { code: "S", name: "Box Tack" },
  { code: "T", name: "Top Foot" },
  { code: "U", name: "Elastic" },
  { code: "V", name: "Zipper" },
  { code: "W", name: "Facing Tack" },
  { code: "X", name: "Bottom Binding" },
];

export const DEFECT_TYPES: DefectType[] = [
  { code: 1, name: "Printing / MBRO" },
  { code: 2, name: "Slubs / Holes / NAR" },
  { code: 3, name: "Color Shading" },
  { code: 4, name: "Broken Stitches" },
  { code: 5, name: "Slip Stitches" },
  { code: 6, name: "SPI (Stitches Per Inch)" },
  { code: 7, name: "Puckering" },
  { code: 8, name: "Loose Tensions" },
  { code: 9, name: "Snap Defects" },
  { code: 10, name: "High-Low" },
  { code: 11, name: "Uneven / Raw Edge" },
  { code: 12, name: "Needle Mark" },
  { code: 13, name: "Open Seam" },
  { code: 14, name: "Pleats" },
  { code: 15, name: "Missing Stitches" },
  { code: 16, name: "Skip / Run-Off Stitches" },
  { code: 17, name: "Incorrect Label" },
  { code: 18, name: "Wrong Placement" },
  { code: 19, name: "Looseness" },
  { code: 20, name: "Cut Damage" },
  { code: 21, name: "Stain" },
  { code: 22, name: "Oil Marks" },
  { code: 23, name: "Stickers" },
  { code: 24, name: "Uncut Thread" },
];

export const COMMON_DEFECT_PAIRS: { garmentCode: string; defectCodes: number[] }[] = [
  { garmentCode: "A", defectCodes: [17, 18, 21, 22] }, // Label Attach
  { garmentCode: "B", defectCodes: [4, 7, 8, 13] }, // Neck Binding
  { garmentCode: "C", defectCodes: [12, 15, 16, 18] }, // Sleeve Attach
  { garmentCode: "D", defectCodes: [2, 11, 13, 20] }, // Side Seam
  { garmentCode: "E", defectCodes: [2, 11, 13, 20] }, // Side Seam
  { garmentCode: "F", defectCodes: [4, 15, 16, 24] }, // Zipper Bar Tack
  { garmentCode: "K", defectCodes: [4, 7, 13, 19] }, // Zipper Outline
  { garmentCode: "V", defectCodes: [10, 18, 19, 20] }, // Zipper
  { garmentCode: "N", defectCodes: [4, 6, 8, 24] }, // Bottom Attach
  { garmentCode: "X", defectCodes: [4, 6, 8, 24] }, // Bottom Binding
];

export const AWARDS: Award[] = [
  {
    id: "lightning-spotter",
    name: "Lightning Spotter",
    description: "Awarded to the first checker with Bingo",
    icon: "zap",
    recipients: []
  },
  {
    id: "eagle-eye",
    name: "Eagle Eye",
    description: "Awarded to the second fastest Bingo",
    icon: "eye",
    recipients: []
  },
  {
    id: "master-detective",
    name: "Master Detective",
    description: "Awarded to the third fastest Bingo",
    icon: "search",
    recipients: []
  },
  {
    id: "guardian-of-quality",
    name: "Guardian of Quality",
    description: "Monthly recognition for most defects identified",
    icon: "shield",
    recipients: []
  }
];

export const MOCK_PLAYERS: any[] = [
  {
    id: "p1",
    name: "Sarah Johnson",
    role: "operator",
    score: 285,
    bingoCount: 3,
    defectsFound: 42
  },
  {
    id: "p2",
    name: "Michael Chen",
    role: "operator",
    score: 320,
    bingoCount: 4,
    defectsFound: 38
  },
  {
    id: "p3",
    name: "Elena Rodriguez",
    role: "supervisor",
    score: 410,
    bingoCount: 5,
    defectsFound: 53
  },
  {
    id: "p4",
    name: "James Wilson",
    role: "operator",
    score: 270,
    bingoCount: 3,
    defectsFound: 36
  },
  {
    id: "p5",
    name: "Aisha Patel",
    role: "operator",
    score: 305,
    bingoCount: 3,
    defectsFound: 45
  }
];

export const checkForBingo = (board: BingoBoard): string[] => {
  const size = board.length;
  const bingos: string[] = [];
  
  // Check rows
  for (let i = 0; i < size; i++) {
    if (board[i].every(cell => cell.marked && cell.garmentPart && cell.defectType)) {
      bingos.push(`row-${i}`);
    }
  }
  
  // Check columns
  for (let j = 0; j < size; j++) {
    if (board.every(row => row[j].marked && row[j].garmentPart && row[j].defectType)) {
      bingos.push(`col-${j}`);
    }
  }
  
  // Check diagonal (top-left to bottom-right)
  if (Array.from({ length: size }, (_, i) => board[i][i]).every(cell => 
    cell.marked && cell.garmentPart && cell.defectType
  )) {
    bingos.push('diag-1');
  }
  
  // Check diagonal (top-right to bottom-left)
  if (Array.from({ length: size }, (_, i) => board[i][size - 1 - i]).every(cell => 
    cell.marked && cell.garmentPart && cell.defectType
  )) {
    bingos.push('diag-2');
  }
  
  return bingos;
};

export const calculateCompletion = (board: BingoBoard): number => {
  const totalCells = board.length * board[0].length;
  let filledCells = 0;
  let markedCells = 0;
  
  for (let i = 0; i < board.length; i++) {
    for (let j = 0; j < board[i].length; j++) {
      if (board[i][j].garmentPart && board[i][j].defectType) {
        filledCells++;
        
        if (board[i][j].marked) {
          markedCells++;
        }
      }
    }
  }
  
  if (filledCells === 0) return 0;
  
  return Math.round((markedCells / filledCells) * 100);
};
