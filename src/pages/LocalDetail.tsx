import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { localesData } from '@/data/locales-data';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Label } from "@/components/ui/label";
import { DatePicker } from '@/components/ui/date-picker'; // ¡Esta importación ahora es válida!
import { Users, DollarSign, Trophy, ArrowLeft, UserCheck } from 'lucide-react';
import { format } from 'date-fns';

// Simulación de datos
const mockDailyData = {
  '1': {
    '2025-07-09': { earnings: 2100, topWorker: 'Ana Rodríguez', services: 18 },
    '2025-07-08': { earnings: 1850, topWorker: 'María González', services: 15 },
  },
  '2': { '2025-07-09': { earnings: 1950, topWorker: 'Laura Jiménez', services: 17 } },
  '3': { '2025-07-09': { earnings: 1550, topWorker: 'Roberto Silva', services: 13 } },
};

const LocalDetail = () => {
  const { localId: urlLocalId } = useParams();
  const navigate = useNavigate();
  const { userRole, localId: authLocalId } = useAuth();
  const [date, setDate] = useState<Date | undefined>(new Date("2025-07-09"));

  const local = useMemo(() => localesData.find(l => l.id.toString() === urlLocalId), [urlLocalId]);

  useEffect(() => {
    console.log("ID desde URL:", urlLocalId, "Local encontrado:", local);
  }, [urlLocalId, local]);
  
  if (userRole === 'local' && authLocalId !== urlLocalId) {
    return (
      <div className="text-center p-4">
        <h1 className="text-2xl font-bold text-destructive">Acceso Denegado</h1>
        <Button onClick={() => navigate('/locales')} className="mt-4">Volver</Button>
      </div>
    );
  }

  if (!local) {
    return (
      <div className="text-center p-4">
        <h1 className="text-2xl font-bold">Local no encontrado</h1>
        <Button onClick={() => navigate('/locales')} className="mt-4">Volver</Button>
      </div>
    );
  }

  const dayData = useMemo(() => {
    if (!date) return null;
    const dateString = format(date, 'yyyy-MM-dd');
    return mockDailyData[local.id]?.[dateString] || null;
  }, [date, local.id]);
  
  return (
    <div className="h-full bg-gradient-to-br from-background via-stylepro-lavender-50/30 to-stylepro-blue-50/20">
      <div className="container mx-auto px-6 py-8 animate-fade-in">
        <div className="flex items-center gap-4 mb-8">
            <Button variant="outline" size="icon" onClick={() => navigate('/locales')}>
                <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
                <h1 className="text-3xl font-bold text-foreground">{local.nombre}</h1>
                <p className="text-muted-foreground">Análisis de rendimiento y gestión diaria.</p>
            </div>
        </div>

        <Card className="mb-6 border-0 shadow-md">
            <CardContent className="p-4 flex flex-col md:flex-row items-center gap-4 justify-between">
                <div className="flex items-center gap-4">
                    <Label>Selecciona un Día:</Label>
                    <DatePicker date={date} setDate={setDate} />
                </div>
                <Button className="bg-stylepro-lavender-600 hover:bg-stylepro-lavender-700">
                    <Users className="mr-2 h-4 w-4" />
                    Lista de Trabajadores
                </Button>
            </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-0 shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Ganancias del Día</span>
                        <DollarSign className="h-5 w-5 text-stylepro-gold-500" />
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-4xl font-bold text-stylepro-gold-600">S/{dayData ? dayData.earnings.toLocaleString() : '0'}</p>
                </CardContent>
            </Card>
            <Card className="border-0 shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Trabajador del Día</span>
                         <Trophy className="h-5 w-5 text-stylepro-lavender-500" />
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-stylepro-lavender-100 rounded-full">
                            <UserCheck className="h-6 w-6 text-stylepro-lavender-700"/>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-stylepro-lavender-700">{dayData ? dayData.topWorker : 'N/A'}</p>
                            <p className="text-sm text-muted-foreground">{dayData ? `${dayData.services} servicios` : 'Sin datos'}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
};

export default LocalDetail;