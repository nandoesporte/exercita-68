-- Habilitar realtime para as tabelas principais
ALTER PUBLICATION supabase_realtime ADD TABLE appointments;
ALTER PUBLICATION supabase_realtime ADD TABLE workouts;
ALTER PUBLICATION supabase_realtime ADD TABLE exercises;
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE user_workout_history;
ALTER PUBLICATION supabase_realtime ADD TABLE products;
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE workout_recommendations;

-- Configurar REPLICA IDENTITY FULL para capturar dados completos nas mudanças
ALTER TABLE appointments REPLICA IDENTITY FULL;
ALTER TABLE workouts REPLICA IDENTITY FULL;
ALTER TABLE exercises REPLICA IDENTITY FULL;
ALTER TABLE profiles REPLICA IDENTITY FULL;
ALTER TABLE user_workout_history REPLICA IDENTITY FULL;
ALTER TABLE products REPLICA IDENTITY FULL;
ALTER TABLE orders REPLICA IDENTITY FULL;
ALTER TABLE workout_recommendations REPLICA IDENTITY FULL;