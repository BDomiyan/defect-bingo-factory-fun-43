
import React, { useState, useEffect } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  ChevronDown, 
  ChevronUp, 
  Search, 
  Filter, 
  Download,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ArrowUpDown
} from "lucide-react";
import { cn } from "@/lib/utils";

interface OperatorData {
  id: string;
  name: string;
  line: string;
  department: string;
  role: string;
  defectsFound: number;
  defectsFixed: number;
  reworkRate: number;
  efficiency: number;
  status: 'excellent' | 'good' | 'average' | 'poor';
}

interface RecordedDefect {
  id: string;
  defectType: any;
  garmentPart: any;
  timestamp: string;
  operatorId: string;
  operatorName: string;
  factoryId: string;
  lineNumber: string;
  status: 'pending' | 'verified' | 'rejected';
  reworked: boolean;
  reworkTime?: number;
}

interface FactoryAnalyticsTableProps {
  data?: OperatorData[];
  defects?: RecordedDefect[];
  title?: string;
  description?: string;
}

const FactoryAnalyticsTable: React.FC<FactoryAnalyticsTableProps> = ({ 
  data = [],
  defects = [],
  title = "Operator Performance Analytics",
  description = "Detailed metrics for quality performance by operator"
}) => {
  const [sortField, setSortField] = useState<keyof OperatorData>('efficiency');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filter, setFilter] = useState('');
  const [operatorData, setOperatorData] = useState<OperatorData[]>(data);
  
  // Process defects into operator data if defects are provided and no data is provided
  useEffect(() => {
    if (defects.length > 0 && data.length === 0) {
      // Get unique operators from defects
      const operatorsMap = new Map<string, {
        id: string;
        name: string;
        defectsFound: number;
        defectsFixed: number;
        line: string;
      }>();
      
      defects.forEach(defect => {
        const opId = defect.operatorId;
        if (!operatorsMap.has(opId)) {
          operatorsMap.set(opId, {
            id: opId,
            name: defect.operatorName,
            defectsFound: 0,
            defectsFixed: 0,
            line: defect.lineNumber
          });
        }
        
        const op = operatorsMap.get(opId)!;
        op.defectsFound++;
        
        if (defect.reworked) {
          op.defectsFixed++;
        }
      });
      
      // Convert map to array
      const operators: OperatorData[] = Array.from(operatorsMap.values()).map(op => {
        const reworkRate = op.defectsFound > 0 
          ? Math.round((op.defectsFixed / op.defectsFound) * 100)
          : 0;
          
        let status: 'excellent' | 'good' | 'average' | 'poor';
        if (reworkRate >= 90) status = 'excellent';
        else if (reworkRate >= 75) status = 'good';
        else if (reworkRate >= 50) status = 'average';
        else status = 'poor';
        
        return {
          ...op,
          department: 'QC',
          role: 'Operator',
          reworkRate,
          efficiency: Math.min(100, 60 + reworkRate), // Simple formula for demo
          status
        };
      });
      
      setOperatorData(operators);
    }
  }, [defects, data]);
  
  const handleSort = (field: keyof OperatorData) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };
  
  const filteredData = operatorData.filter(operator => 
    operator.name.toLowerCase().includes(filter.toLowerCase()) ||
    operator.line.toLowerCase().includes(filter.toLowerCase()) ||
    operator.department?.toLowerCase().includes(filter.toLowerCase()) ||
    operator.role?.toLowerCase().includes(filter.toLowerCase())
  );
  
  const sortedData = [...filteredData].sort((a, b) => {
    const valueA = a[sortField];
    const valueB = b[sortField];
    
    if (typeof valueA === 'number' && typeof valueB === 'number') {
      return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
    }
    
    if (typeof valueA === 'string' && typeof valueB === 'string') {
      return sortDirection === 'asc' 
        ? valueA.localeCompare(valueB) 
        : valueB.localeCompare(valueA);
    }
    
    return 0;
  });
  
  const getStatusIcon = (status: OperatorData['status']) => {
    switch(status) {
      case 'excellent': return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'good': return <CheckCircle2 className="h-4 w-4 text-teal" />;
      case 'average': return <AlertCircle className="h-4 w-4 text-warning" />;
      case 'poor': return <XCircle className="h-4 w-4 text-destructive" />;
      default: return null;
    }
  };
  
  const getStatusClass = (status: OperatorData['status']) => {
    switch(status) {
      case 'excellent': return 'bg-success/10 text-success border-success/30';
      case 'good': return 'bg-teal/10 text-teal border-teal/30';
      case 'average': return 'bg-warning/10 text-warning border-warning/30';
      case 'poor': return 'bg-destructive/10 text-destructive border-destructive/30';
      default: return '';
    }
  };
  
  return (
    <Card className="shadow-md">
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search operators..."
                className="pl-8 w-full sm:w-[200px]"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 tablet-scroll">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead 
                className="w-[180px] cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center">
                  Operator
                  {sortField === 'name' && (
                    sortDirection === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                  )}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('line')}
              >
                <div className="flex items-center">
                  Line
                  {sortField === 'line' && (
                    sortDirection === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                  )}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('defectsFound')}
              >
                <div className="flex items-center">
                  Defects Found
                  {sortField === 'defectsFound' && (
                    sortDirection === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                  )}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('defectsFixed')}
              >
                <div className="flex items-center">
                  Defects Fixed
                  {sortField === 'defectsFixed' && (
                    sortDirection === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                  )}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('reworkRate')}
              >
                <div className="flex items-center">
                  Rework %
                  {sortField === 'reworkRate' && (
                    sortDirection === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                  )}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('efficiency')}
              >
                <div className="flex items-center">
                  Efficiency
                  {sortField === 'efficiency' && (
                    sortDirection === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                  )}
                </div>
              </TableHead>
              <TableHead 
                className="text-right cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center justify-end">
                  Status
                  {sortField === 'status' && (
                    sortDirection === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                  )}
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.length > 0 ? (
              sortedData.map((operator) => (
                <TableRow key={operator.id} className="hover:bg-muted/20">
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      {operator.name}
                      <span className="text-xs text-muted-foreground">{operator.role}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{operator.line}</Badge>
                  </TableCell>
                  <TableCell>{operator.defectsFound}</TableCell>
                  <TableCell>{operator.defectsFixed}</TableCell>
                  <TableCell>{operator.reworkRate}%</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={operator.efficiency}
                        className={cn(
                          "h-2 w-20",
                          operator.efficiency >= 90 ? "bg-success" :
                          operator.efficiency >= 80 ? "bg-teal" :
                          operator.efficiency >= 70 ? "bg-warning" :
                          "bg-destructive"
                        )}
                      />
                      <span>{operator.efficiency}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge className={cn(getStatusClass(operator.status), "flex items-center gap-1 ml-auto")}>
                      {getStatusIcon(operator.status)}
                      <span className="capitalize">{operator.status}</span>
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No results found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default FactoryAnalyticsTable;
