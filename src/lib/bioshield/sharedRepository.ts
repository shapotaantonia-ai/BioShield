import {
  db,
  type SharedExperimentRecord,
} from "./database"

import {
  getCurrentUser,
} from "./authRepository"

import {
  getReportData,
} from "./reportRepository"

/* =========================================================
   OWNER
   ========================================================= */

async function getOwnerId(): Promise<string> {
  const user =
    await getCurrentUser()

  if (!user) {
    throw new Error(
      "You must be signed in to access BioShield shared experiments.",
    )
  }

  return user.id
}

/* =========================================================
   ID
   ========================================================= */

function createId(): string {
  return crypto.randomUUID()
}

/* =========================================================
   CREATE FROZEN SHARED EXPERIMENT
   ========================================================= */

export async function createSharedExperiment(
  experimentId: string,
): Promise<SharedExperimentRecord> {
  const ownerId =
    await getOwnerId()

  /*
   * getReportData() is already ownership-aware.
   * If the experiment does not belong to the
   * current account, it will not return report data.
   */
  const report =
    await getReportData(experimentId)

  if (!report) {
    throw new Error(
      "The experiment could not be found or does not belong to the current account.",
    )
  }

  /*
   * Verify the original experiment directly
   * before building the frozen snapshot.
   */
  const experiment =
    await db.experiments.get(
      experimentId,
    )

  if (
    !experiment ||
    experiment.isDeleted ||
    experiment.ownerId !== ownerId
  ) {
    throw new Error(
      "The experiment could not be found or does not belong to the current account.",
    )
  }

  const now =
    new Date().toISOString()

  /* =======================================================
     GET COMPLETE OBSERVATION RECORDS

     Do not use report.observations here.
     The report contains simplified analysis data.
     The frozen snapshot must preserve the original
     ObservationRecord structures.
     ======================================================= */

  const observations =
    await db.observations
      .where("experimentId")
      .equals(experimentId)
      .and(
        (observation) =>
          !observation.isDeleted &&
          observation.ownerId === ownerId,
      )
      .toArray()

  /* =======================================================
     GET COMPLETE LABORATORY RECORDS
     ======================================================= */

  const laboratoryResults =
    await db.laboratoryResults
      .where("experimentId")
      .equals(experimentId)
      .and(
        (result) =>
          !result.isDeleted &&
          result.ownerId === ownerId,
      )
      .toArray()

  /* =======================================================
     RELIABILITY
     ======================================================= */

  const reliabilityScore =
    report.experiment.qualityEvidence
      ? calculateReliabilityScore(
          report.experiment,
        )
      : undefined

  const reliabilityRating =
    reliabilityScore === undefined
      ? undefined
      : getReliabilityRating(
          reliabilityScore,
        )

  const reliabilityReasons =
    reliabilityScore === undefined
      ? []
      : getReliabilityReasons(
          report.experiment,
          reliabilityScore,
        )

  /* =======================================================
     SCIENTIFIC INTEGRITY
     ======================================================= */

  const integritySummary =
    report.integrity?.summary

  /* =======================================================
     UNEXPECTED RESULTS
     ======================================================= */

  const unexpectedResults =
    report.unexpectedResults?.patterns.map(
      (pattern) => ({
        title: pattern.title,
        treatment: pattern.treatment,
        surface: pattern.surface,
        severity: pattern.severity,
        description: pattern.description,
      }),
    ) ?? []

  /* =======================================================
     LIMITATIONS
     ======================================================= */

  const limitations = [
    "Visual contamination scores are observational scores and are not bacterial counts.",

    "Active treatment concentrations must be verified before making comparative efficacy claims.",

    "Unexpected results do not establish causation.",

    "Laboratory evidence is presented separately from researcher observations.",
  ]

  /* =======================================================
     CONCLUSION
     ======================================================= */

  const blocked =
    integritySummary?.blocked ?? 0

  const conclusion =
    blocked > 0
      ? "This shared report contains claims requiring scientific revision before finalisation."
      : "The recorded experiment provides observational evidence that should be interpreted within its stated experimental conditions and limitations."

  /* =======================================================
     CREATE FROZEN SNAPSHOT
     ======================================================= */

  const shared: SharedExperimentRecord = {
    id: createId(),

    ownerId,

    experimentId,

    experimentVersion:
      report.experiment.updatedAt,

    title:
      report.experiment.title,

    researchQuestion:
      report.experiment.researchQuestion,

    aim:
      report.experiment.aim,

    hypothesis:
      report.experiment.hypothesis,

    researcher:
      report.experiment.researcher,

    treatments: [
      ...report.experiment.treatments,
    ],

    surfaces: [
      ...report.experiment.surfaces,
    ],

    /*
     * Complete ObservationRecord objects
     * from IndexedDB.
     */
    observations,

    /*
     * Complete LaboratoryResultRecord objects
     * from IndexedDB.
     */
    laboratoryResults,

    reliabilityScore,

    reliabilityRating,

    reliabilityReasons,

    integritySummary,

    unexpectedResults,

    limitations,

    conclusion,

    createdAt: now,

    frozenAt: now,

    isFrozen: true,

    isDeleted: false,
  }

  await db.sharedExperiments.add(
    shared,
  )

  return shared
}

/* =========================================================
   LIST SHARED EXPERIMENTS
   ========================================================= */

export async function listSharedExperiments(): Promise<
  SharedExperimentRecord[]
> {
  const ownerId =
    await getOwnerId()

  const records =
    await db.sharedExperiments
      .filter(
        (record) =>
          !record.isDeleted &&
          record.isFrozen &&
          record.ownerId === ownerId,
      )
      .toArray()

  return records.sort(
    (a, b) =>
      b.frozenAt.localeCompare(
        a.frozenAt,
      ),
  )
}

/* =========================================================
   GET SHARED EXPERIMENT
   ========================================================= */

export async function getSharedExperiment(
  id: string,
): Promise<
  SharedExperimentRecord | undefined
> {
  const ownerId =
    await getOwnerId()

  const record =
    await db.sharedExperiments.get(id)

  if (
    !record ||
    record.isDeleted ||
    !record.isFrozen ||
    record.ownerId !== ownerId
  ) {
    return undefined
  }

  return record
}

/* =========================================================
   ARCHIVE SHARED EXPERIMENT
   ========================================================= */

export async function archiveSharedExperiment(
  id: string,
): Promise<void> {
  const ownerId =
    await getOwnerId()

  const record =
    await db.sharedExperiments.get(id)

  if (
    !record ||
    record.ownerId !== ownerId
  ) {
    throw new Error(
      "Shared experiment could not be found.",
    )
  }

  /*
   * Frozen scientific records are never
   * hard-deleted. Archiving only hides them
   * from normal active lists.
   */
  await db.sharedExperiments.update(
    id,
    {
      isDeleted: true,
    },
  )
}

/* =========================================================
   RELIABILITY SCORE
   ========================================================= */

function calculateReliabilityScore(
  experiment: {
    qualityEvidence?: {
      concentrationRecorded: boolean
      activeConcentrationVerified: boolean
      treatmentVolumeRecorded: boolean
      surfaceAreaRecorded: boolean
      contactTimeRecorded: boolean
      environmentalReadingsRecorded: boolean
      photoEvidenceRecorded: boolean
      laboratoryEvidenceRecorded: boolean
    }

    replicates: number
  },
): number {
  const evidence =
    experiment.qualityEvidence

  if (!evidence) {
    return 0
  }

  let score = 100

  if (
    !evidence.concentrationRecorded
  ) {
    score -= 15
  }

  if (
    !evidence.activeConcentrationVerified
  ) {
    score -= 15
  }

  if (
    !evidence.treatmentVolumeRecorded
  ) {
    score -= 10
  }

  if (
    !evidence.surfaceAreaRecorded
  ) {
    score -= 10
  }

  if (
    !evidence.contactTimeRecorded
  ) {
    score -= 10
  }

  if (
    !evidence.environmentalReadingsRecorded
  ) {
    score -= 10
  }

  if (
    !evidence.photoEvidenceRecorded
  ) {
    score -= 10
  }

  if (
    !evidence.laboratoryEvidenceRecorded
  ) {
    score -= 10
  }

  if (experiment.replicates < 3) {
    score -= 15
  }

  return Math.max(
    0,
    Math.min(100, score),
  )
}

/* =========================================================
   RELIABILITY RATING
   ========================================================= */

function getReliabilityRating(
  score: number,
): string {
  if (score >= 85) {
    return "HIGH"
  }

  if (score >= 65) {
    return "MODERATE"
  }

  if (score >= 40) {
    return "LOW"
  }

  return "INSUFFICIENT"
}

/* =========================================================
   RELIABILITY REASONS
   ========================================================= */

function getReliabilityReasons(
  experiment: {
    qualityEvidence?: {
      concentrationRecorded: boolean
      activeConcentrationVerified: boolean
      treatmentVolumeRecorded: boolean
      surfaceAreaRecorded: boolean
      contactTimeRecorded: boolean
      environmentalReadingsRecorded: boolean
      photoEvidenceRecorded: boolean
      laboratoryEvidenceRecorded: boolean
    }

    replicates: number
  },

  score: number,
): string[] {
  const reasons: string[] = []

  const evidence =
    experiment.qualityEvidence

  if (!evidence) {
    return [
      "Research-quality evidence has not been recorded.",
    ]
  }

  if (
    !evidence.concentrationRecorded
  ) {
    reasons.push(
      "Treatment concentration was not fully recorded.",
    )
  }

  if (
    !evidence.activeConcentrationVerified
  ) {
    reasons.push(
      "Active treatment concentration was not verified.",
    )
  }

  if (
    !evidence.treatmentVolumeRecorded
  ) {
    reasons.push(
      "Treatment volume was not fully recorded.",
    )
  }

  if (
    !evidence.surfaceAreaRecorded
  ) {
    reasons.push(
      "Surface area was not fully recorded.",
    )
  }

  if (
    !evidence.contactTimeRecorded
  ) {
    reasons.push(
      "Treatment contact time was not fully recorded.",
    )
  }

  if (
    !evidence.environmentalReadingsRecorded
  ) {
    reasons.push(
      "Environmental readings were not fully recorded.",
    )
  }

  if (experiment.replicates < 3) {
    reasons.push(
      "Fewer than three replicates were recorded.",
    )
  }

  if (
    !evidence.photoEvidenceRecorded
  ) {
    reasons.push(
      "Photographic evidence has not been recorded.",
    )
  }

  if (
    !evidence.laboratoryEvidenceRecorded
  ) {
    reasons.push(
      "Laboratory evidence has not been recorded.",
    )
  }

  if (reasons.length === 0) {
    reasons.push(
      `Quality assessment score: ${score}/100.`,
    )
  }

  return reasons
}