import Dexie, { type Table } from "dexie"

/* =========================================================
   EXPERIMENT QUALITY
   ========================================================= */

export type ExperimentQualityEvidence = {
  concentrationRecorded: boolean
  activeConcentrationVerified: boolean
  treatmentVolumeRecorded: boolean
  surfaceAreaRecorded: boolean
  contactTimeRecorded: boolean
  environmentalReadingsRecorded: boolean
  photoEvidenceRecorded: boolean
  laboratoryEvidenceRecorded: boolean

  concentrationNotes: string
  measurementNotes: string
  environmentalNotes: string
  evidenceNotes: string
}

/* =========================================================
   EXPERIMENTS
   ========================================================= */

export type ExperimentRecord = {
  id: string

  /*
   * Supabase authenticated user who owns this record.
   *
   * Optional during migration so existing local records
   * can be safely upgraded without being destroyed.
   */
  ownerId?: string

  title: string
  researchQuestion: string
  aim: string
  hypothesis: string
  researcher: string

  replicates: number

  treatments: string[]
  surfaces: string[]

  createdAt: string
  updatedAt: string
  isDeleted: boolean

  methodLocked: boolean
  methodLockedAt?: string

  qualityEvidence?: ExperimentQualityEvidence
}

/* =========================================================
   OBSERVATIONS
   ========================================================= */

export type ObservationRecord = {
  id: string

  /*
   * Owner is inherited from the experiment,
   * but stored directly so observations can be
   * filtered safely and efficiently.
   */
  ownerId?: string

  experimentId: string

  treatment: string
  surface: string

  replicate: number
  day: number

  /*
   * IMPORTANT:
   * This is a visual contamination score from 0–8.
   * It is NOT a bacterial count.
   */
  visualScore: number

  notes: string

  createdAt: string
  updatedAt: string
  isDeleted: boolean
}

/* =========================================================
   PHOTOS
   ========================================================= */

export type PhotoRecord = {
  id: string

  ownerId?: string

  experimentId: string

  title: string
  caption: string

  treatment?: string
  surface?: string
  replicate?: number
  day?: number

  fileName: string
  mimeType: string
  fileSize: number

  imageBlob: Blob

  createdAt: string
  updatedAt: string
  isDeleted: boolean
}

/* =========================================================
   LABORATORY RESULTS
   ========================================================= */

export type LabMethod =
  | "culture"
  | "microscopy"
  | "qPCR"
  | "ATP"
  | "other"

export type LabResultStatus =
  | "observed"
  | "measured"
  | "confirmed"
  | "not_confirmed"
  | "unknown"

export type LaboratoryResultRecord = {
  id: string

  ownerId?: string

  experimentId: string

  method: LabMethod
  methodName: string

  sampleCode?: string

  resultStatus: LabResultStatus

  observation: string
  interpretation: string

  countable: boolean

  quantitativeValue?: number
  quantitativeUnit?: string

  confirmationStatus: string

  laboratoryName?: string
  analyst?: string
  performedAt?: string

  notes: string

  createdAt: string
  updatedAt: string
  isDeleted: boolean
}

/* =========================================================
   FOLLOW-UP EXPERIMENTS
   ========================================================= */

export type FollowUpReason =
  | "unexpected_result"
  | "missing_evidence"
  | "concentration_uncertainty"
  | "measurement_limitation"
  | "control_improvement"
  | "replication_improvement"
  | "other"

export type FollowUpExperimentRecord = {
  id: string

  ownerId?: string

  parentExperimentId: string
  parentExperimentVersion?: string

  reason: FollowUpReason
  reasonDetails: string

  researchQuestion: string
  aim: string
  hypothesis: string

  variableChanged: string
  controlsImproved: string
  replicationPlan: string
  measurementImprovement: string

  whatChanged: string
  whatRemainsTheSame: string

  createdAt: string
  updatedAt: string
  isDeleted: boolean
}

/* =========================================================
   SHARED / FROZEN EXPERIMENTS
   ========================================================= */

export type SharedExperimentRecord = {
  id: string

  /*
   * User who created the frozen snapshot.
   */
  ownerId?: string

  /*
   * ID of the original live experiment.
   */
  experimentId: string

  /*
   * updatedAt value of the original experiment
   * when this snapshot was frozen.
   */
  experimentVersion: string

  title: string
  researchQuestion: string
  aim: string
  hypothesis: string
  researcher: string

  treatments: string[]
  surfaces: string[]

  /*
   * Complete frozen copies.
   * These are intentionally separate from live records.
   */
  observations: ObservationRecord[]

  laboratoryResults: LaboratoryResultRecord[]

  /* =======================================================
     RESEARCH QUALITY SNAPSHOT
     ======================================================= */

  reliabilityScore?: number
  reliabilityRating?: string
  reliabilityReasons?: string[]

  /* =======================================================
     SCIENTIFIC INTEGRITY SNAPSHOT
     ======================================================= */

  integritySummary?: {
    total: number
    observed: number
    measured: number
    inferred: number
    unknown: number
    unsupported: number
    blocked: number
  }

  /* =======================================================
     UNEXPECTED RESULTS SNAPSHOT
     ======================================================= */

  unexpectedResults: Array<{
    title: string
    treatment: string
    surface: string
    severity: string
    description: string
  }>

  /* =======================================================
     CONCLUSION / LIMITATIONS
     ======================================================= */

  limitations: string[]
  conclusion: string

  /* =======================================================
     FREEZE METADATA
     ======================================================= */

  createdAt: string
  frozenAt: string

  /*
   * Shared records must remain frozen.
   */
  isFrozen: boolean

  /*
   * Archive flag.
   * Scientific records are never normally hard-deleted.
   */
  isDeleted: boolean
}

/* =========================================================
   APPLICATION SETTINGS
   ========================================================= */

export type BioShieldSettingsRecord = {
  id: string

  /*
   * Supabase authenticated user who owns these settings.
   */
  ownerId?: string

  /*
   * Optional researcher information.
   */
  researcherName: string
  institution: string
  projectId: string

  /*
   * Display / scientific units.
   */
  temperatureUnit: "C" | "F"
  pressureUnit: "hPa" | "kPa"

  dateFormat:
    | "DD/MM/YYYY"
    | "MM/DD/YYYY"

  /*
   * Application preferences.
   */
  darkMode: boolean

  /*
   * Scientific-integrity protection should remain
   * enabled by default.
   */
  scientificIntegrityProtection: boolean

  updatedAt: string
}

/* =========================================================
   DATABASE
   ========================================================= */

class BioShieldDatabase extends Dexie {
  experiments!: Table<
    ExperimentRecord,
    string
  >

  observations!: Table<
    ObservationRecord,
    string
  >

  photos!: Table<
    PhotoRecord,
    string
  >

  laboratoryResults!: Table<
    LaboratoryResultRecord,
    string
  >

  followUpExperiments!: Table<
    FollowUpExperimentRecord,
    string
  >

  sharedExperiments!: Table<
    SharedExperimentRecord,
    string
  >

  appSettings!: Table<
    BioShieldSettingsRecord,
    string
  >

  constructor() {
    super("BioShieldDatabase")

    /* =======================================================
       VERSION 1
       ======================================================= */

    this.version(1).stores({
      experiments:
        "id, createdAt, updatedAt, isDeleted",
    })

    /* =======================================================
       VERSION 2
       Adds observations
       ======================================================= */

    this.version(2).stores({
      experiments:
        "id, createdAt, updatedAt, isDeleted",

      observations:
        "id, experimentId, treatment, surface, replicate, day, isDeleted, [experimentId+day]",
    })

    /* =======================================================
       VERSION 3
       Observation structure retained
       ======================================================= */

    this.version(3).stores({
      experiments:
        "id, createdAt, updatedAt, isDeleted",

      observations:
        "id, experimentId, treatment, surface, replicate, day, isDeleted, [experimentId+day]",
    })

    /* =======================================================
       VERSION 4
       Adds photos
       ======================================================= */

    this.version(4).stores({
      experiments:
        "id, createdAt, updatedAt, isDeleted",

      observations:
        "id, experimentId, treatment, surface, replicate, day, isDeleted, [experimentId+day]",

      photos:
        "id, experimentId, treatment, surface, replicate, day, createdAt, updatedAt, isDeleted",
    })

    /* =======================================================
       VERSION 5
       Adds laboratory results
       ======================================================= */

    this.version(5).stores({
      experiments:
        "id, createdAt, updatedAt, isDeleted",

      observations:
        "id, experimentId, treatment, surface, replicate, day, isDeleted, [experimentId+day]",

      photos:
        "id, experimentId, treatment, surface, replicate, day, createdAt, updatedAt, isDeleted",

      laboratoryResults:
        "id, experimentId, method, resultStatus, createdAt, updatedAt, isDeleted",
    })

    /* =======================================================
       VERSION 6
       Adds follow-up experiments
       ======================================================= */

    this.version(6).stores({
      experiments:
        "id, createdAt, updatedAt, isDeleted",

      observations:
        "id, experimentId, treatment, surface, replicate, day, isDeleted, [experimentId+day]",

      photos:
        "id, experimentId, treatment, surface, replicate, day, createdAt, updatedAt, isDeleted",

      laboratoryResults:
        "id, experimentId, method, resultStatus, createdAt, updatedAt, isDeleted",

      followUpExperiments:
        "id, parentExperimentId, createdAt, updatedAt, isDeleted",
    })

    /* =======================================================
       VERSION 7
       Adds frozen shared experiment snapshots
       ======================================================= */

    this.version(7).stores({
      experiments:
        "id, createdAt, updatedAt, isDeleted",

      observations:
        "id, experimentId, treatment, surface, replicate, day, isDeleted, [experimentId+day]",

      photos:
        "id, experimentId, treatment, surface, replicate, day, createdAt, updatedAt, isDeleted",

      laboratoryResults:
        "id, experimentId, method, resultStatus, createdAt, updatedAt, isDeleted",

      followUpExperiments:
        "id, parentExperimentId, createdAt, updatedAt, isDeleted",

      sharedExperiments:
        "id, experimentId, experimentVersion, createdAt, frozenAt, isFrozen, isDeleted",
    })

    /* =======================================================
       VERSION 8
       Adds application settings
       ======================================================= */

    this.version(8).stores({
      experiments:
        "id, createdAt, updatedAt, isDeleted",

      observations:
        "id, experimentId, treatment, surface, replicate, day, isDeleted, [experimentId+day]",

      photos:
        "id, experimentId, treatment, surface, replicate, day, createdAt, updatedAt, isDeleted",

      laboratoryResults:
        "id, experimentId, method, resultStatus, createdAt, updatedAt, isDeleted",

      followUpExperiments:
        "id, parentExperimentId, createdAt, updatedAt, isDeleted",

      sharedExperiments:
        "id, experimentId, experimentVersion, createdAt, frozenAt, isFrozen, isDeleted",

      appSettings:
        "id, updatedAt",
    })

    /* =======================================================
       VERSION 9
       Adds researcher ownership indexes
       ======================================================= */

    this.version(9).stores({
      experiments:
        "id, ownerId, createdAt, updatedAt, isDeleted, [ownerId+updatedAt]",

      observations:
        "id, ownerId, experimentId, treatment, surface, replicate, day, isDeleted, [ownerId+experimentId], [experimentId+day]",

      photos:
        "id, ownerId, experimentId, treatment, surface, replicate, day, createdAt, updatedAt, isDeleted, [ownerId+experimentId]",

      laboratoryResults:
        "id, ownerId, experimentId, method, resultStatus, createdAt, updatedAt, isDeleted, [ownerId+experimentId]",

      followUpExperiments:
        "id, ownerId, parentExperimentId, createdAt, updatedAt, isDeleted, [ownerId+parentExperimentId]",

      sharedExperiments:
        "id, ownerId, experimentId, experimentVersion, createdAt, frozenAt, isFrozen, isDeleted, [ownerId+experimentId]",

      appSettings:
        "id, ownerId, updatedAt",
    })
  }
}

/* =========================================================
   DATABASE INSTANCE
   ========================================================= */

export const db =
  new BioShieldDatabase()