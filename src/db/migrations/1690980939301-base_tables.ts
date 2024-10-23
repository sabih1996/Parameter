import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1690980939301 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "parameter" (
        "path" varchar NOT NULL,
        "org_id" varchar NOT NULL,
        "value" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        PRIMARY KEY ("path","org_id"))
    `);

    await queryRunner.query(
      `ALTER TABLE "parameter" ADD CONSTRAINT "UQ_PARAMETER_PATH" UNIQUE ("path", "org_id")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "parameter"`);
  }
}
