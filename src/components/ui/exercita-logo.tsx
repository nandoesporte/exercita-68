import React from 'react';

interface ExercitaLogoProps {
  className?: string;
  width?: number;
  height?: number;
}

export const ExercitaLogo: React.FC<ExercitaLogoProps> = ({ 
  className = "", 
  width = 120, 
  height = 40 
}) => {
  return (
    <img 
      src="/lovable-uploads/f79e9b59-2131-4427-bbe2-ac5f884ef83a.png" 
      alt="Exercita" 
      className={className}
      width={width}
      height={height}
      style={{ objectFit: 'contain' }}
    />
  );
};

export default ExercitaLogo;