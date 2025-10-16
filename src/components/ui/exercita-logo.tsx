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
      src="/ilivi-logo.png" 
      alt="ILIVI" 
      className={className}
      width={width}
      height={height}
      style={{ objectFit: 'contain' }}
    />
  );
};

export default ExercitaLogo;