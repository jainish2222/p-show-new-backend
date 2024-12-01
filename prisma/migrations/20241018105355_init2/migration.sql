-- CreateTable
CREATE TABLE "FormData" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "surname" TEXT,
    "college" TEXT,
    "branch" TEXT,
    "graduationStart" TIMESTAMP(3),
    "graduationEnd" TIMESTAMP(3),
    "projectName" TEXT,
    "projectDescription" TEXT,
    "githubLink" TEXT,
    "liveLink" TEXT,
    "img" TEXT NOT NULL,
    "agreeTerms" BOOLEAN,

    CONSTRAINT "FormData_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FormData_email_key" ON "FormData"("email");
