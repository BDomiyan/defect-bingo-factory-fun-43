
import React, { useState, useEffect } from 'react';
import { useDefectSync } from '@/hooks/use-defect-sync';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, XCircle, AlertTriangle, Clock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format, formatDistance } from 'date-fns';
import { FACTORIES } from '@/lib/game-data';

const SupervisorValidation = () => {
  const { recentDefects, updateDefectStatus, getAllowedPlants } = useDefectSync();
  const [isValidating, setIsValidating] = useState(false);
  const [selectedDefect, setSelectedDefect] = useState<any>(null);
  const [comment, setComment] = useState('');
  const [filter, setFilter] = useState('pending');
  
  // Get only pending defects for validation
  const pendingDefects = recentDefects.filter(d => d.status === 'pending');
  const verifiedDefects = recentDefects.filter(d => d.status === 'verified');
  const rejectedDefects = recentDefects.filter(d => d.status === 'rejected');
  
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
        return recentDefects;
    }
  };
  
  const filteredDefects = getFilteredDefects();
  
  // Handle verify defect
  const handleVerifyDefect = () => {
    if (!selectedDefect) return;
    
    setIsValidating(true);
    
    setTimeout(() => {
      updateDefectStatus(selectedDefect.id, 'verified', comment || undefined);
      
      toast.success("Defect verified", {
        description: `${selectedDefect.garmentPart.name} - ${selectedDefect.defectType.name} by ${selectedDefect.operatorName}`,
      });
      
      setIsValidating(false);
      setSelectedDefect(null);
      setComment('');
    }, 500);
  };
  
  // Handle reject defect
  const handleRejectDefect = () => {
    if (!selectedDefect) return;
    
    if (!comment) {
      toast.error("Comment required", {
        description: "Please provide a reason for rejection"
      });
      return;
    }
    
    setIsValidating(true);
    
    setTimeout(() => {
      updateDefectStatus(selectedDefect.id, 'rejected', comment);
      
      toast.info("Defect rejected", {
        description: `${selectedDefect.garmentPart.name} - ${selectedDefect.defectType.name} by ${selectedDefect.operatorName}`,
      });
      
      setIsValidating(false);
      setSelectedDefect(null);
      setComment('');
    }, 500);
  };
  
  // Get factory name by ID
  const getFactoryName = (factoryId: string) => {
    const factory = FACTORIES.find(f => f.id === factoryId);
    return factory ? factory.name : factoryId;
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
          {filteredDefects.length > 0 ? (
            filteredDefects.map(defect => (
              <div 
                key={defect.id} 
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {defect.status === 'verified' ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : defect.status === 'rejected' ? (
                        <XCircle className="h-5 w-5 text-red-500" />
                      ) : (
                        <Clock className="h-5 w-5 text-amber-500" />
                      )}
                      <h4 className="font-medium">
                        {defect.garmentPart.name} - {defect.defectType.name}
                      </h4>
                    </div>
                    <div className="text-sm text-muted-foreground mb-2">
                      Recorded by <span className="font-medium">{defect.operatorName}</span> • EPF: {defect.epfNumber || 'N/A'}
                    </div>
                    <div className="flex gap-2 text-xs">
                      <Badge variant="outline">
                        {getFactoryName(defect.factoryId)}
                      </Badge>
                      <Badge variant="outline">
                        Line {defect.lineNumber}
                      </Badge>
                      {defect.operation && (
                        <Badge variant="outline">
                          {defect.operation}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    {formatDistance(new Date(defect.timestamp), new Date(), { addSuffix: true })}
                  </div>
                </div>
                
                {defect.supervisorComment && (
                  <div className="mt-3 text-sm p-2 bg-muted/50 rounded border">
                    <p className="font-medium">Supervisor Comment:</p>
                    <p className="text-muted-foreground">{defect.supervisorComment}</p>
                  </div>
                )}
                
                {defect.status === 'pending' && (
                  <div className="mt-3 flex gap-2 justify-end">
                    <Dialog>
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
                            Review the defect details and provide feedback.
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="py-4">
                          <div className="space-y-4">
                            <div>
                              <h3 className="font-medium">Defect Details</h3>
                              <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Garment Part:</span>
                                  <div>{selectedDefect?.garmentPart.name}</div>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Defect Type:</span>
                                  <div>{selectedDefect?.defectType.name}</div>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Operator:</span>
                                  <div>{selectedDefect?.operatorName}</div>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">EPF Number:</span>
                                  <div>{selectedDefect?.epfNumber || 'N/A'}</div>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Factory:</span>
                                  <div>{getFactoryName(selectedDefect?.factoryId)}</div>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Line:</span>
                                  <div>Line {selectedDefect?.lineNumber}</div>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Time:</span>
                                  <div>
                                    {selectedDefect && format(new Date(selectedDefect.timestamp), 'MM/dd/yyyy h:mm a')}
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
