-- CreateTable
CREATE TABLE "Menage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Menage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JeuParametres" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "anneeBase" INTEGER NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JeuParametres_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Menage_userId_idx" ON "Menage"("userId");

-- CreateIndex
CREATE INDEX "JeuParametres_userId_idx" ON "JeuParametres"("userId");

-- AddForeignKey
ALTER TABLE "Menage" ADD CONSTRAINT "Menage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JeuParametres" ADD CONSTRAINT "JeuParametres_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
