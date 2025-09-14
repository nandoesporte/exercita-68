-- Inserir algumas consultas de teste para verificar se o sistema funciona
INSERT INTO appointments (
  title,
  description,
  appointment_date,
  duration,
  trainer_name,
  status,
  admin_id,
  user_id
) VALUES 
(
  'Avaliação Física',
  'Avaliação inicial do aluno',
  '2025-09-15 10:00:00',
  60,
  'Dr. João Silva',
  'scheduled',
  (SELECT id FROM admins WHERE user_id = 'a898ae66-1bd6-4835-a826-d77b1e0c8fbb' LIMIT 1),
  'a898ae66-1bd6-4835-a826-d77b1e0c8fbb'
),
(
  'Consulta Nutricional',
  'Orientação nutricional personalizada',
  '2025-09-16 14:30:00',
  45,
  'Dra. Maria Santos',
  'scheduled',
  (SELECT id FROM admins WHERE user_id = 'a898ae66-1bd6-4835-a826-d77b1e0c8fbb' LIMIT 1),
  NULL
),
(
  'Acompanhamento Semanal',
  'Revisão do progresso do aluno',
  '2025-09-17 16:00:00',
  30,
  'Prof. Carlos Lima',
  'scheduled',
  (SELECT id FROM admins WHERE user_id = 'c8ff3f45-7d48-45e6-9b88-16d80bfaceec' LIMIT 1),
  'c8ff3f45-7d48-45e6-9b88-16d80bfaceec'
);