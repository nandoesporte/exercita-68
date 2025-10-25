import { useState } from 'react';
import { useHealthcareProfessionals } from '@/hooks/useHealthcareProfessionals';
import { ProfessionalCard } from '@/components/appointments/ProfessionalCard';
import { HealthcareProfessional } from '@/types/healthcare';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function AppointmentsNew() {
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: professionals, isLoading } = useHealthcareProfessionals();

  const specialties = [
    { value: 'all', label: 'Todos' },
    { value: 'médico', label: 'Médico' },
    { value: 'nutricionista', label: 'Nutricionista' },
    { value: 'fisioterapeuta', label: 'Fisioterapeuta' },
    { value: 'psicólogo', label: 'Psicólogo' },
    { value: 'personal trainer', label: 'Personal Trainer' },
    { value: 'educador físico', label: 'Educador Físico' },
  ];

  const filteredProfessionals = professionals?.filter((prof) => {
    const matchesSpecialty = selectedSpecialty === 'all' || prof.specialty.toLowerCase() === selectedSpecialty.toLowerCase();
    const matchesSearch = searchQuery === '' || 
      prof.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prof.specialty.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSpecialty && matchesSearch && prof.is_active;
  });

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 pb-24 md:pb-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Profissionais de Saúde</h1>
        <p className="text-muted-foreground">
          Escolha um profissional para visualizar o perfil ou agendar uma consulta
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          type="text"
          placeholder="Buscar profissional..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Specialty Filters */}
      <div className="flex overflow-x-auto gap-2 pb-2">
        {specialties.map((specialty) => (
          <Badge
            key={specialty.value}
            variant={selectedSpecialty === specialty.value ? 'default' : 'outline'}
            className={`cursor-pointer whitespace-nowrap ${
              selectedSpecialty === specialty.value 
                ? 'bg-turquoise hover:bg-turquoise/90' 
                : 'hover:bg-muted'
            }`}
            onClick={() => setSelectedSpecialty(specialty.value)}
          >
            {specialty.label}
          </Badge>
        ))}
      </div>

      {/* Professionals List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-turquoise"></div>
        </div>
      ) : filteredProfessionals && filteredProfessionals.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2">
          {filteredProfessionals.map((professional) => (
            <ProfessionalCard
              key={professional.id}
              professional={professional}
              showContact={true}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {searchQuery || selectedSpecialty !== 'all' 
              ? 'Nenhum profissional encontrado com os filtros aplicados.'
              : 'Nenhum profissional disponível no momento.'
            }
          </p>
        </div>
      )}
    </div>
  );
}
