import { useState } from 'react';
import { useHealthcareProfessionals } from '@/hooks/useHealthcareProfessionals';
import { ProfessionalCard } from './ProfessionalCard';
import { HealthcareProfessional, SPECIALTIES } from '@/types/healthcare';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Users, Heart, Stethoscope, Baby, Activity, Pill, Brain, Scissors, Apple, Dumbbell } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';

interface ProfessionalSelectorProps {
  onSelect?: (professional: HealthcareProfessional) => void;
  selectedProfessionalId?: string;
}

export function ProfessionalSelector({ 
  onSelect, 
  selectedProfessionalId 
}: ProfessionalSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('all');
  
  const { data: professionals = [], isLoading } = useHealthcareProfessionals(
    selectedSpecialty === 'all' ? undefined : selectedSpecialty
  );

  const filteredProfessionals = professionals.filter(prof => {
    const matchesSearch = prof.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prof.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prof.sub_specialty?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (selectedSpecialty === 'all') return matchesSearch;
    
    // Filter by specialty or sub_specialty matching the selected filter
    const matchesSpecialty = prof.specialty.toLowerCase() === selectedSpecialty.toLowerCase() ||
      prof.sub_specialty?.toLowerCase().includes(selectedSpecialty.toLowerCase());
    
    return matchesSearch && matchesSpecialty;
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-40 w-full" />
        ))}
      </div>
    );
  }

  const specialtyIcons = [
    { name: 'Cirurgia Vascular', icon: Heart, filter: 'cirurgia vascular' },
    { name: 'Endocrinologia', icon: Stethoscope, filter: 'endocrinologia' },
    { name: 'Ginecologia', icon: Baby, filter: 'ginecologia' },
    { name: 'Fisioterapia', icon: Activity, filter: 'fisioterapeuta' },
    { name: 'Farmácia', icon: Pill, filter: 'farmacêutico' },
    { name: 'Psiquiatria', icon: Brain, filter: 'psicologia' },
    { name: 'Cirurgia Plástica', icon: Scissors, filter: 'cirurgia plástica' },
    { name: 'Nutrição', icon: Apple, filter: 'nutricionista' },
    { name: 'Personal Trainer', icon: Dumbbell, filter: 'personal trainer' },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-4">Agende uma consulta online ou presencial</h2>
        
        {/* Grid de Especialidades */}
        <div className="grid grid-cols-3 md:grid-cols-5 gap-3 md:gap-4 max-w-4xl mx-auto mb-8">
          {specialtyIcons.map((specialty) => {
            const IconComponent = specialty.icon;
            return (
              <Card
                key={specialty.name}
                className="p-3 md:p-4 hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer group border-2 hover:border-turquoise"
                onClick={() => setSelectedSpecialty(specialty.filter)}
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="w-16 h-16 md:w-18 md:h-18 rounded-full bg-turquoise/10 flex items-center justify-center group-hover:bg-turquoise/20 transition-colors">
                    <IconComponent className="w-8 h-8 md:w-9 md:h-9 text-turquoise" />
                  </div>
                  <span className="text-xs md:text-sm font-medium text-center leading-tight">
                    {specialty.name}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou especialidade..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Professionals List */}
      {filteredProfessionals.length === 0 ? (
        <Alert>
          <AlertDescription>
            Nenhum profissional encontrado com os filtros selecionados.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredProfessionals.map((professional) => (
            <ProfessionalCard
              key={professional.id}
              professional={professional}
              onSelect={onSelect}
              selected={professional.id === selectedProfessionalId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
