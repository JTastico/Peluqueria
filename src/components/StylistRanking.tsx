
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Trophy, Award, Medal } from "lucide-react";

const stylists = [
  {
    id: 1,
    name: "María González",
    rating: 4.9,
    services: 156,
    revenue: 12500,
    specialty: "Colorimetría",
    rank: 1
  },
  {
    id: 2,
    name: "Carlos Rodríguez",
    rating: 4.8,
    services: 142,
    revenue: 11200,
    specialty: "Cortes Masculinos",
    rank: 2
  },
  {
    id: 3,
    name: "Ana Martínez",
    rating: 4.7,
    services: 138,
    revenue: 10800,
    specialty: "Peinados",
    rank: 3
  },
  {
    id: 4,
    name: "Diego López",
    rating: 4.6,
    services: 124,
    revenue: 9600,
    specialty: "Barbería",
    rank: 4
  }
];

export function StylistRanking() {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-stylepro-gold-500" />;
      case 2:
        return <Award className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Medal className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="text-muted-foreground font-bold">#{rank}</span>;
    }
  };

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-stylepro-gold-500 to-stylepro-gold-600 text-white";
      case 2:
        return "bg-gradient-to-r from-gray-400 to-gray-500 text-white";
      case 3:
        return "bg-gradient-to-r from-amber-500 to-amber-600 text-white";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <Card className="shadow-md border-0 animate-fade-in">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-stylepro-gold-500 to-stylepro-lavender-500"></div>
          Ranking de Peluqueros
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {stylists.map((stylist) => (
          <div
            key={stylist.id}
            className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-white to-gray-50 hover:from-stylepro-lavender-50 hover:to-stylepro-blue-50 transition-all duration-300 border border-gray-100"
          >
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-8 h-8">
                {getRankIcon(stylist.rank)}
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-stylepro-lavender-500 to-stylepro-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {stylist.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                
                <div>
                  <p className="font-semibold text-foreground">{stylist.name}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs px-2 py-0.5">
                      {stylist.specialty}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-stylepro-gold-500 fill-current" />
                      <span className="text-xs font-medium">{stylist.rating}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-right">
              <p className="font-bold text-stylepro-lavender-700">${stylist.revenue.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">{stylist.services} servicios</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
