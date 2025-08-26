
import React from 'react';

interface MotionProps {
  initial?: any;
  animate?: any;
  exit?: any;
  className?: string;
  children: React.ReactNode;
}

// Simple motion component that mimics Framer Motion's API but uses CSS transitions
export const motion = {
  div: ({ initial, animate, exit, className = "", children }: MotionProps) => {
    const [isAnimated, setIsAnimated] = React.useState(false);
    const [isExiting, setIsExiting] = React.useState(false);
    const [shouldRender, setShouldRender] = React.useState(true);

    React.useEffect(() => {
      // Start animation after mount
      const timer = setTimeout(() => setIsAnimated(true), 50);
      return () => clearTimeout(timer);
    }, []);

    // Handle component unmounting with exit animation
    React.useEffect(() => {
      return () => {
        // When component unmounts, we properly clean up
        setIsExiting(true);
      };
    }, []);

    // Convert motion props to CSS styles
    const getStyles = () => {
      const styles: React.CSSProperties = {
        transition: 'all 0.3s ease-in-out',
      };

      if (isExiting && exit) {
        // Exit state
        if (exit?.opacity !== undefined) styles.opacity = exit.opacity;
        if (exit?.y !== undefined) styles.transform = `translateY(${exit.y}px)`;
      } else if (!isAnimated) {
        // Initial state
        if (initial?.opacity !== undefined) styles.opacity = initial.opacity;
        if (initial?.y !== undefined) styles.transform = `translateY(${initial.y}px)`;
      } else {
        // Animated state
        if (animate?.opacity !== undefined) styles.opacity = animate.opacity;
        if (animate?.y !== undefined) styles.transform = `translateY(${animate.y}px)`;
      }

      return styles;
    };

    if (!shouldRender) return null;

    return (
      <div className={className} style={getStyles()}>
        {children}
      </div>
    );
  }
};
