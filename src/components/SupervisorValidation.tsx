import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, XCircle, AlertTriangle, Clock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format, formatDistance } from 'date-fns';
import { useAuth } from '@/context/auth-context';
import { useDefects } from '@/lib/supabase/hooks';
import { supabase } from '@/lib/supabase/client';

interface SupervisorValidationProps {
  users?: any[];
}

const SupervisorValidation: React.FC<SupervisorValidationProps> = ({ users = [] }) => {
  const { user } = useAuth();
  const { defects, loading: defectsLoading, validateDefect, fetchDefects } = useDefects();
  const [isValidating, setIsValidating] = useState(false);
  const [selectedDefect, setSelectedDefect] = useState<any>(null);
  const [comment, setComment] = useState('');
  const [filter, setFilter] = useState('pending');
  const [checkingAuth, setCheckingAuth] = useState(true);
  
  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      console.log('Current Supabase session:', data.session);
      setCheckingAuth(false);
    };
    
    checkAuth();
  }, []);
  
  // Log defects data to help debug
  useEffect(() => {
    console.log('All defects from Supabase:', defects);
    
    // Debug validation fields
    console.log('Defect validation details:');
    defects.forEach(d => {
      console.log(`Defect ${d.id.substring(0, 8)}: validated=${d.validated}, validated_by=${d.validated_by || 'null'}`);
    });
  }, [defects]);
  
  // Get defects based on validation status
  const pendingDefects = defects.filter(d => !d.validated && !d.validated_by);
  const verifiedDefects = defects.filter(d => d.validated && d.validated_by);
  const rejectedDefects = defects.filter(d => !d.validated && d.validated_by);
  
  // Log filtered defects to help debug
  useEffect(() => {
    console.log('Pending defects:', pendingDefects);
    console.log('Verified defects:', verifiedDefects);
    console.log('Rejected defects:', rejectedDefects);
  }, [pendingDefects, verifiedDefects, rejectedDefects]);
  
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
        return defects;
    }
  };
  
  const filteredDefects = getFilteredDefects();
  
  // Handle verify defect
  const handleVerifyDefect = async () => {
    if (!selectedDefect) return;
    
    setIsValidating(true);
    
    try {
      const result = await validateDefect(selectedDefect.id, true, comment || undefined);
      
      if (result) {
        toast.success("Defect verified successfully", {
          description: `${selectedDefect.garment_part} - ${selectedDefect.defect_type}`,
        });
        
        // Close dialog and reset state
        setSelectedDefect(null);
        setComment('');
      }
    } catch (error: any) {
      console.error("Error verifying defect:", error);
      
      toast.error("Failed to verify defect", {
        description: error.message || "An unexpected error occurred"
      });
    } finally {
      setIsValidating(false);
    }
  };
  
  // Handle reject defect
  const handleRejectDefect = async () => {
    if (!selectedDefect) return;
    
    if (!comment) {
      toast.error("Comment required", {
        description: "Please provide a reason for rejection"
      });
      return;
    }
    
    setIsValidating(true);
    
    try {
      const result = await validateDefect(selectedDefect.id, false, comment);
      
      if (result) {
        toast.info("Defect rejected successfully", {
          description: `${selectedDefect.garment_part} - ${selectedDefect.defect_type}`,
        });
        
        // Close dialog and reset state
        setSelectedDefect(null);
        setComment('');
      }
    } catch (error: any) {
      console.error("Error rejecting defect:", error);
      
      toast.error("Failed to reject defect", {
        description: error.message || "An unexpected error occurred"
      });
    } finally {
      setIsValidating(false);
    }
  };
  
  // Get factory name by ID
  const getFactoryName = (factoryId: string) => {
    // First check if it's in the users prop
    const userPlant = users.find(u => u.plant_id === factoryId);
    if (userPlant) return userPlant.name;
    
    // Return a generic name if not found
    return `Factory ${factoryId.substring(0, 8)}`;
  };
  
  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>Supervisor Validation</CardTitle>
        <CardDescription>
          Validate defects recorded by operators to ensure accuracy
        </CardDescription>
      </CardHeader>
      
      <div className="px-6 pb-2 flex space-x-1">
        <Button 
          variant={filter === 'pending' ? 'default' : 'outline'}
          onClick={() => setFilter('pending')}
          size="sm"
          className="relative"
        >
          Pending
          {pendingDefects.length > 0 && (
            <Badge className="ml-1 bg-amber-500 hover:bg-amber-600">
              {pendingDefects.length}
            </Badge>
          )}
        </Button>
        <Button 
          variant={filter === 'verified' ? 'default' : 'outline'}
          onClick={() => setFilter('verified')}
          size="sm"
        >
          Verified
        </Button>
        <Button 
          variant={filter === 'rejected' ? 'default' : 'outline'}
          onClick={() => setFilter('rejected')}
          size="sm"
        >
          Rejected
        </Button>
      </div>
      
      <CardContent>
        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
          {defectsLoading ? (
            <div className="text-center p-8 flex flex-col items-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
              <p>Loading defects...</p>
            </div>
          ) : filteredDefects.length > 0 ? (
            filteredDefects.map(defect => (
              <div 
                key={defect.id} 
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {defect.validated ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : defect.validated_by ? (
                        <XCircle className="h-5 w-5 text-red-500" />
                      ) : (
                        <Clock className="h-5 w-5 text-amber-500" />
                      )}
                      <h4 className="font-medium">
                        {defect.garment_part} - {defect.defect_type}
                      </h4>
                    </div>
                    <div className="text-sm text-muted-foreground mb-2">
                      Recorded by <span className="font-medium">{defect.created_by}</span> • EPF: {defect.epf_number || 'N/A'}
                    </div>
                    <div className="flex gap-2 text-xs">
                      <Badge variant="outline">
                        {getFactoryName(defect.factory_id)}
                      </Badge>
                      <Badge variant="outline">
                        Line {defect.line_number}
                      </Badge>
                      {defect.operation && (
                        <Badge variant="outline">
                          {defect.operation}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    {formatDistance(new Date(defect.created_at), new Date(), { addSuffix: true })}
                  </div>
                </div>
                
                {defect.supervisor_comment && (
                  <div className="mt-3 text-sm p-2 bg-muted/50 rounded border">
                    <p className="font-medium">Supervisor Comment:</p>
                    <p className="text-muted-foreground">{defect.supervisor_comment}</p>
                  </div>
                )}
                
                {!defect.validated && !defect.validated_by && (
                  <div className="mt-3 flex gap-2 justify-end">
                    <Dialog 
                      open={selectedDefect?.id === defect.id} 
                      onOpenChange={(open) => {
                        if (!open) setSelectedDefect(null);
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedDefect(defect)}
                        >
                          Validate
                        </Button>
                      </DialogTrigger>
                      
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Validate Defect</DialogTitle>
                          <DialogDescription>
                            Review the defect information and provide feedback
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-4 py-4">
                          <div className="bg-muted/40 p-4 rounded-md space-y-4">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="h-5 w-5 text-amber-500" />
                              <h3 className="font-medium">Defect Details</h3>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <span className="text-muted-foreground">Garment Part:</span>
                                <div>{selectedDefect?.garment_part}</div>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Defect Type:</span>
                                <div>{selectedDefect?.defect_type}</div>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Operator:</span>
                                <div>{selectedDefect?.created_by}</div>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Factory:</span>
                                <div>{selectedDefect?.factory_id && getFactoryName(selectedDefect.factory_id)}</div>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Line:</span>
                                <div>Line {selectedDefect?.line_number}</div>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Time:</span>
                                <div>
                                  {selectedDefect && format(new Date(selectedDefect.created_at), 'MM/dd/yyyy h:mm a')}
                                </div>
                              </div>
                              {selectedDefect?.operation && (
                                <div>
                                  <span className="text-muted-foreground">Operation:</span>
                                  <div>{selectedDefect.operation}</div>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <Separator />
                          
                          <div>
                            <label htmlFor="comment" className="block font-medium mb-2">
                              Supervisor Comment
                            </label>
                            <Textarea 
                              id="comment" 
                              placeholder="Add a comment (required for rejection)"
                              value={comment}
                              onChange={e => setComment(e.target.value)}
                            />
                          </div>
                        </div>
                        
                        <DialogFooter>
                          <Button 
                            variant="outline" 
                            onClick={() => {
                              setSelectedDefect(null);
                              setComment('');
                            }}
                          >
                            Cancel
                          </Button>
                          <Button 
                            variant="destructive" 
                            onClick={handleRejectDefect}
                            disabled={isValidating}
                          >
                            {isValidating ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Rejecting...
                              </>
                            ) : (
                              <>
                                <XCircle className="mr-2 h-4 w-4" />
                                Reject
                              </>
                            )}
                          </Button>
                          <Button 
                            onClick={handleVerifyDefect}
                            disabled={isValidating}
                          >
                            {isValidating ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Verifying...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Verify
                              </>
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center p-8 border rounded-lg">
              <AlertTriangle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-medium text-lg mb-1">No defects found</h3>
              <p className="text-muted-foreground">
                {filter === 'pending' 
                  ? "All defects have been validated. Come back later when new defects are recorded."
                  : filter === 'verified'
                  ? "No verified defects found. Start validating the pending defects."
                  : filter === 'rejected'
                  ? "No rejected defects found."
                  : "No defects have been recorded yet."}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Total defects in database: {defects.length}
              </p>
              {filter !== 'pending' && pendingDefects.length > 0 && (
                <Button 
                  className="mt-4" 
                  variant="outline"
                  onClick={() => setFilter('pending')}
                >
                  View Pending Defects ({pendingDefects.length})
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="border-t pt-4 flex justify-between">
        <div className="text-sm text-muted-foreground">
          {pendingDefects.length} pending • {verifiedDefects.length} verified • {rejectedDefects.length} rejected
        </div>
        
        {pendingDefects.length > 0 && (
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <span className="text-sm text-amber-500 font-medium">Defects awaiting validation</span>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default SupervisorValidation;
