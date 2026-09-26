-- Amplia a coluna existente para armazenar a foto de perfil, preservando os dados.
-- Em bancos novos, a tabela será criada pelo Hibernate com o tipo text.
ALTER TABLE IF EXISTS users ALTER COLUMN profile_image_url TYPE text;
