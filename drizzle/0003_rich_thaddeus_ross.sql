CREATE TYPE "public"."task_effort" AS ENUM('quick', 'medium', 'heavy');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('todo', 'done');--> statement-breakpoint
CREATE TABLE "task" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"flat_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"effort" "task_effort" NOT NULL,
	"status" "task_status" DEFAULT 'todo' NOT NULL,
	"assignee_membership_id" uuid,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_flat_id_flat_id_fk" FOREIGN KEY ("flat_id") REFERENCES "public"."flat"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_assignee_membership_id_membership_id_fk" FOREIGN KEY ("assignee_membership_id") REFERENCES "public"."membership"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "task_flatId_idx" ON "task" USING btree ("flat_id");--> statement-breakpoint
CREATE INDEX "task_assigneeMembershipId_idx" ON "task" USING btree ("assignee_membership_id");