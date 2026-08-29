# ERP Tem De Tudo

Sistema ERP para varejo e serviços (cadastros, estoque, compras, PDV, financeiro, OS/produção, e-commerce e painel de funcionários). Monorepo com backend Java/Spring Boot e frontend React/Vite.

Documentação HTML: [resumo-projeto.html](resumo-projeto.html)  
Wiki: [Inicio](https://github.com/FelipeCamposPaiva/sistemaLoja/wiki/Inicio) · [Backend](https://github.com/FelipeCamposPaiva/sistemaLoja/wiki/Backend) · [Frontend](https://github.com/FelipeCamposPaiva/sistemaLoja/wiki/Frontend)

## Stack

| Camada | Tecnologia |
| --- | --- |
| Backend | Java 21, Spring Boot 4.1, Security + JWT, JPA, MySQL |
| Frontend | React 19, Vite 8, React Router 7, Axios, Bootstrap 5 |
| Banco | MySQL `temdetudo_db` (`ddl-auto=none`) |

## Como rodar (local)

Pré-requisitos: Java 21, Maven (wrapper em `backend/`), Node.js e MySQL com o database `temdetudo_db`.

Ajuste usuário/senha e JWT em `backend/src/main/resources/application.properties` (valores locais; não reutilize em produção).

```bash
# Backend — API em http://localhost:8080
cd backend
./mvnw spring-boot:run
```

```bash
# Frontend — UI em http://localhost:5173 (proxy /api → 8080)
cd frontend
npm install
npm run dev
```

O `vite.config` sobe o Spring Boot automaticamente se a porta 8080 estiver livre.

## Estrutura

```
backend/     Spring Boot (Maven) — com.temdetudo.erp
frontend/    Vite + React — páginas, providers, services
resumo-projeto.html / .css
```

Rotas de auth em `/api/auth/**` são públicas; demais endpoints exigem JWT.
