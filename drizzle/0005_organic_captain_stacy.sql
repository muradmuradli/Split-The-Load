CREATE TYPE "public"."effort_rating" AS ENUM('easier', 'about_right', 'harder');--> statement-breakpoint
CREATE TABLE "completion" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"completed_by" text NOT NULL,
	"completed_at" timestamp DEFAULT now() NOT NULL,
	"effort_points_at_completion" integer NOT NULL,
	"effort_rating" "effort_rating"
);
--> statement-breakpoint
ALTER TABLE "task" ADD COLUMN "effort_points" integer;--> statement-breakpoint
ALTER TABLE "task" ADD COLUMN "is_recurring" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "task" ADD COLUMN "recurrence_interval_days" integer;--> statement-breakpoint
ALTER TABLE "completion" ADD CONSTRAINT "completion_task_id_task_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."task"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "completion" ADD CONSTRAINT "completion_completed_by_user_id_fk" FOREIGN KEY ("completed_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "completion_taskId_idx" ON "completion" USING btree ("task_id");--> statement-breakpoint
UPDATE "task" SET "effort_points" = CASE "effort"
	WHEN 'quick' THEN 10
	WHEN 'medium' THEN 20
	WHEN 'heavy' THEN 40
END WHERE "effort_points" IS NULL;--> statement-breakpoint
ALTER TABLE "task" ALTER COLUMN "effort_points" SET NOT NULL;