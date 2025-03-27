
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
  garmentPart?: GarmentPart;
  defectType?: DefectType;
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
  epfNumber?: string;
  line?: string;
  factory?: string;
  operation?: string;
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
  type: 'defect' | 'garment' | 'cell';
  id: string;
  data: DefectType | GarmentPart;
}

export interface Operator {
  id: string;
  name: string;
  epfNumber: string;
  line: string;
  factory: string;
  operation?: string;
}

export interface RecordedDefect {
  id: string;
  defectType: DefectType;
  garmentPart: GarmentPart;
  timestamp: string;
  operatorId: string;
  operatorName: string;
  factoryId: string;
  lineNumber: string;
  epfNumber: string;
  operation?: string;
  status: 'pending' | 'verified' | 'rejected';
  reworked: boolean;
  reworkTime?: number;
  supervisorComment?: string;
}
