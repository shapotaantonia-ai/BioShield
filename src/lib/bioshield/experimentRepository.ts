import {
  db,
  type ExperimentRecord,
  type ExperimentQualityEvidence,
  type ObservationRecord,
} from "./database"

import { getCurrentUser } from "./authRepository"

export type { ExperimentRecord } from "./database"

export type CreateExperimentInput = Omit<
  ExperimentRecord,
  | "id"
  | "createdAt"
  | "updatedAt"
  | "isDeleted"
  | "methodLocked"
  | "methodLockedAt"
  | "ownerId"
>

export const emptyQualityEvidence: ExperimentQualityEvidence = {
  concentrationRecorded: false,
  activeConcentrationVerified: false,
  treatmentVolumeRecorded: false,
  surfaceAreaRecorded: false,
  contactTimeRecorded: false,
  environmentalReadingsRecorded: false,
  photoEvidenceRecorded: false,
  laboratoryEvidenceRecorded: false,

  concentrationNotes: "",
  measurementNotes: "",
  environmentalNotes: "",
  evidenceNotes: "",
}

let migrationComplete = false

async function getOwnerId(): Promise<string> {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error(
      "You must be signed in to access BioShield experiment data.",
    )
  }

  return user.id
}

async function migrateLegacyLocalStorage() {
  if (migrationComplete) return

  if (typeof window === "undefined") return

  const ownerId = await getOwnerId()

  migrationComplete = true

  const legacy = window.localStorage.getItem(
    "bioshield-experiments",
  )

  if (!legacy) return

  try {
    const parsed = JSON.parse(
      legacy,
    ) as Partial<ExperimentRecord>[]

    if (!Array.isArray(parsed) || parsed.length === 0) {
      return
    }

    const existingIds = new Set(
      await db.experiments
        .toCollection()
        .primaryKeys(),
    )

    const records = parsed
      .filter(
        (item) =>
          item.id &&
          !existingIds.has(item.id),
      )
      .map((item) => ({
        id: item.id as string,

        ownerId,

        title:
          item.title ??
          "Untitled experiment",

        researchQuestion:
          item.researchQuestion ??
          "",

        aim:
          item.aim ??
          "",

        hypothesis:
          item.hypothesis ??
          "",

        researcher:
          item.researcher ??
          "",

        replicates:
          Number(item.replicates) || 1,

        treatments:
          Array.isArray(item.treatments)
            ? item.treatments
            : [],

        surfaces:
          Array.isArray(item.surfaces)
            ? item.surfaces
            : [],

        createdAt:
          item.createdAt ??
          new Date().toISOString(),

        updatedAt:
          item.updatedAt ??
          new Date().toISOString(),

        isDeleted: false,

        methodLocked:
          item.methodLocked ?? false,

        methodLockedAt:
          item.methodLockedAt,

        qualityEvidence:
          item.qualityEvidence ??
          {
            ...emptyQualityEvidence,
          },
      }))

    if (records.length > 0) {
      await db.experiments.bulkAdd(records)
    }

    window.localStorage.removeItem(
      "bioshield-experiments",
    )
  } catch {
    migrationComplete = false
  }
}

export async function createExperiment(
  input: CreateExperimentInput,
): Promise<ExperimentRecord> {
  await migrateLegacyLocalStorage()

  const ownerId = await getOwnerId()

  const now =
    new Date().toISOString()

  const experiment: ExperimentRecord = {
    ...input,

    id: crypto.randomUUID(),

    ownerId,

    createdAt: now,
    updatedAt: now,

    isDeleted: false,

    methodLocked: false,

    qualityEvidence:
      input.qualityEvidence ?? {
        ...emptyQualityEvidence,
      },
  }

  await db.experiments.add(
    experiment,
  )

  return experiment
}

export async function listExperiments(): Promise<
  ExperimentRecord[]
> {
  await migrateLegacyLocalStorage()

  const ownerId = await getOwnerId()

  return db.experiments
    .filter(
      (experiment) =>
        !experiment.isDeleted &&
        experiment.ownerId === ownerId,
    )
    .toArray()
    .then((items) =>
      items.sort((a, b) =>
        b.updatedAt.localeCompare(
          a.updatedAt,
        ),
      ),
    )
}

export async function getExperiment(
  experimentId: string,
): Promise<
  ExperimentRecord | undefined
> {
  await migrateLegacyLocalStorage()

  const ownerId = await getOwnerId()

  const experiment =
    await db.experiments.get(
      experimentId,
    )

  if (
    !experiment ||
    experiment.isDeleted ||
    experiment.ownerId !== ownerId
  ) {
    return undefined
  }

  return experiment
}

export async function updateExperimentQuality(
  experimentId: string,
  qualityEvidence: ExperimentQualityEvidence,
): Promise<
  ExperimentRecord | undefined
> {
  const ownerId = await getOwnerId()

  const experiment =
    await db.experiments.get(
      experimentId,
    )

  if (
    !experiment ||
    experiment.isDeleted ||
    experiment.ownerId !== ownerId
  ) {
    return undefined
  }

  const now =
    new Date().toISOString()

  await db.experiments.update(
    experimentId,
    {
      qualityEvidence: {
        ...emptyQualityEvidence,
        ...qualityEvidence,
      },

      updatedAt: now,
    },
  )

  return db.experiments.get(
    experimentId,
  )
}

export async function lockExperimentMethod(
  experimentId: string,
): Promise<
  ExperimentRecord | undefined
> {
  const ownerId = await getOwnerId()

  const experiment =
    await db.experiments.get(
      experimentId,
    )

  if (
    !experiment ||
    experiment.isDeleted ||
    experiment.ownerId !== ownerId
  ) {
    return undefined
  }

  if (experiment.methodLocked) {
    return experiment
  }

  const now =
    new Date().toISOString()

  await db.experiments.update(
    experimentId,
    {
      methodLocked: true,
      methodLockedAt: now,
      updatedAt: now,
    },
  )

  return db.experiments.get(
    experimentId,
  )
}

/*
 * BioShield demonstration dataset
 *
 * IMPORTANT:
 *
 * This dataset uses the actual recorded
 * demonstration observations.
 *
 * visualScore is a visual contamination
 * score from 0–8.
 *
 * It is NOT a bacterial count.
 *
 * The Research Quality evidence below
 * deliberately distinguishes:
 *
 * - information that was recorded
 * - information that was not recorded
 * - information that could not be verified
 *
 * BioShield must never turn missing
 * information into a scientific claim.
 */

export async function seedDemoExperiment(): Promise<void> {
  await migrateLegacyLocalStorage()

  const ownerId = await getOwnerId()

  const existing =
    await db.experiments
      .filter(
        (experiment) =>
          !experiment.isDeleted &&
          experiment.ownerId === ownerId &&
          experiment.title ===
            "DEMO — Beyond Disinfection Surface-Treatment Study",
      )
      .first()

  if (existing) {
    return
  }

  const now =
    new Date().toISOString()

  const experiment: ExperimentRecord = {
    id: crypto.randomUUID(),

    ownerId,

    title:
      "DEMO — Beyond Disinfection Surface-Treatment Study",

    researchQuestion:
      "How do treatment type and surface material influence changes in visual contamination over time on plastic, steel and wood surfaces?",

    aim:
      "To investigate how treatment type and surface material influence changes in visual contamination over time by comparing a natural citrus preparation, a diluted chemical treatment and an untreated control on plastic, steel and wood surfaces.",

    hypothesis:
      "It was hypothesised that changes in visual contamination over time would differ according to both treatment type and surface material.",

    researcher:
      "BioShield demonstration dataset",

    replicates: 1,

    treatments: [
      "Untreated control",
      "Natural citrus",
      "Chemical treatment",
    ],

    surfaces: [
      "Plastic",
      "Steel",
      "Wood",
    ],

    createdAt: now,
    updatedAt: now,

    isDeleted: false,

    methodLocked: true,
    methodLockedAt: now,

    qualityEvidence: {
      ...emptyQualityEvidence,

      concentrationRecorded: true,

      activeConcentrationVerified: false,

      concentrationNotes:
        "Natural citrus preparation: one quarter lemon peel + one quarter orange peel with 75 mL water. Active citrus compound concentration was not measured. Chemical treatment: 25 mL commercial Jik + 50 mL distilled water = 75 mL final mixture. The active chemical concentration of the diluted treatment was not verified.",

      treatmentVolumeRecorded: false,

      surfaceAreaRecorded: false,

      contactTimeRecorded: true,

      measurementNotes:
        "Treatments were exposed for 1 hour before swab testing. Treatment volume applied to each surface and formal surface area measurements were not recorded in the demonstration dataset. Therefore volume-per-area could not be calculated.",

      environmentalReadingsRecorded: true,

      environmentalNotes:
        "Swab testing conditions were recorded as approximately 19–24°C. Environmental readings were recorded during the observation period, including temperature, humidity and pressure.",

      photoEvidenceRecorded: false,

      laboratoryEvidenceRecorded: true,

      evidenceNotes:
        "Laboratory microscopy and cultivation evidence existed separately from the visual observation dataset. Microbial growth was observed, but clearly separated colonies were not reliably available for quantitative comparison. Laboratory evidence must therefore remain separate from the visual contamination scores.",
    },
  }

  await db.experiments.add(
    experiment,
  )

  const scores: Record<
    string,
    Record<string, number[]>
  > = {
    "Untreated control": {
      Plastic: [
        0,
        1,
        2,
        4,
        6,
        6,
      ],

      Steel: [
        0,
        0,
        2,
        4,
        6,
        6,
      ],

      Wood: [
        0,
        0,
        1,
        4,
        5,
        5,
      ],
    },

    "Natural citrus": {
      Plastic: [
        0,
        0,
        0,
        0,
        0,
        0,
      ],

      Steel: [
        0,
        0,
        0,
        0,
        1,
        1,
      ],

      Wood: [
        0,
        0,
        0,
        1,
        1,
        1,
      ],
    },

    "Chemical treatment": {
      Plastic: [
        0,
        0,
        0,
        0,
        0,
        0,
      ],

      Steel: [
        0,
        0,
        3,
        6,
        8,
        8,
      ],

      Wood: [
        0,
        0,
        0,
        0,
        0,
        0,
      ],
    },
  }

  const observations: ObservationRecord[] = []

  for (
    const treatment of experiment.treatments
  ) {
    for (
      const surface of experiment.surfaces
    ) {
      const dailyScores =
        scores[treatment][surface]

      for (
        let index = 0;
        index < dailyScores.length;
        index++
      ) {
        const day = index + 1

        let notes = ""

        if (
          treatment ===
            "Chemical treatment" &&
          surface === "Steel" &&
          day >= 3
        ) {
          notes =
            "Dark spots observed on chemically treated steel. Cause not established from available evidence."
        }

        if (
          treatment ===
            "Natural citrus" &&
          surface === "Plastic"
        ) {
          notes =
            "No visible contamination recorded for this observation."
        }

        observations.push({
          id: crypto.randomUUID(),

          ownerId,

          experimentId:
            experiment.id,

          treatment,
          surface,

          replicate: 1,
          day,

          visualScore:
            dailyScores[index],

          notes,

          createdAt: now,
          updatedAt: now,

          isDeleted: false,
        })
      }
    }
  }

  await db.observations.bulkAdd(
    observations,
  )
}