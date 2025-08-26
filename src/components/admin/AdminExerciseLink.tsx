
import React from 'react';
import { NavLink } from 'react-router-dom';
import { Dumbbell } from 'lucide-react';
import { cn } from '@/lib/utils';

const AdminExerciseLink = () => {
  return (
    <NavLink
      to="/admin/exercises"
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
          isActive
            ? "bg-fitness-dark text-white font-medium"
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        )
      }
    >
      <Dumbbell className="h-5 w-5" />
      <span>Exercises</span>
    </NavLink>
  );
};

export default AdminExerciseLink;
