import { useEffect, useState } from "react"

import {
  db,
  type ExperimentRecord,
  type LabMethod,
  type LabResultStatus,
  type LaboratoryResultRecord,
} from "../lib/bioshield/database"

import {
  createLaboratoryResult,
  deleteLaboratoryResult,
  listLaboratoryResults,
} from "../lib/bioshield/laboratoryRepository"

type LabProps = {
  onNavigate: (page: string) => void
}

const methodLabels: Record<LabMethod, string> = {
  culture: "Culture",
  microscopy: "Microscopy",
  qPCR: "qPCR",
  ATP: "ATP",
  other: "Other",
}

const statusLabels: Record<LabResultStatus, string> = {
  observed: "Observed",
  measured: "Measured",
  confirmed: "Confirmed",
  not_confirmed: "Not confirmed",
  unknown: "Unknown",
}

export default function Lab({ onNavigate }: LabProps) {
  const [experiments, setExperiments] = useState<ExperimentRecord[]>([])
  const [selectedExperimentId, setSelectedExperimentId] = useState("")
  const [results, setResults] = useState<LaboratoryResultRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")

  const [method, setMethod] = useState<LabMethod>("microscopy")
  const [methodName, setMethodName] = useState("")
  const [sampleCode, setSampleCode] = useState("")
  const [resultStatus, setResultStatus] =
    useState<LabResultStatus>("observed")

  const [observation, setObservation] = useState("")
  const [interpretation, setInterpretation] = useState("")
  const [countable, setCountable] = useState(false)
  const [quantitativeValue, setQuantitativeValue] = useState("")
  const [quantitativeUnit, setQuantitativeUnit] = useState("")
  const [confirmationStatus, setConfirmationStatus] = useState("")
  const [laboratoryName, setLaboratoryName] = useState("")
  const [analyst, setAnalyst] = useState("")
  const [performedAt, setPerformedAt] = useState("")
  const [notes, setNotes] = useState("")

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

  async function loadResults(experimentId: string) {
    const records = await listLaboratoryResults(experimentId)
    setResults(records)
  }

  useEffect(() => {
    void loadExperiments().catch((error) => {
      console.error("Could not load experiments:", error)
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (!selectedExperimentId) {
      setResults([])
      return
    }

    void loadResults(selectedExperimentId).catch((error) => {
      console.error("Could not load laboratory results:", error)
    })
  }, [selectedExperimentId])

  async function handleSave() {
    setMessage("")

    if (!selectedExperimentId) {
      setMessage(
        "Select an experiment before recording laboratory evidence.",
      )
      return
    }

    if (!methodName.trim()) {
      setMessage("Enter the laboratory method name.")
      return
    }

    if (!observation.trim()) {
      setMessage(
        "Record what was actually observed or measured.",
      )
      return
    }

    if (
      quantitativeValue.trim() &&
      Number.isNaN(Number(quantitativeValue))
    ) {
      setMessage(
        "The quantitative value must be a valid number.",
      )
      return
    }

    try {
      setSaving(true)

      await createLaboratoryResult({
        experimentId: selectedExperimentId,
        method,
        methodName,
        sampleCode,
        resultStatus,
        observation,
        interpretation,
        countable,
        quantitativeValue: quantitativeValue.trim()
          ? Number(quantitativeValue)
          : undefined,
        quantitativeUnit,
        confirmationStatus,
        laboratoryName,
        analyst,
        performedAt,
        notes,
      })

      await loadResults(selectedExperimentId)

      setMethodName("")
      setSampleCode("")
      setObservation("")
      setInterpretation("")
      setQuantitativeValue("")
      setQuantitativeUnit("")
      setConfirmationStatus("")
      setNotes("")

      setMessage("Laboratory evidence recorded.")
    } catch (error) {
      console.error(error)
      setMessage(
        "The laboratory result could not be saved.",
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleArchive(
    result: LaboratoryResultRecord,
  ) {
    const confirmed = window.confirm(
      `Archive this laboratory result from "${result.methodName}"?`,
    )

    if (!confirmed) return

    try {
      await deleteLaboratoryResult(result.id)

      if (selectedExperimentId) {
        await loadResults(selectedExperimentId)
      }

      setMessage("Laboratory evidence archived.")
    } catch (error) {
      console.error(error)
      setMessage(
        "The laboratory result could not be archived.",
      )
    }
  }

  const selectedExperiment = experiments.find(
    (experiment) => experiment.id === selectedExperimentId,
  )

  if (loading) {
    return (
      <div className="lab-page">
        <p className="eyebrow">LABORATORY EVIDENCE</p>
        <h3 className="page-title">Laboratory results</h3>
        <p className="page-description">
          Loading laboratory records…
        </p>

        <div className="page-navigation">
          <button
            type="button"
            className="secondary-button"
            onClick={() => onNavigate("Dashboard")}
          >
            Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="lab-page">
      <header className="lab-page-header">
        <div>
          <p className="eyebrow">LABORATORY EVIDENCE</p>

          <h3 className="page-title">
            Laboratory results
          </h3>

          <p className="page-description">
            Record laboratory findings separately from
            researcher observations.
          </p>
        </div>

        <div className="lab-record-count">
          <strong>{results.length}</strong>
          <span>
            laboratory record
            {results.length === 1 ? "" : "s"}
          </span>
        </div>
      </header>

      {/* TOP NAVIGATION */}
      <div className="page-navigation">
        <button
          type="button"
          className="secondary-button"
          onClick={() => onNavigate("Dashboard")}
        >
          Dashboard
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
          className="secondary-button"
          onClick={() => onNavigate("Analysis")}
        >
          Analysis
        </button>

        <button
          type="button"
          className="secondary-button"
          onClick={() => onNavigate("Scientific Integrity")}
        >
          Scientific Integrity
        </button>
      </div>

      {experiments.length === 0 ? (
        <section className="empty-state">
          <h4>No experiments available</h4>

          <p>
            Create an experiment before recording laboratory
            evidence.
          </p>

          <div className="page-navigation">
            <button
              type="button"
              className="create-button"
              onClick={() => onNavigate("Builder")}
            >
              Create experiment
            </button>

            <button
              type="button"
              className="secondary-button"
              onClick={() => onNavigate("Dashboard")}
            >
              Dashboard
            </button>
          </div>
        </section>
      ) : (
        <>
          <section className="lab-card lab-experiment-card">
            <div className="lab-card-heading">
              <div>
                <p className="eyebrow">EXPERIMENT</p>

                <h4>Evidence belongs to</h4>
              </div>
            </div>

            <div className="lab-experiment-grid">
              <div className="lab-field">
                <label htmlFor="lab-experiment">
                  Select experiment
                </label>

                <select
                  id="lab-experiment"
                  value={selectedExperimentId}
                  onChange={(event) =>
                    setSelectedExperimentId(
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

              {selectedExperiment && (
                <div className="lab-selected-experiment">
                  <span>Research question</span>

                  <strong>
                    {selectedExperiment.researchQuestion ||
                      "No research question recorded."}
                  </strong>
                </div>
              )}
            </div>
          </section>

          <section className="lab-evidence-boundary">
            <div className="lab-info-icon">i</div>

            <div>
              <strong>Evidence boundary</strong>

              <p>
                BioShield stores laboratory evidence separately
                from researcher observations. A laboratory
                observation does not automatically establish a
                bacterial count, species identification,
                antimicrobial efficacy or causation.
              </p>
            </div>
          </section>

          {message && (
            <div className="lab-message">
              {message}
            </div>
          )}

          <section className="lab-card">
            <div className="lab-card-heading">
              <div>
                <p className="eyebrow">RECORD RESULT</p>

                <h4>Add laboratory evidence</h4>

                <p>
                  Record only what is supported by the
                  laboratory evidence.
                </p>
              </div>
            </div>

            <div className="lab-form-section">
              <div className="lab-form-section-title">
                <span>01</span>

                <div>
                  <h5>Method</h5>

                  <p>
                    Identify how the laboratory evidence was
                    obtained.
                  </p>
                </div>
              </div>

              <div className="lab-form-grid">
                <div className="lab-field">
                  <label htmlFor="lab-method">
                    Laboratory method
                  </label>

                  <select
                    id="lab-method"
                    value={method}
                    onChange={(event) =>
                      setMethod(
                        event.target.value as LabMethod,
                      )
                    }
                  >
                    {Object.entries(methodLabels).map(
                      ([value, label]) => (
                        <option
                          key={value}
                          value={value}
                        >
                          {label}
                        </option>
                      ),
                    )}
                  </select>
                </div>

                <div className="lab-field">
                  <label htmlFor="lab-method-name">
                    Method / procedure name
                  </label>

                  <input
                    id="lab-method-name"
                    value={methodName}
                    onChange={(event) =>
                      setMethodName(event.target.value)
                    }
                    placeholder="e.g. Gram stain and microscopy"
                  />
                </div>

                <div className="lab-field">
                  <label htmlFor="lab-sample-code">
                    Sample code
                  </label>

                  <input
                    id="lab-sample-code"
                    value={sampleCode}
                    onChange={(event) =>
                      setSampleCode(event.target.value)
                    }
                    placeholder="Optional"
                  />
                </div>

                <div className="lab-field">
                  <label htmlFor="lab-status">
                    Evidence status
                  </label>

                  <select
                    id="lab-status"
                    value={resultStatus}
                    onChange={(event) =>
                      setResultStatus(
                        event.target
                          .value as LabResultStatus,
                      )
                    }
                  >
                    {Object.entries(statusLabels).map(
                      ([value, label]) => (
                        <option
                          key={value}
                          value={value}
                        >
                          {label}
                        </option>
                      ),
                    )}
                  </select>
                </div>
              </div>
            </div>

            <div className="lab-form-section">
              <div className="lab-form-section-title">
                <span>02</span>

                <div>
                  <h5>Finding</h5>

                  <p>
                    Separate what was observed from what you
                    think it might mean.
                  </p>
                </div>
              </div>

              <div className="lab-form-stack">
                <div className="lab-field">
                  <label htmlFor="lab-observation">
                    What was observed or measured?
                  </label>

                  <textarea
                    id="lab-observation"
                    value={observation}
                    onChange={(event) =>
                      setObservation(event.target.value)
                    }
                    rows={6}
                    placeholder="Record the laboratory observation exactly as supported by the evidence."
                  />

                  <small>
                    Example: “Microbial growth was observed
                    after incubation.” Do not convert this into
                    a numerical count unless the result was
                    reliably countable.
                  </small>
                </div>

                <div className="lab-field">
                  <label htmlFor="lab-interpretation">
                    Interpretation
                  </label>

                  <textarea
                    id="lab-interpretation"
                    value={interpretation}
                    onChange={(event) =>
                      setInterpretation(
                        event.target.value,
                      )
                    }
                    rows={5}
                    placeholder="Give a cautious interpretation without claiming more than the evidence supports."
                  />
                </div>
              </div>
            </div>

            <div className="lab-form-section">
              <div className="lab-form-section-title">
                <span>03</span>

                <div>
                  <h5>Quantification</h5>

                  <p>
                    Only enter numerical results when they can
                    be reliably measured.
                  </p>
                </div>
              </div>

              <div className="lab-quantification-box">
                <label className="lab-toggle">
                  <input
                    type="checkbox"
                    checked={countable}
                    onChange={(event) =>
                      setCountable(
                        event.target.checked,
                      )
                    }
                  />

                  <span className="lab-toggle-track">
                    <span />
                  </span>

                  <span>
                    Result is reliably countable
                  </span>
                </label>

                <div className="lab-form-grid lab-quantitative-fields">
                  <div className="lab-field">
                    <label htmlFor="lab-value">
                      Quantitative value
                    </label>

                    <input
                      id="lab-value"
                      type="number"
                      value={quantitativeValue}
                      onChange={(event) =>
                        setQuantitativeValue(
                          event.target.value,
                        )
                      }
                      disabled={!countable}
                      placeholder="Only if reliably measured"
                    />
                  </div>

                  <div className="lab-field">
                    <label htmlFor="lab-unit">
                      Unit
                    </label>

                    <input
                      id="lab-unit"
                      value={quantitativeUnit}
                      onChange={(event) =>
                        setQuantitativeUnit(
                          event.target.value,
                        )
                      }
                      disabled={!countable}
                      placeholder="e.g. CFU/mL"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="lab-form-section">
              <div className="lab-form-section-title">
                <span>04</span>

                <div>
                  <h5>Traceability</h5>

                  <p>
                    Record information that helps another person
                    understand where the evidence came from.
                  </p>
                </div>
              </div>

              <div className="lab-form-grid">
                <div className="lab-field">
                  <label htmlFor="lab-confirmation">
                    Confirmation status
                  </label>

                  <input
                    id="lab-confirmation"
                    value={confirmationStatus}
                    onChange={(event) =>
                      setConfirmationStatus(
                        event.target.value,
                      )
                    }
                    placeholder="e.g. Not formally identified"
                  />
                </div>

                <div className="lab-field">
                  <label htmlFor="lab-laboratory">
                    Laboratory
                  </label>

                  <input
                    id="lab-laboratory"
                    value={laboratoryName}
                    onChange={(event) =>
                      setLaboratoryName(
                        event.target.value,
                      )
                    }
                    placeholder="Optional"
                  />
                </div>

                <div className="lab-field">
                  <label htmlFor="lab-analyst">
                    Analyst
                  </label>

                  <input
                    id="lab-analyst"
                    value={analyst}
                    onChange={(event) =>
                      setAnalyst(event.target.value)
                    }
                    placeholder="Optional"
                  />
                </div>

                <div className="lab-field">
                  <label htmlFor="lab-date">
                    Date performed
                  </label>

                  <input
                    id="lab-date"
                    type="date"
                    value={performedAt}
                    onChange={(event) =>
                      setPerformedAt(event.target.value)
                    }
                  />
                </div>

                <div className="lab-field lab-field-full">
                  <label htmlFor="lab-notes">
                    Notes
                  </label>

                  <textarea
                    id="lab-notes"
                    value={notes}
                    onChange={(event) =>
                      setNotes(event.target.value)
                    }
                    rows={4}
                    placeholder="Additional traceability information or limitations."
                  />
                </div>
              </div>
            </div>

            <div className="lab-save-area">
              <button
                type="button"
                className="lab-save-button"
                onClick={handleSave}
                disabled={saving}
              >
                {saving
                  ? "Saving laboratory evidence…"
                  : "Save laboratory evidence"}
              </button>
            </div>
          </section>

          <section className="lab-card">
            <div className="lab-card-heading stored-heading">
              <div>
                <p className="eyebrow">STORED EVIDENCE</p>

                <h4>Laboratory record</h4>

                <p>
                  Evidence already recorded for this
                  experiment.
                </p>
              </div>

              <span className="lab-result-count">
                {results.length}
              </span>
            </div>

            {results.length === 0 ? (
              <div className="lab-empty-results">
                <div className="lab-empty-icon">+</div>

                <h5>
                  No laboratory evidence recorded
                </h5>

                <p>
                  Add a laboratory result above to build the
                  laboratory evidence record for this
                  experiment.
                </p>
              </div>
            ) : (
              <div className="lab-results-list">
                {results.map((result) => (
                  <article
                    className="lab-result-card"
                    key={result.id}
                  >
                    <div className="lab-result-top">
                      <div>
                        <div className="lab-result-tags">
                          <span className="lab-method-badge">
                            {methodLabels[result.method]}
                          </span>

                          <span className="lab-status-badge">
                            {
                              statusLabels[
                                result.resultStatus
                              ]
                            }
                          </span>
                        </div>

                        <h5>{result.methodName}</h5>
                      </div>

                      <button
                        type="button"
                        className="danger-button"
                        onClick={() =>
                          void handleArchive(result)
                        }
                      >
                        Archive
                      </button>
                    </div>

                    <div className="lab-result-meta">
                      {result.sampleCode && (
                        <span>
                          <strong>Sample</strong>
                          {result.sampleCode}
                        </span>
                      )}

                      <span>
                        <strong>Countable</strong>
                        {result.countable
                          ? "Yes"
                          : "No"}
                      </span>

                      {result.performedAt && (
                        <span>
                          <strong>Date</strong>
                          {result.performedAt}
                        </span>
                      )}
                    </div>

                    <div className="lab-result-content">
                      <div>
                        <strong>Observation</strong>
                        <p>{result.observation}</p>
                      </div>

                      {result.interpretation && (
                        <div>
                          <strong>
                            Interpretation
                          </strong>

                          <p>
                            {result.interpretation}
                          </p>
                        </div>
                      )}

                      {result.countable &&
                        result.quantitativeValue !==
                          undefined && (
                          <div>
                            <strong>
                              Quantitative result
                            </strong>

                            <p>
                              {result.quantitativeValue}{" "}
                              {result.quantitativeUnit ||
                                "unit not recorded"}
                            </p>
                          </div>
                        )}

                      {result.confirmationStatus && (
                        <div>
                          <strong>
                            Confirmation
                          </strong>

                          <p>
                            {result.confirmationStatus}
                          </p>
                        </div>
                      )}

                      {result.notes && (
                        <div>
                          <strong>Notes</strong>
                          <p>{result.notes}</p>
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          {/* BOTTOM NAVIGATION */}
          <div className="page-navigation">
            <button
              type="button"
              className="secondary-button"
              onClick={() => onNavigate("Dashboard")}
            >
              Dashboard
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
              className="secondary-button"
              onClick={() => onNavigate("Scientific Integrity")}
            >
              Scientific Integrity
            </button>

            <button
              type="button"
              className="secondary-button"
              onClick={() => onNavigate("Unexpected Results")}
            >
              Unexpected Results
            </button>

            <button
              type="button"
              className="create-button"
              onClick={() => onNavigate("Analysis")}
            >
              Continue to Analysis
            </button>
          </div>
        </>
      )}
    </div>
  )
}