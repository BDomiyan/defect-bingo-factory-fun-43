
import { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import BingoBoard from '@/components/BingoBoard';
import AwardsSection from '@/components/AwardsSection';
import { Button } from '@/components/ui/button';
import { Award, Info, LogIn } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/context/auth-context';

const Index = () => {
  const { isAuthenticated, user } = useAuth();
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30">
      <Header />
      
      <main className="container py-8">
        <div className="mb-10 flex flex-col items-center justify-center text-center max-w-3xl mx-auto animate-fade-in">
          <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors bg-accent text-accent-foreground mb-4">
            <span>Quality Enhancement Initiative</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-3 text-gradient">
            Defect Bingo
          </h1>
          
          <p className="text-muted-foreground max-w-[42rem] leading-normal sm:text-xl sm:leading-8">
            Improve quality awareness through friendly competition and real-time defect tracking.
          </p>
          
          <div className="flex gap-2 mt-6">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="gap-1 glass-hover">
                  <Info className="h-4 w-4" />
                  How to Play
                </Button>
              </SheetTrigger>
              <SheetContent className="overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>How to Play Defect Bingo</SheetTitle>
                  <SheetDescription>
                    A fun way to improve quality through friendly competition
                  </SheetDescription>
                </SheetHeader>
                
                <div className="py-4 space-y-4">
                  <div>
                    <h3 className="font-medium mb-1">Game Objective</h3>
                    <p className="text-sm text-muted-foreground">
                      Identify defects across different garment parts to complete rows, columns, or diagonals on your Bingo card.
                    </p>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="font-medium mb-1">Card Layout</h3>
                    <p className="text-sm text-muted-foreground">
                      Each cell contains a garment part code (A-X) and a defect type (1-24).
                    </p>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <div className="rounded-md bg-accent/50 p-2">
                        <p className="text-xs text-muted-foreground">Garment Parts</p>
                        <p className="text-sm">A: Label Attach, B: Neck Binding, etc.</p>
                      </div>
                      <div className="rounded-md bg-accent/50 p-2">
                        <p className="text-xs text-muted-foreground">Defect Types</p>
                        <p className="text-sm">1: Printing, 2: Slubs/Holes, etc.</p>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="font-medium mb-1">How to Win</h3>
                    <ul className="text-sm space-y-2">
                      <li className="flex items-start">
                        <Award className="h-4 w-4 text-primary mr-2 mt-0.5" />
                        <span><strong>Lightning Spotter:</strong> First to achieve Bingo (any line)</span>
                      </li>
                      <li className="flex items-start">
                        <Award className="h-4 w-4 text-primary mr-2 mt-0.5" />
                        <span><strong>Eagle Eye:</strong> Second fastest Bingo</span>
                      </li>
                      <li className="flex items-start">
                        <Award className="h-4 w-4 text-primary mr-2 mt-0.5" />
                        <span><strong>Master Detective:</strong> Third fastest Bingo</span>
                      </li>
                      <li className="flex items-start">
                        <Award className="h-4 w-4 text-primary mr-2 mt-0.5" />
                        <span><strong>Guardian of Quality:</strong> Monthly award for most defects found</span>
                      </li>
                    </ul>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="font-medium mb-1">Rules</h3>
                    <ul className="text-sm space-y-1 list-disc pl-5">
                      <li>Only mark cells when you actually find the specific defect</li>
                      <li>All marked defects must be validated by a supervisor</li>
                      <li>Falsely marked defects will result in penalties</li>
                      <li>A "Bingo" is achieved by completing any row, column, or diagonal</li>
                      <li>Full board completion earns bonus points</li>
                    </ul>
                  </div>
                  
                  <Button className="w-full mt-4">Start Playing</Button>
                </div>
              </SheetContent>
            </Sheet>
            
            {!isAuthenticated ? (
              <Link to="/login">
                <Button className="gap-1">
                  <LogIn className="h-4 w-4" />
                  Login to Play
                </Button>
              </Link>
            ) : (
              <Link to="/dashboard">
                <Button className="gap-1">
                  Go to Dashboard
                </Button>
              </Link>
            )}
          </div>
          
          {isAuthenticated && (
            <div className="mt-4 px-4 py-2 bg-primary/10 rounded-full text-sm">
              Welcome back, <span className="font-medium">{user?.name}</span>!
            </div>
          )}
        </div>

        <div className="mb-12">
          <BingoBoard boardSize={5} playerName={user?.name || "Guest Player"} />
        </div>
        
        <Separator className="my-8" />
        
        <AwardsSection />
      </main>
    </div>
  );
};

export default Index;
