
import React from 'react';
import { Link } from 'react-router-dom';

interface ExerciseCardProps {
  id: string;
  title: string;
  image: string;
  targetMuscle: string;
}

export function ExerciseCard({ id, title, image, targetMuscle }: ExerciseCardProps) {
  return (
    <Link
      to={`/exercise/${id}`}
      className="fitness-card group block"
    >
      <div className="aspect-square relative overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-3">
          <h3 className="text-white font-medium text-sm">{title}</h3>
          <span className="text-white/80 text-xs">{targetMuscle}</span>
        </div>
      </div>
    </Link>
  );
}
