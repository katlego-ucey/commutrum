import {
  pgTable,
  serial,
  text,
  date,
  real,
  boolean,
  integer,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const factorCandidates = pgTable(
  "factor_candidates",
  {
    id: serial("id").primaryKey(),
    candidateId: text("candidate_id").notNull().unique(),
    factorName: text("factor_name").notNull(),
    submittedAt: timestamp("submitted_at").notNull().defaultNow(),
    causalityClassification: text("causality_classification").notNull(),
    economicRationale: text("economic_rationale").notNull(),
    academicSupport: text("academic_support"),
    status: text("status").notNull().default("submitted"),
    hypothesisRegistryId: text("hypothesis_registry_id"),
    finalDecision: text("final_decision"),
    finalDecisionAt: timestamp("final_decision_at"),
    finalDecisionRationale: text("final_decision_rationale"),
  },
  (t) => [
    index("factor_candidates_status_idx").on(t.status),
  ]
);

export const admissionGateResults = pgTable(
  "admission_gate_results",
  {
    id: serial("id").primaryKey(),
    candidateId: text("candidate_id")
      .notNull()
      .references(() => factorCandidates.candidateId),
    gateNumber: integer("gate_number").notNull(),
    gateName: text("gate_name").notNull(),
    passed: boolean("passed"),
    metricValue: real("metric_value"),
    threshold: real("threshold"),
    evidence: text("evidence"),
    evaluatedAt: timestamp("evaluated_at"),
    evaluatedBy: text("evaluated_by"),
  },
  (t) => [
    index("admission_gate_results_candidate_idx").on(t.candidateId),
  ]
);

export const admissionDecisions = pgTable(
  "admission_decisions",
  {
    id: serial("id").primaryKey(),
    candidateId: text("candidate_id")
      .notNull()
      .references(() => factorCandidates.candidateId),
    decision: text("decision").notNull(),
    decidedAt: timestamp("decided_at").notNull().defaultNow(),
    decidedBy: text("decided_by"),
    rationale: text("rationale").notNull(),
    allGatesPassed: boolean("all_gates_passed").notNull(),
    failedGates: text("failed_gates"),
  },
  (t) => [
    index("admission_decisions_candidate_idx").on(t.candidateId),
  ]
);

export const insertFactorCandidateSchema = createInsertSchema(factorCandidates).omit({ id: true, submittedAt: true });
export const insertAdmissionGateResultSchema = createInsertSchema(admissionGateResults).omit({ id: true });
export const insertAdmissionDecisionSchema = createInsertSchema(admissionDecisions).omit({ id: true, decidedAt: true });

export type FactorCandidate = typeof factorCandidates.$inferSelect;
export type AdmissionGateResult = typeof admissionGateResults.$inferSelect;
export type AdmissionDecision = typeof admissionDecisions.$inferSelect;
export type InsertFactorCandidate = z.infer<typeof insertFactorCandidateSchema>;
export type InsertAdmissionGateResult = z.infer<typeof insertAdmissionGateResultSchema>;
export type InsertAdmissionDecision = z.infer<typeof insertAdmissionDecisionSchema>;
