import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/context/auth-context';
import { Separator } from '@/components/ui/separator';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import { UserProfile } from '@/context/auth-context';
import { Plus, Trash, Edit, Factory, Users, User, Settings, CheckCircle, XCircle } from 'lucide-react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Operation } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

const Admin = () => {
  const { 
    user, 
    isAdmin, 
    getAllUsers, 
    deleteUser, 
    updateUser, 
    addUser,
    getAllPlants,
    addPlant,
    updatePlant,
    deletePlant
  } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [plants, setPlants] = useState<any[]>([]);
  const [operations, setOperations] = useLocalStorage<Operation[]>('operations', [
    { id: '1', name: 'Cutting' },
    { id: '2', name: 'Sewing' },
    { id: '3', name: 'Finishing' }
  ]);
  const navigate = useNavigate();

  // New user form state
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    employeeId: '',
    plantId: '',
    lineNumber: '',
    role: 'user'
  });

  // New plant form state
  const [newPlant, setNewPlant] = useState({
    name: '',
    lines: ''
  });

  // New operation form state
  const [newOperation, setNewOperation] = useState('');
  const [editingOperation, setEditingOperation] = useState<Operation | null>(null);

  // Load data on component mount
  useEffect(() => {
    if (isAdmin) {
      setUsers(getAllUsers());
      setPlants(getAllPlants());
    } else {
      navigate('/dashboard');
      toast.error("Access denied", { description: "You need admin privileges to access this page" });
    }
  }, [isAdmin, getAllUsers, getAllPlants, navigate]);

  // Handle new user form submission
  const handleAddUser = () => {
    try {
      addUser({
        ...newUser,
        password: newUser.password || 'password123',
        role: newUser.role as "user" | "admin" | "manager" | "qc"
      });
      
      setNewUser({
        name: '',
        email: '',
        password: '',
        employeeId: '',
        plantId: '',
        lineNumber: '',
        role: 'user'
      });
      
      setUsers(getAllUsers());
      toast.success("User added successfully");
    } catch (error) {
      toast.error("Failed to add user", { 
        description: error instanceof Error ? error.message : "An unknown error occurred"
      });
    }
  };

  // Handle new plant form submission
  const handleAddPlant = () => {
    try {
      if (!newPlant.name) {
        toast.error("Please enter a plant name");
        return;
      }
      
      const lines = newPlant.lines 
        ? newPlant.lines.split(',').map(line => line.trim()) 
        : ['L1'];
      
      addPlant({
        name: newPlant.name,
        lines
      });
      
      setNewPlant({
        name: '',
        lines: ''
      });
      
      setPlants(getAllPlants());
      toast.success("Plant added successfully");
    } catch (error) {
      toast.error("Failed to add plant", { 
        description: error instanceof Error ? error.message : "An unknown error occurred"
      });
    }
  };

  // Handle user deletion
  const handleDeleteUser = (userId: string) => {
    try {
      deleteUser(userId);
      setUsers(getAllUsers());
      toast.success("User deleted successfully");
    } catch (error) {
      toast.error("Failed to delete user", { 
        description: error instanceof Error ? error.message : "An unknown error occurred"
      });
    }
  };

  // Handle plant deletion
  const handleDeletePlant = (plantId: string) => {
    try {
      deletePlant(plantId);
      setPlants(getAllPlants());
      toast.success("Plant deleted successfully");
    } catch (error) {
      toast.error("Failed to delete plant", { 
        description: error instanceof Error ? error.message : "An unknown error occurred"
      });
    }
  };

  // Handle adding a new operation
  const handleAddOperation = () => {
    if (!newOperation.trim()) {
      toast.error("Operation name cannot be empty");
      return;
    }

    // Check if operation already exists
    if (operations.some(op => op.name.toLowerCase() === newOperation.toLowerCase())) {
      toast.error("Operation already exists");
      return;
    }

    const newOp: Operation = {
      id: crypto.randomUUID(),
      name: newOperation.trim()
    };

    setOperations([...operations, newOp]);
    setNewOperation('');
    toast.success("Operation added successfully");
  };

  // Handle updating an operation
  const handleUpdateOperation = () => {
    if (!editingOperation || !editingOperation.name.trim()) {
      toast.error("Operation name cannot be empty");
      return;
    }

    // Check if name already exists (except for the current operation)
    if (operations.some(op => 
      op.name.toLowerCase() === editingOperation.name.toLowerCase() && 
      op.id !== editingOperation.id
    )) {
      toast.error("Operation name already exists");
      return;
    }

    const updatedOperations = operations.map(op => 
      op.id === editingOperation.id ? editingOperation : op
    );
    
    setOperations(updatedOperations);
    setEditingOperation(null);
    toast.success("Operation updated successfully");
  };

  // Handle deleting an operation
  const handleDeleteOperation = (id: string) => {
    const updatedOperations = operations.filter(op => op.id !== id);
    setOperations(updatedOperations);
    toast.success("Operation deleted successfully");
  };

  // Check if user is admin
  if (!isAdmin) {
    return null; // Navigate handled in useEffect
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage users, plants, and operations</p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center gap-2">
            <span className="text-sm text-muted-foreground mr-1">Logged in as:</span>
            <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
              {user?.name} (Admin)
            </div>
          </div>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>Users</span>
            </TabsTrigger>
            <TabsTrigger value="plants" className="flex items-center gap-2">
              <Factory className="h-4 w-4" />
              <span>Plants</span>
            </TabsTrigger>
            <TabsTrigger value="operations" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span>Operations</span>
            </TabsTrigger>
          </TabsList>

          {/* Users Tab Content */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Add New User</CardTitle>
                <CardDescription>Create a new user account with specific role and permissions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input 
                      id="name" 
                      value={newUser.name} 
                      onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                      placeholder="John Doe" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      value={newUser.email} 
                      onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                      placeholder="john@example.com" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input 
                      id="password" 
                      type="password" 
                      value={newUser.password} 
                      onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                      placeholder="Default: password123" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="employeeId">Employee ID</Label>
                    <Input 
                      id="employeeId" 
                      value={newUser.employeeId} 
                      onChange={(e) => setNewUser({...newUser, employeeId: e.target.value})}
                      placeholder="EMP001" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select 
                      value={newUser.role} 
                      onValueChange={(value) => setNewUser({...newUser, role: value as any})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="qc">Quality Control</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="plantId">Plant</Label>
                    <Select 
                      value={newUser.plantId} 
                      onValueChange={(value) => setNewUser({...newUser, plantId: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select plant" />
                      </SelectTrigger>
                      <SelectContent>
                        {plants.map((plant) => (
                          <SelectItem key={plant.id} value={plant.id}>
                            {plant.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lineNumber">Line Number</Label>
                    <Input 
                      id="lineNumber" 
                      value={newUser.lineNumber} 
                      onChange={(e) => setNewUser({...newUser, lineNumber: e.target.value})}
                      placeholder="L1" 
                      disabled={!newUser.plantId}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleAddUser}
                  disabled={!newUser.name || !newUser.email || !newUser.plantId}
                  className="w-full md:w-auto"
                >
                  <Plus className="mr-2 h-4 w-4" /> 
                  Add User
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">User Management</CardTitle>
                <CardDescription>View and manage all registered users</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Plant</TableHead>
                        <TableHead>Line</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                            No users found
                          </TableCell>
                        </TableRow>
                      ) : (
                        users.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.name}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              <span className={cn(
                                "px-2 py-1 rounded-full text-xs font-medium",
                                user.role === 'admin' && "bg-blue-100 text-blue-800",
                                user.role === 'manager' && "bg-purple-100 text-purple-800",
                                user.role === 'qc' && "bg-amber-100 text-amber-800",
                                user.role === 'user' && "bg-green-100 text-green-800"
                              )}>
                                {user.role}
                              </span>
                            </TableCell>
                            <TableCell>{user.plantId}</TableCell>
                            <TableCell>{user.lineNumber}</TableCell>
                            <TableCell className="text-right">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Edit User</DialogTitle>
                                    <DialogDescription>Update user details</DialogDescription>
                                  </DialogHeader>
                                  <div className="grid gap-4 py-4">
                                    {/* Edit user form would go here */}
                                  </div>
                                  <DialogFooter>
                                    <Button>Save Changes</Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-red-500"
                                onClick={() => handleDeleteUser(user.id)}
                                disabled={user.id === '1'}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Plants Tab Content */}
          <TabsContent value="plants" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Add New Plant</CardTitle>
                <CardDescription>Create a new manufacturing plant with production lines</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="plantName">Plant Name</Label>
                    <Input 
                      id="plantName" 
                      value={newPlant.name} 
                      onChange={(e) => setNewPlant({...newPlant, name: e.target.value})}
                      placeholder="Main Factory" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lines">Production Lines (comma separated)</Label>
                    <Input 
                      id="lines" 
                      value={newPlant.lines} 
                      onChange={(e) => setNewPlant({...newPlant, lines: e.target.value})}
                      placeholder="L1, L2, L3" 
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleAddPlant}
                  disabled={!newPlant.name}
                  className="w-full md:w-auto"
                >
                  <Plus className="mr-2 h-4 w-4" /> 
                  Add Plant
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Plant Management</CardTitle>
                <CardDescription>View and manage all manufacturing plants</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Production Lines</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {plants.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                          No plants found
                        </TableCell>
                      </TableRow>
                    ) : (
                      plants.map((plant) => (
                        <TableRow key={plant.id}>
                          <TableCell className="font-medium">{plant.id}</TableCell>
                          <TableCell>{plant.name}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {plant.lines.map((line: string, index: number) => (
                                <span 
                                  key={index}
                                  className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded"
                                >
                                  {line}
                                </span>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Edit Plant</DialogTitle>
                                  <DialogDescription>Update plant details</DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                  {/* Edit plant form would go here */}
                                </div>
                                <DialogFooter>
                                  <Button>Save Changes</Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-red-500"
                              onClick={() => handleDeletePlant(plant.id)}
                              disabled={plant.id === 'A6'} // Prevent deleting default plant
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Operations Tab Content */}
          <TabsContent value="operations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Operations Management</CardTitle>
                <CardDescription>Define the operations that are performed in your manufacturing process</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-end gap-2">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="operationName">Operation Name</Label>
                    <Input 
                      id="operationName" 
                      value={newOperation} 
                      onChange={(e) => setNewOperation(e.target.value)}
                      placeholder="e.g., Cutting, Sewing, Finishing" 
                    />
                  </div>
                  <Button 
                    onClick={handleAddOperation}
                    disabled={!newOperation}
                  >
                    <Plus className="mr-2 h-4 w-4" /> 
                    Add Operation
                  </Button>
                </div>

                <Separator className="my-4" />

                <div>
                  <h3 className="mb-4 text-sm font-medium">Current Operations</h3>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead className="text-right w-[120px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {operations.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={2} className="text-center py-4 text-muted-foreground">
                              No operations defined yet
                            </TableCell>
                          </TableRow>
                        ) : (
                          operations.map((op) => (
                            <TableRow key={op.id}>
                              {editingOperation?.id === op.id ? (
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Input 
                                      value={editingOperation.name} 
                                      onChange={(e) => setEditingOperation({...editingOperation, name: e.target.value})}
                                      className="h-8"
                                    />
                                    <Button size="sm" variant="ghost" onClick={handleUpdateOperation}>
                                      <CheckCircle className="h-4 w-4 text-green-500" />
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => setEditingOperation(null)}>
                                      <XCircle className="h-4 w-4 text-red-500" />
                                    </Button>
                                  </div>
                                </TableCell>
                              ) : (
                                <TableCell className="font-medium">{op.name}</TableCell>
                              )}
                              <TableCell className="text-right">
                                <div className="flex justify-end">
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => setEditingOperation(op)}
                                    disabled={editingOperation !== null}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="text-red-500"
                                    onClick={() => handleDeleteOperation(op.id)}
                                  >
                                    <Trash className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
