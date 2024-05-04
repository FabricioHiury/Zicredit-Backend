-- CreateEnum
CREATE TYPE "Roles" AS ENUM ('ZICREDIT', 'SELLER', 'COMPANY', 'INVESTOR');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "cpf" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255),
    "phone" VARCHAR(255) NOT NULL,
    "role" "Roles" NOT NULL DEFAULT 'INVESTOR',
    "password" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
