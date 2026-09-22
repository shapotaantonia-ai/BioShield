import { useEffect, useMemo, useState } from "react"

import {
  getExperiment,
  listExperiments,
  lockExperimentMethod,
  type ExperimentRecord,
} from "../lib/bioshield/experimentRepository"

import {
  createObservation,
  listObservations,
  type ObservationRecord,
} from "../lib/bioshield/observationRepository"

type ObservationsProps = {
  onNavigate: (page: string) => void
}

const scoreDescriptions: Record<number, string> = {
  0: "No visible contamination",
  1: "Very slight visible change",
  2: "Slight visible contamination",
  3: "Low visible contamination",
  4: "Moderate visible contamination",
  5: "Moderately high visible contamination",
  6: "High visible contamination",
  7: "Very high visible contamination",
  8: "Extensive visible contamination",
}

function Observations({
  onNavigate,
}: ObservationsProps) {
  const [experiments, setExperiments] = useState<
    ExperimentRecord[]
  >([])

  const [selectedExperimentId, setSelectedExperimentId] =
    useState("")

  const [observations, setObservations] = useState<
    ObservationRecord[]
  >([])

  const [treatment, setTreatment] = useState("")
  const [surface, setSurface] = useState("")
  const [replicate, setReplicate] = useState("1")
  const [day, setDay] = useState("0")
  const [visualScore, setVisualScore] = useState("0")
  const [notes, setNotes] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const selectedExperiment = useMemo(
    () =>
      experiments.find(
        (experiment) =>
          experiment.id === selectedExperimentId,
      ),
    [experiments, selectedExperimentId],
  )

  async function loadExperiments() {
    const items = await listExperiments()

    setExperiments(items)

    if (
      !selectedExperimentId &&
      items.length > 0
    ) {
      setSelectedExperimentId(items[0].id)
    }
  }

  async function loadObservations(experimentId: string) {
    setObservations(
      experimentId
        ? await listObservations(experimentId)
        : [],
    )
  }

  useEffect(() => {
    void (async () => {
      try {
        await loadExperiments()
      } catch (error) {
        console.error(
          "Could not load experiments:",
          error,
        )
        setMessage(
          "Experiments could not be loaded.",
        )
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  useEffect(() => {
    if (!selectedExperimentId) {
      setObservations([])
      return
    }

    void (async () => {
      try {
        const experiment = await getExperiment(
          selectedExperimentId,
        )

        if (experiment) {
          setTreatment(
            experiment.treatments[0] ?? "",
          )

          setSurface(
            experiment.surfaces[0] ?? "",
          )

          setReplicate("1")
        }

        await loadObservations(
          selectedExperimentId,
        )
      } catch (error) {
        console.error(
          "Could not load observations:",
          error,
        )
        setMessage(
          "Observations could not be loaded.",
        )
      }
    })()
  }, [selectedExperimentId])

  async function saveObservation() {
    setMessage("")

    if (!selectedExperiment) {
      setMessage(
        "Select an experiment before saving an observation.",
      )
      return
    }

    const numericDay = Number(day)
    const numericReplicate = Number(replicate)
    const numericScore = Number(visualScore)

    if (!treatment || !surface) {
      setMessage(
        "Select a treatment and surface before saving.",
      )
      return
    }

    if (
      !Number.isInteger(numericDay) ||
      numericDay < 0
    ) {
      setMessage(
        "Day must be a whole number starting at 0.",
      )
      return
    }

    if (
      !Number.isInteger(numericReplicate) ||
      numericReplicate < 1 ||
      numericReplicate >
        selectedExperiment.replicates
    ) {
      setMessage(
        `Replicate must be between 1 and ${selectedExperiment.replicates}.`,
      )
      return
    }

    if (
      !Number.isInteger(numericScore) ||
      numericScore < 0 ||
      numericScore > 8
    ) {
      setMessage(
        "Visual contamination score must be an integer from 0 to 8.",
      )
      return
    }

    try {
      setSaving(true)

      await createObservation({
        experimentId: selectedExperiment.id,
        treatment,
        surface,
        replicate: numericReplicate,
        day: numericDay,
        visualScore: numericScore,
        notes: notes.trim(),
      })

      await lockExperimentMethod(
        selectedExperiment.id,
      )

      await loadObservations(
        selectedExperiment.id,
      )

      await loadExperiments()

      setNotes("")
      setMessage(
        "Observation saved. The experiment method is now locked for this version.",
      )
    } catch (error) {
      console.error(
        "Could not save observation:",
        error,
      )

      setMessage(
        "The observation could not be saved. Please try again.",
      )
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div>
        <p className="eyebrow">DATA COLLECTION</p>

        <h3 className="page-title">
          Observations
        </h3>

        <div className="empty-state">
          <h4>Loading…</h4>

          <p>
            Reading experiments from this device.
          </p>
        </div>

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
        </div>
      </div>
    )
  }

  if (experiments.length === 0) {
    return (
      <div>
        <p className="eyebrow">DATA COLLECTION</p>

        <h3 className="page-title">
          Observations
        </h3>

        <p className="page-description">
          Record observations against the correct
          experiment, treatment, surface and
          replicate.
        </p>

        <div className="empty-state">
          <h4>No experiment available</h4>

          <p>
            Create an experiment first. Observations
            are always linked to a specific
            experimental record.
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
    <div>
      <p className="eyebrow">DATA COLLECTION</p>

      <h3 className="page-title">
        Observations
      </h3>

      <p className="page-description">
        Record observations against the correct
        experiment, treatment, surface and
        replicate. Scores are visual contamination
        scores, not bacterial counts.
      </p>

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
            onNavigate("Lab")
          }
        >
          Laboratory
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
      </div>

      <div className="builder-form">
        <section className="form-section">
          <div className="form-section-header">
            <span>01</span>

            <div>
              <h4>Experiment</h4>

              <p>
                Choose the research record receiving
                this observation.
              </p>
            </div>
          </div>

          <label>
            Experiment

            <select
              value={selectedExperimentId}
              onChange={(event) =>
                setSelectedExperimentId(
                  event.target.value,
                )
              }
            >
              <option value="">
                Select experiment
              </option>

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

          {selectedExperiment?.methodLocked && (
            <div className="warning-box">
              Method locked after observations
              began. Changes to key method details
              should be handled through a new
              version/amendment rather than silently
              overwritten.
            </div>
          )}
        </section>

        <section className="form-section">
          <div className="form-section-header">
            <span>02</span>

            <div>
              <h4>Observation record</h4>

              <p>
                Each record represents one treatment ×
                surface × replicate × day observation.
              </p>
            </div>
          </div>

          <label>
            Treatment

            <select
              value={treatment}
              onChange={(event) =>
                setTreatment(event.target.value)
              }
            >
              {selectedExperiment?.treatments.map(
                (item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                ),
              )}
            </select>
          </label>

          <label>
            Surface

            <select
              value={surface}
              onChange={(event) =>
                setSurface(event.target.value)
              }
            >
              {selectedExperiment?.surfaces.map(
                (item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                ),
              )}
            </select>
          </label>

          <label>
            Replicate

            <select
              value={replicate}
              onChange={(event) =>
                setReplicate(event.target.value)
              }
            >
              {Array.from(
                {
                  length:
                    selectedExperiment?.replicates ??
                    1,
                },
                (_, index) => (
                  <option
                    key={index + 1}
                    value={index + 1}
                  >
                    Replicate {index + 1}
                  </option>
                ),
              )}
            </select>
          </label>

          <label>
            Day

            <input
              type="number"
              min="0"
              value={day}
              onChange={(event) =>
                setDay(event.target.value)
              }
            />
          </label>

          <label>
            Visual contamination score (0–8)

            <select
              value={visualScore}
              onChange={(event) =>
                setVisualScore(event.target.value)
              }
            >
              {Object.entries(
                scoreDescriptions,
              ).map(
                ([score, description]) => (
                  <option
                    key={score}
                    value={score}
                  >
                    {score} — {description}
                  </option>
                ),
              )}
            </select>
          </label>

          <label>
            Observation notes

            <textarea
              value={notes}
              onChange={(event) =>
                setNotes(event.target.value)
              }
              placeholder="Record what was visibly observed. Keep interpretation separate from the observation."
            />
          </label>
        </section>

        <section className="form-section">
          <div className="form-section-header">
            <span>03</span>

            <div>
              <h4>Scoring reference</h4>

              <p>
                Use the same 0–8 scale consistently
                throughout the experiment.
              </p>
            </div>
          </div>

          <div className="score-grid">
            {Object.entries(
              scoreDescriptions,
            ).map(([score, description]) => (
              <div
                className="design-cell"
                key={score}
              >
                <strong>{score}</strong>

                <span>{description}</span>
              </div>
            ))}
          </div>
        </section>

        {message && (
          <div
            className={
              message.includes("saved")
                ? "success-box"
                : "warning-box"
            }
          >
            {message}
          </div>
        )}

        <div className="builder-actions">
          <button
            type="button"
            className="create-button"
            onClick={() =>
              void saveObservation()
            }
            disabled={saving}
          >
            {saving
              ? "Saving observation…"
              : "Save observation"}
          </button>
        </div>

        <section className="form-section">
          <div className="form-section-header">
            <span>04</span>

            <div>
              <h4>Recorded observations</h4>

              <p>
                {observations.length} saved
                observation
                {observations.length === 1
                  ? ""
                  : "s"} for this experiment.
              </p>
            </div>
          </div>

          {observations.length === 0 ? (
            <p className="table-empty">
              No observations have been recorded
              for this experiment yet.
            </p>
          ) : (
            <div className="observation-table-wrap">
              <table className="observation-table">
                <thead>
                  <tr>
                    <th>Day</th>
                    <th>Treatment</th>
                    <th>Surface</th>
                    <th>Replicate</th>
                    <th>Score</th>
                    <th>Notes</th>
                  </tr>
                </thead>

                <tbody>
                  {[...observations]
                    .sort(
                      (a, b) =>
                        a.day - b.day ||
                        a.treatment.localeCompare(
                          b.treatment,
                        ) ||
                        a.surface.localeCompare(
                          b.surface,
                        ) ||
                        a.replicate -
                          b.replicate,
                    )
                    .map((observation) => (
                      <tr
                        key={observation.id}
                      >
                        <td>
                          {observation.day}
                        </td>

                        <td>
                          {observation.treatment}
                        </td>

                        <td>
                          {observation.surface}
                        </td>

                        <td>
                          {observation.replicate}
                        </td>

                        <td>
                          <strong>
                            {
                              observation.visualScore
                            }
                          </strong>
                        </td>

                        <td>
                          {observation.notes ||
                            "—"}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <div className="page-navigation">
        <button
          type="button"
          className="secondary-button"
          onClick={() =>
            onNavigate("Lab")
          }
        >
          Laboratory evidence
        </button>

        <button
          type="button"
          className="secondary-button"
          onClick={() =>
            onNavigate("Analysis")
          }
        >
          Analyse observations
        </button>

        <button
          type="button"
          className="secondary-button"
          onClick={() =>
            onNavigate("Research Quality")
          }
        >
          Research Quality
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
            onNavigate("Dashboard")
          }
        >
          Dashboard
        </button>
      </div>
    </div>
  )
}

export default Observations