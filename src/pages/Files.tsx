import { useEffect, useState } from "react"

import {
  db,
  type ExperimentRecord,
  type PhotoRecord,
} from "../lib/bioshield/database"

import {
  deletePhoto,
  listPhotos,
  createPhotoPreviewUrl,
} from "../lib/bioshield/photoRepository"

import PhotoUpload from "../components/PhotoUpload"

type FilesProps = {
  onNavigate: (page: string) => void
}

export default function Files({ onNavigate }: FilesProps) {
  const [experiments, setExperiments] = useState<ExperimentRecord[]>([])
  const [selectedExperimentId, setSelectedExperimentId] = useState("")
  const [photos, setPhotos] = useState<PhotoRecord[]>([])
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({})
  const [selectedPhoto, setSelectedPhoto] =
    useState<PhotoRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState("")

  async function loadExperiments() {
    const records = await db.experiments
      .filter((experiment) => !experiment.isDeleted)
      .toArray()

    records.sort((a, b) =>
      b.updatedAt.localeCompare(a.updatedAt),
    )

    setExperiments(records)

    if (
      records.length > 0 &&
      !records.some(
        (experiment) => experiment.id === selectedExperimentId,
      )
    ) {
      setSelectedExperimentId(records[0].id)
    }

    setLoading(false)
  }

  async function loadPhotos(experimentId: string) {
    const records = await listPhotos(experimentId)
    setPhotos(records)
  }

  useEffect(() => {
    loadExperiments().catch((error) => {
      console.error("Could not load experiments:", error)
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (!selectedExperimentId) {
      setPhotos([])
      return
    }

    loadPhotos(selectedExperimentId).catch((error) => {
      console.error("Could not load photographs:", error)
    })
  }, [selectedExperimentId])

  useEffect(() => {
    const urls: Record<string, string> = {}

    for (const photo of photos) {
      urls[photo.id] = createPhotoPreviewUrl(photo)
    }

    setPhotoUrls(urls)

    return () => {
      Object.values(urls).forEach((url) => {
        URL.revokeObjectURL(url)
      })
    }
  }, [photos])

  const selectedExperiment = experiments.find(
    (experiment) => experiment.id === selectedExperimentId,
  )

  async function handlePhotoSaved() {
    if (!selectedExperimentId) return

    await loadPhotos(selectedExperimentId)
    setMessage("Photo evidence saved.")
  }

  async function handleDeletePhoto(photo: PhotoRecord) {
    const confirmed = window.confirm(
      `Archive "${photo.title}" from the experiment evidence?`,
    )

    if (!confirmed) return

    try {
      await deletePhoto(photo.id)

      if (selectedExperimentId) {
        await loadPhotos(selectedExperimentId)
      }

      setSelectedPhoto(null)
      setMessage("Photo evidence archived.")
    } catch (error) {
      console.error(error)
      setMessage("The photograph could not be archived.")
    }
  }

  if (loading) {
    return (
      <div className="files-page">
        <p className="eyebrow">EVIDENCE</p>

        <h3 className="page-title">
          Experimental photographs
        </h3>

        <p className="page-description">
          Loading experimental evidence…
        </p>

        <div className="page-navigation">
          <button
            type="button"
            className="secondary-button"
            onClick={() => onNavigate("Dashboard")}
          >
            ← Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="files-page">
      <div className="files-page-header">
        <div>
          <p className="eyebrow">EVIDENCE</p>

          <h3 className="page-title">
            Experimental photographs
          </h3>

          <p className="page-description">
            Store and review original photographs linked to your
            BioShield experiments.
          </p>
        </div>

        <div className="files-count">
          <strong>{photos.length}</strong>

          <span>
            photograph{photos.length === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      <div className="page-navigation">
        <button
          type="button"
          className="secondary-button"
          onClick={() => onNavigate("Dashboard")}
        >
          ← Dashboard
        </button>

        <button
          type="button"
          className="secondary-button"
          onClick={() => onNavigate("Experiments")}
        >
          Experiments
        </button>

        <button
          type="button"
          className="secondary-button"
          onClick={() => onNavigate("Observations")}
        >
          Observations
        </button>

        <button
          type="button"
          className="create-button"
          onClick={() => onNavigate("Reports")}
        >
          Reports →
        </button>
      </div>

      {experiments.length === 0 ? (
        <div className="empty-state">
          <h4>No experiments available</h4>

          <p>
            Create an experiment first. Photographs must be linked
            to an experiment so the evidence remains traceable.
          </p>

          <div className="page-navigation">
            <button
              type="button"
              className="create-button"
              onClick={() => onNavigate("Builder")}
            >
              + Create experiment
            </button>

            <button
              type="button"
              className="secondary-button"
              onClick={() => onNavigate("Dashboard")}
            >
              Dashboard
            </button>
          </div>
        </div>
      ) : (
        <>
          <section className="files-experiment-selector">
            <label>
              <span>Select experiment</span>

              <select
                value={selectedExperimentId}
                onChange={(event) =>
                  setSelectedExperimentId(event.target.value)
                }
              >
                {experiments.map((experiment) => (
                  <option
                    key={experiment.id}
                    value={experiment.id}
                  >
                    {experiment.title}
                  </option>
                ))}
              </select>
            </label>

            {selectedExperiment && (
              <div className="files-experiment-info">
                <strong>{selectedExperiment.title}</strong>

                <span>
                  {selectedExperiment.researchQuestion ||
                    "No research question recorded."}
                </span>
              </div>
            )}
          </section>

          {message && (
            <div className="photo-message success">
              {message}
            </div>
          )}

          <PhotoUpload
            experimentId={selectedExperimentId}
            onSaved={handlePhotoSaved}
          />

          <section className="photo-gallery-section">
            <div className="photo-gallery-header">
              <div>
                <p className="eyebrow">PHOTO LIBRARY</p>

                <h3>Stored evidence</h3>
              </div>

              <span>
                {photos.length} stored
              </span>
            </div>

            {photos.length === 0 ? (
              <div className="empty-state">
                <h4>No photographs recorded yet</h4>

                <p>
                  Upload a photograph above to create your first
                  piece of stored visual evidence.
                </p>
              </div>
            ) : (
              <div className="photo-gallery">
                {photos.map((photo) => (
                  <article
                    className="photo-card"
                    key={photo.id}
                  >
                    <button
                      type="button"
                      className="photo-image-button"
                      onClick={() => setSelectedPhoto(photo)}
                    >
                      {photoUrls[photo.id] ? (
                        <img
                          src={photoUrls[photo.id]}
                          alt={photo.title}
                        />
                      ) : (
                        <div className="photo-loading">
                          Loading image…
                        </div>
                      )}
                    </button>

                    <div className="photo-card-body">
                      <h4>{photo.title}</h4>

                      {photo.caption && (
                        <p>{photo.caption}</p>
                      )}

                      <div className="photo-metadata">
                        {photo.treatment && (
                          <span>
                            Treatment: {photo.treatment}
                          </span>
                        )}

                        {photo.surface && (
                          <span>
                            Surface: {photo.surface}
                          </span>
                        )}

                        {photo.replicate !== undefined && (
                          <span>
                            Replicate: {photo.replicate}
                          </span>
                        )}

                        {photo.day !== undefined && (
                          <span>
                            Day: {photo.day}
                          </span>
                        )}
                      </div>

                      <div className="photo-card-footer">
                        <small>{photo.fileName}</small>

                        <button
                          type="button"
                          className="danger-button"
                          onClick={() =>
                            handleDeletePhoto(photo)
                          }
                        >
                          Archive
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <div className="page-navigation">
            <button
              type="button"
              className="secondary-button"
              onClick={() => onNavigate("Observations")}
            >
              ← Observations
            </button>

            <button
              type="button"
              className="secondary-button"
              onClick={() => onNavigate("Analysis")}
            >
              Analysis
            </button>

            <button
              type="button"
              className="secondary-button"
              onClick={() => onNavigate("Research Quality")}
            >
              Research Quality
            </button>

            <button
              type="button"
              className="create-button"
              onClick={() => onNavigate("Reports")}
            >
              Reports →
            </button>
          </div>
        </>
      )}

      {selectedPhoto && (
        <div
          className="photo-lightbox"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="photo-lightbox-content"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="photo-lightbox-close"
              onClick={() => setSelectedPhoto(null)}
            >
              ×
            </button>

            {photoUrls[selectedPhoto.id] && (
              <img
                src={photoUrls[selectedPhoto.id]}
                alt={selectedPhoto.title}
              />
            )}

            <div className="photo-lightbox-details">
              <h3>{selectedPhoto.title}</h3>

              {selectedPhoto.caption && (
                <p>{selectedPhoto.caption}</p>
              )}

              <div className="photo-metadata">
                {selectedPhoto.treatment && (
                  <span>
                    Treatment: {selectedPhoto.treatment}
                  </span>
                )}

                {selectedPhoto.surface && (
                  <span>
                    Surface: {selectedPhoto.surface}
                  </span>
                )}

                {selectedPhoto.replicate !== undefined && (
                  <span>
                    Replicate: {selectedPhoto.replicate}
                  </span>
                )}

                {selectedPhoto.day !== undefined && (
                  <span>
                    Day: {selectedPhoto.day}
                  </span>
                )}
              </div>

              <button
                type="button"
                className="danger-button"
                onClick={() =>
                  handleDeletePhoto(selectedPhoto)
                }
              >
                Archive photograph
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}