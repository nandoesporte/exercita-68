-- Create function to clone a workout for a specific user
CREATE OR REPLACE FUNCTION public.clone_workout_for_user(
  source_workout_id uuid,
  target_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  new_workout_id uuid;
  cloning_user_id uuid;
  source_workout_record workouts%ROWTYPE;
  exercise_record workout_exercises%ROWTYPE;
  day_record workout_days%ROWTYPE;
  clone_history_id uuid;
BEGIN
  -- Check if user is admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only administrators can clone workouts for users';
  END IF;
  
  -- Get current user ID (admin who is cloning)
  cloning_user_id := auth.uid();
  
  -- Get the source workout
  SELECT * INTO source_workout_record
  FROM workouts 
  WHERE id = source_workout_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Source workout not found';
  END IF;
  
  -- Check if target user exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = target_user_id) THEN
    RAISE EXCEPTION 'Target user not found';
  END IF;
  
  -- Generate new workout ID
  new_workout_id := gen_random_uuid();
  
  -- Insert clone history record first
  INSERT INTO workout_clone_history (
    source_workout_id,
    target_user_id,
    cloned_by_user_id,
    status
  ) VALUES (
    source_workout_id,
    target_user_id,
    cloning_user_id,
    'in_progress'
  ) RETURNING id INTO clone_history_id;
  
  BEGIN
    -- Clone the main workout (keeping it as a public workout)
    INSERT INTO workouts (
      id,
      title,
      description,
      duration,
      level,
      calories,
      category_id,
      image_url,
      is_featured,
      is_recommended
    ) VALUES (
      new_workout_id,
      source_workout_record.title || ' (Clonado)',
      source_workout_record.description,
      source_workout_record.duration,
      source_workout_record.level,
      source_workout_record.calories,
      source_workout_record.category_id,
      source_workout_record.image_url,
      false, -- Don't make cloned workouts featured
      true   -- Make them recommended
    );
    
    -- Clone workout exercises
    FOR exercise_record IN 
      SELECT * FROM workout_exercises 
      WHERE workout_id = source_workout_id
      ORDER BY day_of_week, order_position
    LOOP
      INSERT INTO workout_exercises (
        workout_id,
        exercise_id,
        day_of_week,
        order_position,
        sets,
        reps,
        weight,
        duration,
        rest,
        is_title_section,
        section_title
      ) VALUES (
        new_workout_id,
        exercise_record.exercise_id,
        exercise_record.day_of_week,
        exercise_record.order_position,
        exercise_record.sets,
        exercise_record.reps,
        exercise_record.weight,
        exercise_record.duration,
        exercise_record.rest,
        exercise_record.is_title_section,
        exercise_record.section_title
      );
    END LOOP;
    
    -- Clone workout days
    FOR day_record IN 
      SELECT * FROM workout_days 
      WHERE workout_id = source_workout_id
    LOOP
      INSERT INTO workout_days (
        workout_id,
        day_of_week
      ) VALUES (
        new_workout_id,
        day_record.day_of_week
      );
    END LOOP;
    
    -- Add workout recommendation for the target user
    INSERT INTO workout_recommendations (
      user_id,
      workout_id
    ) VALUES (
      target_user_id,
      new_workout_id
    );
    
    -- Update clone history as successful
    UPDATE workout_clone_history 
    SET 
      status = 'completed',
      cloned_workout_id = new_workout_id
    WHERE id = clone_history_id;
    
    -- Return success response
    RETURN jsonb_build_object(
      'success', true,
      'new_workout_id', new_workout_id,
      'message', 'Workout cloned successfully'
    );
    
  EXCEPTION
    WHEN OTHERS THEN
      -- Update clone history with error
      UPDATE workout_clone_history 
      SET 
        status = 'failed',
        error_message = SQLERRM
      WHERE id = clone_history_id;
      
      -- Re-raise the exception
      RAISE EXCEPTION 'Failed to clone workout: %', SQLERRM;
  END;
END;
$function$;