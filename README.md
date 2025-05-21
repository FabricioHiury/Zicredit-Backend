# Zicredit Backend

Backend system for the Zicredit application. It provides credit simulation data, investor management, and business logic, developed using NestJS.

## 📁 Project Structure

```
Zicredit-Backend/
├── prisma/
│   └── migrations/
│   └── schema.prisma
├── src/
│   ├── Upload/
│   ├── auth/
│   ├── company/
│   ├── control-roles/
│   ├── database/
│   ├── investment/
│   ├── mail/
│   ├── pagination/
│   ├── project/
│   ├── user/
│   ├── app.controller.spec.ts
│   ├── app.controller.ts
│   ├── app.module.ts
│   ├── app.service.ts
│   └── main.ts
├── test/
├── .dockerignore
├── .eslintrc.js
├── .gitignore
├── .prettierrc
├── Dockerfile
├── docker-compose.yml
├── docker-compose.database.yml
├── nest-cli.json
├── package-lock.json
├── package.json
├── tsconfig.build.json
├── tsconfig.json
└── README.md
```

## 🚀 Technologies Used

- **Node.js**: JavaScript runtime environment.
- **NestJS**: A progressive Node.js framework for scalable backend applications.
- **TypeScript**: Strongly typed language built on JavaScript.
- **PostgreSQL**: Relational database system.
- **Prisma**: ORM for database interactions.
- **Docker**: For containerized deployments.

## 🔐 Features

- Credit simulation and investor management.
- User authentication with JWT.
- Company and project management.
- Modular and scalable architecture.
- File upload service.
- Email service integration.

## 🛠️ Getting Started

### Prerequisites

- Node.js
- Docker & Docker Compose

### Installation

1. **Clone the repository:**

```bash
git clone https://github.com/FabricioHiury/Zicredit-Backend.git
cd Zicredit-Backend
```

2. **Install dependencies:**

```bash
npm install
```

3. **Set up environment variables:**

```env
DATABASE_URL=postgresql://user:password@localhost:5432/zicredit
JWT_SECRET=your_jwt_secret
```

4. **Run database migrations:**

```bash
npx prisma migrate dev --name init
```

5. **Start the development server:**

```bash
npm run start:dev
```

The server will be available at `http://localhost:3000`.

## 🐳 Docker Setup

```bash
docker-compose up --build
```

Then apply migrations:

```bash
docker exec -it zicredit-backend-app npx prisma migrate dev --name init
```
