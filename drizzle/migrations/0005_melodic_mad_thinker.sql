CREATE TABLE "tenant_slug_redirects" (
	"slug" text PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tenant_slug_redirects" ADD CONSTRAINT "tenant_slug_redirects_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tenant_slug_redirects_tenant_idx" ON "tenant_slug_redirects" USING btree ("tenant_id");