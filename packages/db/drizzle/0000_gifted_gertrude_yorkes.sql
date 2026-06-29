CREATE EXTENSION IF NOT EXISTS postgis;--> statement-breakpoint
CREATE TYPE "public"."activity_type" AS ENUM('call', 'note', 'status_change', 'reminder', 'email', 'meeting');--> statement-breakpoint
CREATE TYPE "public"."contact_channel" AS ENUM('email', 'phone', 'sms', 'whatsapp');--> statement-breakpoint
CREATE TYPE "public"."content_status" AS ENUM('draft', 'published');--> statement-breakpoint
CREATE TYPE "public"."content_type" AS ENUM('area', 'neighborhood', 'guide', 'page');--> statement-breakpoint
CREATE TYPE "public"."lead_intent" AS ENUM('buy', 'sell', 'rent');--> statement-breakpoint
CREATE TYPE "public"."lead_status" AS ENUM('new', 'contacted', 'qualified', 'appointment', 'offer', 'closed', 'lost');--> statement-breakpoint
CREATE TYPE "public"."listing_source" AS ENUM('mls', 'manual', 'mock');--> statement-breakpoint
CREATE TYPE "public"."listing_status" AS ENUM('active', 'pending', 'sold', 'off_market');--> statement-breakpoint
CREATE TYPE "public"."listing_visibility" AS ENUM('public', 'registered', 'private_link');--> statement-breakpoint
CREATE TYPE "public"."property_type" AS ENUM('single_family', 'condo', 'townhouse', 'multi_family', 'villa', 'co_op', 'land', 'mobile', 'other');--> statement-breakpoint
CREATE TYPE "public"."question_type" AS ENUM('single_select', 'multi_select', 'text', 'number', 'boolean', 'range');--> statement-breakpoint
CREATE TABLE "listings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" "listing_source" NOT NULL,
	"visibility" "listing_visibility" DEFAULT 'public' NOT NULL,
	"status" "listing_status" DEFAULT 'active' NOT NULL,
	"slug" text NOT NULL,
	"mls_number" text,
	"property_type" "property_type" NOT NULL,
	"price" integer NOT NULL,
	"bedrooms" integer,
	"bathrooms" numeric(3, 1),
	"sqft" integer,
	"lot_size_sqft" integer,
	"year_built" integer,
	"description" text,
	"address_line1" text NOT NULL,
	"address_line2" text,
	"city" text NOT NULL,
	"state" text DEFAULT 'FL' NOT NULL,
	"zip" text NOT NULL,
	"county" text,
	"latitude" numeric(9, 6),
	"longitude" numeric(9, 6),
	"geom" geometry(Point,4326),
	"flood_zone" text,
	"hoa_fee_monthly" integer,
	"cdd_fee_annual" integer,
	"est_property_tax_annual" integer,
	"est_home_insurance_annual" integer,
	"est_flood_insurance_annual" integer,
	"photos" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"video_url" text,
	"virtual_tour_url" text,
	"listing_brokerage_name" text,
	"listing_agent_name" text,
	"originating_mls" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_synced_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"intent" "lead_intent" NOT NULL,
	"status" "lead_status" DEFAULT 'new' NOT NULL,
	"name" text,
	"email" text,
	"phone" text,
	"answers" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"source" text,
	"attribution" jsonb,
	"viewed_listing_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "leads_contact_present" CHECK ("leads"."email" is not null or "leads"."phone" is not null)
);
--> statement-breakpoint
CREATE TABLE "consent_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"channel" "contact_channel" NOT NULL,
	"granted" boolean NOT NULL,
	"wording" text NOT NULL,
	"source" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "suppressions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"channel" "contact_channel" NOT NULL,
	"value" text NOT NULL,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_searches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid,
	"label" text,
	"criteria" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"type" "activity_type" NOT NULL,
	"body" text,
	"meta" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"due_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "qualification_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"intent" "lead_intent" NOT NULL,
	"key" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"type" "question_type" NOT NULL,
	"label" text NOT NULL,
	"label_es" text,
	"options" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"required" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "content_type" NOT NULL,
	"status" "content_status" DEFAULT 'draft' NOT NULL,
	"slug" text NOT NULL,
	"city" text,
	"neighborhood" text,
	"title" text NOT NULL,
	"title_es" text,
	"excerpt" text,
	"excerpt_es" text,
	"body" text,
	"body_es" text,
	"hero_image_url" text,
	"meta_title" text,
	"meta_description" text,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "listings_slug_uq" ON "listings" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "listings_geom_gix" ON "listings" USING gist ("geom");--> statement-breakpoint
CREATE INDEX "listings_source_ix" ON "listings" USING btree ("source");--> statement-breakpoint
CREATE INDEX "listings_status_ix" ON "listings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "listings_city_ix" ON "listings" USING btree ("city");--> statement-breakpoint
CREATE INDEX "listings_price_ix" ON "listings" USING btree ("price");--> statement-breakpoint
CREATE INDEX "leads_status_ix" ON "leads" USING btree ("status");--> statement-breakpoint
CREATE INDEX "leads_intent_ix" ON "leads" USING btree ("intent");--> statement-breakpoint
CREATE INDEX "consent_lead_ix" ON "consent_records" USING btree ("lead_id");--> statement-breakpoint
CREATE UNIQUE INDEX "suppressions_channel_value_uq" ON "suppressions" USING btree ("channel","value");--> statement-breakpoint
CREATE INDEX "activities_lead_ix" ON "activities" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "activities_due_ix" ON "activities" USING btree ("due_at");--> statement-breakpoint
CREATE UNIQUE INDEX "questions_intent_key_uq" ON "qualification_questions" USING btree ("intent","key");--> statement-breakpoint
CREATE INDEX "questions_intent_order_ix" ON "qualification_questions" USING btree ("intent","sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "content_type_slug_uq" ON "content" USING btree ("type","slug");--> statement-breakpoint
CREATE INDEX "content_status_ix" ON "content" USING btree ("status");