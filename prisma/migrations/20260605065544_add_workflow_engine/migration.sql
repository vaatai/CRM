-- CreateEnum
CREATE TYPE "WorkflowTrigger" AS ENUM ('LEAD_ASSIGNED', 'LEAD_STATUS_CHANGED', 'DEAL_WON', 'TASK_OVERDUE');

-- CreateEnum
CREATE TYPE "WorkflowActionType" AS ENUM ('SEND_EMAIL', 'CREATE_TASK', 'SEND_NOTIFICATION', 'WEBHOOK');

-- CreateEnum
CREATE TYPE "WorkflowExecutionStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "WorkflowStepStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'SKIPPED');

-- CreateTable
CREATE TABLE "Workflow" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "trigger" "WorkflowTrigger" NOT NULL,
    "triggerConfig" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workflow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowStep" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "actionType" "WorkflowActionType" NOT NULL,
    "config" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowExecution" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "status" "WorkflowExecutionStatus" NOT NULL DEFAULT 'PENDING',
    "triggerData" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "error" TEXT,

    CONSTRAINT "WorkflowExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowStepLog" (
    "id" TEXT NOT NULL,
    "executionId" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "status" "WorkflowStepStatus" NOT NULL DEFAULT 'PENDING',
    "output" TEXT,
    "error" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "WorkflowStepLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'info',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "link" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Workflow_organizationId_idx" ON "Workflow"("organizationId");

-- CreateIndex
CREATE INDEX "Workflow_trigger_idx" ON "Workflow"("trigger");

-- CreateIndex
CREATE INDEX "Workflow_isActive_idx" ON "Workflow"("isActive");

-- CreateIndex
CREATE INDEX "WorkflowStep_workflowId_idx" ON "WorkflowStep"("workflowId");

-- CreateIndex
CREATE INDEX "WorkflowStep_sortOrder_idx" ON "WorkflowStep"("sortOrder");

-- CreateIndex
CREATE INDEX "WorkflowExecution_workflowId_idx" ON "WorkflowExecution"("workflowId");

-- CreateIndex
CREATE INDEX "WorkflowExecution_status_idx" ON "WorkflowExecution"("status");

-- CreateIndex
CREATE INDEX "WorkflowExecution_startedAt_idx" ON "WorkflowExecution"("startedAt");

-- CreateIndex
CREATE INDEX "WorkflowStepLog_executionId_idx" ON "WorkflowStepLog"("executionId");

-- CreateIndex
CREATE INDEX "WorkflowStepLog_stepId_idx" ON "WorkflowStepLog"("stepId");

-- CreateIndex
CREATE INDEX "Notification_organizationId_idx" ON "Notification"("organizationId");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- AddForeignKey
ALTER TABLE "Workflow" ADD CONSTRAINT "Workflow_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Workflow" ADD CONSTRAINT "Workflow_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowStep" ADD CONSTRAINT "WorkflowStep_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowExecution" ADD CONSTRAINT "WorkflowExecution_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowStepLog" ADD CONSTRAINT "WorkflowStepLog_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "WorkflowExecution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowStepLog" ADD CONSTRAINT "WorkflowStepLog_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "WorkflowStep"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
