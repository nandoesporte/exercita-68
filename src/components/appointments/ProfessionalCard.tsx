import { HealthcareProfessional } from '@/types/healthcare';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Stethoscope, 
  Apple, 
  HeartPulse, 
  Brain, 
  Dumbbell, 
  Activity,
  Phone,
  MessageCircle,
  Mail
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfessionalCardProps {
  professional: HealthcareProfessional;
  onSelect?: (professional: HealthcareProfessional) => void;
  selected?: boolean;
  showContact?: boolean;
}

const getSpecialtyIcon = (specialty: string) => {
  const icons: Record<string, any> = {
    'médico': Stethoscope,
    'nutricionista': Apple,
    'fisioterapeuta': HeartPulse,
    'psicólogo': Brain,
    'personal trainer': Dumbbell,
    'educador físico': Activity,
  };
  
  const Icon = icons[specialty.toLowerCase()] || Stethoscope;
  return <Icon className="w-5 h-5" />;
};

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export function ProfessionalCard({ 
  professional, 
  onSelect, 
  selected = false,
  showContact = false 
}: ProfessionalCardProps) {
  return (
    <Card 
      className={cn(
        "p-6 hover:shadow-lg transition-all duration-300 cursor-pointer",
        selected && "ring-2 ring-turquoise shadow-lg bg-turquoise/5"
      )}
      onClick={() => onSelect?.(professional)}
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <Avatar className="w-20 h-20 ring-2 ring-border">
          <AvatarImage src={professional.photo_url || undefined} alt={professional.name} />
          <AvatarFallback className="text-lg font-semibold bg-gradient-primary text-white">
            {getInitials(professional.name)}
          </AvatarFallback>
        </Avatar>

        {/* Info */}
        <div className="flex-1 space-y-2">
          <div>
            <h3 className="text-xl font-bold">{professional.name}</h3>
            {professional.credentials && (
              <p className="text-sm text-muted-foreground">{professional.credentials}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              {getSpecialtyIcon(professional.specialty)}
              {professional.specialty}
            </Badge>
            {professional.sub_specialty && (
              <Badge variant="outline">
                {professional.sub_specialty}
              </Badge>
            )}
          </div>

          {professional.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {professional.description}
            </p>
          )}

          {/* Contact Info */}
          {showContact && (
            <div className="flex flex-wrap gap-2 pt-2">
              {professional.phone && (
                <Button variant="outline" size="sm" className="gap-2">
                  <Phone className="w-4 h-4" />
                  Ligar
                </Button>
              )}
              {professional.whatsapp && (
                <Button variant="outline" size="sm" className="gap-2">
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp
                </Button>
              )}
              {professional.email && (
                <Button variant="outline" size="sm" className="gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {onSelect && (
        <div className="mt-4">
          <Button 
            className={cn(
              "w-full",
              selected && "bg-turquoise hover:bg-turquoise/90"
            )}
            variant={selected ? "default" : "outline"}
          >
            {selected ? 'Selecionado' : 'Agendar Consulta'}
          </Button>
        </div>
      )}
    </Card>
  );
}
