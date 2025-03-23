
import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  HelpCircle,
  CheckCircle,
  ArrowRight,
  ThumbsUp,
  ListChecks,
  Award,
  PanelLeft
} from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface TutorialGuideProps {
  onClose: () => void;
}

const TutorialGuide: React.FC<TutorialGuideProps> = ({ onClose }) => {
  const steps = [
    {
      title: "Welcome to Defect Bingo!",
      content: "This game helps you learn about and record garment defects in a fun, interactive way.",
      icon: <ThumbsUp className="h-10 w-10 text-primary" />
    },
    {
      title: "Understand the Grid",
      content: "Each cell on the bingo board represents a combination of a garment part and defect type.",
      icon: <PanelLeft className="h-10 w-10 text-primary" />
    },
    {
      title: "Placing Defects",
      content: "Drag defect types and garment parts to the grid cells or use the selector on mobile.",
      icon: <ArrowRight className="h-10 w-10 text-primary" />
    },
    {
      title: "Marking Defects",
      content: "When you find a real defect, click the cell to mark it. This records the defect in the system.",
      icon: <CheckCircle className="h-10 w-10 text-primary" />
    },
    {
      title: "Complete a Bingo",
      content: "Mark defects to complete a row, column, or diagonal to achieve a bingo!",
      icon: <ListChecks className="h-10 w-10 text-primary" />
    },
    {
      title: "Earn Rewards",
      content: "Each bingo and defect you find earns points that contribute to your quality score.",
      icon: <Award className="h-10 w-10 text-primary" />
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-card max-w-2xl w-full mx-4 rounded-lg shadow-xl overflow-hidden border">
        <div className="bg-primary/10 p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-lg">How to Play Defect Bingo</h3>
          </div>
          <Badge variant="outline" className="bg-background">Step-by-Step Guide</Badge>
        </div>
        
        <Carousel className="w-full max-w-2xl">
          <CarouselContent>
            {steps.map((step, index) => (
              <CarouselItem key={index}>
                <div className="p-6 flex flex-col items-center text-center">
                  {step.icon}
                  <h4 className="text-xl font-semibold mt-4 mb-2">{step.title}</h4>
                  <p className="text-muted-foreground mb-6">{step.content}</p>
                  <div className="flex gap-2 justify-center">
                    {steps.map((_, i) => (
                      <div 
                        key={i} 
                        className={`h-2 w-2 rounded-full ${i === index ? 'bg-primary' : 'bg-muted'}`}
                      />
                    ))}
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="flex justify-between p-4">
            <CarouselPrevious className="relative left-0" />
            <CarouselNext className="relative right-0" />
          </div>
        </Carousel>
        
        <div className="p-4 border-t flex justify-end">
          <Button onClick={onClose}>Got it, let's play!</Button>
        </div>
      </div>
    </div>
  );
};

export default TutorialGuide;
