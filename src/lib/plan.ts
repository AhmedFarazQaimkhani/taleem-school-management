export type FeatureFlag =
  | "payroll"
  | "certificates"
  | "timetable"
  | "parentPortal"
  | "studentPortal"
  | "smsBroadcast"
  | "whatsappAlerts"
  | "exams";

export type FeatureFlags = Record<FeatureFlag, boolean>;

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  payroll: false,
  certificates: false,
  timetable: false,
  parentPortal: false,
  studentPortal: false,
  smsBroadcast: false,
  whatsappAlerts: true,
  exams: false,
};

export function parseFeatureFlags(json: unknown): FeatureFlags {
  const raw = (json ?? {}) as Partial<Record<FeatureFlag, boolean>>;
  return { ...DEFAULT_FEATURE_FLAGS, ...raw };
}

export function hasFeature(flags: unknown, feature: FeatureFlag): boolean {
  return parseFeatureFlags(flags)[feature] === true;
}
