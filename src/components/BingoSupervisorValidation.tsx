import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, XCircle, AlertTriangle, Clock, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/context/auth-context';
import { useBingoDefects } from '@/lib/supabase/hooks';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface BingoSupervisorValidationProps {
  users?: any[];
}

export const BingoSupervisorValidation = ({ users = [] }: BingoSupervisorValidationProps) => {
  const { user } = useAuth();
  const { bingoDefects, loading: defectsLoading, validateBingoDefect, fetchBingoDefects } = useBingoDefects();
  const [isValidating, setIsValidating] = useState(false);
  const [selectedDefect, setSelectedDefect] = useState<any>(null);
  const [comment, setComment] = useState('');
  const [filter, setFilter] = useState('pending');
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [showValidateDialog, setShowValidateDialog] = useState(false);
  
  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      console.log('Current Supabase session:', data.session);
      setCheckingAuth(false);
    };
    
    checkAuth();
  }, []);
  
  // Get defects based on validation status
  const pendingDefects = bingoDefects.filter(d => !d.validated && !d.validated_by);
  const verifiedDefects = bingoDefects.filter(d => d.validated && d.validated_by);
  const rejectedDefects = bingoDefects.filter(d => !d.validated && d.validated_by);
  
  // Get the defects based on filter
  const getFilteredDefects = () => {
    switch (filter) {
      case 'pending':
        return pendingDefects;
      case 'verified':
        return verifiedDefects;
      case 'rejected':
        return rejectedDefects;
      default:
        return bingoDefects;
    }
  };
  
  const handleSelectDefect = (defect: any) => {
    setSelectedDefect(defect);
    setShowValidateDialog(true);
  };
  
  const handleCloseDialog = () => {
    setShowValidateDialog(false);
    setSelectedDefect(null);
    setComment('');
  };
  
  const handleValidate = async (defectId: string, isValid: boolean) => {
    if (isValidating) return;
    setIsValidating(true);
    
    try {
      await validateBingoDefect(defectId, isValid, comment);
      toast.success(isValid ? "Defect validated" : "Defect rejected", {
        description: isValid 
          ? "The defect has been marked as valid" 
          : "The defect has been marked as invalid"
      });
      handleCloseDialog();
      fetchBingoDefects();
    } catch (error) {
      console.error("Error validating defect:", error);
      toast.error("Validation failed", {
        description: "There was an error while validating the defect"
      });
    } finally {
      setIsValidating(false);
    }
  };
  
  const formatDefectData = (defect: any) => {
    // Find garment part name
    let garmentPartName = defect.garment_part;
    try {
      if (typeof defect.garment_part === 'object' && defect.garment_part !== null) {
        garmentPartName = defect.garment_part.name || defect.garment_part.code;
      }
    } catch (e) {
      console.error("Error parsing garment part:", e);
    }
    
    // Find defect type name
    let defectTypeName = defect.defect_type;
    try {
      if (typeof defect.defect_type === 'object' && defect.defect_type !== null) {
        defectTypeName = defect.defect_type.name || defect.defect_type.code;
      }
    } catch (e) {
      console.error("Error parsing defect type:", e);
    }
    
    return {
      garmentPart: garmentPartName,
      defectType: defectTypeName,
      bingoLine: defect.is_bingo_line ? 
        `${defect.bingo_line_type?.charAt(0).toUpperCase()}${defect.bingo_line_type?.slice(1) || ''} ${defect.bingo_line_index || ''}` : 
        'No',
      operator: defect.created_by_user?.name || 'Unknown',
      date: formatDistanceToNow(new Date(defect.created_at), { addSuffix: true }),
      pointsAwarded: defect.points_awarded || 0
    };
  };
  
  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Bingo Defect Validation</span>
            <Badge variant={filter === 'pending' ? 'destructive' : (filter === 'verified' ? 'default' : 'secondary')}>
              {pendingDefects.length} Pending
            </Badge>
          </CardTitle>
          <CardDescription>
            Validate or reject defects reported through the Bingo game
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue={filter} onValueChange={setFilter} className="w-full">
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="pending" className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>Pending ({pendingDefects.length})</span>
                </TabsTrigger>
                <TabsTrigger value="verified" className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" />
                  <span>Verified ({verifiedDefects.length})</span>
                </TabsTrigger>
                <TabsTrigger value="rejected" className="flex items-center gap-1">
                  <XCircle className="h-4 w-4" />
                  <span>Rejected ({rejectedDefects.length})</span>
                </TabsTrigger>
              </TabsList>
              
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending Validation</SelectItem>
                  <SelectItem value="verified">Verified Defects</SelectItem>
                  <SelectItem value="rejected">Rejected Defects</SelectItem>
                  <SelectItem value="all">All Defects</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <TabsContent value="pending" className="mt-0">
              {pendingDefects.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground" />
                  <p className="mt-2 text-muted-foreground">No pending defects to validate</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingDefects.map(defect => {
                    const { garmentPart, defectType, bingoLine, operator, date, pointsAwarded } = formatDefectData(defect);
                    
                    return (
                      <div key={defect.id} className="border rounded-lg p-4 bg-background hover:bg-muted/30 transition-colors">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-medium">{garmentPart} - {defectType}</h3>
                            <div className="text-sm text-muted-foreground mt-1">
                              <p>Reported by {operator} • {date}</p>
                              <p className="mt-1">Bingo Line: {bingoLine} • Points: {pointsAwarded}</p>
                              <p className="mt-1">Line: {defect.line_number || 'N/A'}</p>
                            </div>
                          </div>
                          
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleSelectDefect(defect)}
                          >
                            Validate
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="verified" className="mt-0">
              {verifiedDefects.length === 0 ? (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground" />
                  <p className="mt-2 text-muted-foreground">No verified defects</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {verifiedDefects.map(defect => {
                    const { garmentPart, defectType, bingoLine, operator, date, pointsAwarded } = formatDefectData(defect);
                    
                    return (
                      <div key={defect.id} className="border rounded-lg p-4 bg-background hover:bg-muted/30 transition-colors">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center">
                              <h3 className="font-medium">{garmentPart} - {defectType}</h3>
                              <Badge variant="default" className="ml-2">Verified</Badge>
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              <p>Reported by {operator} • {date}</p>
                              <p className="mt-1">Bingo Line: {bingoLine} • Points: {pointsAwarded}</p>
                              <p className="mt-1">Line: {defect.line_number || 'N/A'}</p>
                            </div>
                            {defect.supervisor_comment && (
                              <div className="mt-2 text-sm">
                                <span className="font-medium">Comment:</span> {defect.supervisor_comment}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="rejected" className="mt-0">
              {rejectedDefects.length === 0 ? (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground" />
                  <p className="mt-2 text-muted-foreground">No rejected defects</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {rejectedDefects.map(defect => {
                    const { garmentPart, defectType, bingoLine, operator, date, pointsAwarded } = formatDefectData(defect);
                    
                    return (
                      <div key={defect.id} className="border rounded-lg p-4 bg-background hover:bg-muted/30 transition-colors">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center">
                              <h3 className="font-medium">{garmentPart} - {defectType}</h3>
                              <Badge variant="destructive" className="ml-2">Rejected</Badge>
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              <p>Reported by {operator} • {date}</p>
                              <p className="mt-1">Bingo Line: {bingoLine} • Points: {pointsAwarded}</p>
                              <p className="mt-1">Line: {defect.line_number || 'N/A'}</p>
                            </div>
                            {defect.supervisor_comment && (
                              <div className="mt-2 text-sm">
                                <span className="font-medium">Rejection reason:</span> {defect.supervisor_comment}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Validation Dialog */}
      <AlertDialog open={showValidateDialog} onOpenChange={handleCloseDialog}>
        <AlertDialogContent className="max-w-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex justify-between items-center">
              <h2 className="text-xl">Validate Defect</h2>
              <button 
                className="text-gray-500 hover:text-gray-700" 
                onClick={handleCloseDialog}
              >
                ✕
              </button>
            </AlertDialogTitle>
            <p className="text-gray-500 mt-2">
              Review the defect information and provide feedback
            </p>
          </AlertDialogHeader>
          
          {selectedDefect && (
            <>
              <div className="my-6">
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
                  <div className="flex items-start">
                    <div className="text-amber-500 mr-3">
                      <AlertTriangle size={20} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-4">Defect Details</h3>
                      
                      <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                        <div>
                          <p className="text-gray-500">Garment Part:</p>
                          <p className="font-medium">
                            {typeof selectedDefect.garment_part === 'object'
                              ? selectedDefect.garment_part.code
                              : selectedDefect.garment_part || 'V'}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Defect Type:</p>
                          <p className="font-medium">
                            {typeof selectedDefect.defect_type === 'object'
                              ? selectedDefect.defect_type.code
                              : selectedDefect.defect_type || '3'}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Operator:</p>
                          <p className="font-medium truncate">
                            {selectedDefect.created_by_user?.name || selectedDefect.created_by || '7068846e-7c74-40cb-a288-102e963492ca'}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Factory:</p>
                          <p className="font-medium">SCASCADC</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Line:</p>
                          <p className="font-medium">{selectedDefect.line_number || 'Line L2'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Time:</p>
                          <p className="font-medium">
                            {new Date(selectedDefect.created_at).toLocaleDateString()} {new Date(selectedDefect.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="border-t border-gray-200 pt-4 mb-4">
                <h3 className="text-lg font-medium mb-2">Supervisor Comment</h3>
                <Textarea
                  placeholder="Add a comment (required for rejection)"
                  className="w-full"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>
              
              <div className="flex justify-between mt-4">
                <Button 
                  variant="outline" 
                  onClick={handleCloseDialog}
                  className="w-24"
                >
                  Cancel
                </Button>
                
                <div className="flex gap-2">
                  <Button 
                    variant="destructive"
                    onClick={() => handleValidate(selectedDefect.id, false)}
                    className="flex items-center gap-1 w-24"
                    disabled={isValidating}
                  >
                    <XCircle className="h-4 w-4" />
                    Reject
                  </Button>
                  
                  <Button 
                    className="bg-blue-950 hover:bg-blue-900 flex items-center gap-1 w-24"
                    onClick={() => handleValidate(selectedDefect.id, true)}
                    disabled={isValidating}
                  >
                    <CheckCircle className="h-4 w-4" />
                    Verify
                  </Button>
                </div>
              </div>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}; 