
import { useState, useEffect } from 'react';
import { 
  Trophy, 
  Zap, 
  Eye, 
  Search, 
  Shield, 
  Users, 
  Award,
  Factory,
  Layers
} from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Player, Award as AwardType } from '@/lib/types';
import { useDefectSync } from '@/hooks/use-defect-sync';
import { toast } from 'sonner';

const defaultPlayers: Player[] = [
  {
    id: 'default-player',
    name: 'New Player',
    role: 'operator',
    score: 0,
    bingoCount: 0,
    defectsFound: 0
  }
];

const defaultAwards: AwardType[] = [
  {
    id: 'lightning-spotter',
    name: 'Lightning Spotter',
    description: 'Fastest to achieve Bingo',
    icon: 'zap',
    recipients: []
  },
  {
    id: 'eagle-eye',
    name: 'Eagle Eye',
    description: 'Second fastest Bingo',
    icon: 'eye',
    recipients: []
  },
  {
    id: 'master-detective',
    name: 'Master Detective',
    description: 'Third fastest Bingo',
    icon: 'search',
    recipients: []
  },
  {
    id: 'guardian-of-quality',
    name: 'Guardian of Quality',
    description: 'Most defects identified',
    icon: 'shield',
    recipients: []
  }
];

const Leaderboard = () => {
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [players, setPlayers] = useLocalStorage<Player[]>('defect-bingo-players', defaultPlayers);
  const [awards, setAwards] = useLocalStorage<AwardType[]>('defect-bingo-awards', defaultAwards);
  const [activeTab, setActiveTab] = useState<'players' | 'plants' | 'lines'>('players');
  
  // Get defect data
  const { defectsByFactory, defectsByLine, recentDefects } = useDefectSync();
  
  // Update awards when players change
  useEffect(() => {
    updateAwards();
  }, [players]);
  
  // Function to update awards based on player performance
  const updateAwards = () => {
    if (players.length <= 1) return;
    
    const sortedByScore = [...players].sort((a, b) => b.score - a.score);
    const sortedByDefects = [...players].sort((a, b) => b.defectsFound - a.defectsFound);
    
    const updatedAwards = awards.map(award => {
      if (award.id === 'lightning-spotter' && sortedByScore[0]?.name) {
        return { ...award, recipients: [sortedByScore[0].name] };
      } 
      else if (award.id === 'eagle-eye' && sortedByScore[1]?.name) {
        return { ...award, recipients: [sortedByScore[1].name] };
      } 
      else if (award.id === 'master-detective' && sortedByScore[2]?.name) {
        return { ...award, recipients: [sortedByScore[2].name] };
      } 
      else if (award.id === 'guardian-of-quality' && sortedByDefects[0]?.name) {
        return { ...award, recipients: [sortedByDefects[0].name] };
      }
      return award;
    });
    
    setAwards(updatedAwards);
  };
  
  // Function to add demo data for presentation purposes
  const addDemoPlayers = () => {
    const demoPlayers: Player[] = [
      {
        id: '1',
        name: 'Elena Rodriguez',
        role: 'operator',
        score: 92,
        bingoCount: 3,
        defectsFound: 45
      },
      {
        id: '2',
        name: 'Michael Chen',
        role: 'supervisor',
        score: 78,
        bingoCount: 2,
        defectsFound: 38
      },
      {
        id: '3',
        name: 'Aisha Patel',
        role: 'operator',
        score: 65,
        bingoCount: 1,
        defectsFound: 29
      },
      {
        id: '4',
        name: 'Carlos Mendez',
        role: 'operator',
        score: 52,
        bingoCount: 1,
        defectsFound: 24
      },
      {
        id: '5',
        name: 'Sarah Johnson',
        role: 'operator',
        score: 47,
        bingoCount: 0,
        defectsFound: 22
      },
      {
        id: '6',
        name: 'Ahmed Al-Farsi',
        role: 'supervisor',
        score: 41,
        bingoCount: 0,
        defectsFound: 19
      }
    ];
    
    // Update award recipients
    const updatedAwards = awards.map(award => {
      if (award.id === 'lightning-spotter') {
        return { ...award, recipients: ['Elena Rodriguez'] };
      } else if (award.id === 'eagle-eye') {
        return { ...award, recipients: ['Michael Chen'] };
      } else if (award.id === 'master-detective') {
        return { ...award, recipients: ['Aisha Patel'] };
      } else if (award.id === 'guardian-of-quality') {
        return { ...award, recipients: ['Elena Rodriguez'] };
      }
      return award;
    });
    
    setPlayers(demoPlayers);
    setAwards(updatedAwards);
    
    toast.success('Demo players added', {
      description: 'Leaderboard has been populated with sample players'
    });
  };
  
  // Function to reset all data
  const resetData = () => {
    setPlayers(defaultPlayers);
    setAwards(defaultAwards);
    
    toast.info('Data reset', {
      description: 'Leaderboard data has been reset to defaults'
    });
  };
  
  // Sort players by score
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  
  // Sort factories by defect count
  const sortedFactories = [...defectsByFactory].sort((a, b) => b.defects.length - a.defects.length);
  
  // Sort lines by defect count
  const sortedLines = [...defectsByLine].sort((a, b) => b.defects.length - a.defects.length);
  
  // Helper function to get the icon component based on award icon name
  const getAwardIcon = (iconName: string) => {
    switch (iconName) {
      case 'zap':
        return <Zap className="h-4 w-4 text-primary" />;
      case 'eye':
        return <Eye className="h-4 w-4 text-primary" />;
      case 'search':
        return <Search className="h-4 w-4 text-primary" />;
      case 'shield':
        return <Shield className="h-4 w-4 text-primary" />;
      default:
        return <Award className="h-4 w-4 text-primary" />;
    }
  };
  
  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Leaderboard</h2>
          <p className="text-sm text-muted-foreground">
            Top performers in defect detection
          </p>
        </div>
        
        <div className="mt-4 sm:mt-0 flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={addDemoPlayers}
          >
            Add Demo Players
          </Button>
          <Button 
            variant="destructive" 
            size="sm"
            onClick={resetData}
          >
            Reset
          </Button>
        </div>
      </div>
      
      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border-b">
          <div className="flex items-center space-x-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <h3 className="font-medium">Rankings</h3>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Tabs 
              value={activeTab} 
              onValueChange={(value) => setActiveTab(value as any)}
              className="w-full sm:w-auto mt-4 sm:mt-0"
            >
              <TabsList className="grid w-full grid-cols-3 sm:w-[300px]">
                <TabsTrigger value="players">Players</TabsTrigger>
                <TabsTrigger value="plants">Plants</TabsTrigger>
                <TabsTrigger value="lines">Lines</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <Tabs 
              defaultValue="weekly" 
              className="w-full sm:w-auto mt-2 sm:mt-0"
              onValueChange={(value) => setTimeframe(value as any)}
            >
              <TabsList className="grid w-full grid-cols-3 sm:w-[200px]">
                <TabsTrigger value="daily">Daily</TabsTrigger>
                <TabsTrigger value="weekly">Weekly</TabsTrigger>
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
        
        <TabsContent value="players" className="mt-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">Rank</TableHead>
                <TableHead>Player</TableHead>
                <TableHead className="text-center">Defects Found</TableHead>
                <TableHead className="text-center">Bingo Count</TableHead>
                <TableHead className="text-right">Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedPlayers.length === 0 || (sortedPlayers.length === 1 && sortedPlayers[0].score === 0) ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No players yet. Start playing to see rankings!
                  </TableCell>
                </TableRow>
              ) : (
                sortedPlayers.map((player, index) => (
                  <TableRow 
                    key={player.id}
                    className={cn(
                      index < 3 ? "bg-accent/30" : ""
                    )}
                  >
                    <TableCell className="font-medium flex items-center justify-center py-3">
                      {index === 0 && (
                        <div className="w-7 h-7 flex items-center justify-center rounded-full bg-yellow-100 text-yellow-700">
                          <Trophy className="h-3.5 w-3.5" />
                        </div>
                      )}
                      {index === 1 && (
                        <div className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-100 text-slate-700">
                          <Trophy className="h-3.5 w-3.5" />
                        </div>
                      )}
                      {index === 2 && (
                        <div className="w-7 h-7 flex items-center justify-center rounded-full bg-amber-100 text-amber-700">
                          <Trophy className="h-3.5 w-3.5" />
                        </div>
                      )}
                      {index > 2 && (
                        <span className="font-normal text-muted-foreground">{index + 1}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{player.name}</span>
                        {player.role === 'supervisor' && (
                          <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-sm">
                            Supervisor
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{player.defectsFound}</TableCell>
                    <TableCell className="text-center">{player.bingoCount}</TableCell>
                    <TableCell className="text-right font-medium">{player.score}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TabsContent>
          
        <TabsContent value="plants" className="mt-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">Rank</TableHead>
                <TableHead>Plant</TableHead>
                <TableHead className="text-center">Defects Found</TableHead>
                <TableHead className="text-center">Affected Lines</TableHead>
                <TableHead className="text-right">Quality Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedFactories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No plant data yet. Record defects to see plant rankings!
                  </TableCell>
                </TableRow>
              ) : (
                sortedFactories.map((factory, index) => {
                  const uniqueLines = new Set(factory.defects.map(d => d.lineNumber)).size;
                  const qualityScore = 100 - Math.min(80, factory.defects.length * 2);
                  
                  return (
                    <TableRow 
                      key={factory.id}
                      className={cn(
                        index < 3 ? "bg-accent/30" : ""
                      )}
                    >
                      <TableCell className="font-medium flex items-center justify-center py-3">
                        {index === 0 && (
                          <div className="w-7 h-7 flex items-center justify-center rounded-full bg-yellow-100 text-yellow-700">
                            <Factory className="h-3.5 w-3.5" />
                          </div>
                        )}
                        {index === 1 && (
                          <div className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-100 text-slate-700">
                            <Factory className="h-3.5 w-3.5" />
                          </div>
                        )}
                        {index === 2 && (
                          <div className="w-7 h-7 flex items-center justify-center rounded-full bg-amber-100 text-amber-700">
                            <Factory className="h-3.5 w-3.5" />
                          </div>
                        )}
                        {index > 2 && (
                          <span className="font-normal text-muted-foreground">{index + 1}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{factory.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{factory.defects.length}</TableCell>
                      <TableCell className="text-center">{uniqueLines}</TableCell>
                      <TableCell className="text-right font-medium">{qualityScore}%</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TabsContent>
          
        <TabsContent value="lines" className="mt-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">Rank</TableHead>
                <TableHead>Production Line</TableHead>
                <TableHead>Plant</TableHead>
                <TableHead className="text-center">Defects Found</TableHead>
                <TableHead className="text-right">Quality Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedLines.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No line data yet. Record defects to see line rankings!
                  </TableCell>
                </TableRow>
              ) : (
                sortedLines.map((line, index) => {
                  const qualityScore = 100 - Math.min(80, line.defects.length * 3);
                  
                  return (
                    <TableRow 
                      key={line.id}
                      className={cn(
                        index < 3 ? "bg-accent/30" : ""
                      )}
                    >
                      <TableCell className="font-medium flex items-center justify-center py-3">
                        {index === 0 && (
                          <div className="w-7 h-7 flex items-center justify-center rounded-full bg-yellow-100 text-yellow-700">
                            <Layers className="h-3.5 w-3.5" />
                          </div>
                        )}
                        {index === 1 && (
                          <div className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-100 text-slate-700">
                            <Layers className="h-3.5 w-3.5" />
                          </div>
                        )}
                        {index === 2 && (
                          <div className="w-7 h-7 flex items-center justify-center rounded-full bg-amber-100 text-amber-700">
                            <Layers className="h-3.5 w-3.5" />
                          </div>
                        )}
                        {index > 2 && (
                          <span className="font-normal text-muted-foreground">{index + 1}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Line {line.lineNumber}</span>
                        </div>
                      </TableCell>
                      <TableCell>Factory {line.factoryId}</TableCell>
                      <TableCell className="text-center">{line.defects.length}</TableCell>
                      <TableCell className="text-right font-medium">{qualityScore}%</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TabsContent>
      </div>

      {/* Awards section */}
      <div className="mt-8">
        <div className="mb-4 flex items-center">
          <Award className="mr-2 h-5 w-5 text-primary" />
          <h3 className="text-lg font-medium">Weekly Awards</h3>
        </div>
        
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {awards.map((award) => (
            <div key={award.id} className="rounded-lg border bg-card p-4 shadow-sm">
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                {getAwardIcon(award.icon)}
              </div>
              <h4 className="text-sm font-medium">{award.name}</h4>
              <p className="mt-1 text-xs text-muted-foreground">
                {award.description}
              </p>
              <div className="mt-3">
                {award.recipients.length > 0 ? (
                  <span className="text-sm font-medium">{award.recipients[0]}</span>
                ) : (
                  <span className="text-sm text-muted-foreground">Not yet awarded</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="mt-8 flex justify-center">
        <Button variant="outline">
          <Users className="mr-2 h-4 w-4" />
          View All Players
        </Button>
      </div>
    </div>
  );
};

export default Leaderboard;
