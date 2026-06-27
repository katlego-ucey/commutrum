import {
  pgTable,
  serial,
  text,
  date,
  timestamp,
  jsonb,
  integer,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const hypothesisRegistry = pgTable(
  "hypothesis_registry",
  {
    id: serial("id").primaryKey(),
    factorId: text("factor_id").notNull().unique(),
    factorName: text("factor_name").notNull(),
    hypothesis: text("hypothesis").notNull(),
    mechanismType: text("mechanism_type").notNull(),
    causalityClassification: text("causality_classification").notNull(),
    dataRequirements: text("data_requirements"),
    expectedReturnHorizon: text("expected_return_horizon"),
    failureCriteria: text("failure_criteria"),
    status: text("status").notNull().default("R&D"),
    registeredAt: timestamp("registered_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("hypothesis_registry_status_idx").on(t.status),
  ]
);

export const modelVersions = pgTable(
  "model_versions",
  {
    id: serial("id").primaryKey(),
    factorId: text("factor_id")
      .notNull()
      .references(() => hypothesisRegistry.factorId),
    version: integer("version").notNull(),
    description: text("description"),
    parameterSnapshot: jsonb("parameter_snapshot"),
    effectiveFrom: date("effective_from").notNull(),
    effectiveTo: date("effective_to"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("model_versions_factor_idx").on(t.factorId),
  ]
);

export const lifecycleStatus = pgTable(
  "lifecycle_status",
  {
    id: serial("id").primaryKey(),
    factorId: text("factor_id")
      .notNull()
      .references(() => hypothesisRegistry.factorId),
    fromStatus: text("from_status"),
    toStatus: text("to_status").notNull(),
    transitionedAt: timestamp("transitioned_at").notNull().defaultNow(),
    transitionedBy: text("transitioned_by"),
    evidence: text("evidence"),
    backtestRunId: text("backtest_run_id"),
  },
  (t) => [
    index("lifecycle_status_factor_idx").on(t.factorId),
  ]
);

export const auditLog = pgTable(
  "audit_log",
  {
    id: serial("id").primaryKey(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    action: text("action").notNull(),
    performedBy: text("performed_by"),
    performedAt: timestamp("performed_at").notNull().defaultNow(),
    before: jsonb("before"),
    after: jsonb("after"),
    notes: text("notes"),
  },
  (t) => [
    index("audit_log_entity_idx").on(t.entityType, t.entityId),
    index("audit_log_performed_at_idx").on(t.performedAt),
  ]
);

export const insertHypothesisRegistrySchema = createInsertSchema(hypothesisRegistry).omit({ id: true, registeredAt: true, updatedAt: true });
export const insertModelVersionSchema = createInsertSchema(modelVersions).omit({ id: true, createdAt: true });
export const insertLifecycleStatusSchema = createInsertSchema(lifecycleStatus).omit({ id: true, transitionedAt: true });
export const insertAuditLogSchema = createInsertSchema(auditLog).omit({ id: true, performedAt: true });

export type HypothesisRegistry = typeof hypothesisRegistry.$inferSelect;
export type ModelVersion = typeof modelVersions.$inferSelect;
export type LifecycleStatus = typeof lifecycleStatus.$inferSelect;
export type AuditLog = typeof auditLog.$inferSelect;
export type InsertHypothesisRegistry = z.infer<typeof insertHypothesisRegistrySchema>;
export type InsertModelVersion = z.infer<typeof insertModelVersionSchema>;
export type InsertLifecycleStatus = z.infer<typeof insertLifecycleStatusSchema>;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
