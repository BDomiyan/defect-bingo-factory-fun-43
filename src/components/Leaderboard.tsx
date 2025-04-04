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
  Layers,
  Loader2
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
import { Award as AwardType } from '@/lib/types';
import { toast } from 'sonner';
import Header from '@/components/Header';
import { useLeaderboard } from '@/lib/supabase/hooks';

const Leaderboard = () => {
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [activeTab, setActiveTab] = useState<'players' | 'plants' | 'lines'>('players');
  
  // Get data from Supabase using the new hook
  const { 
    players, 
    plantStats, 
    lineStats, 
    awards, 
    loading,
    fetchPlayers, 
    fetchPlantStats, 
    fetchLineStats 
  } = useLeaderboard();
  
  // Function to refresh data
  const refreshData = async () => {
    toast.info('Refreshing data...', {
      description: 'Fetching the latest leaderboard data from the server'
    });
    
    try {
      await Promise.all([
        fetchPlayers(),
        fetchPlantStats(),
        fetchLineStats()
      ]);
      
      toast.success('Data refreshed', {
        description: 'Leaderboard data has been updated with the latest information'
      });
    } catch (error) {
      toast.error('Refresh failed', {
        description: 'There was a problem refreshing the leaderboard data'
      });
    }
  };
  
  // Sort players by score
  const sortedPlayers = players ? [...players].sort((a, b) => b.score - a.score) : [];
  
  // Sort factories by defect count
  const sortedFactories = plantStats ? [...plantStats].sort((a, b) => b.defects.length - a.defects.length) : [];
  
  // Sort lines by defect count
  const sortedLines = lineStats ? [...lineStats].sort((a, b) => b.defects.length - a.defects.length) : [];
  
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
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-semibold tracking-tight">Leaderboard</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={refreshData}>
              Refresh Data
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
            <p className="text-muted-foreground">Loading leaderboard data...</p>
          </div>
        ) : (
          <Tabs defaultValue="players" className="space-y-4" onValueChange={(value) => setActiveTab(value as any)}>
            <TabsList>
              <TabsTrigger value="players" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Players
              </TabsTrigger>
              <TabsTrigger value="plants" className="flex items-center gap-2">
                <Factory className="h-4 w-4" />
                Plants
              </TabsTrigger>
              <TabsTrigger value="lines" className="flex items-center gap-2">
                <Layers className="h-4 w-4" />
                Lines
              </TabsTrigger>
            </TabsList>

            <TabsContent value="players">
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
                  {sortedPlayers.length === 0 ? (
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

            <TabsContent value="plants">
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
                    sortedFactories.map((factory, index) => (
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
                        <TableCell className="text-center">{factory.uniqueLines}</TableCell>
                        <TableCell className="text-right font-medium">{factory.qualityScore}%</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="lines">
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
                    sortedLines.map((line, index) => (
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
                        <TableCell>{line.plantName}</TableCell>
                        <TableCell className="text-center">{line.defects.length}</TableCell>
                        <TableCell className="text-right font-medium">{line.qualityScore}%</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        )}

        {/* Awards section */}
        <div className="mt-8">
          <div className="mb-4 flex items-center">
            <Award className="mr-2 h-5 w-5 text-primary" />
            <h3 className="text-lg font-medium">Weekly Awards</h3>
          </div>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {awards && awards.map((award: AwardType) => (
              <div key={award.id} className="rounded-lg border bg-card p-4 shadow-sm">
                <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                  {getAwardIcon(award.icon)}
                </div>
                <h4 className="text-sm font-medium">{award.name}</h4>
                <p className="mt-1 text-xs text-muted-foreground">
                  {award.description}
                </p>
                <div className="mt-3">
                  {award.recipients && award.recipients.length > 0 ? (
                    <span className="text-sm font-medium">{award.recipients[0]}</span>
                  ) : (
                    <span className="text-sm text-muted-foreground">Not yet awarded</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
