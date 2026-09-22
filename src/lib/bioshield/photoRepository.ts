import { db, type PhotoRecord } from "./database"
import { getCurrentUser } from "./authRepository"

export type CreatePhotoInput = {
  experimentId: string
  title: string
  caption?: string
  treatment?: string
  surface?: string
  replicate?: number
  day?: number
  file: File
}

async function getOwnerId(): Promise<string> {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error("You must be signed in to manage evidence.")
  }

  return user.id
}

async function verifyExperimentOwnership(
  experimentId: string,
  ownerId: string,
): Promise<boolean> {
  const experiment = await db.experiments
    .where("id")
    .equals(experimentId)
    .first()

  return Boolean(
    experiment &&
      !experiment.isDeleted &&
      experiment.ownerId === ownerId,
  )
}

export async function createPhoto(
  input: CreatePhotoInput,
): Promise<PhotoRecord> {
  const ownerId = await getOwnerId()

  const ownsExperiment = await verifyExperimentOwnership(
    input.experimentId,
    ownerId,
  )

  if (!ownsExperiment) {
    throw new Error(
      "You do not have permission to add evidence to this experiment.",
    )
  }

  const now = new Date().toISOString()

  const photo: PhotoRecord = {
    id: crypto.randomUUID(),
    ownerId,
    experimentId: input.experimentId,

    title: input.title,
    caption: input.caption ?? "",

    treatment: input.treatment,
    surface: input.surface,
    replicate: input.replicate,
    day: input.day,

    fileName: input.file.name,
    mimeType: input.file.type || "application/octet-stream",
    fileSize: input.file.size,

    imageBlob: input.file,

    createdAt: now,
    updatedAt: now,
    isDeleted: false,
  }

  await db.photos.add(photo)

  return photo
}

export async function getPhoto(
  id: string,
): Promise<PhotoRecord | undefined> {
  const ownerId = await getOwnerId()

  const photo = await db.photos
    .where("id")
    .equals(id)
    .first()

  if (
    !photo ||
    photo.isDeleted ||
    photo.ownerId !== ownerId
  ) {
    return undefined
  }

  return photo
}

export async function listPhotos(
  experimentId: string,
): Promise<PhotoRecord[]> {
  const ownerId = await getOwnerId()

  const ownsExperiment = await verifyExperimentOwnership(
    experimentId,
    ownerId,
  )

  if (!ownsExperiment) {
    return []
  }

  const photos = await db.photos
    .where("experimentId")
    .equals(experimentId)
    .filter(
      (photo) =>
        !photo.isDeleted &&
        photo.ownerId === ownerId,
    )
    .toArray()

  photos.sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  )

  return photos
}

export async function updatePhoto(
  id: string,
  updates: Partial<
    Pick<
      PhotoRecord,
      | "title"
      | "caption"
      | "treatment"
      | "surface"
      | "replicate"
      | "day"
    >
  >,
): Promise<PhotoRecord> {
  const ownerId = await getOwnerId()

  const photo = await db.photos
    .where("id")
    .equals(id)
    .first()

  if (
    !photo ||
    photo.isDeleted ||
    photo.ownerId !== ownerId
  ) {
    throw new Error(
      "You do not have permission to modify this evidence.",
    )
  }

  await db.photos.update(id, {
    ...updates,
    updatedAt: new Date().toISOString(),
  })

  const updated = await db.photos
    .where("id")
    .equals(id)
    .first()

  if (!updated) {
    throw new Error(
      "The photograph could not be updated.",
    )
  }

  return updated
}

export async function deletePhoto(
  id: string,
): Promise<void> {
  const ownerId = await getOwnerId()

  const photo = await db.photos
    .where("id")
    .equals(id)
    .first()

  if (!photo || photo.ownerId !== ownerId) {
    throw new Error(
      "You do not have permission to archive this evidence.",
    )
  }

  await db.photos.update(id, {
    isDeleted: true,
    updatedAt: new Date().toISOString(),
  })
}

export function createPhotoPreviewUrl(
  photo: PhotoRecord,
): string {
  return URL.createObjectURL(photo.imageBlob)
}