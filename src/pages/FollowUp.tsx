import { useEffect, useState } from "react"

import {
  listExperiments,
  type ExperimentRecord,
} from "../lib/bioshield/experimentRepository"

import {
  createFollowUpExperiment,
  listFollowUpExperiments,
  type CreateFollowUpInput,
} from "../lib/bioshield/followUpRepository"

import type {
  FollowUpReason,
  FollowUpExperimentRecord,
} from "../lib/bioshield/database"

type FollowUpProps = {
  onNavigate: (page: string) => void
}

const reasonOptions: {
  value: FollowUpReason
  label: string
}[] = [
  {
    value: "unexpected_result",
    label: "Unexpected result",
  },
  {
    value: "missing_evidence",
    label: "Missing evidence",
  },
  {
    value: "concentration_uncertainty",
    label: "Concentration uncertainty",
  },
  {
    value: "measurement_limitation",
    label: "Measurement limitation",
  },
  {
    value: "control_improvement",
    label: "Control improvement",
  },
  {
    value: "replication_improvement",
    label: "Replication improvement",
  },
  {
    value: "other",
    label: "Other",
  },
]

export default function FollowUp({ onNavigate }: FollowUpProps) {
  const [experiments, setExperiments] =
    useState<ExperimentRecord[]>([])

  const [followUps, setFollowUps] =
    useState<FollowUpExperimentRecord[]>([])

  const [selectedExperimentId, setSelectedExperimentId] =
    useState("")

  const [reason, setReason] =
    useState<FollowUpReason>("unexpected_result")

  const [reasonDetails, setReasonDetails] =
    useState("")

  const [researchQuestion, setResearchQuestion] =
    useState("")

  const [aim, setAim] =
    useState("")

  const [hypothesis, setHypothesis] =
    useState("")

  const [variableChanged, setVariableChanged] =
    useState("")

  const [controlsImproved, setControlsImproved] =
    useState("")

  const [replicationPlan, setReplicationPlan] =
    useState("")

  const [measurementImprovement, setMeasurementImprovement] =
    useState("")

  const [whatChanged, setWhatChanged] =
    useState("")

  const [whatRemainsTheSame, setWhatRemainsTheSame] =
    useState("")

  const [saving, setSaving] =
    useState(false)

  const [message, setMessage] =
    useState("")

  const [error, setError] =
    useState("")

  const selectedExperiment =
    experiments.find(
      (experiment) =>
        experiment.id === selectedExperimentId,
    )

  async function loadData() {
    try {
      setError("")

      const records = await listExperiments()

      setExperiments(records)

      if (records.length > 0) {
        setSelectedExperimentId((current) => {
          if (
            current &&
            records.some(
              (experiment) =>
                experiment.id === current,
            )
          ) {
            return current
          }

          return records[0].id
        })
      }

      const savedFollowUps =
        await listFollowUpExperiments()

      setFollowUps(savedFollowUps)
    } catch (err) {
      console.error(err)

      setError(
        "Could not load follow-up experiment data.",
      )
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  function clearForm() {
    setReason("unexpected_result")
    setReasonDetails("")
    setResearchQuestion("")
    setAim("")
    setHypothesis("")
    setVariableChanged("")
    setControlsImproved("")
    setReplicationPlan("")
    setMeasurementImprovement("")
    setWhatChanged("")
    setWhatRemainsTheSame("")
    setMessage("")
  }

  async function handleCreate() {
    setError("")
    setMessage("")

    if (!selectedExperimentId) {
      setError(
        "Select the original experiment first.",
      )
      return
    }

    if (!researchQuestion.trim()) {
      setError(
        "Enter a research question for the follow-up experiment.",
      )
      return
    }

    if (!aim.trim()) {
      setError(
        "Enter an aim for the follow-up experiment.",
      )
      return
    }

    if (!hypothesis.trim()) {
      setError(
        "Enter a hypothesis for the follow-up experiment.",
      )
      return
    }

    if (!whatChanged.trim()) {
      setError(
        "Describe what will change in the follow-up.",
      )
      return
    }

    try {
      setSaving(true)

      const input: CreateFollowUpInput = {
        parentExperimentId: selectedExperimentId,
        reason,
        reasonDetails,
        researchQuestion,
        aim,
        hypothesis,
        variableChanged,
        controlsImproved,
        replicationPlan,
        measurementImprovement,
        whatChanged,
        whatRemainsTheSame,
      }

      await createFollowUpExperiment(input)

      setMessage(
        "Follow-up experiment created and linked to the original experiment.",
      )

      clearForm()

      const savedFollowUps =
        await listFollowUpExperiments()

      setFollowUps(savedFollowUps)
    } catch (err) {
      console.error(err)

      setError(
        err instanceof Error
          ? err.message
          : "Could not create the follow-up experiment.",
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="followup-page">
      <div className="followup-header">
        <div>
          <p className="eyebrow">
            NEXT EXPERIMENT
          </p>

          <h3 className="page-title">
            Follow-Up Experiment
          </h3>

          <p className="page-description">
            Turn an evidence gap or unexpected result
            into a new experiment without changing the
            original record.
          </p>
        </div>
      </div>

      {/* PAGE NAVIGATION */}
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
          onClick={() => onNavigate("Unexpected Results")}
        >
          Unexpected Results
        </button>

        <button
          type="button"
          className="create-button"
          onClick={() => onNavigate("Analysis")}
        >
          Analysis →
        </button>
      </div>

      <div className="followup-boundary">
        <div className="followup-boundary-icon">
          ↗
        </div>

        <div>
          <strong>
            Follow-up experiments are new records.
          </strong>

          <p>
            BioShield keeps the original experiment
            unchanged and records exactly why the new
            experiment was created and what will be
            changed.
          </p>
        </div>
      </div>

      {error && (
        <div className="followup-error">
          {error}
        </div>
      )}

      {message && (
        <div className="followup-success">
          {message}
        </div>
      )}

      {experiments.length === 0 ? (
        <div className="followup-empty">
          <h4>
            No original experiments available
          </h4>

          <p>
            Create an experiment before creating a
            follow-up.
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
          <section className="followup-card">
            <div className="followup-card-heading">
              <div>
                <p className="followup-label">
                  01 · ORIGINAL EXPERIMENT
                </p>

                <h4>
                  Select the experiment being followed up
                </h4>
              </div>
            </div>

            <select
              className="followup-select"
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
                  {experiment.title ||
                    "Untitled experiment"}
                </option>
              ))}
            </select>

            {selectedExperiment && (
              <div className="followup-original">
                <div>
                  <span>
                    Research question
                  </span>

                  <p>
                    {selectedExperiment.researchQuestion ||
                      "Not recorded"}
                  </p>
                </div>

                <div>
                  <span>Aim</span>

                  <p>
                    {selectedExperiment.aim ||
                      "Not recorded"}
                  </p>
                </div>

                <div>
                  <span>Hypothesis</span>

                  <p>
                    {selectedExperiment.hypothesis ||
                      "Not recorded"}
                  </p>
                </div>
              </div>
            )}
          </section>

          <section className="followup-card">
            <div className="followup-card-heading">
              <div>
                <p className="followup-label">
                  02 · REASON
                </p>

                <h4>
                  Why is a follow-up needed?
                </h4>
              </div>
            </div>

            <select
              className="followup-select"
              value={reason}
              onChange={(event) =>
                setReason(
                  event.target.value as FollowUpReason,
                )
              }
            >
              {reasonOptions.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              ))}
            </select>

            <label className="followup-field">
              <span>
                Explain the reason
              </span>

              <textarea
                value={reasonDetails}
                onChange={(event) =>
                  setReasonDetails(
                    event.target.value,
                  )
                }
                placeholder="Describe the evidence gap, unexpected pattern or limitation that led to the follow-up."
                rows={4}
              />
            </label>
          </section>

          <section className="followup-card">
            <div className="followup-card-heading">
              <div>
                <p className="followup-label">
                  03 · NEW RESEARCH
                </p>

                <h4>
                  Define the new experiment
                </h4>
              </div>
            </div>

            <label className="followup-field">
              <span>
                Research question *
              </span>

              <textarea
                value={researchQuestion}
                onChange={(event) =>
                  setResearchQuestion(
                    event.target.value,
                  )
                }
                placeholder="What will the follow-up experiment investigate?"
                rows={3}
              />
            </label>

            <label className="followup-field">
              <span>Aim *</span>

              <textarea
                value={aim}
                onChange={(event) =>
                  setAim(event.target.value)
                }
                placeholder="What will the follow-up experiment determine or investigate?"
                rows={3}
              />
            </label>

            <label className="followup-field">
              <span>
                Hypothesis *
              </span>

              <textarea
                value={hypothesis}
                onChange={(event) =>
                  setHypothesis(
                    event.target.value,
                  )
                }
                placeholder="What do you predict will happen?"
                rows={3}
              />
            </label>
          </section>

          <section className="followup-card">
            <div className="followup-card-heading">
              <div>
                <p className="followup-label">
                  04 · EXPERIMENTAL IMPROVEMENT
                </p>

                <h4>
                  What will be improved?
                </h4>
              </div>
            </div>

            <label className="followup-field">
              <span>
                Variable changed
              </span>

              <textarea
                value={variableChanged}
                onChange={(event) =>
                  setVariableChanged(
                    event.target.value,
                  )
                }
                placeholder="Example: use a measured active concentration."
                rows={3}
              />
            </label>

            <label className="followup-field">
              <span>
                Controls improved
              </span>

              <textarea
                value={controlsImproved}
                onChange={(event) =>
                  setControlsImproved(
                    event.target.value,
                  )
                }
                placeholder="Describe any additional or improved controls."
                rows={3}
              />
            </label>

            <label className="followup-field">
              <span>
                Replication plan
              </span>

              <textarea
                value={replicationPlan}
                onChange={(event) =>
                  setReplicationPlan(
                    event.target.value,
                  )
                }
                placeholder="Describe how replication will be improved."
                rows={3}
              />
            </label>

            <label className="followup-field">
              <span>
                Measurement improvement
              </span>

              <textarea
                value={measurementImprovement}
                onChange={(event) =>
                  setMeasurementImprovement(
                    event.target.value,
                  )
                }
                placeholder="Describe how the measurement method will be improved."
                rows={3}
              />
            </label>
          </section>

          <section className="followup-card">
            <div className="followup-card-heading">
              <div>
                <p className="followup-label">
                  05 · TRACEABILITY
                </p>

                <h4>
                  Record exactly what changed
                </h4>
              </div>
            </div>

            <label className="followup-field">
              <span>
                What changed? *
              </span>

              <textarea
                value={whatChanged}
                onChange={(event) =>
                  setWhatChanged(
                    event.target.value,
                  )
                }
                placeholder="Describe the specific methodological change from the original experiment."
                rows={4}
              />
            </label>

            <label className="followup-field">
              <span>
                What remains the same?
              </span>

              <textarea
                value={whatRemainsTheSame}
                onChange={(event) =>
                  setWhatRemainsTheSame(
                    event.target.value,
                  )
                }
                placeholder="Record the conditions that remain unchanged so the comparison remains traceable."
                rows={4}
              />
            </label>
          </section>

          <div className="followup-actions">
            <button
              type="button"
              className="followup-secondary-button"
              onClick={clearForm}
              disabled={saving}
            >
              Clear form
            </button>

            <button
              type="button"
              className="followup-primary-button"
              onClick={() => void handleCreate()}
              disabled={saving}
            >
              {saving
                ? "Creating..."
                : "Create follow-up experiment"}
            </button>
          </div>

          {followUps.length > 0 && (
            <section className="followup-card">
              <div className="followup-card-heading">
                <div>
                  <p className="followup-label">
                    FOLLOW-UP HISTORY
                  </p>

                  <h4>
                    Previously created follow-ups
                  </h4>
                </div>

                <span className="followup-count">
                  {followUps.length}
                </span>
              </div>

              <div className="followup-history">
                {followUps.map((item) => (
                  <div
                    className="followup-history-item"
                    key={item.id}
                  >
                    <div>
                      <strong>
                        {reasonOptions.find(
                          (option) =>
                            option.value ===
                            item.reason,
                        )?.label ??
                          item.reason}
                      </strong>

                      <p>
                        {item.researchQuestion}
                      </p>
                    </div>

                    <small>
                      {new Date(
                        item.createdAt,
                      ).toLocaleString()}
                    </small>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* BOTTOM NAVIGATION */}
          <div className="page-navigation">
            <button
              type="button"
              className="secondary-button"
              onClick={() => onNavigate("Unexpected Results")}
            >
              ← Unexpected Results
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
              onClick={() => onNavigate("Research Quality")}
            >
              Research Quality
            </button>

            <button
              type="button"
              className="create-button"
              onClick={() => onNavigate("Dashboard")}
            >
              Dashboard →
            </button>
          </div>
        </>
      )}
    </div>
  )
}