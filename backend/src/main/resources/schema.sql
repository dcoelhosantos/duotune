-- Amplia a coluna existente para armazenar a foto de perfil, preservando os dados.
-- Em bancos novos, a tabela será criada pelo Hibernate com o tipo text.
ALTER TABLE IF EXISTS users ALTER COLUMN profile_image_url TYPE text;;

-- O separador ;; permite executar o bloco PostgreSQL abaixo como uma instrução.
CREATE TABLE IF NOT EXISTS duotune_schema_migrations (
    version varchar(100) PRIMARY KEY,
    applied_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);;

-- Executado antes do Hibernate. Em bancos novos, ele criará invitations
-- com o enum atualizado; nos existentes, ampliamos o CHECK antes de converter.
DO $$
DECLARE
    status_constraint record;
BEGIN
    -- Serializa esta migração caso duas instâncias iniciem simultaneamente.
    PERFORM pg_advisory_xact_lock(20260927, 1);
    IF NOT EXISTS (
        SELECT 1 FROM duotune_schema_migrations
        WHERE version = '20260927_invitation_cancelled'
    ) THEN
        IF to_regclass('invitations') IS NOT NULL THEN
            -- Abrange também o CHECK gerado pelo Hibernate com outro nome.
            FOR status_constraint IN
                SELECT c.conname
                FROM pg_constraint c
                JOIN pg_attribute a ON a.attrelid = c.conrelid
                    AND a.attname = 'status'
                WHERE c.conrelid = 'invitations'::regclass
                    AND c.contype = 'c'
                    AND c.conkey = ARRAY[a.attnum]::smallint[]
            LOOP
                EXECUTE format('ALTER TABLE invitations DROP CONSTRAINT %I', status_constraint.conname);
            END LOOP;

            ALTER TABLE invitations ADD CONSTRAINT invitations_status_check
                CHECK (status IN ('PENDING', 'ACCEPTED', 'CANCELLED', 'REJECTED', 'EXPIRED'));

            -- Até esta versão, REJECTED representava cancelamento pelo remetente.
            UPDATE invitations SET status = 'CANCELLED' WHERE status = 'REJECTED';
        END IF;

        -- Inclusive em bancos novos, não converter futuras recusas reais.
        INSERT INTO duotune_schema_migrations(version)
            VALUES ('20260927_invitation_cancelled');
    END IF;
END;
$$;;
