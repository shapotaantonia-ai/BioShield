import {
  db,
  type ObservationRecord,
} from "./database"

import { getCurrentUser } from "./authRepository"

export type { ObservationRecord } from "./database"

export type CreateObservationInput = Omit<
  ObservationRecord,
  | "id"
  | "createdAt"
  | "updatedAt"
  | "isDeleted"
  | "ownerId"
>

async function getOwnerId(): Promise<string> {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error(
      "You must be signed in to access BioShield observations.",
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

export async function createObservation(
  input: CreateObservationInput,
): Promise<ObservationRecord> {
  const ownerId = await getOwnerId()

  /*
   * An observation must belong to an experiment
   * owned by the currently signed-in researcher.
   */
  const ownsExperiment =
    await verifyExperimentOwnership(
      input.experimentId,
      ownerId,
    )

  if (!ownsExperiment) {
    throw new Error(
      "You cannot add an observation to an experiment you do not own.",
    )
  }

  /*
   * Look for an existing observation belonging
   * to the same researcher.
   */
  const existing =
    await db.observations
      .where({
        experimentId:
          input.experimentId,

        treatment:
          input.treatment,

        surface:
          input.surface,

        replicate:
          input.replicate,

        day:
          input.day,
      })
      .filter(
        (observation) =>
          !observation.isDeleted &&
          observation.ownerId === ownerId,
      )
      .first()

  const now =
    new Date().toISOString()

  if (existing) {
    const updated: ObservationRecord = {
      ...existing,

      ...input,

      ownerId,

      updatedAt: now,

      isDeleted: false,
    }

    await db.observations.put(
      updated,
    )

    return updated
  }

  const observation: ObservationRecord = {
    ...input,

    id: crypto.randomUUID(),

    ownerId,

    createdAt: now,

    updatedAt: now,

    isDeleted: false,
  }

  await db.observations.add(
    observation,
  )

  return observation
}

export async function listObservations(
  experimentId: string,
): Promise<ObservationRecord[]> {
  const ownerId = await getOwnerId()

  /*
   * Only return observations that:
   *
   * 1. belong to this experiment
   * 2. belong to the signed-in researcher
   * 3. are not deleted
   */
  return db.observations
    .where("experimentId")
    .equals(experimentId)
    .filter(
      (observation) =>
        !observation.isDeleted &&
        observation.ownerId === ownerId,
    )
    .toArray()
}

export async function deleteObservation(
  observationId: string,
): Promise<void> {
  const ownerId = await getOwnerId()

  const observation =
    await db.observations.get(
      observationId,
    )

  /*
   * Never allow one account to delete
   * another account's scientific record.
   */
  if (
    !observation ||
    observation.isDeleted ||
    observation.ownerId !== ownerId
  ) {
    return
  }

  await db.observations.update(
    observationId,
    {
      isDeleted: true,

      updatedAt:
        new Date().toISOString(),
    },
  )
}