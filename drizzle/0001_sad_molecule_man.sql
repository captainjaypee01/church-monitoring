ALTER TABLE "cells" ADD COLUMN "leader_id" uuid;--> statement-breakpoint
ALTER TABLE "cells" ADD COLUMN "created_by" uuid;--> statement-breakpoint
ALTER TABLE "networks" ADD COLUMN "location" varchar(255);--> statement-breakpoint
ALTER TABLE "networks" ADD COLUMN "created_by" uuid;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cells" ADD CONSTRAINT "cells_leader_id_profiles_id_fk" FOREIGN KEY ("leader_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cells" ADD CONSTRAINT "cells_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "networks" ADD CONSTRAINT "networks_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
