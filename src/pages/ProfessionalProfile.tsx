import { useParams, Link } from 'react-router-dom';
import { useHealthcareProfessional } from '@/hooks/useHealthcareProfessionals';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowLeft,
  Stethoscope, 
  Apple, 
  HeartPulse, 
  Brain, 
  Dumbbell, 
  Activity,
  Phone,
  MessageCircle,
  Mail,
  Calendar,
  CheckCircle2,
  Briefcase
} from 'lucide-react';

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
  return Icon;
};

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export default function ProfessionalProfile() {
  const { id } = useParams<{ id: string }>();
  const { data: professional, isLoading } = useHealthcareProfessional(id || '');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-12 w-full" />
          <Card className="p-6">
            <div className="flex items-start gap-6">
              <Skeleton className="w-32 h-32 rounded-full" />
              <div className="flex-1 space-y-4">
                <Skeleton className="h-8 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-20 w-full" />
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (!professional) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-8">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-2">Profissional não encontrado</h2>
            <p className="text-muted-foreground mb-4">
              O profissional que você está procurando não existe ou foi removido.
            </p>
            <Button asChild>
              <Link to="/appointments">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar para Profissionais
              </Link>
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const SpecialtyIcon = getSpecialtyIcon(professional.specialty);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-gradient-primary text-white p-4 sm:p-8">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            asChild
            className="text-white hover:bg-white/20 mb-4"
          >
            <Link to="/appointments">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Link>
          </Button>
          
          <div className="flex items-start gap-6">
            <Avatar className="w-24 h-24 sm:w-32 sm:h-32 ring-4 ring-white/20">
              <AvatarImage src={professional.photo_url || undefined} alt={professional.name} />
              <AvatarFallback className="text-2xl font-bold bg-white/20">
                {getInitials(professional.name)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">{professional.name}</h1>
              
              {professional.credentials && (
                <p className="text-white/90 text-sm sm:text-base mb-3">
                  {professional.credentials}
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="flex items-center gap-1 bg-white/20 text-white border-white/40">
                  <SpecialtyIcon className="w-4 h-4" />
                  {professional.specialty}
                </Badge>
                {professional.sub_specialty && (
                  <Badge variant="outline" className="bg-white/10 text-white border-white/40">
                    {professional.sub_specialty}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 sm:p-8 space-y-6">
        {/* Quick Actions */}
        <Card className="p-6">
          <div className="flex flex-wrap gap-3">
            <Button className="flex-1 sm:flex-none" size="lg" asChild>
              <Link to={`/appointments?professional=${professional.id}`}>
                <Calendar className="mr-2 h-5 w-5" />
                Agendar Consulta
              </Link>
            </Button>
            
            {professional.whatsapp && (
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => window.open(`https://wa.me/${professional.whatsapp.replace(/\D/g, '')}`, '_blank')}
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                WhatsApp
              </Button>
            )}
            
            {professional.phone && (
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => window.open(`tel:${professional.phone}`, '_blank')}
              >
                <Phone className="mr-2 h-5 w-5" />
                Ligar
              </Button>
            )}
            
            {professional.email && (
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => window.open(`mailto:${professional.email}`, '_blank')}
              >
                <Mail className="mr-2 h-5 w-5" />
                Email
              </Button>
            )}
          </div>
        </Card>

        {/* About */}
        {professional.description && (
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <SpecialtyIcon className="w-5 h-5 text-primary" />
              Sobre
            </h2>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
              {professional.description}
            </p>
          </Card>
        )}

        {/* Experience */}
        {professional.experience && (
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-primary" />
              Experiência Profissional
            </h2>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
              {professional.experience}
            </p>
          </Card>
        )}

        {/* Services */}
        {professional.services && professional.services.length > 0 && (
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              Serviços Oferecidos
            </h2>
            <ul className="space-y-3">
              {professional.services.map((service, index) => (
                <li key={index} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-turquoise mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">{service}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* CTA Footer */}
        <Card className="p-6 bg-gradient-to-r from-secondary to-card">
          <div className="text-center space-y-4">
            <h3 className="text-xl font-bold">Pronto para começar?</h3>
            <p className="text-muted-foreground">
              Agende sua consulta agora e dê o primeiro passo para alcançar seus objetivos.
            </p>
            <Button size="lg" asChild className="w-full sm:w-auto">
              <Link to={`/appointments?professional=${professional.id}`}>
                <Calendar className="mr-2 h-5 w-5" />
                Agendar Consulta com {professional.name.split(' ')[0]}
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
