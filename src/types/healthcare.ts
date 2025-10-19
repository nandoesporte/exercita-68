export interface HealthcareProfessional {
  id: string;
  name: string;
  specialty: string;
  sub_specialty: string | null;
  description: string | null;
  photo_url: string | null;
  credentials: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  is_active: boolean;
  admin_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface AppointmentWithProfessional {
  id: string;
  user_id: string | null;
  professional_id: string | null;
  appointment_date: string;
  duration: number;
  title: string;
  description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  healthcare_professionals?: HealthcareProfessional;
  trainer_name?: string; // Legacy field
}

export type SpecialtyType = 
  | 'médico' 
  | 'nutricionista' 
  | 'fisioterapeuta' 
  | 'psicólogo' 
  | 'personal trainer'
  | 'educador físico';

export const SPECIALTIES: { value: SpecialtyType; label: string; icon: string }[] = [
  { value: 'médico', label: 'Médico', icon: 'Stethoscope' },
  { value: 'nutricionista', label: 'Nutricionista', icon: 'Apple' },
  { value: 'fisioterapeuta', label: 'Fisioterapeuta', icon: 'HeartPulse' },
  { value: 'psicólogo', label: 'Psicólogo', icon: 'Brain' },
  { value: 'personal trainer', label: 'Personal Trainer', icon: 'Dumbbell' },
  { value: 'educador físico', label: 'Educador Físico', icon: 'Activity' },
];
