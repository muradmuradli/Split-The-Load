CREATE TYPE "public"."membership_role" AS ENUM('admin', 'member');--> statement-breakpoint
CREATE TYPE "public"."membership_status" AS ENUM('pending', 'verified');--> statement-breakpoint
CREATE TABLE "flat" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"city" text NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "membership" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"flat_id" uuid NOT NULL,
	"user_id" text,
	"email" text NOT NULL,
	"role" "membership_role" DEFAULT 'member' NOT NULL,
	"status" "membership_status" DEFAULT 'pending' NOT NULL,
	"invite_token" text,
	"invite_token_expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "membership_invite_token_unique" UNIQUE("invite_token")
);
--> statement-breakpoint
ALTER TABLE "flat" ADD CONSTRAINT "flat_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership" ADD CONSTRAINT "membership_flat_id_flat_id_fk" FOREIGN KEY ("flat_id") REFERENCES "public"."flat"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership" ADD CONSTRAINT "membership_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "membership_flat_email_idx" ON "membership" USING btree ("flat_id","email");--> statement-breakpoint
CREATE INDEX "membership_invite_token_idx" ON "membership" USING btree ("invite_token");--> statement-breakpoint
CREATE INDEX "membership_flatId_idx" ON "membership" USING btree ("flat_id");--> statement-breakpoint
CREATE INDEX "membership_userId_idx" ON "membership" USING btree ("user_id");