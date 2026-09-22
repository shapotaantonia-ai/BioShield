import { useEffect, useState } from "react"
import { createPhoto } from "../lib/bioshield/photoRepository"
type PhotoUploadProps = {
  experimentId: string
  treatment?: string
  surface?: string
  replicate?: number
  day?: number
  onSaved?: () => void
}

export default function PhotoUpload({
  experimentId,
  treatment,
  surface,
  replicate,
  day,
  onSaved,
}: PhotoUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState("")
  const [title, setTitle] = useState("")
  const [caption, setCaption] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    if (!file) {
      setPreviewUrl("")
      return
    }

    const url = URL.createObjectURL(file)
    setPreviewUrl(url)

    return () => {
      URL.revokeObjectURL(url)
    }
  }, [file])

  function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const selectedFile = event.target.files?.[0]

    setError("")
    setSuccess("")

    if (!selectedFile) {
      return
    }

    if (!["image/jpeg", "image/png"].includes(selectedFile.type)) {
      setError("Please select a JPG, JPEG or PNG image.")
      return
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("The image must be smaller than 10 MB.")
      return
    }

    setFile(selectedFile)

    if (!title) {
      setTitle(
        selectedFile.name.replace(/\.[^/.]+$/, ""),
      )
    }
  }

  async function handleSave() {
    setError("")
    setSuccess("")

    if (!file) {
      setError("Select a photograph first.")
      return
    }

    if (!title.trim()) {
      setError("Give the photograph a title.")
      return
    }

    try {
      setSaving(true)

      await createPhoto({
        experimentId,
        title,
        caption,
        treatment,
        surface,
        replicate,
        day,
        file,
      })

      setFile(null)
      setTitle("")
      setCaption("")
      setSuccess("Photo evidence saved successfully.")

      onSaved?.()
    } catch (saveError) {
      console.error(saveError)
      setError(
        "The photograph could not be saved. Please try again.",
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="photo-upload-card">
      <div className="photo-upload-header">
        <div>
          <p className="eyebrow">PHOTO EVIDENCE</p>

          <h3>Add experimental photograph</h3>

          <p>
            Store the original image as evidence linked to this
            experiment.
          </p>
        </div>
      </div>

      <label className="photo-dropzone">
        <input
          type="file"
          accept="image/png,image/jpeg"
          onChange={handleFileChange}
          hidden
        />

        <div className="photo-upload-icon">+</div>

        <strong>
          {file
            ? "Choose a different photograph"
            : "Choose photograph"}
        </strong>

        <span>
          JPG, JPEG or PNG · maximum 10 MB
        </span>
      </label>

      {previewUrl && (
        <div className="photo-preview">
          <img
            src={previewUrl}
            alt="Selected experimental evidence"
          />

          <div className="photo-preview-info">
            <strong>{file?.name}</strong>

            <span>
              {file
                ? `${(file.size / 1024 / 1024).toFixed(2)} MB`
                : ""}
            </span>
          </div>
        </div>
      )}

      <div className="photo-form">
        <label>
          <span>Photo title</span>

          <input
            value={title}
            onChange={(event) =>
              setTitle(event.target.value)
            }
            placeholder="e.g. Chemical steel Day 3"
          />
        </label>

        <label>
          <span>Caption / observation</span>

          <textarea
            value={caption}
            onChange={(event) =>
              setCaption(event.target.value)
            }
            placeholder="Describe what the photograph shows."
            rows={4}
          />
        </label>

        {(treatment ||
          surface ||
          replicate !== undefined ||
          day !== undefined) && (
          <div className="photo-context">
            <strong>Experimental context</strong>

            <div>
              {treatment && (
                <span>Treatment: {treatment}</span>
              )}

              {surface && (
                <span>Surface: {surface}</span>
              )}

              {replicate !== undefined && (
                <span>
                  Replicate: {replicate}
                </span>
              )}

              {day !== undefined && (
                <span>Day: {day}</span>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="photo-message error">
            {error}
          </div>
        )}

        {success && (
          <div className="photo-message success">
            {success}
          </div>
        )}

        <button
          type="button"
          className="create-button"
          onClick={handleSave}
          disabled={saving || !file}
        >
          {saving ? "Saving…" : "Save photo evidence"}
        </button>
      </div>
    </section>
  )
}