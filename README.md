# IndieLeads Enterprise 🚀

[![Powered by NestJS](https://img.shields.io/badge/backend-NestJS-E0234E?style=for-the-badge&logo=nestjs)](https://nestjs.com/)
[![Powered by React](https://img.shields.io/badge/frontend-React-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![Database: Prisma](https://img.shields.io/badge/ORM-Prisma-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![Queue: BullMQ](https://img.shields.io/badge/Queue-BullMQ-FF4500?style=for-the-badge&logo=redis)](https://bullmq.io/)

**IndieLeads Enterprise** is a world-class, high-scale cold email automation and deliverability platform. Designed for high-volume outreach with enterprise-grade multi-tenancy, deliverability monitoring, and automated warmup.

---

## 🏗️ Architecture Overview

The platform is built as a **Turborepo Monorepo**, ensuring high modularity and shared type safety across the entire stack.

- **`apps/api`**: Core NestJS REST API. High-performance, multi-tenant aware (workspace isolation via Prisma Extensions).
- **`apps/web`**: Premium React/Vite dashboard. Features an "Ethereal" design system with fluid animations and advanced data visualizations.
- **`apps/workers`**: Distributed background processing engine handling email sending, warmup simulations, and reply fetching.
- **`packages/shared`**: Shared TypeScript types, constants, and utilities used by both frontend and backend.

## 🛠️ Tech Stack

### Backend
- **Framework**: [NestJS](https://nestjs.com/) (Express-based)
- **Database**: [PostgreSQL](https://www.postgresql.org/) with [Prisma ORM](https://www.prisma.io/)
- **Caching & Queues**: [Redis](https://redis.io/) + [BullMQ](https://bullmq.io/)
- **Auth**: JWT with specialized multi-workspace context injection.

### Frontend
- **Framework**: [React](https://reactjs.org/) (Vite)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Charts**: [Recharts](https://recharts.org/)

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- Docker & Docker Compose (for PostgreSQL and Redis)

### Installation
1.  **Clone the repository**
    ```bash
    git clone https://github.com/your-org/indieleads.git
    cd indieleads
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Setup Environment**
    ```bash
    cp apps/api/.env.example apps/api/.env
    # Configure your DATABASE_URL and REDIS_URL
    ```

4.  **Database Migration**
    ```bash
    npm run prisma:push
    ```

5.  **Run in Development Mode**
    ```bash
    # Run all apps concurrently
    npm run dev
    ```

## 🔒 Security & Multi-Tenancy

IndieLeads implements **Automatic Workspace Isolation**. Every database query is automatically intercepted at the Prisma level to inject `workspaceId` filters, preventing any cross-tenant data leakage—a "Meta-level" engineering pattern for SaaS products.

## 📈 Scalability

- **Horizontal Scaling**: Workers can be scaled independently to handle millions of emails per day.
- **Rate Limiting**: Intelligent throttling at the inbox level to protect sender reputation.
- **AI-Driven Warmup**: Simulates human behavior to maximize inbox health scores across ISP networks.

---

Developed with ❤️ by the IndieLeads Engineering Team.
