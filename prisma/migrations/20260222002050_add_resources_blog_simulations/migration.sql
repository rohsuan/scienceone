-- CreateEnum
CREATE TYPE "ResourceType" AS ENUM ('LESSON_PLAN', 'PROBLEM_SET', 'COURSE_MODULE', 'LAB_GUIDE', 'SIMULATION');

-- CreateEnum
CREATE TYPE "ResourceLevel" AS ENUM ('AP', 'INTRO_UNIVERSITY', 'ADVANCED_UNIVERSITY');

-- CreateEnum
CREATE TYPE "BlogCategory" AS ENUM ('TEACHING', 'COMPUTATION', 'RESOURCES', 'AI_IN_EDUCATION');

-- CreateTable
CREATE TABLE "subjects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resources" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "content" TEXT,
    "type" "ResourceType" NOT NULL,
    "level" "ResourceLevel" NOT NULL,
    "isFree" BOOLEAN NOT NULL DEFAULT true,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "coverImage" TEXT,
    "fileKey" TEXT,
    "fileName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resource_prices" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resource_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resource_purchases" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "stripePaymentId" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'completed',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resource_purchases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resource_subjects" (
    "resourceId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,

    CONSTRAINT "resource_subjects_pkey" PRIMARY KEY ("resourceId","subjectId")
);

-- CreateTable
CREATE TABLE "simulations" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "componentKey" TEXT NOT NULL,
    "teacherGuide" TEXT,
    "parameterDocs" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "simulations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_posts" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT,
    "content" TEXT,
    "category" "BlogCategory" NOT NULL,
    "authorName" TEXT NOT NULL,
    "authorBio" TEXT,
    "authorImage" TEXT,
    "coverImage" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blog_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_post_subjects" (
    "blogPostId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,

    CONSTRAINT "blog_post_subjects_pkey" PRIMARY KEY ("blogPostId","subjectId")
);

-- CreateIndex
CREATE UNIQUE INDEX "subjects_name_key" ON "subjects"("name");

-- CreateIndex
CREATE UNIQUE INDEX "subjects_slug_key" ON "subjects"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "resources_slug_key" ON "resources"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "resource_prices_resourceId_key" ON "resource_prices"("resourceId");

-- CreateIndex
CREATE UNIQUE INDEX "resource_purchases_stripePaymentId_key" ON "resource_purchases"("stripePaymentId");

-- CreateIndex
CREATE UNIQUE INDEX "resource_purchases_userId_resourceId_key" ON "resource_purchases"("userId", "resourceId");

-- CreateIndex
CREATE UNIQUE INDEX "simulations_resourceId_key" ON "simulations"("resourceId");

-- CreateIndex
CREATE UNIQUE INDEX "blog_posts_slug_key" ON "blog_posts"("slug");

-- AddForeignKey
ALTER TABLE "resource_prices" ADD CONSTRAINT "resource_prices_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_purchases" ADD CONSTRAINT "resource_purchases_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_purchases" ADD CONSTRAINT "resource_purchases_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "resources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_subjects" ADD CONSTRAINT "resource_subjects_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_subjects" ADD CONSTRAINT "resource_subjects_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulations" ADD CONSTRAINT "simulations_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_post_subjects" ADD CONSTRAINT "blog_post_subjects_blogPostId_fkey" FOREIGN KEY ("blogPostId") REFERENCES "blog_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_post_subjects" ADD CONSTRAINT "blog_post_subjects_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
