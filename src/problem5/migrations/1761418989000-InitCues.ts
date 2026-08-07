import type { MigrationInterface, QueryRunner } from 'typeorm';

export class InitCues1761418989000 implements MigrationInterface {
  name = 'InitCues1761418989000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "email" character varying NOT NULL,
        "name" character varying NOT NULL,
        "password_hash" character varying NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "users_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "users_email_unique" UNIQUE ("email")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "cues" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "brand" character varying NOT NULL,
        "model" character varying NOT NULL,
        "material" character varying NOT NULL,
        "tip_size_mm" numeric(4,1) NOT NULL,
        "weight_oz" numeric(4,1) NOT NULL,
        "length_in" integer NOT NULL,
        "price_usd" numeric(10,2) NOT NULL,
        "condition" character varying NOT NULL,
        "status" character varying NOT NULL DEFAULT 'available',
        "created_by" uuid NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "cues_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "cues_created_by_fkey" FOREIGN KEY ("created_by")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      'CREATE INDEX "cues_created_by_deleted_at_idx" ON "cues" ("created_by", "deleted_at")',
    );
    await queryRunner.query(
      'CREATE INDEX "cues_status_idx" ON "cues" ("status")',
    );
    await queryRunner.query(
      'CREATE INDEX "cues_condition_idx" ON "cues" ("condition")',
    );
    await queryRunner.query(
      'CREATE INDEX "cues_brand_idx" ON "cues" ("brand")',
    );
    await queryRunner.query(
      'CREATE INDEX "cues_price_usd_idx" ON "cues" ("price_usd")',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "cues"');
    await queryRunner.query('DROP TABLE "users"');
  }
}
