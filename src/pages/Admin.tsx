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
import { useOperations, usePlants, useUserManagement } from '@/lib/supabase/hooks';
import { Operation } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

const Admin = () => {
  const { user, isAdmin } = useAuth();
  const { users, loading: usersLoading, addUser, updateUser, deleteUser } = useUserManagement();
  const { plants, loading: plantsLoading, addPlant, updatePlant, deletePlant } = usePlants();
  const { operations, loading: operationsLoading, addOperation, updateOperation, deleteOperation } = useOperations();
  const navigate = useNavigate();

  // New user form state
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    employee_id: '',
    plant_id: '',
    line_number: '',
    role: 'user',
    epf_number: ''
  });

  // New plant form state
  const [newPlant, setNewPlant] = useState({
    name: '',
    lines: ''
  });

  // New operation form state
  const [newOperation, setNewOperation] = useState('');
  const [editingOperation, setEditingOperation] = useState<Operation | null>(null);

  // Add this state near the top where other state variables are defined
  const [editingPlant, setEditingPlant] = useState<{ id: string; name: string; lines: string } | null>(null);

  // Add this state near the top where other state variables are defined
  const [editingUser, setEditingUser] = useState<{
    id: string;
    name: string;
    email: string;
    employee_id: string;
    plant_id: string;
    line_number: string;
    role: string;
    epf_number: string;
  } | null>(null);

  // Redirect if not admin
  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard');
      toast.error("Access denied", { description: "You need admin privileges to access this page" });
    }
  }, [isAdmin, navigate]);

  // Handle new user form submission
  const handleAddUser = async () => {
    try {
      if (!newUser.name || !newUser.email || !newUser.epf_number) {
        toast.error("Please fill all required fields");
        return;
      }

      await addUser({
        name: newUser.name,
        email: newUser.email,
        password: newUser.password || 'password123',
        role: newUser.role as "user" | "admin" | "manager" | "qc",
        employee_id: newUser.employee_id,
        plant_id: newUser.plant_id,
        line_number: newUser.line_number,
        epf_number: newUser.epf_number
      });
      
      setNewUser({
        name: '',
        email: '',
        password: '',
        employee_id: '',
        plant_id: '',
        line_number: '',
        role: 'user',
        epf_number: ''
      });
      
      toast.success("User added successfully");
    } catch (error) {
      toast.error("Failed to add user", { 
        description: error instanceof Error ? error.message : "An unknown error occurred"
      });
    }
  };

  // Handle new plant form submission
  const handleAddPlant = async () => {
    try {
      if (!newPlant.name) {
        toast.error("Please enter a plant name");
        return;
      }
      
      const lines = newPlant.lines 
        ? newPlant.lines.split(',').map(line => line.trim()) 
        : ['L1'];
      
      await addPlant({
        name: newPlant.name,
        lines
      });
      
      setNewPlant({
        name: '',
        lines: ''
      });
      
      toast.success("Plant added successfully");
    } catch (error) {
      toast.error("Failed to add plant", { 
        description: error instanceof Error ? error.message : "An unknown error occurred"
      });
    }
  };

  // Handle user deletion
  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteUser(userId);
      toast.success("User deleted successfully");
    } catch (error) {
      toast.error("Failed to delete user", { 
        description: error instanceof Error ? error.message : "An unknown error occurred"
      });
    }
  };

  // Handle plant deletion
  const handleDeletePlant = async (plantId: string) => {
    try {
      await deletePlant(plantId);
      toast.success("Plant deleted successfully");
    } catch (error) {
      toast.error("Failed to delete plant", { 
        description: error instanceof Error ? error.message : "An unknown error occurred"
      });
    }
  };

  // Handle adding a new operation
  const handleAddOperation = async () => {
    if (!newOperation.trim()) {
      toast.error("Operation name cannot be empty");
      return;
    }

    // Check if operation already exists
    if (operations.some(op => op.name.toLowerCase() === newOperation.toLowerCase())) {
      toast.error("Operation already exists");
      return;
    }

    try {
      await addOperation(newOperation.trim());
    setNewOperation('');
    toast.success("Operation added successfully");
    } catch (error) {
      toast.error("Failed to add operation", { 
        description: error instanceof Error ? error.message : "An unknown error occurred"
      });
    }
  };

  // Handle updating an operation
  const handleUpdateOperation = async () => {
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

    try {
      await updateOperation(editingOperation.id, editingOperation.name);
    setEditingOperation(null);
    toast.success("Operation updated successfully");
    } catch (error) {
      toast.error("Failed to update operation", { 
        description: error instanceof Error ? error.message : "An unknown error occurred"
      });
    }
  };

  // Handle deleting an operation
  const handleDeleteOperation = async (id: string) => {
    try {
      await deleteOperation(id);
    toast.success("Operation deleted successfully");
    } catch (error) {
      toast.error("Failed to delete operation", { 
        description: error instanceof Error ? error.message : "An unknown error occurred"
      });
    }
  };

  // Add this function with the other handlers
  const handleUpdatePlant = async () => {
    if (!editingPlant) return;
    
    try {
      const lines = editingPlant.lines
        ? editingPlant.lines.split(',').map(line => line.trim())
        : ['L1'];
        
      await updatePlant(editingPlant.id, {
        name: editingPlant.name,
        lines
      });
      
      setEditingPlant(null);
      toast.success("Plant updated successfully");
    } catch (error) {
      toast.error("Failed to update plant", { 
        description: error instanceof Error ? error.message : "An unknown error occurred"
      });
    }
  };

  // Add this function with the other handlers
  const handleUpdateUser = async () => {
    if (!editingUser) return;
    
    try {
      if (!editingUser.name || !editingUser.email || !editingUser.epf_number) {
        toast.error("Please fill all required fields");
        return;
      }

      await updateUser(editingUser.id, {
        name: editingUser.name,
        email: editingUser.email,
        role: editingUser.role as "user" | "admin" | "manager" | "qc",
        employee_id: editingUser.employee_id,
        plant_id: editingUser.plant_id,
        line_number: editingUser.line_number,
        epf_number: editingUser.epf_number
      });
      
      // Close the dialog after successful update
      setEditingUser(null);
      toast.success("User updated successfully");
    } catch (error) {
      toast.error("Failed to update user", { 
        description: error instanceof Error ? error.message : "An unknown error occurred"
      });
    }
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
                    <Label htmlFor="epfNumber">EPF Number</Label>
                    <Input 
                      id="epfNumber" 
                      value={newUser.epf_number} 
                      onChange={(e) => setNewUser({...newUser, epf_number: e.target.value})}
                      placeholder="EPF001" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="employeeId">Employee ID</Label>
                    <Input 
                      id="employeeId" 
                      value={newUser.employee_id} 
                      onChange={(e) => setNewUser({...newUser, employee_id: e.target.value})}
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
                      value={newUser.plant_id} 
                      onValueChange={(value) => setNewUser({...newUser, plant_id: value})}
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
                      value={newUser.line_number} 
                      onChange={(e) => setNewUser({...newUser, line_number: e.target.value})}
                      placeholder="L1" 
                      disabled={!newUser.plant_id}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleAddUser}
                  disabled={!newUser.name || !newUser.email || !newUser.epf_number}
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
                        <TableHead>EPF Number</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Plant</TableHead>
                        <TableHead>Line</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usersLoading ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-4">
                            Loading users...
                          </TableCell>
                        </TableRow>
                      ) : users.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                            No users found
                          </TableCell>
                        </TableRow>
                      ) : (
                        users.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.name}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>{user.epf_number}</TableCell>
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
                            <TableCell>
                              {plants.find(plant => plant.id === user.plant_id)?.name || 'N/A'}
                            </TableCell>
                            <TableCell>{user.line_number}</TableCell>
                            <TableCell className="text-right">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => {
                                      setEditingUser({
                                        id: user.id,
                                        name: user.name,
                                        email: user.email,
                                        employee_id: user.employee_id || '',
                                        plant_id: user.plant_id || '',
                                        line_number: user.line_number || '',
                                        role: user.role,
                                        epf_number: user.epf_number || ''
                                      });
                                    }}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Edit User</DialogTitle>
                                    <DialogDescription>Update user details</DialogDescription>
                                  </DialogHeader>
                                  <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <Label htmlFor="edit-user-name">Full Name</Label>
                                        <Input
                                          id="edit-user-name"
                                          value={editingUser?.name || ''}
                                          onChange={(e) => setEditingUser(prev => 
                                            prev ? {...prev, name: e.target.value} : null
                                          )}
                                          placeholder="John Doe"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor="edit-user-email">Email</Label>
                                        <Input
                                          id="edit-user-email"
                                          type="email"
                                          value={editingUser?.email || ''}
                                          onChange={(e) => setEditingUser(prev => 
                                            prev ? {...prev, email: e.target.value} : null
                                          )}
                                          placeholder="john@example.com"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor="edit-user-epf">EPF Number</Label>
                                        <Input
                                          id="edit-user-epf"
                                          value={editingUser?.epf_number || ''}
                                          onChange={(e) => setEditingUser(prev => 
                                            prev ? {...prev, epf_number: e.target.value} : null
                                          )}
                                          placeholder="EPF001"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor="edit-user-employee-id">Employee ID</Label>
                                        <Input
                                          id="edit-user-employee-id"
                                          value={editingUser?.employee_id || ''}
                                          onChange={(e) => setEditingUser(prev => 
                                            prev ? {...prev, employee_id: e.target.value} : null
                                          )}
                                          placeholder="EMP001"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor="edit-user-role">Role</Label>
                                        <Select 
                                          value={editingUser?.role || ''}
                                          onValueChange={(value) => setEditingUser(prev => 
                                            prev ? {...prev, role: value} : null
                                          )}
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
                                        <Label htmlFor="edit-user-plant">Plant</Label>
                                        <Select 
                                          value={editingUser?.plant_id || ''}
                                          onValueChange={(value) => setEditingUser(prev => 
                                            prev ? {...prev, plant_id: value} : null
                                          )}
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
                                        <Label htmlFor="edit-user-line">Line Number</Label>
                                        <Input
                                          id="edit-user-line"
                                          value={editingUser?.line_number || ''}
                                          onChange={(e) => setEditingUser(prev => 
                                            prev ? {...prev, line_number: e.target.value} : null
                                          )}
                                          placeholder="L1"
                                          disabled={!editingUser?.plant_id}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                  <DialogFooter>
                                    <Button 
                                      onClick={handleUpdateUser}
                                      disabled={!editingUser?.name || !editingUser?.email || !editingUser?.epf_number}
                                    >
                                      Save Changes
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-red-500"
                                onClick={() => handleDeleteUser(user.id)}
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
                    {plantsLoading ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-4">
                          Loading plants...
                        </TableCell>
                      </TableRow>
                    ) : plants.length === 0 ? (
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
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => setEditingPlant({
                                    id: plant.id,
                                    name: plant.name,
                                    lines: plant.lines.join(', ')
                                  })}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Edit Plant</DialogTitle>
                                  <DialogDescription>Update plant details</DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="edit-plant-name">Plant Name</Label>
                                    <Input
                                      id="edit-plant-name"
                                      value={editingPlant?.name || ''}
                                      onChange={(e) => setEditingPlant(prev => 
                                        prev ? {...prev, name: e.target.value} : null
                                      )}
                                      placeholder="Main Factory"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="edit-plant-lines">Production Lines (comma separated)</Label>
                                    <Input
                                      id="edit-plant-lines"
                                      value={editingPlant?.lines || ''}
                                      onChange={(e) => setEditingPlant(prev => 
                                        prev ? {...prev, lines: e.target.value} : null
                                      )}
                                      placeholder="L1, L2, L3"
                                    />
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button 
                                    onClick={handleUpdatePlant}
                                    disabled={!editingPlant?.name}
                                  >
                                    Save Changes
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-red-500"
                              onClick={() => handleDeletePlant(plant.id)}
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
                        {operationsLoading ? (
                          <TableRow>
                            <TableCell colSpan={2} className="text-center py-4">
                              Loading operations...
                            </TableCell>
                          </TableRow>
                        ) : operations.length === 0 ? (
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
