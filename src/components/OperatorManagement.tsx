
import React, { useState, useEffect } from 'react';
import { useDefectSync } from '@/hooks/use-defect-sync';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Plus, Pencil, Trash2, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { FACTORIES } from '@/lib/game-data';

const OperatorManagement = () => {
  const { operators, addOperator, updateOperator, removeOperator } = useDefectSync();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedOperator, setSelectedOperator] = useState<any>(null);
  
  // Form states
  const [name, setName] = useState('');
  const [epfNumber, setEpfNumber] = useState('');
  const [factoryId, setFactoryId] = useState('A6');
  const [line, setLine] = useState('L1');
  
  // Reset form
  const resetForm = () => {
    setName('');
    setEpfNumber('');
    setFactoryId('A6');
    setLine('L1');
  };
  
  // Close add dialog
  const closeAddDialog = () => {
    resetForm();
    setIsAddDialogOpen(false);
  };
  
  // Close edit dialog
  const closeEditDialog = () => {
    setSelectedOperator(null);
    resetForm();
    setIsEditDialogOpen(false);
  };
  
  // Set form values for editing
  const prepareEdit = (operator: any) => {
    setSelectedOperator(operator);
    setName(operator.name);
    setEpfNumber(operator.epfNumber);
    setFactoryId(operator.factory);
    setLine(operator.line);
    setIsEditDialogOpen(true);
  };
  
  // Handle add operator
  const handleAddOperator = () => {
    if (!name || !epfNumber || !factoryId || !line) {
      toast.error("All fields are required", {
        description: "Please fill in all required fields"
      });
      return;
    }
    
    const newOperator = {
      id: crypto.randomUUID(),
      name,
      epfNumber,
      factory: factoryId,
      line
    };
    
    const result = addOperator(newOperator);
    if (result) {
      closeAddDialog();
    }
  };
  
  // Handle update operator
  const handleUpdateOperator = () => {
    if (!selectedOperator || !name || !epfNumber || !factoryId || !line) {
      toast.error("All fields are required", {
        description: "Please fill in all required fields"
      });
      return;
    }
    
    const updatedData = {
      name,
      epfNumber,
      factory: factoryId,
      line
    };
    
    const result = updateOperator(selectedOperator.id, updatedData);
    if (result) {
      closeEditDialog();
    }
  };
  
  // Handle delete operator
  const handleDeleteOperator = (operatorId: string) => {
    if (window.confirm("Are you sure you want to remove this operator?")) {
      removeOperator(operatorId);
    }
  };
  
  // Filter operators based on search term
  const filteredOperators = operators.filter(op => 
    op.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    op.epfNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    op.factory.toLowerCase().includes(searchTerm.toLowerCase()) ||
    op.line.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Get factory by ID
  const getFactoryName = (factoryId: string) => {
    const factory = FACTORIES.find(f => f.id === factoryId);
    return factory ? factory.name : factoryId;
  };
  
  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>Operator Management</CardTitle>
        <CardDescription>Add, edit or remove operators from the system</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search operators..."
              className="pl-8 w-full sm:w-[300px]"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Add Operator
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Operator</DialogTitle>
                <DialogDescription>
                  Fill in the details to add a new operator to the system.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-2">
                  <Label htmlFor="name" className="text-right">Name</Label>
                  <Input 
                    id="name" 
                    className="col-span-3" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-2">
                  <Label htmlFor="epf" className="text-right">EPF Number</Label>
                  <Input 
                    id="epf" 
                    className="col-span-3" 
                    value={epfNumber} 
                    onChange={e => setEpfNumber(e.target.value)} 
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-2">
                  <Label htmlFor="factory" className="text-right">Factory</Label>
                  <Select value={factoryId} onValueChange={setFactoryId}>
                    <SelectTrigger id="factory" className="col-span-3">
                      <SelectValue placeholder="Select factory" />
                    </SelectTrigger>
                    <SelectContent>
                      {FACTORIES.map(factory => (
                        <SelectItem key={factory.id} value={factory.id}>
                          {factory.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-2">
                  <Label htmlFor="line" className="text-right">Line</Label>
                  <Select value={line} onValueChange={setLine}>
                    <SelectTrigger id="line" className="col-span-3">
                      <SelectValue placeholder="Select line" />
                    </SelectTrigger>
                    <SelectContent>
                      {FACTORIES.find(f => f.id === factoryId)?.lines.map(line => (
                        <SelectItem key={line} value={line}>
                          Line {line}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={closeAddDialog}>
                  Cancel
                </Button>
                <Button onClick={handleAddOperator}>
                  Add Operator
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          {/* Edit Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Operator</DialogTitle>
                <DialogDescription>
                  Update the operator's information.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-2">
                  <Label htmlFor="edit-name" className="text-right">Name</Label>
                  <Input 
                    id="edit-name" 
                    className="col-span-3" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-2">
                  <Label htmlFor="edit-epf" className="text-right">EPF Number</Label>
                  <Input 
                    id="edit-epf" 
                    className="col-span-3" 
                    value={epfNumber} 
                    onChange={e => setEpfNumber(e.target.value)} 
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-2">
                  <Label htmlFor="edit-factory" className="text-right">Factory</Label>
                  <Select value={factoryId} onValueChange={setFactoryId}>
                    <SelectTrigger id="edit-factory" className="col-span-3">
                      <SelectValue placeholder="Select factory" />
                    </SelectTrigger>
                    <SelectContent>
                      {FACTORIES.map(factory => (
                        <SelectItem key={factory.id} value={factory.id}>
                          {factory.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-2">
                  <Label htmlFor="edit-line" className="text-right">Line</Label>
                  <Select value={line} onValueChange={setLine}>
                    <SelectTrigger id="edit-line" className="col-span-3">
                      <SelectValue placeholder="Select line" />
                    </SelectTrigger>
                    <SelectContent>
                      {FACTORIES.find(f => f.id === factoryId)?.lines.map(line => (
                        <SelectItem key={line} value={line}>
                          Line {line}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={closeEditDialog}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateOperator}>
                  Update Operator
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>EPF Number</TableHead>
                <TableHead>Factory</TableHead>
                <TableHead>Line</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOperators.length > 0 ? (
                filteredOperators.map(operator => (
                  <TableRow key={operator.id}>
                    <TableCell className="font-medium">{operator.name}</TableCell>
                    <TableCell>{operator.epfNumber}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getFactoryName(operator.factory)}
                      </Badge>
                    </TableCell>
                    <TableCell>Line {operator.line}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => prepareEdit(operator)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDeleteOperator(operator.id)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                    {searchTerm ? (
                      <div className="flex flex-col items-center gap-2">
                        <X className="h-8 w-8" />
                        <p>No operators found matching "{searchTerm}"</p>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSearchTerm('')}
                        >
                          Clear search
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <p>No operators have been added yet</p>
                        <Button 
                          size="sm"
                          onClick={() => setIsAddDialogOpen(true)}
                        >
                          Add your first operator
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default OperatorManagement;
