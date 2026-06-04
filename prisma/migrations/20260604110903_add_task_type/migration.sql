-- CreateEnum
CREATE TYPE "TaskType" AS ENUM ('CALL', 'MEETING', 'EMAIL', 'FOLLOW_UP');

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "type" "TaskType";
