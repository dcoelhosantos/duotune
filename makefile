# ==============================================================================
# [BACKEND] Rode 'make start-back'. Acesse o Swagger para testar a API:
# 👉 http://localhost:8080/swagger-ui/index.html
#
# [FRONTEND] Rode 'make start-front'. Acesse a interface do React (Vite):
# 👉 http://localhost:5173
# ==============================================================================

# --- DETECÇÃO DE SISTEMA OPERACIONAL ---
ifeq ($(OS),Windows_NT)
	MVNW = ./mvnw.cmd
else
	MVNW = ./mvnw
endif

# --- INFRAESTRUTURA (DOCKER) ---
infra:
	docker compose up -d

down:
	docker compose down

reset-infra: down infra


# --- BACKEND (SPRING BOOT) ---
setup-back:
	cd backend && $(MVNW) clean install -DskipTests

run-back:
	cd backend && $(MVNW) spring-boot:run

clean-back:
	cd backend && $(MVNW) clean


# --- FRONTEND (REACT + VITE) ---
setup-front:
	cd frontend && npm install

run-front:
	cd frontend && npm run dev


# --- COMANDOS GERAIS ---
start-back: infra setup-back run-back
start-front: setup-front run-front