-- Inserir profissionais de saúde
INSERT INTO healthcare_professionals (name, specialty, sub_specialty, credentials, services, is_active) VALUES
('Dra. Juliana Henriques dos Santos', 'médico', 'Cirurgia Vascular', 'CRM-PR: 21245 | RQE: 16213 e 16214', to_jsonb(ARRAY['Cirurgia Vascular']), true),
('Dra. Ana Paula Torres Liberati', 'médico', 'Endocrinologia e Metabologia', 'CRM-PR: 23848 | RQE: 1724 e 1725', to_jsonb(ARRAY['Endocrinologia', 'Metabologia']), true),
('Dra. Layla Patricia Azoia Lukiantchuki', 'médico', 'Ginecologia e Obstetrícia', 'CRM-PR: 20518 | RQE: 14334', to_jsonb(ARRAY['Ginecologia', 'Obstetrícia']), true),
('Andreia Dalacort Rodrigues', 'fisioterapeuta', 'Fisioterapeuta especializada', 'CREFITO: 146335', to_jsonb(ARRAY['Drenagem Linfática', 'Fisioterapia', 'Reabilitação']), true),
('Kélei de Cassia Santin', 'médico', 'Farmacêutica', 'CRF-PR: 014258', to_jsonb(ARRAY['Farmácia Clínica', 'Orientação Farmacêutica', 'Medicamentos']), true),
('Dr. Breno Corrêa de França', 'psicólogo', 'Psiquiatra', 'CRM-PR: 30781 | RQE: 20898', to_jsonb(ARRAY['Psiquiatria', 'Saúde Mental', 'Bem-estar Psicológico']), true),
('Dr. Aluísio Marino Roma', 'médico', 'Cirurgia Plástica', 'CRM-PR: 27964 | RQE: 22108', to_jsonb(ARRAY['Cirurgia Plástica', 'Cirurgia Reconstrutiva', 'Estética']), true),
('Dr. Carlos Felipe Pasquini de Paule', 'médico', 'Cirurgia Plástica', 'CRM: 27946 | RQE: 20519', to_jsonb(ARRAY['Cirurgia Plástica', 'Cirurgia Reconstrutiva', 'Estética']), true),
('Rodrigo Murta Galacini', 'nutricionista', 'Nutricionista', 'CRN 8: 3063', to_jsonb(ARRAY['Nutrição Clínica', 'Orientação Nutricional', 'Alimentação Saudável']), true),
('Fernando Malentaqui Martins', 'personal trainer', 'Personal Trainer', 'CREF-PR: 024351', to_jsonb(ARRAY['Treinamento Personalizado', 'Condicionamento Físico', 'Exercícios Terapêuticos']), true);