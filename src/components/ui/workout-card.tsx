
import React from 'react';
import { Link } from 'react-router-dom';
import { Dumbbell, Clock, Calendar } from 'lucide-react';

interface WorkoutCardProps {
  id: string;
  title: string;
  image: string;
  duration: string;
  level: string;
  calories?: number;
  daysOfWeek?: string[];
}

const dayTranslations: Record<string, string> = {
  'monday': 'Seg',
  'tuesday': 'Ter',
  'wednesday': 'Qua',
  'thursday': 'Qui',
  'friday': 'Sex',
  'saturday': 'Sáb',
  'sunday': 'Dom',
};

export function WorkoutCard({ id, title, image, duration, level, calories, daysOfWeek }: WorkoutCardProps) {
  return (
    <Link
      to={`/workout/${id}`}
      className="fitness-card group block"
    >
      <div className="aspect-video relative overflow-hidden">
        <img
          src={image || '/placeholder.svg'}
          alt={title}
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
          onError={(e) => {
            // Set default image if the image fails to load
            (e.target as HTMLImageElement).src = '/placeholder.svg';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-4">
          <h3 className="text-white font-bold text-lg">{title}</h3>
          <div className="flex flex-wrap items-center gap-3 mt-2">
            <div className="flex items-center text-white text-sm gap-1">
              <Clock size={14} />
              <span>{duration}</span>
            </div>
            <div className="flex items-center text-white text-sm gap-1">
              <Dumbbell size={14} />
              <span>{level}</span>
            </div>
            {calories && calories > 0 && (
              <div className="bg-fitness-green text-white text-xs px-2 py-0.5 rounded-full">
                {calories} kcal
              </div>
            )}
          </div>
          
          {daysOfWeek && daysOfWeek.length > 0 && (
            <div className="flex items-center gap-1 mt-2">
              <Calendar size={12} className="text-white" />
              <div className="flex flex-wrap gap-1">
                {daysOfWeek.map(day => (
                  <span 
                    key={day} 
                    className="text-white text-xs bg-slate-700/50 px-1.5 py-0.5 rounded"
                  >
                    {dayTranslations[day] || day}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
