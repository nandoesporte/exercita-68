
import React from 'react';
import { Link } from 'react-router-dom';

interface CategoryCardProps {
  id: string;
  name: string;
  icon: React.ReactNode;
  count: number;
  color?: string;
}

export function CategoryCard({ id, name, icon, count, color = '#F97316' }: CategoryCardProps) {
  return (
    <Link
      to={`/category/${id}`}
      className="fitness-card flex items-center gap-4 p-4 group hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
      style={{ borderLeft: `4px solid ${color}` }}
    >
      <div className="w-12 h-12 rounded-full flex items-center justify-center" 
           style={{ 
             background: `linear-gradient(135deg, ${color}, ${color}90)`,
             boxShadow: `0 4px 12px ${color}30`
           }}>
        {icon}
      </div>
      <div>
        <h3 className="font-semibold text-foreground group-hover:text-fitness-orange transition-colors">{name}</h3>
        <p className="text-sm text-muted-foreground">{count} exercícios</p>
      </div>
    </Link>
  );
}
