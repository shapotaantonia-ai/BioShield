import {
  db,
  type FollowUpExperimentRecord,
  type FollowUpReason,
} from "./database"

import { getCurrentUser } from "./authRepository"

export type CreateFollowUpInput = {
  parentExperimentId: string
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
}

async function getOwnerId(): Promise<string> {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error(
      "You must be signed in to access follow-up experiments.",
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

export async function createFollowUpExperiment(
  input: CreateFollowUpInput,
): Promise<FollowUpExperimentRecord> {
  const ownerId =
    await getOwnerId()

  const parent =
    await db.experiments.get(
      input.parentExperimentId,
    )

  if (
    !parent ||
    parent.isDeleted
  ) {
    throw new Error(
      "The original experiment could not be found.",
    )
  }

  if (
    parent.ownerId !== ownerId
  ) {
    throw new Error(
      "You cannot create a follow-up from an experiment belonging to another account.",
    )
  }

  const now =
    new Date().toISOString()

  const followUp: FollowUpExperimentRecord = {
    id: createId(),

    ownerId,

    parentExperimentId:
      input.parentExperimentId,

    parentExperimentVersion:
      parent.updatedAt,

    reason:
      input.reason,

    reasonDetails:
      input.reasonDetails.trim(),

    researchQuestion:
      input.researchQuestion.trim(),

    aim:
      input.aim.trim(),

    hypothesis:
      input.hypothesis.trim(),

    variableChanged:
      input.variableChanged.trim(),

    controlsImproved:
      input.controlsImproved.trim(),

    replicationPlan:
      input.replicationPlan.trim(),

    measurementImprovement:
      input.measurementImprovement.trim(),

    whatChanged:
      input.whatChanged.trim(),

    whatRemainsTheSame:
      input.whatRemainsTheSame.trim(),

    createdAt:
      now,

    updatedAt:
      now,

    isDeleted:
      false,
  }

  await db.followUpExperiments.add(
    followUp,
  )

  return followUp
}

export async function listFollowUpExperiments(
  parentExperimentId?: string,
): Promise<FollowUpExperimentRecord[]> {
  const ownerId =
    await getOwnerId()

  let results:
    FollowUpExperimentRecord[]

  if (parentExperimentId) {
    const ownsExperiment =
      await verifyExperimentOwnership(
        parentExperimentId,
        ownerId,
      )

    if (!ownsExperiment) {
      return []
    }

    results =
      await db.followUpExperiments
        .where("parentExperimentId")
        .equals(parentExperimentId)
        .and(
          (item) =>
            !item.isDeleted &&
            item.ownerId === ownerId,
        )
        .toArray()
  } else {
    results =
      await db.followUpExperiments
        .filter(
          (item) =>
            !item.isDeleted &&
            item.ownerId === ownerId,
        )
        .toArray()
  }

  return results.sort(
    (a, b) =>
      b.createdAt.localeCompare(
        a.createdAt,
      ),
  )
}

export async function getFollowUpExperiment(
  id: string,
): Promise<
  FollowUpExperimentRecord | undefined
> {
  const ownerId =
    await getOwnerId()

  const result =
    await db.followUpExperiments.get(
      id,
    )

  if (
    !result ||
    result.isDeleted ||
    result.ownerId !== ownerId
  ) {
    return undefined
  }

  return result
}

export async function deleteFollowUpExperiment(
  id: string,
): Promise<void> {
  const ownerId =
    await getOwnerId()

  const existing =
    await db.followUpExperiments.get(
      id,
    )

  if (
    !existing ||
    existing.isDeleted
  ) {
    throw new Error(
      "Follow-up experiment could not be found.",
    )
  }

  if (
    existing.ownerId !== ownerId
  ) {
    throw new Error(
      "You cannot delete a follow-up experiment belonging to another account.",
    )
  }

  /*
   * Scientific records are never hard-deleted.
   * Preserve the record and mark it deleted.
   */
  await db.followUpExperiments.update(
    id,
    {
      isDeleted: true,

      updatedAt:
        new Date().toISOString(),
    },
  )
}
