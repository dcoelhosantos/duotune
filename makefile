SHELL := cmd.exe

# --- INFRAESTRUTURA (DOCKER) ---

# Sobe o banco de dados
infra:
	docker compose up -d

# Derruba o banco de dados
down:
	docker compose down

# Reinicia a infraestrutura do zero
reset-infra: down infra


# --- BACKEND (SPRING BOOT) ---

# Baixa as dependências e compila o projeto
setup:
	cd backend && mvn clean install -DskipTests

# Roda a aplicação
run:
	cd backend && mvn spring-boot:run

# Limpa a pasta target
clean:
	cd backend && mvn clean


# --- COMANDOS GERAIS ---

# Prepara tudo e roda a aplicação
start:
	make infra
	make setup
	make run

# Após rodar o 'make start' e o Spring Boot subir, acesse a documentação
# e a área de testes da API (Swagger) pelo seu navegador no link:
# 👉 http://localhost:8080/swagger-ui/index.html