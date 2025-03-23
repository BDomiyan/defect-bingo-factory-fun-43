
import { useState } from 'react';
import { useAuth, UserProfile, Plant } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Trash2, PencilLine, Plus, Users, Building2, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Admin = () => {
  const { 
    isAdmin, 
    getAllUsers, 
    deleteUser, 
    addUser, 
    updateUser, 
    getAllPlants, 
    addPlant, 
    updatePlant, 
    deletePlant,
    logout
  } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('users');
  
  // User form state
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    employeeId: '',
    plantId: '',
    lineNumber: '',
    role: 'user' as UserProfile['role']
  });
  
  // Plant form state
  const [newPlant, setNewPlant] = useState({
    name: '',
    lines: ['L1']
  });
  const [editingLine, setEditingLine] = useState('');
  
  // Get data
  const users = getAllUsers();
  const plants = getAllPlants();
  
  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  // If not admin, redirect
  if (!isAdmin) {
    toast.error("Unauthorized access", {
      description: "You don't have permission to view this page"
    });
    navigate('/dashboard');
    return null;
  }
  
  // Add user
  const handleAddUser = () => {
    if (!newUser.name || !newUser.email || !newUser.password || !newUser.employeeId || !newUser.plantId || !newUser.lineNumber) {
      toast.error("Missing fields", { description: "All fields are required" });
      return;
    }
    
    addUser(newUser);
    
    // Reset form
    setNewUser({
      name: '',
      email: '',
      password: '',
      employeeId: '',
      plantId: '',
      lineNumber: '',
      role: 'user'
    });
  };
  
  // Add plant
  const handleAddPlant = () => {
    if (!newPlant.name || newPlant.lines.length === 0) {
      toast.error("Missing fields", { description: "Plant name and at least one line are required" });
      return;
    }
    
    addPlant(newPlant);
    
    // Reset form
    setNewPlant({
      name: '',
      lines: ['L1']
    });
  };
  
  // Add line to new plant
  const handleAddLine = () => {
    if (!editingLine) return;
    
    if (newPlant.lines.includes(editingLine)) {
      toast.error("Line exists", { description: "This line already exists" });
      return;
    }
    
    setNewPlant({
      ...newPlant,
      lines: [...newPlant.lines, editingLine]
    });
    
    setEditingLine('');
  };
  
  // Remove line from new plant
  const handleRemoveLine = (line: string) => {
    setNewPlant({
      ...newPlant,
      lines: newPlant.lines.filter(l => l !== line)
    });
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-background to-blue-50">
      <div className="container py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gradient mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage users, plants, and system settings</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 mb-8">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Users Management
            </TabsTrigger>
            <TabsTrigger value="plants" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Plants Management
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Add New User</CardTitle>
                <CardDescription>Create a new user with specific role and permissions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
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
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input 
                    id="password"
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    placeholder="••••••••"
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="employeeId">Employee ID</Label>
                    <Input 
                      id="employeeId"
                      value={newUser.employeeId}
                      onChange={(e) => setNewUser({...newUser, employeeId: e.target.value})}
                      placeholder="EMP123"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="plant">Plant</Label>
                    <Select 
                      value={newUser.plantId} 
                      onValueChange={(value) => setNewUser({...newUser, plantId: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select plant" />
                      </SelectTrigger>
                      <SelectContent>
                        {plants.map(plant => (
                          <SelectItem key={plant.id} value={plant.id}>{plant.name}</SelectItem>
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
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select 
                    value={newUser.role} 
                    onValueChange={(value: UserProfile['role']) => setNewUser({...newUser, role: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="qc">Quality Control</SelectItem>
                      <SelectItem value="admin">Administrator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleAddUser} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>View, edit and delete users</CardDescription>
              </CardHeader>
              <CardContent>
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
                    {users.map(user => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell className="capitalize">{user.role}</TableCell>
                        <TableCell>{plants.find(p => p.id === user.plantId)?.name || user.plantId}</TableCell>
                        <TableCell>{user.lineNumber}</TableCell>
                        <TableCell className="text-right">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <PencilLine className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Edit User</DialogTitle>
                                <DialogDescription>Make changes to user profile</DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                  <Label htmlFor={`edit-name-${user.id}`}>Name</Label>
                                  <Input
                                    id={`edit-name-${user.id}`}
                                    defaultValue={user.name}
                                    onChange={(e) => {
                                      // We use a dialog so changes are applied only on save
                                    }}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor={`edit-role-${user.id}`}>Role</Label>
                                  <Select defaultValue={user.role}>
                                    <SelectTrigger id={`edit-role-${user.id}`}>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="user">User</SelectItem>
                                      <SelectItem value="manager">Manager</SelectItem>
                                      <SelectItem value="qc">Quality Control</SelectItem>
                                      <SelectItem value="admin">Administrator</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label htmlFor={`edit-plant-${user.id}`}>Plant</Label>
                                    <Select defaultValue={user.plantId}>
                                      <SelectTrigger id={`edit-plant-${user.id}`}>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {plants.map(plant => (
                                          <SelectItem key={plant.id} value={plant.id}>{plant.name}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor={`edit-line-${user.id}`}>Line Number</Label>
                                    <Input
                                      id={`edit-line-${user.id}`}
                                      defaultValue={user.lineNumber}
                                    />
                                  </div>
                                </div>
                              </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => {
                                  // This would capture the form data and update user
                                  toast.success("Changes saved", {
                                    description: "This is a demo. Full implementation would save changes."
                                  });
                                }}>
                                  Save Changes
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                          
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive"
                            onClick={() => deleteUser(user.id)}
                            disabled={user.id === 'admin-1'}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="plants" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Add New Plant</CardTitle>
                <CardDescription>Create a new manufacturing plant and define its production lines</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="plantName">Plant Name</Label>
                  <Input 
                    id="plantName"
                    value={newPlant.name}
                    onChange={(e) => setNewPlant({...newPlant, name: e.target.value})}
                    placeholder="Factory Name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Production Lines</Label>
                  <div className="bg-secondary/50 rounded-md p-4">
                    <div className="flex flex-wrap gap-2 mb-4">
                      {newPlant.lines.map(line => (
                        <div key={line} className="flex items-center gap-1 bg-white px-3 py-1 rounded-full shadow-sm">
                          <span>{line}</span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-5 w-5 rounded-full"
                            onClick={() => handleRemoveLine(line)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex gap-2">
                      <Input 
                        value={editingLine}
                        onChange={(e) => setEditingLine(e.target.value)}
                        placeholder="L5"
                        className="flex-1"
                      />
                      <Button variant="secondary" onClick={handleAddLine}>
                        Add Line
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleAddPlant} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Plant
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Plant Management</CardTitle>
                <CardDescription>View and manage manufacturing plants</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Plant ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Production Lines</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {plants.map(plant => (
                      <TableRow key={plant.id}>
                        <TableCell>{plant.id}</TableCell>
                        <TableCell className="font-medium">{plant.name}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {plant.lines.map(line => (
                              <span key={line} className="inline-block px-2 py-1 bg-secondary text-xs rounded">
                                {line}
                              </span>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <PencilLine className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Edit Plant</DialogTitle>
                                <DialogDescription>Make changes to plant information</DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                  <Label htmlFor={`edit-plant-name-${plant.id}`}>Plant Name</Label>
                                  <Input
                                    id={`edit-plant-name-${plant.id}`}
                                    defaultValue={plant.name}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Production Lines</Label>
                                  <div className="flex flex-wrap gap-2 bg-secondary/50 p-3 rounded-md">
                                    {plant.lines.map(line => (
                                      <div key={line} className="bg-white px-2 py-1 rounded text-sm">
                                        {line}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => {
                                  // This would capture the form data and update plant
                                  toast.success("Changes saved", {
                                    description: "This is a demo. Full implementation would save changes."
                                  });
                                }}>
                                  Save Changes
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                          
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive"
                            onClick={() => deletePlant(plant.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
