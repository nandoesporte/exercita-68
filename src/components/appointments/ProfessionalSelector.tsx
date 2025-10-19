import { useState } from 'react';
import { useHealthcareProfessionals } from '@/hooks/useHealthcareProfessionals';
import { ProfessionalCard } from './ProfessionalCard';
import { HealthcareProfessional, SPECIALTIES } from '@/types/healthcare';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Users } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ProfessionalSelectorProps {
  onSelect: (professional: HealthcareProfessional) => void;
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

  const filteredProfessionals = professionals.filter(prof =>
    prof.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    prof.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
    prof.sub_specialty?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-40 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Users className="w-6 h-6 text-turquoise" />
        <div>
          <h2 className="text-2xl font-bold">Selecione um Profissional</h2>
          <p className="text-muted-foreground">
            Escolha o profissional ideal para sua necessidade
          </p>
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

      {/* Specialty Tabs */}
      <Tabs value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7">
          <TabsTrigger value="all">Todos</TabsTrigger>
          {SPECIALTIES.map(specialty => (
            <TabsTrigger key={specialty.value} value={specialty.value}>
              {specialty.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

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
