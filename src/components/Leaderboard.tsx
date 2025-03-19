
import { useState } from 'react';
import { 
  Trophy, 
  Zap, 
  Eye, 
  Search, 
  Shield, 
  Users, 
  Award
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
import { MOCK_PLAYERS } from '@/lib/game-data';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Leaderboard = () => {
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  
  // Sort players by score
  const sortedPlayers = [...MOCK_PLAYERS].sort((a, b) => b.score - a.score);
  
  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="mb-6 flex flex-col">
        <h2 className="text-2xl font-semibold tracking-tight">Leaderboard</h2>
        <p className="text-sm text-muted-foreground">
          Top performers in defect detection
        </p>
      </div>
      
      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border-b">
          <div className="flex items-center space-x-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <h3 className="font-medium">Top Players</h3>
          </div>
          
          <Tabs 
            defaultValue="weekly" 
            className="w-full sm:w-auto"
            onValueChange={(value) => setTimeframe(value as any)}
          >
            <TabsList className="grid w-full grid-cols-3 sm:w-[300px]">
              <TabsTrigger value="daily">Daily</TabsTrigger>
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
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
            {sortedPlayers.map((player, index) => (
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
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Awards section */}
      <div className="mt-8">
        <div className="mb-4 flex items-center">
          <Award className="mr-2 h-5 w-5 text-primary" />
          <h3 className="text-lg font-medium">Weekly Awards</h3>
        </div>
        
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <h4 className="text-sm font-medium">Lightning Spotter</h4>
            <p className="mt-1 text-xs text-muted-foreground">
              Fastest to achieve Bingo
            </p>
            <div className="mt-3">
              <span className="text-sm font-medium">Elena Rodriguez</span>
            </div>
          </div>
          
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <Eye className="h-4 w-4 text-primary" />
            </div>
            <h4 className="text-sm font-medium">Eagle Eye</h4>
            <p className="mt-1 text-xs text-muted-foreground">
              Second fastest Bingo
            </p>
            <div className="mt-3">
              <span className="text-sm font-medium">Michael Chen</span>
            </div>
          </div>
          
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <Search className="h-4 w-4 text-primary" />
            </div>
            <h4 className="text-sm font-medium">Master Detective</h4>
            <p className="mt-1 text-xs text-muted-foreground">
              Third fastest Bingo
            </p>
            <div className="mt-3">
              <span className="text-sm font-medium">Aisha Patel</span>
            </div>
          </div>
          
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <Shield className="h-4 w-4 text-primary" />
            </div>
            <h4 className="text-sm font-medium">Guardian of Quality</h4>
            <p className="mt-1 text-xs text-muted-foreground">
              Most defects identified
            </p>
            <div className="mt-3">
              <span className="text-sm font-medium">Elena Rodriguez</span>
            </div>
          </div>
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
