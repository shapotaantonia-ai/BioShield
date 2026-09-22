import {
  db,
  type LaboratoryResultRecord,
  type LabMethod,
  type LabResultStatus,
} from "./database"

import { getCurrentUser } from "./authRepository"

export type CreateLaboratoryResultInput = {
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
  notes?: string
}

async function getOwnerId(): Promise<string> {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error(
      "You must be signed in to access laboratory results.",
    )
  }

  return user.id
}

async function verifyExperimentOwnership(
  experimentId: string,
  ownerId: string,
): Promise<boolean> {
  const experiment =
    await db.experiments.get(
      experimentId,
    )

  return Boolean(
    experiment &&
      !experiment.isDeleted &&
      experiment.ownerId === ownerId,
  )
}

function createId(): string {
  return crypto.randomUUID()
}

export async function createLaboratoryResult(
  input: CreateLaboratoryResultInput,
): Promise<LaboratoryResultRecord> {
  const ownerId =
    await getOwnerId()

  const ownsExperiment =
    await verifyExperimentOwnership(
      input.experimentId,
      ownerId,
    )

  if (!ownsExperiment) {
    throw new Error(
      "You cannot add laboratory evidence to an experiment you do not own.",
    )
  }

  const now =
    new Date().toISOString()

  const result: LaboratoryResultRecord = {
    id: createId(),

    ownerId,

    experimentId:
      input.experimentId,

    method:
      input.method,

    methodName:
      input.methodName.trim(),

    sampleCode:
      input.sampleCode?.trim() ||
      undefined,

    resultStatus:
      input.resultStatus,

    observation:
      input.observation.trim(),

    interpretation:
      input.interpretation.trim(),

    countable:
      input.countable,

    quantitativeValue:
      input.quantitativeValue,

    quantitativeUnit:
      input.quantitativeUnit?.trim() ||
      undefined,

    confirmationStatus:
      input.confirmationStatus.trim(),

    laboratoryName:
      input.laboratoryName?.trim() ||
      undefined,

    analyst:
      input.analyst?.trim() ||
      undefined,

    performedAt:
      input.performedAt ||
      undefined,

    notes:
      input.notes?.trim() || "",

    createdAt:
      now,

    updatedAt:
      now,

    isDeleted:
      false,
  }

  await db.laboratoryResults.add(
    result,
  )

  return result
}

export async function listLaboratoryResults(
  experimentId: string,
): Promise<LaboratoryResultRecord[]> {
  const ownerId =
    await getOwnerId()

  const ownsExperiment =
    await verifyExperimentOwnership(
      experimentId,
      ownerId,
    )

  if (!ownsExperiment) {
    return []
  }

  const results =
    await db.laboratoryResults
      .where("experimentId")
      .equals(experimentId)
      .and(
        (result) =>
          !result.isDeleted &&
          result.ownerId === ownerId,
      )
      .toArray()

  return results.sort(
    (a, b) =>
      b.createdAt.localeCompare(
        a.createdAt,
      ),
  )
}

export async function updateLaboratoryResult(
  resultId: string,
  changes: Partial<
    Omit<
      LaboratoryResultRecord,
      | "id"
      | "experimentId"
      | "ownerId"
      | "createdAt"
      | "updatedAt"
    >
  >,
): Promise<void> {
  const ownerId =
    await getOwnerId()

  const existing =
    await db.laboratoryResults.get(
      resultId,
    )

  if (
    !existing ||
    existing.isDeleted
  ) {
    throw new Error(
      "Laboratory result could not be found.",
    )
  }

  if (
    existing.ownerId !== ownerId
  ) {
    throw new Error(
      "You cannot modify laboratory evidence belonging to another account.",
    )
  }

  await db.laboratoryResults.update(
    resultId,
    {
      ...changes,

      updatedAt:
        new Date().toISOString(),
    },
  )
}

export async function deleteLaboratoryResult(
  resultId: string,
): Promise<void> {
  const ownerId =
    await getOwnerId()

  const existing =
    await db.laboratoryResults.get(
      resultId,
    )

  if (
    !existing ||
    existing.isDeleted
  ) {
    throw new Error(
      "Laboratory result could not be found.",
    )
  }

  if (
    existing.ownerId !== ownerId
  ) {
    throw new Error(
      "You cannot delete laboratory evidence belonging to another account.",
    )
  }

  /*
   * Scientific evidence is never hard-deleted.
   * We preserve the record and mark it deleted.
   */
  await db.laboratoryResults.update(
    resultId,
    {
      isDeleted: true,

      updatedAt:
        new Date().toISOString(),
    },
  )
}