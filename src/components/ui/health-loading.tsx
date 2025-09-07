import React from 'react';
import { Heart } from 'lucide-react';

interface HealthLoadingProps {
  message?: string;
}

export const HealthLoading = ({ message = "Carregando seus dados..." }: HealthLoadingProps) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
      {/* Heart with ECG Container */}
      <div className="relative">
        {/* Pulsing Heart */}
        <div className="relative z-10">
          <Heart 
            className="w-16 h-16 text-fitness-orange animate-heartbeat" 
            fill="currentColor"
          />
        </div>
        
        {/* ECG Line Animation */}
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 w-32 h-12 overflow-hidden">
          <svg 
            viewBox="0 0 200 60" 
            className="w-full h-full animate-ecg-scroll"
          >
            <defs>
              <linearGradient id="ecgGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(var(--fitness-green))" stopOpacity="0" />
                <stop offset="50%" stopColor="hsl(var(--fitness-green))" stopOpacity="1" />
                <stop offset="100%" stopColor="hsl(var(--fitness-green))" stopOpacity="0" />
              </linearGradient>
            </defs>
            
            {/* ECG Line Pattern */}
            <path
              d="M0,30 L20,30 L25,10 L30,50 L35,5 L40,30 L60,30 L65,10 L70,50 L75,5 L80,30 L100,30 L105,10 L110,50 L115,5 L120,30 L140,30 L145,10 L150,50 L155,5 L160,30 L180,30 L185,10 L190,50 L195,5 L200,30"
              stroke="url(#ecgGradient)"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        
        {/* Glowing effect */}
        <div className="absolute inset-0 w-16 h-16 rounded-full bg-fitness-orange/20 animate-glow-pulse" />
      </div>
      
      {/* Loading Message */}
      <div className="text-center space-y-2">
        <p className="text-lg font-medium text-white">{message}</p>
        <div className="flex items-center justify-center space-x-1">
          <div className="w-2 h-2 bg-fitness-orange rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-fitness-orange rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-fitness-orange rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
};