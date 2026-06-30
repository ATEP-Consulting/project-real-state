CREATE TYPE "public"."search_filter_control" AS ENUM('range', 'min_select', 'enum_select', 'boolean');--> statement-breakpoint
CREATE TABLE "search_filters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"control" "search_filter_control" NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"label" text NOT NULL,
	"label_es" text,
	"options" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"advanced" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "waterfront" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "pool" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "age_restricted" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "search_filters_key_uq" ON "search_filters" USING btree ("key");--> statement-breakpoint
CREATE INDEX "search_filters_order_ix" ON "search_filters" USING btree ("sort_order");