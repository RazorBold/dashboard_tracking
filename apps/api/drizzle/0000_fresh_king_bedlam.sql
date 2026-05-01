CREATE TYPE "public"."user_role" AS ENUM('super_admin', 'admin', 'operator', 'viewer');--> statement-breakpoint
CREATE TYPE "public"."org_plan" AS ENUM('free', 'basic', 'pro', 'enterprise');--> statement-breakpoint
CREATE TYPE "public"."device_status" AS ENUM('online', 'offline', 'inactive', 'expired');--> statement-breakpoint
CREATE TYPE "public"."insurance_status" AS ENUM('active', 'expired', 'expiring_soon', 'none');--> statement-breakpoint
CREATE TYPE "public"."vehicle_status" AS ENUM('active', 'inactive', 'maintenance', 'retired');--> statement-breakpoint
CREATE TYPE "public"."vehicle_type" AS ENUM('car', 'motorcycle', 'truck', 'bus', 'van', 'other');--> statement-breakpoint
CREATE TYPE "public"."driver_status" AS ENUM('active', 'inactive', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."alert_severity" AS ENUM('info', 'warning', 'critical');--> statement-breakpoint
CREATE TYPE "public"."alert_type" AS ENUM('acc_on', 'acc_off', 'vibration', 'overspeed', 'enter_geofence', 'exit_geofence', 'collision', 'sharp_turn_left', 'sharp_turn_right', 'sudden_acceleration', 'sudden_deceleration', 'low_battery', 'sos');--> statement-breakpoint
CREATE TYPE "public"."geofence_type" AS ENUM('circle', 'polygon');--> statement-breakpoint
CREATE TYPE "public"."report_frequency" AS ENUM('daily', 'weekly', 'monthly');--> statement-breakpoint
CREATE TYPE "public"."report_type" AS ENUM('daily_activity', 'track_details');--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"name" varchar(100) NOT NULL,
	"role" "user_role" DEFAULT 'viewer' NOT NULL,
	"avatar" text,
	"organization_id" uuid,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(50) NOT NULL,
	"plan" "org_plan" DEFAULT 'free' NOT NULL,
	"max_devices" varchar(10) DEFAULT '10',
	"contact_email" varchar(255),
	"contact_phone" varchar(20),
	"address" varchar(500),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "devices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"imei" varchar(17) NOT NULL,
	"model" varchar(50),
	"status" "device_status" DEFAULT 'offline' NOT NULL,
	"organization_id" uuid,
	"group_id" uuid,
	"activated_at" timestamp with time zone,
	"subscription_expiry" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"last_online" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "devices_imei_unique" UNIQUE("imei")
);
--> statement-breakpoint
CREATE TABLE "device_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" varchar(500),
	"organization_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plate_no" varchar(20) NOT NULL,
	"type" "vehicle_type" DEFAULT 'car',
	"make" varchar(50),
	"model" varchar(50),
	"max_speed" integer,
	"vin" varchar(17),
	"sn" varchar(30),
	"device_id" uuid,
	"organization_id" uuid,
	"status" "vehicle_status" DEFAULT 'active',
	"insurance_status" "insurance_status" DEFAULT 'none',
	"insurance_expiry" timestamp with time zone,
	"accumulated_mileage" integer DEFAULT 0,
	"owner_name" varchar(100),
	"owner_phone" varchar(20),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "drivers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"driver_no" varchar(30) NOT NULL,
	"name" varchar(100) NOT NULL,
	"phone" varchar(20),
	"license_no" varchar(30),
	"rfid_card_no" varchar(30),
	"kc208" varchar(30),
	"register_place" varchar(100),
	"register_date" timestamp with time zone,
	"license_expiry" timestamp with time zone,
	"license_status" varchar(20) DEFAULT 'N/A',
	"status" "driver_status" DEFAULT 'active',
	"organization_id" uuid,
	"fleet_name" varchar(100),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "drivers_driver_no_unique" UNIQUE("driver_no")
);
--> statement-breakpoint
CREATE TABLE "refresh_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" text NOT NULL,
	"user_agent" text,
	"ip_address" text,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "refresh_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "device_positions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"device_id" uuid NOT NULL,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"speed" real DEFAULT 0,
	"heading" real DEFAULT 0,
	"altitude" real,
	"satellites" smallint,
	"gsm_signal" smallint,
	"battery_voltage" real,
	"acc_status" smallint,
	"mileage" real,
	"timestamp" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"device_id" uuid NOT NULL,
	"organization_id" uuid,
	"type" "alert_type" NOT NULL,
	"severity" "alert_severity" DEFAULT 'warning' NOT NULL,
	"message" text,
	"latitude" double precision,
	"longitude" double precision,
	"address" text,
	"speed" double precision,
	"is_read" boolean DEFAULT false NOT NULL,
	"processed_by" uuid,
	"processed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "geofences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"type" "geofence_type" NOT NULL,
	"geometry" jsonb NOT NULL,
	"organization_id" uuid,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auto_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid,
	"user_id" uuid,
	"name" text NOT NULL,
	"report_type" "report_type" NOT NULL,
	"device_id" uuid,
	"frequency" "report_frequency" NOT NULL,
	"execution_time" text NOT NULL,
	"email" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_run_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "report_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid,
	"user_id" uuid,
	"name" text NOT NULL,
	"report_type" "report_type" NOT NULL,
	"device_id" uuid,
	"date_from" timestamp with time zone,
	"date_to" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_devices_imei" ON "devices" USING btree ("imei");--> statement-breakpoint
CREATE INDEX "idx_devices_org" ON "devices" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_devices_status" ON "devices" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_vehicles_plate" ON "vehicles" USING btree ("plate_no");--> statement-breakpoint
CREATE INDEX "idx_vehicles_device" ON "vehicles" USING btree ("device_id");--> statement-breakpoint
CREATE INDEX "idx_vehicles_org" ON "vehicles" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_drivers_no" ON "drivers" USING btree ("driver_no");--> statement-breakpoint
CREATE INDEX "idx_drivers_org" ON "drivers" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_positions_device" ON "device_positions" USING btree ("device_id");--> statement-breakpoint
CREATE INDEX "idx_positions_timestamp" ON "device_positions" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "idx_positions_device_time" ON "device_positions" USING btree ("device_id","timestamp");--> statement-breakpoint
CREATE INDEX "idx_alerts_device" ON "alerts" USING btree ("device_id");--> statement-breakpoint
CREATE INDEX "idx_alerts_type" ON "alerts" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_alerts_read" ON "alerts" USING btree ("is_read");--> statement-breakpoint
CREATE INDEX "idx_alerts_created" ON "alerts" USING btree ("created_at");