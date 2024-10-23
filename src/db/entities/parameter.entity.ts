import { Column, Entity, PrimaryColumn, Unique } from "typeorm";

@Entity()
@Unique("UQ_PARAMETER_PATH", ["path", "org_id"])
export class Parameter {
  @PrimaryColumn({ type: "varchar" })
  path: string;

  @PrimaryColumn({ type: "varchar" })
  org_id: string;

  @Column("jsonb", { nullable: false, default: {} })
  value: object;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  public created_at: Date;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  public updated_at: Date;
}
