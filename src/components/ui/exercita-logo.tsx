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
      src="/lovable-uploads/9c2e6dc1-75bf-4bee-9342-526b0e358b54.png" 
      alt="Exercita" 
      className={className}
      width={width}
      height={height}
      style={{ objectFit: 'contain' }}
    />
  );
};

export default ExercitaLogo;