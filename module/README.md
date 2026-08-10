# Credit Concession Engine

A robust, highly scalable, and professionally engineered Credit Concession Engine (Motor de Concessão de Crédito). This project is designed to evaluate credit rules securely and efficiently, reserving funds and dispatching events asynchronously in a distributed environment.

## 🚀 Architecture & Key Features

This project was built focusing on high availability, consistency, and clean architecture. We applied various advanced architectural patterns and principles:

- **Event-Driven Architecture (EDA)**: Built with **BullMQ** to process background jobs and manage queues efficiently, ensuring that webhooks and other side effects are handled reliably.
- **Unit of Work (UoW)**: Ensures atomic operations across multiple repositories. All database changes either commit entirely or rollback, maintaining absolute data consistency.
- **Transactional Outbox Pattern**: Used to guarantee that events (like webhook triggers) are safely stored in the same database transaction as the domain changes, preventing data loss before they are processed by the message broker.
- **Pessimistic Locking**: Applied in the fund reservation processes to prevent concurrency issues and race conditions, ensuring that concurrent requests do not overdraw the available credit limit.
- **Cache-Aside Pattern**: Implemented for the Abstract Syntax Tree (AST) evaluation rules. It caches complex rule structures to dramatically reduce processing time and database overhead during credit evaluation.
- **Strategy Pattern**: Used extensively in webhook formatting and external integrations (e.g., XML, JSON payload formatting), making the engine highly extensible and compliant with the Open-Closed Principle (OCP).

## 🛠️ Tech Stack & Technologies

- **Node.js** & **TypeScript**: Core platform and language for robust typing and maintainability.
- **Prisma ORM**: Type-safe database access.
- **BullMQ**: Powerful Redis-based queue for Event-Driven Architecture.
- **Redis**: Fast in-memory data store for the Cache-Aside pattern and queue management.
- **PostgreSQL / Relational DB**: Primary data store for transactions, utilizing pessimistic locking for consistency.
- **Docker & Docker Compose**: Containerization for reproducible environments.
- **Vitest**: Blazing fast unit and integration tests.

## 📁 Project Structure

The repository is modularized into distinct bounded contexts:

- `Rule-engine/`: Core logic for evaluating credit rules using ASTs (Abstract Syntax Trees) with the Cache-Aside pattern.
- `credit-grantin/`: Handles fund reservations, applying Pessimistic Locking, Unit of Work, and the Transactional Outbox pattern.
- `credit-granting-webhook/`: Manages webhook dispatching via EDA (BullMQ), using the Strategy pattern to dynamically adapt message payloads.

## ⚙️ Getting Started

### Prerequisites

- Node.js (v18+)
- Docker and Docker Compose
- Redis (via Docker)
- Database (PostgreSQL via Docker)

### Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/marceloferreiracampos07/marceloferreiracampos07-credit-concession-engine.git
   cd marceloferreiracampos07-credit-concession-engine
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up the environment:**
   Create `.env` files based on `.env.example` in the respective modules.

4. **Run containers:**
   ```bash
   docker-compose up -d
   ```

5. **Run migrations:**
   ```bash
   npx prisma migrate dev
   ```

6. **Start the application:**
   ```bash
   npm run dev
   ```

## 🧪 Testing

The system features an extensive test suite, ensuring atomicity, concurrency safety, and rule accuracy.
```bash
npm run test
```

## 📜 License

This project is licensed under the MIT License.
