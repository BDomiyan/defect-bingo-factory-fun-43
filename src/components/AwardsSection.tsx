
import { Award, Zap, Eye, Search, Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AWARDS } from '@/lib/game-data';

const AwardsSection = () => {
  const getAwardIcon = (icon: string) => {
    switch (icon) {
      case 'zap':
        return <Zap className="h-5 w-5" />;
      case 'eye':
        return <Eye className="h-5 w-5" />;
      case 'search':
        return <Search className="h-5 w-5" />;
      case 'shield':
        return <Shield className="h-5 w-5" />;
      default:
        return <Award className="h-5 w-5" />;
    }
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold tracking-tight">Awards & Recognition</h2>
        <p className="text-sm text-muted-foreground">
          Special achievements in defect detection
        </p>
      </div>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {AWARDS.map((award) => (
          <Card key={award.id} className="overflow-hidden">
            <div className="absolute right-2 top-2 h-20 w-20 opacity-5">
              {getAwardIcon(award.icon)}
            </div>
            
            <CardHeader className="pb-2">
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                {getAwardIcon(award.icon)}
              </div>
              <CardTitle className="text-base">{award.name}</CardTitle>
              <CardDescription className="text-xs">
                {award.description}
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="rounded-md border bg-accent/50 p-3">
                <p className="text-xs text-muted-foreground mb-1">Current Recipients</p>
                {award.recipients.length > 0 ? (
                  <ul className="space-y-1">
                    {award.recipients.map((recipient, index) => (
                      <li key={index} className="text-sm">{recipient}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm italic text-muted-foreground">No recipients yet</p>
                )}
              </div>
              
              <p className="mt-3 text-xs text-muted-foreground">
                {award.id === 'lightning-spotter' && "Awarded to the first person to achieve Bingo"}
                {award.id === 'eagle-eye' && "Awarded to the second fastest Bingo"}
                {award.id === 'master-detective' && "Awarded to the third fastest Bingo"}
                {award.id === 'guardian-of-quality' && "Monthly recognition for overall excellence"}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AwardsSection;
