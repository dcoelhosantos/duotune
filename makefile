#SHELL := cmd.exe

# --- INFRAESTRUTURA (DOCKER) ---
infra:
	docker compose up -d

down:
	docker compose down

reset-infra: down infra

# --- BACKEND (SPRING BOOT) ---
setup:
	cd backend && mvn clean install -DskipTests

run:
	cd backend && mvn spring-boot:run

clean:
	cd backend && mvn clean

# --- COMANDOS GERAIS ---
# Define as regras como dependências (separadas por espaço na mesma linha)
start: infra setup run

# Após rodar o 'make start' e o Spring Boot subir, acesse a documentação
# e a área de testes da API (Swagger) pelo seu navegador no link:
# 👉 http://localhost:8080/swagger-ui/index.html