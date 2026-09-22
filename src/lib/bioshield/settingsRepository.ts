import {
  db,
  type BioShieldSettingsRecord,
} from "./database"

import { getCurrentUser } from "./authRepository"

const SETTINGS_ID = "application-settings"

export const DEFAULT_SETTINGS: BioShieldSettingsRecord = {
  id: SETTINGS_ID,
  ownerId: undefined,

  researcherName: "",
  institution: "",
  projectId: "",

  temperatureUnit: "C",
  pressureUnit: "hPa",
  dateFormat: "DD/MM/YYYY",

  darkMode: false,

  scientificIntegrityProtection: true,

  updatedAt: new Date().toISOString(),
}

async function getOwnerId(): Promise<string> {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error(
      "You must be signed in to manage BioShield settings.",
    )
  }

  return user.id
}

export async function getSettings(): Promise<BioShieldSettingsRecord> {
  const ownerId = await getOwnerId()

  const saved = await db.appSettings
    .where("ownerId")
    .equals(ownerId)
    .first()

  if (saved) {
    return {
      ...DEFAULT_SETTINGS,
      ...saved,
      ownerId,
    }
  }

  const settings: BioShieldSettingsRecord = {
    ...DEFAULT_SETTINGS,
    ownerId,
    updatedAt: new Date().toISOString(),
  }

  await db.appSettings.put(settings)

  return settings
}

export async function saveSettings(
  settings: BioShieldSettingsRecord,
): Promise<BioShieldSettingsRecord> {
  const ownerId = await getOwnerId()

  const updated: BioShieldSettingsRecord = {
    ...settings,
    id: SETTINGS_ID,
    ownerId,
    updatedAt: new Date().toISOString(),
  }

  await db.appSettings.put(updated)

  return updated
}

export async function resetPreferences(
  current: BioShieldSettingsRecord,
): Promise<BioShieldSettingsRecord> {
  const ownerId = await getOwnerId()

  const reset: BioShieldSettingsRecord = {
    ...DEFAULT_SETTINGS,

    id: SETTINGS_ID,
    ownerId,

    researcherName: current.researcherName,
    institution: current.institution,
    projectId: current.projectId,

    updatedAt: new Date().toISOString(),
  }

  await db.appSettings.put(reset)

  return reset
}

export async function exportResearchBackup() {
  const ownerId = await getOwnerId()

  const [
    experiments,
    observations,
    laboratoryResults,
    followUps,
    sharedExperiments,
    photos,
  ] = await Promise.all([
    db.experiments
      .where("ownerId")
      .equals(ownerId)
      .toArray(),

    db.observations
      .where("ownerId")
      .equals(ownerId)
      .toArray(),

    db.laboratoryResults
      .where("ownerId")
      .equals(ownerId)
      .toArray(),

    db.followUpExperiments
      .where("ownerId")
      .equals(ownerId)
      .toArray(),

    db.sharedExperiments
      .where("ownerId")
      .equals(ownerId)
      .toArray(),

    db.photos
      .where("ownerId")
      .equals(ownerId)
      .toArray(),
  ])

  const settings = await getSettings()

  return {
    bioShieldBackup: true,
    application: "BioShield",
    title: "Beyond Disinfection",
    exportedAt: new Date().toISOString(),

    settings,

    data: {
      experiments,
      observations,
      laboratoryResults,
      followUps,
      sharedExperiments,

      /*
       * Photo binary data is stored separately.
       * Metadata is included in the backup.
       */
      photos: photos.map((photo) => ({
        id: photo.id,
        ownerId: photo.ownerId,
        experimentId: photo.experimentId,
        title: photo.title,
        caption: photo.caption,
        treatment: photo.treatment,
        surface: photo.surface,
        replicate: photo.replicate,
        day: photo.day,
        fileName: photo.fileName,
        mimeType: photo.mimeType,
        fileSize: photo.fileSize,
        createdAt: photo.createdAt,
        updatedAt: photo.updatedAt,
        isDeleted: photo.isDeleted,
      })),
    },

    note:
      "This backup contains BioShield database records and photo metadata. Original photo binary files remain stored separately in IndexedDB.",
  }
}