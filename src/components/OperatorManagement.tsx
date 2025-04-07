import React, { useState, useEffect } from 'react';
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
import { useAuth } from '@/context/auth-context';
import { usePlants, useOperations, useUserManagement } from '@/lib/supabase/hooks';

const OperatorManagement = () => {
  const { users, loading: usersLoading, addUser, updateUser, deleteUser } = useUserManagement();
  const { plants, loading: plantsLoading } = usePlants();
  const { operations, loading: operationsLoading } = useOperations();
  const { user } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedOperator, setSelectedOperator] = useState<any>(null);
  
  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [epfNumber, setEpfNumber] = useState('');
  const [plantId, setPlantId] = useState('');
  const [lineNumber, setLineNumber] = useState('');
  const [operationId, setOperationId] = useState('');
  const [role, setRole] = useState('operator');
  
  // Reset form
  const resetForm = () => {
    setName('');
    setEmail('');
    setEpfNumber('');
    setPlantId('');
    setLineNumber('');
    setOperationId('');
    setRole('operator');
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
    setEmail(operator.email);
    setEpfNumber(operator.epf_number);
    setPlantId(operator.plant_id || '');
    setLineNumber(operator.line_number || '');
    
    // Get operation from database or localStorage
    const operationMappings = JSON.parse(localStorage.getItem('operator-operations') || '{}');
    const storedOperation = operator.id ? operationMappings[operator.id] : '';
    setOperationId(operator.operation || storedOperation || '');
    
    setRole(operator.role);
    setIsEditDialogOpen(true);
  };
  
  // Handle add operator
  const handleAddOperator = async () => {
    if (!name || !email || !epfNumber || !plantId || !lineNumber) {
      toast.error("All fields are required", {
        description: "Please fill in all required fields"
      });
      return;
    }
    
    try {
      // Create user without the operation field
      const newUser = {
        name,
        email,
        epf_number: epfNumber,
        role,
        plant_id: plantId,
        line_number: lineNumber,
        password: 'defaultpassword', // This should be handled securely in production
      };
      
      // Add the user to Supabase
      const addedUser = await addUser(newUser);
      
      // Store operation in localStorage as a workaround
      if (operationId && addedUser && addedUser.id) {
        const operationMappings = JSON.parse(localStorage.getItem('operator-operations') || '{}');
        operationMappings[addedUser.id] = operationId;
        localStorage.setItem('operator-operations', JSON.stringify(operationMappings));
      }
      
      toast.success("Operator added successfully");
      closeAddDialog();
    } catch (error: any) {
      toast.error("Error adding operator", {
        description: error.message || "An unexpected error occurred"
      });
    }
  };
  
  // Handle update operator
  const handleUpdateOperator = async () => {
    if (!selectedOperator || !name || !email || !epfNumber) {
      toast.error("All fields are required", {
        description: "Please fill in all required fields"
      });
      return;
    }
    
    try {
      // Update user without the operation field
      const updatedData = {
        name,
        email,
        epf_number: epfNumber,
        role,
        plant_id: plantId,
        line_number: lineNumber,
      };
      
      // Update the user in Supabase
      const updatedUser = await updateUser(selectedOperator.id, updatedData);
      
      // Store operation in localStorage as a workaround
      if (operationId && selectedOperator.id) {
        const operationMappings = JSON.parse(localStorage.getItem('operator-operations') || '{}');
        operationMappings[selectedOperator.id] = operationId;
        localStorage.setItem('operator-operations', JSON.stringify(operationMappings));
      }
      
      toast.success("Operator updated successfully");
      closeEditDialog();
    } catch (error: any) {
      toast.error("Error updating operator", {
        description: error.message || "An unexpected error occurred"
      });
    }
  };
  
  // Handle delete operator
  const handleDeleteOperator = async (operatorId: string) => {
    if (window.confirm("Are you sure you want to remove this operator?")) {
      try {
        await deleteUser(operatorId);
        toast.success("Operator removed successfully");
      } catch (error: any) {
        toast.error("Error removing operator", {
          description: error.message || "An unexpected error occurred"
        });
      }
    }
  };
  
  // Filter operators based on search term
  const operators = users?.filter(user => user.role !== 'admin') || [];
  const filteredOperators = operators.filter(op => 
    op.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    op.epf_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (op.line_number && op.line_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (op.email && op.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  // Get plant name by ID
  const getPlantName = (plantId: string) => {
    const plant = plants?.find(p => p.id === plantId);
    return plant ? plant.name : plantId;
  };
  
  // Get operation name by ID
  const getOperationName = (operatorId: string, dbOperation?: string) => {
    // First check if operation exists in database
    if (dbOperation) {
      const operation = operations?.find(op => op.id === dbOperation);
      if (operation) return operation.name;
    }
    
    // Otherwise check localStorage
    const operationMappings = JSON.parse(localStorage.getItem('operator-operations') || '{}');
    const operationId = operationMappings[operatorId];
    if (!operationId) return '-';
    
    const operation = operations?.find(op => op.id === operationId);
    return operation ? operation.name : '-';
  };
  
  // Loading state
  const isLoading = usersLoading || plantsLoading || operationsLoading;
  
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
              <Button className="w-full sm:w-auto" disabled={isLoading}>
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
                  <Label htmlFor="email" className="text-right">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    className="col-span-3" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
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
                  <Label htmlFor="role" className="text-right">Role</Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger id="role" className="col-span-3">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="operator">Operator</SelectItem>
                      <SelectItem value="supervisor">Supervisor</SelectItem>
                      <SelectItem value="qc">Quality Control</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-2">
                  <Label htmlFor="plant" className="text-right">Plant</Label>
                  <Select value={plantId} onValueChange={setPlantId}>
                    <SelectTrigger id="plant" className="col-span-3">
                      <SelectValue placeholder="Select plant" />
                    </SelectTrigger>
                    <SelectContent>
                      {plants?.map(plant => (
                        <SelectItem key={plant.id} value={plant.id}>
                          {plant.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-2">
                  <Label htmlFor="line" className="text-right">Line</Label>
                  <Select value={lineNumber} onValueChange={setLineNumber}>
                    <SelectTrigger id="line" className="col-span-3">
                      <SelectValue placeholder="Select line" />
                    </SelectTrigger>
                    <SelectContent>
                      {plants?.find(p => p.id === plantId)?.lines.map(line => (
                        <SelectItem key={line} value={line}>
                          Line {line}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-2">
                  <Label htmlFor="operation" className="text-right">Operation</Label>
                  <Select value={operationId} onValueChange={setOperationId}>
                    <SelectTrigger id="operation" className="col-span-3">
                      <SelectValue placeholder="Select operation" />
                    </SelectTrigger>
                    <SelectContent>
                      {operations?.map(op => (
                        <SelectItem key={op.id} value={op.id}>
                          {op.name}
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
                  Update the operator's information
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
                  <Label htmlFor="edit-email" className="text-right">Email</Label>
                  <Input 
                    id="edit-email" 
                    type="email" 
                    className="col-span-3" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
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
                  <Label htmlFor="edit-role" className="text-right">Role</Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger id="edit-role" className="col-span-3">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="operator">Operator</SelectItem>
                      <SelectItem value="supervisor">Supervisor</SelectItem>
                      <SelectItem value="qc">Quality Control</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-2">
                  <Label htmlFor="edit-plant" className="text-right">Plant</Label>
                  <Select value={plantId} onValueChange={setPlantId}>
                    <SelectTrigger id="edit-plant" className="col-span-3">
                      <SelectValue placeholder="Select plant" />
                    </SelectTrigger>
                    <SelectContent>
                      {plants?.map(plant => (
                        <SelectItem key={plant.id} value={plant.id}>
                          {plant.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-2">
                  <Label htmlFor="edit-line" className="text-right">Line</Label>
                  <Select value={lineNumber} onValueChange={setLineNumber}>
                    <SelectTrigger id="edit-line" className="col-span-3">
                      <SelectValue placeholder="Select line" />
                    </SelectTrigger>
                    <SelectContent>
                      {plants?.find(p => p.id === plantId)?.lines.map(line => (
                        <SelectItem key={line} value={line}>
                          Line {line}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-2">
                  <Label htmlFor="edit-operation" className="text-right">Operation</Label>
                  <Select value={operationId} onValueChange={setOperationId}>
                    <SelectTrigger id="edit-operation" className="col-span-3">
                      <SelectValue placeholder="Select operation" />
                    </SelectTrigger>
                    <SelectContent>
                      {operations?.map(op => (
                        <SelectItem key={op.id} value={op.id}>
                          {op.name}
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
        
        {isLoading ? (
          <div className="text-center p-10 text-muted-foreground">
            Loading operators...
          </div>
        ) : filteredOperators.length > 0 ? (
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>EPF Number</TableHead>
                  <TableHead>Plant</TableHead>
                  <TableHead>Line</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Operation</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOperators.map(operator => (
                  <TableRow key={operator.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{operator.name}</span>
                        <span className="text-xs text-muted-foreground">{operator.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>{operator.epf_number}</TableCell>
                    <TableCell>{operator.plant_id ? getPlantName(operator.plant_id) : '-'}</TableCell>
                    <TableCell>{operator.line_number || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={
                        operator.role === 'supervisor' ? 'bg-blue-50 text-blue-700 border-blue-300' :
                        operator.role === 'qc' ? 'bg-purple-50 text-purple-700 border-purple-300' :
                        'bg-green-50 text-green-700 border-green-300'
                      }>
                        {operator.role.charAt(0).toUpperCase() + operator.role.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>{getOperationName(operator.id, operator['operation'] as string)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
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
                          className="text-destructive hover:text-destructive" 
                          onClick={() => handleDeleteOperator(operator.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center p-10 text-muted-foreground">
            {searchTerm ? 'No operators match your search.' : 'No operators found. Add your first operator.'}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OperatorManagement;
