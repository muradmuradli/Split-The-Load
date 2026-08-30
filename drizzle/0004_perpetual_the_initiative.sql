CREATE TYPE "public"."task_actual_effort" AS ENUM('easier', 'as_expected', 'harder');--> statement-breakpoint
ALTER TABLE "task" ADD COLUMN "actual_effort" "task_actual_effort";--> statement-breakpoint
ALTER TABLE "task" ADD COLUMN "due_date" date;