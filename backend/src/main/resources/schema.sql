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

DO $$
BEGIN
    -- Serializa esta migração
    PERFORM pg_advisory_xact_lock(20260928, 1);
    
    IF NOT EXISTS (
        SELECT 1 FROM duotune_schema_migrations
        WHERE version = '20260928_add_metadata_to_playlist_tracks'
    ) THEN
        -- Se a tabela já existir (bancos em produção/legados), adiciona as colunas
        IF to_regclass('playlist_tracks') IS NOT NULL THEN
            ALTER TABLE playlist_tracks 
            ADD COLUMN title VARCHAR(255),
            ADD COLUMN artist VARCHAR(255),
            ADD COLUMN image_url VARCHAR(512);
        END IF;

        -- Registra a migração (inclusive em bancos novos)
        INSERT INTO duotune_schema_migrations(version)
            VALUES ('20260928_add_metadata_to_playlist_tracks');
    END IF;
END;
$$;;

DO $$
BEGIN
    IF to_regclass('playlists') IS NOT NULL THEN
        ALTER TABLE playlists ADD COLUMN IF NOT EXISTS description VARCHAR(500);
    END IF;
END;
$$;

DO $$
BEGIN
    -- Serializa esta migração (usando a data de hoje como lock)
    PERFORM pg_advisory_xact_lock(20261013, 1);
    
    IF NOT EXISTS (
        SELECT 1 FROM duotune_schema_migrations
        WHERE version = '20261013_remove_duos_unique_constraints'
    ) THEN
        IF to_regclass('duos') IS NOT NULL THEN
            -- Remove as restrições (UNIQUE) criadas pelo OneToOne do Hibernate
            ALTER TABLE duos DROP CONSTRAINT IF EXISTS uk9rwhs4c9q1co89nrb0ulmy9k0;
            ALTER TABLE duos DROP CONSTRAINT IF EXISTS ukcedkff8491u4fyrj41vbf087s;
        END IF;

        -- Registra a migração
        INSERT INTO duotune_schema_migrations(version)
            VALUES ('20261013_remove_duos_unique_constraints');
    END IF;
END;
$$;;
-- Preserva playlists existentes; a duração é preenchida a partir de dados do Spotify.
ALTER TABLE IF EXISTS playlist_tracks ADD COLUMN IF NOT EXISTS duration_ms bigint;;

DO $$
BEGIN
    PERFORM pg_advisory_xact_lock(20261016, 1);
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        IF NOT EXISTS (
            SELECT 1 FROM duotune_schema_migrations
            WHERE version = '20261016_create_duo_dedications'
        ) THEN
            CREATE TABLE IF NOT EXISTS duo_dedications (
                id BIGSERIAL PRIMARY KEY,
                sender_id BIGINT NOT NULL REFERENCES users(id),
                receiver_id BIGINT NOT NULL REFERENCES users(id),
                track_spotify_id VARCHAR(255) NOT NULL,
                title VARCHAR(255) NOT NULL,
                artist VARCHAR(255) NOT NULL,
                image_url TEXT,
                scheduled_date DATE NOT NULL,
                delivered BOOLEAN NOT NULL DEFAULT false,
                CONSTRAINT uk_receiver_date UNIQUE (receiver_id, scheduled_date) 
            );

            INSERT INTO duotune_schema_migrations(version)
                VALUES ('20261016_create_duo_dedications');
        END IF;
    END IF;
END;
$$;;
