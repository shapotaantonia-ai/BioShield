import { useEffect, useMemo, useState } from "react"

import {
  emptyQualityEvidence,
  listExperiments,
  updateExperimentQuality,
  type ExperimentRecord,
} from "../lib/bioshield/experimentRepository"

import type {
  ExperimentQualityEvidence,
} from "../lib/bioshield/database"

import { listPhotos } from "../lib/bioshield/photoRepository"

type ResearchQualityProps = {
  onNavigate: (page: string) => void
}

type EditorSection =
  | "concentration"
  | "measurements"
  | "environment"
  | "evidence"

type QualityStatus =
  | "pass"
  | "warning"
  | "missing"

type QualityCheck = {
  id: string
  title: string
  description: string
  deduction: number
  status: QualityStatus
  section: EditorSection
  actionLabel: string
}

function ResearchQuality({
  onNavigate,
}: ResearchQualityProps) {
  const [experiments, setExperiments] =
    useState<ExperimentRecord[]>([])

  const [selectedExperimentId, setSelectedExperimentId] =
    useState("")

  const [evidence, setEvidence] =
    useState<ExperimentQualityEvidence>({
      ...emptyQualityEvidence,
    })

  const [photoCount, setPhotoCount] = useState(0)

  const [editorSection, setEditorSection] =
    useState<EditorSection | null>(null)

  const [saving, setSaving] = useState(false)

  useEffect(() => {
    void loadExperiments()
  }, [])

  async function loadExperiments() {
    try {
      const records = await listExperiments()

      setExperiments(records)

      if (records.length === 0) {
        return
      }

      const current =
        records.find(
          (experiment) =>
            experiment.id === selectedExperimentId,
        ) ?? records[0]

      setSelectedExperimentId(current.id)

      setEvidence(
        current.qualityEvidence
          ? { ...current.qualityEvidence }
          : { ...emptyQualityEvidence },
      )

      await loadPhotoEvidence(current.id)
    } catch (error) {
      console.error(
        "Could not load experiments:",
        error,
      )
    }
  }

  async function loadPhotoEvidence(
    experimentId: string,
  ) {
    try {
      const photos = await listPhotos(experimentId)

      setPhotoCount(photos.length)
    } catch (error) {
      console.error(
        "Could not load photo evidence:",
        error,
      )

      setPhotoCount(0)
    }
  }

  function handleExperimentChange(id: string) {
    const experiment = experiments.find(
      (item) => item.id === id,
    )

    if (!experiment) {
      return
    }

    setSelectedExperimentId(id)

    setEvidence(
      experiment.qualityEvidence
        ? { ...experiment.qualityEvidence }
        : { ...emptyQualityEvidence },
    )

    setEditorSection(null)

    void loadPhotoEvidence(id)
  }

  const selectedExperiment =
    experiments.find(
      (experiment) =>
        experiment.id === selectedExperimentId,
    )

  const photoEvidenceRecorded = photoCount > 0

  const qualityChecks = useMemo<QualityCheck[]>(() => {
    if (!selectedExperiment) {
      return []
    }

    const stored =
      selectedExperiment.qualityEvidence ??
      emptyQualityEvidence

    return [
      {
        id: "concentration",
        title: "Treatment formulation recorded",
        description:
          "The treatment formulation or concentration information has been recorded.",
        deduction: 15,
        status:
          stored.concentrationRecorded
            ? "pass"
            : "missing",
        section: "concentration",
        actionLabel:
          stored.concentrationRecorded
            ? "View / edit"
            : "Record",
      },

      {
        id: "active-concentration",
        title: "Active concentration verified",
        description:
          "Checks whether the actual active concentration was experimentally verified rather than assumed.",
        deduction: 15,
        status:
          stored.activeConcentrationVerified
            ? "pass"
            : "warning",
        section: "concentration",
        actionLabel:
          stored.activeConcentrationVerified
            ? "View / edit"
            : "Review",
      },

      {
        id: "volume",
        title: "Applied treatment volume",
        description:
          "The amount of treatment actually applied to the experimental surface is recorded.",
        deduction: 10,
        status:
          stored.treatmentVolumeRecorded
            ? "pass"
            : "missing",
        section: "measurements",
        actionLabel:
          stored.treatmentVolumeRecorded
            ? "View / edit"
            : "Record",
      },

      {
        id: "surface-area",
        title: "Surface area",
        description:
          "Surface area is recorded so that volume-per-area can be evaluated.",
        deduction: 0,
        status:
          stored.surfaceAreaRecorded
            ? "pass"
            : "missing",
        section: "measurements",
        actionLabel:
          stored.surfaceAreaRecorded
            ? "View / edit"
            : "Record",
      },

      {
        id: "contact-time",
        title: "Contact time",
        description:
          "The treatment exposure/contact time has been recorded.",
        deduction: 10,
        status:
          stored.contactTimeRecorded
            ? "pass"
            : "missing",
        section: "measurements",
        actionLabel:
          stored.contactTimeRecorded
            ? "View / edit"
            : "Record",
      },

      {
        id: "environment",
        title: "Environmental readings",
        description:
          "Relevant temperature, humidity, pressure or logger information is recorded.",
        deduction: 10,
        status:
          stored.environmentalReadingsRecorded
            ? "pass"
            : "missing",
        section: "environment",
        actionLabel:
          stored.environmentalReadingsRecorded
            ? "View / edit"
            : "Record",
      },

      {
        id: "photos",
        title: "Photo evidence",
        description:
          photoEvidenceRecorded
            ? `${photoCount} photograph${
                photoCount === 1 ? "" : "s"
              } is stored and linked to this experiment.`
            : "No stored photographs are currently linked to this experiment.",
        deduction: 10,
        status:
          photoEvidenceRecorded
            ? "pass"
            : "missing",
        section: "evidence",
        actionLabel:
          photoEvidenceRecorded
            ? "View evidence"
            : "Add photographs",
      },

      {
        id: "lab",
        title: "Laboratory evidence",
        description:
          "Laboratory evidence is recorded separately from visual observations.",
        deduction: 15,
        status:
          stored.laboratoryEvidenceRecorded
            ? "pass"
            : "missing",
        section: "evidence",
        actionLabel:
          stored.laboratoryEvidenceRecorded
            ? "View / edit"
            : "Record",
      },
    ]
  }, [
    selectedExperiment,
    photoCount,
    photoEvidenceRecorded,
  ])

  const qualityScore = useMemo(() => {
    if (!selectedExperiment) {
      return 0
    }

    let score = 100

    for (const check of qualityChecks) {
      if (
        check.status === "missing" ||
        check.status === "warning"
      ) {
        score -= check.deduction
      }
    }

    if (selectedExperiment.replicates < 3) {
      score -= 15
    }

    if (!selectedExperiment.methodLocked) {
      score -= 5
    }

    if (!selectedExperiment.researchQuestion.trim()) {
      score -= 5
    }

    if (!selectedExperiment.hypothesis.trim()) {
      score -= 5
    }

    return Math.max(
      0,
      Math.min(100, score),
    )
  }, [selectedExperiment, qualityChecks])

  const rating =
    qualityScore >= 85
      ? "HIGH"
      : qualityScore >= 65
        ? "MODERATE"
        : qualityScore >= 40
          ? "LOW"
          : "INSUFFICIENT"

  const passCount =
    qualityChecks.filter(
      (check) => check.status === "pass",
    ).length

  const missingCount =
    qualityChecks.filter(
      (check) => check.status === "missing",
    ).length

  const warningCount =
    qualityChecks.filter(
      (check) => check.status === "warning",
    ).length

  function openEditor(section: EditorSection) {
    setEditorSection(section)
  }

  function closeEditor() {
    if (!saving) {
      setEditorSection(null)
    }
  }

  function updateEvidence(
    changes: Partial<ExperimentQualityEvidence>,
  ) {
    setEvidence((current) => ({
      ...current,
      ...changes,
    }))
  }

  async function saveEvidence() {
    if (!selectedExperiment) {
      return
    }

    setSaving(true)

    try {
      const evidenceToSave = {
        ...evidence,
        photoEvidenceRecorded:
          photoEvidenceRecorded,
      }

      const updated =
        await updateExperimentQuality(
          selectedExperiment.id,
          evidenceToSave,
        )

      if (updated) {
        setExperiments((current) =>
          current.map((experiment) =>
            experiment.id === updated.id
              ? updated
              : experiment,
          ),
        )

        setEvidence(
          updated.qualityEvidence
            ? {
                ...updated.qualityEvidence,
                photoEvidenceRecorded:
                  photoEvidenceRecorded,
              }
            : {
                ...emptyQualityEvidence,
                photoEvidenceRecorded:
                  photoEvidenceRecorded,
              },
        )
      }

      setEditorSection(null)
    } finally {
      setSaving(false)
    }
  }

  if (!selectedExperiment) {
    return (
      <div className="research-quality-page">
        <div className="rq-empty">
          <div className="rq-empty-icon">
            RQ
          </div>

          <h3>No experiment selected</h3>

          <p>
            Create an experiment before assessing
            its research quality.
          </p>

          <div className="page-navigation">
            <button
              type="button"
              className="create-button"
              onClick={() =>
                onNavigate("Builder")
              }
            >
              Create experiment
            </button>

            <button
              type="button"
              className="secondary-button"
              onClick={() =>
                onNavigate("Dashboard")
              }
            >
              Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="research-quality-page">
      <section className="rq-control-bar">
        <div>
          <p className="rq-kicker">
            EXPERIMENTAL QUALITY
          </p>

          <p className="rq-description">
            Assess whether the recorded evidence is
            sufficient to support the conclusions
            being made.
          </p>
        </div>

        <div className="rq-experiment-selector">
          <label htmlFor="rq-experiment">
            Experiment
          </label>

          <select
            id="rq-experiment"
            value={selectedExperiment.id}
            onChange={(event) =>
              handleExperimentChange(
                event.target.value,
              )
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
        </div>
      </section>

      <div className="page-navigation">
        <button
          type="button"
          className="secondary-button"
          onClick={() =>
            onNavigate("Dashboard")
          }
        >
          Dashboard
        </button>

        <button
          type="button"
          className="secondary-button"
          onClick={() =>
            onNavigate("Experiments")
          }
        >
          Experiments
        </button>

        <button
          type="button"
          className="secondary-button"
          onClick={() =>
            onNavigate("Observations")
          }
        >
          Observations
        </button>

        <button
          type="button"
          className="secondary-button"
          onClick={() =>
            onNavigate("Analysis")
          }
        >
          Analysis
        </button>

        <button
          type="button"
          className="secondary-button"
          onClick={() =>
            onNavigate("Scientific Integrity")
          }
        >
          Scientific Integrity
        </button>

        <button
          type="button"
          className="secondary-button"
          onClick={() =>
            onNavigate("Reports")
          }
        >
          Reports
        </button>
      </div>

      <section className="rq-score-panel">
        <div className="rq-score-main">
          <span className="rq-score-label">
            BIOSHIELD QUALITY SCORE
          </span>

          <div className="rq-score-number">
            {qualityScore}
            <small>/100</small>
          </div>

          <div
            className={`rq-score-rating ${rating.toLowerCase()}`}
          >
            {rating}
          </div>
        </div>

        <div className="rq-score-info">
          <h4>
            What this assessment means
          </h4>

          <p>
            BioShield evaluates the completeness
            and traceability of the information
            recorded for this experiment.
          </p>

          <p>
            This is an application-based assessment.
            It is not a universally validated
            scientific quality scale.
          </p>
        </div>

        <div className="rq-counts">
          <div className="rq-count pass">
            <strong>{passCount}</strong>
            <span>Recorded</span>
          </div>

          <div className="rq-count warning">
            <strong>{warningCount}</strong>
            <span>Warnings</span>
          </div>

          <div className="rq-count missing">
            <strong>{missingCount}</strong>
            <span>Missing</span>
          </div>
        </div>
      </section>

      <section className="rq-section">
        <div className="rq-section-header">
          <div>
            <p className="rq-kicker">
              EVIDENCE
            </p>

            <h4>
              Evidence checks
            </h4>
          </div>

          <span className="rq-section-count">
            {qualityChecks.length} checks
          </span>
        </div>

        <div className="rq-check-grid">
          {qualityChecks.map((check) => (
            <article
              className={`rq-check-card ${check.status}`}
              key={check.id}
            >
              <div className="rq-check-top">
                <div
                  className={`rq-status ${check.status}`}
                >
                  {check.status === "pass"
                    ? "✓"
                    : check.status === "warning"
                      ? "!"
                      : "×"}
                </div>

                <div className="rq-check-heading">
                  <h5>{check.title}</h5>

                  <span>
                    {check.status === "pass"
                      ? "Recorded"
                      : check.status === "warning"
                        ? "Needs verification"
                        : "Not recorded"}
                  </span>
                </div>

                {check.deduction > 0 && (
                  <span className="rq-deduction">
                    −{check.deduction}
                  </span>
                )}
              </div>

              <p className="rq-check-description">
                {check.description}
              </p>

              <button
                type="button"
                className="rq-action-button"
                onClick={() =>
                  openEditor(check.section)
                }
              >
                {check.actionLabel}

                <span aria-hidden="true">
                  →
                </span>
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="rq-section">
        <div className="rq-section-header">
          <div>
            <p className="rq-kicker">
              EXPERIMENT DESIGN
            </p>

            <h4>
              Design checks
            </h4>
          </div>
        </div>

        <div className="rq-design-grid">
          <article
            className={`rq-design-card ${
              selectedExperiment.replicates >= 3
                ? "pass"
                : "warning"
            }`}
          >
            <span className="rq-design-label">
              REPLICATION
            </span>

            <strong>
              n = {selectedExperiment.replicates}
            </strong>

            <p>
              {selectedExperiment.replicates >= 3
                ? "At least three replicates are recorded."
                : "Fewer than three replicates are recorded. Reliability statistics should not be applied."}
            </p>

            <div className="rq-readonly-note">
              Replication is managed in the
              Experiment Builder.
            </div>
          </article>

          <article
            className={`rq-design-card ${
              selectedExperiment.methodLocked
                ? "pass"
                : "warning"
            }`}
          >
            <span className="rq-design-label">
              METHOD
            </span>

            <strong>
              {selectedExperiment.methodLocked
                ? "Locked"
                : "Not locked"}
            </strong>

            <p>
              {selectedExperiment.methodLocked
                ? "The experimental method is currently locked."
                : "The experimental method has not been locked."}
            </p>

            <div className="rq-readonly-note">
              Method changes should be handled
              through experiment versioning.
            </div>
          </article>
        </div>
      </section>

      <section className="rq-section">
        <div className="rq-section-header">
          <div>
            <p className="rq-kicker">
              TRACEABILITY
            </p>

            <h4>
              Recorded information
            </h4>
          </div>

          <button
            type="button"
            className="rq-primary-button"
            onClick={() =>
              openEditor("evidence")
            }
          >
            Edit evidence
          </button>
        </div>

        <div className="rq-notes-grid">
          <div className="rq-note-card">
            <span>
              Treatment formulation
            </span>

            <p>
              {evidence.concentrationNotes ||
                "No formulation information recorded."}
            </p>
          </div>

          <div className="rq-note-card">
            <span>
              Measurements
            </span>

            <p>
              {evidence.measurementNotes ||
                "No measurement information recorded."}
            </p>
          </div>

          <div className="rq-note-card">
            <span>
              Environment
            </span>

            <p>
              {evidence.environmentalNotes ||
                "No environmental information recorded."}
            </p>
          </div>

          <div className="rq-note-card">
            <span>
              Supporting evidence
            </span>

            <p>
              {photoEvidenceRecorded
                ? `${photoCount} photograph${
                    photoCount === 1 ? "" : "s"
                  } stored in BioShield. ${
                    evidence.evidenceNotes ||
                    ""
                  }`
                : evidence.evidenceNotes ||
                  "No supporting evidence information recorded."}
            </p>
          </div>
        </div>
      </section>

      <section className="rq-integrity">
        <div className="rq-integrity-icon">
          !
        </div>

        <div>
          <strong>
            Scientific integrity reminder
          </strong>

          <p>
            BioShield records evidence and identifies
            evidence gaps. It does not turn missing
            measurements into proof of treatment
            effectiveness.
          </p>
        </div>
      </section>

      <div className="page-navigation">
        <button
          type="button"
          className="secondary-button"
          onClick={() =>
            onNavigate("Scientific Integrity")
          }
        >
          Scientific Integrity
        </button>

        <button
          type="button"
          className="secondary-button"
          onClick={() =>
            onNavigate("Unexpected Results")
          }
        >
          Unexpected Results
        </button>

        <button
          type="button"
          className="secondary-button"
          onClick={() =>
            onNavigate("Follow-Up")
          }
        >
          Follow-Up Experiment
        </button>

        <button
          type="button"
          className="create-button"
          onClick={() =>
            onNavigate("Reports")
          }
        >
          Generate Report
        </button>

        <button
          type="button"
          className="secondary-button"
          onClick={() =>
            onNavigate("Dashboard")
          }
        >
          Dashboard
        </button>
      </div>

      {editorSection && (
        <div
          className="rq-modal-backdrop"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeEditor()
            }
          }}
        >
          <div
            className="rq-modal"
            role="dialog"
            aria-modal="true"
          >
            <div className="rq-modal-header">
              <div>
                <p className="rq-kicker">
                  RECORD EVIDENCE
                </p>

                <h4>
                  {editorSection === "concentration"
                    ? "Treatment concentration"
                    : editorSection === "measurements"
                      ? "Measurements and contact time"
                      : editorSection === "environment"
                        ? "Environmental readings"
                        : "Supporting evidence"}
                </h4>
              </div>

              <button
                type="button"
                className="rq-close-button"
                onClick={closeEditor}
                disabled={saving}
                aria-label="Close evidence editor"
              >
                ×
              </button>
            </div>

            {editorSection ===
              "concentration" && (
              <div className="rq-form">
                <div className="rq-form-note">
                  <strong>
                    Important
                  </strong>

                  <p>
                    Record the formulation exactly as
                    used. Do not enter an active
                    concentration unless it was actually
                    measured or verified.
                  </p>
                </div>

                <label>
                  <span>
                    Formulation / concentration
                    information
                  </span>

                  <textarea
                    value={
                      evidence.concentrationNotes
                    }
                    onChange={(event) =>
                      updateEvidence({
                        concentrationNotes:
                          event.target.value,
                      })
                    }
                    placeholder="Example: 25 mL commercial disinfectant + 50 mL distilled water = 75 mL final mixture. Active concentration not verified."
                  />
                </label>

                <label className="rq-checkbox">
                  <input
                    type="checkbox"
                    checked={
                      evidence.concentrationRecorded
                    }
                    onChange={(event) =>
                      updateEvidence({
                        concentrationRecorded:
                          event.target.checked,
                      })
                    }
                  />

                  <span>
                    Treatment formulation /
                    concentration is recorded.
                  </span>
                </label>

                <label className="rq-checkbox">
                  <input
                    type="checkbox"
                    checked={
                      evidence.activeConcentrationVerified
                    }
                    onChange={(event) =>
                      updateEvidence({
                        activeConcentrationVerified:
                          event.target.checked,
                      })
                    }
                  />

                  <span>
                    Active concentration was
                    actually verified.
                  </span>
                </label>
              </div>
            )}

            {editorSection ===
              "measurements" && (
              <div className="rq-form">
                <label>
                  <span>
                    Measurement information
                  </span>

                  <textarea
                    value={
                      evidence.measurementNotes
                    }
                    onChange={(event) =>
                      updateEvidence({
                        measurementNotes:
                          event.target.value,
                      })
                    }
                    placeholder="Record treatment volume actually applied, surface area, volume-per-area and contact time."
                  />
                </label>

                <div className="rq-checkbox-list">
                  <label className="rq-checkbox">
                    <input
                      type="checkbox"
                      checked={
                        evidence.treatmentVolumeRecorded
                      }
                      onChange={(event) =>
                        updateEvidence({
                          treatmentVolumeRecorded:
                            event.target.checked,
                        })
                      }
                    />

                    <span>
                      Treatment volume actually
                      applied is recorded.
                    </span>
                  </label>

                  <label className="rq-checkbox">
                    <input
                      type="checkbox"
                      checked={
                        evidence.surfaceAreaRecorded
                      }
                      onChange={(event) =>
                        updateEvidence({
                          surfaceAreaRecorded:
                            event.target.checked,
                        })
                      }
                    />

                    <span>
                      Surface area is recorded.
                    </span>
                  </label>

                  <label className="rq-checkbox">
                    <input
                      type="checkbox"
                      checked={
                        evidence.contactTimeRecorded
                      }
                      onChange={(event) =>
                        updateEvidence({
                          contactTimeRecorded:
                            event.target.checked,
                        })
                      }
                    />

                    <span>
                      Contact time is recorded.
                    </span>
                  </label>
                </div>
              </div>
            )}

            {editorSection ===
              "environment" && (
              <div className="rq-form">
                <label>
                  <span>
                    Environmental information
                  </span>

                  <textarea
                    value={
                      evidence.environmentalNotes
                    }
                    onChange={(event) =>
                      updateEvidence({
                        environmentalNotes:
                          event.target.value,
                      })
                    }
                    placeholder="Record temperature, humidity, pressure, logger information and relevant environmental conditions."
                  />
                </label>

                <label className="rq-checkbox">
                  <input
                    type="checkbox"
                    checked={
                      evidence.environmentalReadingsRecorded
                    }
                    onChange={(event) =>
                      updateEvidence({
                        environmentalReadingsRecorded:
                          event.target.checked,
                      })
                    }
                  />

                  <span>
                    Environmental readings are
                    recorded.
                  </span>
                </label>
              </div>
            )}

            {editorSection ===
              "evidence" && (
              <div className="rq-form">
                <label>
                  <span>
                    Supporting evidence notes
                  </span>

                  <textarea
                    value={
                      evidence.evidenceNotes
                    }
                    onChange={(event) =>
                      updateEvidence({
                        evidenceNotes:
                          event.target.value,
                      })
                    }
                    placeholder="Describe laboratory evidence or other supporting evidence."
                  />
                </label>

                <div className="rq-form-note">
                  <strong>
                    Photographs are detected automatically
                  </strong>

                  <p>
                    BioShield currently has{" "}
                    <strong>
                      {photoCount}
                    </strong>{" "}
                    stored photograph
                    {photoCount === 1
                      ? ""
                      : "s"} linked to this experiment.
                    The photo evidence status is
                    calculated from the actual stored
                    records and cannot be manually
                    overridden here.
                  </p>
                </div>

                <label className="rq-checkbox">
                  <input
                    type="checkbox"
                    checked={
                      evidence.laboratoryEvidenceRecorded
                    }
                    onChange={(event) =>
                      updateEvidence({
                        laboratoryEvidenceRecorded:
                          event.target.checked,
                      })
                    }
                  />

                  <span>
                    Laboratory evidence is
                    recorded separately.
                  </span>
                </label>
              </div>
            )}

            <div className="rq-modal-footer">
              <button
                type="button"
                className="rq-secondary-button"
                onClick={closeEditor}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="button"
                className="rq-primary-button"
                onClick={() =>
                  void saveEvidence()
                }
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : "Save evidence"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ResearchQuality