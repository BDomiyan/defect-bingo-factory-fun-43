
export interface GarmentPart {
  code: string;
  name: string;
}

export interface DefectType {
  code: number;
  name: string;
}

export interface BingoCell {
  id: string;
  garmentPart: GarmentPart;
  defectType: DefectType;
  marked: boolean;
  validatedBy?: string;
  validatedAt?: Date;
}

export interface Player {
  id: string;
  name: string;
  role: 'operator' | 'supervisor' | 'admin';
  score: number;
  bingoCount: number;
  defectsFound: number;
}

export interface Award {
  id: string;
  name: string;
  description: string;
  icon: string;
  recipients: string[];
}

export type BingoBoard = BingoCell[][];

export type BingoStatus = 'none' | 'bingo' | 'fullBoard';

export interface DragItem {
  type: string;
  cellId: string;
  rowIndex: number;
  colIndex: number;
}
