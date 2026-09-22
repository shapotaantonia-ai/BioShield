import { useEffect, useState } from "react"

import {
  analyseScientificIntegrity,
  type IntegrityAnalysis,
  type IntegrityClassification,
} from "../lib/bioshield/scientificIntegrity"

import {
  listExperiments,
  type ExperimentRecord,
} from "../lib/bioshield/experimentRepository"

type ScientificIntegrityProps = {
  onNavigate: (page: string) => void
}

function classificationClass(
  classification: IntegrityClassification,
): string {
  return classification.toLowerCase()
}

function ClassificationBadge({
  classification,
}: {
  classification: IntegrityClassification
}) {
  return (
    <span
      className={`integrity-badge integrity-badge-${classificationClass(
        classification,
      )}`}
    >
      {classification}
    </span>
  )
}

export default function ScientificIntegrity({
  onNavigate,
}: ScientificIntegrityProps) {
  const [experiments, setExperiments] =
    useState<ExperimentRecord[]>([])

  const [selectedExperimentId, setSelectedExperimentId] =
    useState("")

  const [analysis, setAnalysis] =
    useState<IntegrityAnalysis | null>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  async function loadExperiments() {
    try {
      setLoading(true)
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
    } catch (err) {
      console.error(err)
      setError(
        "Could not load BioShield experiments.",
      )
    } finally {
      setLoading(false)
    }
  }

  async function loadAnalysis(
    experimentId: string,
  ) {
    if (!experimentId) {
      setAnalysis(null)
      return
    }

    try {
      setError("")

      const result =
        await analyseScientificIntegrity(
          experimentId,
        )

      setAnalysis(result)
    } catch (err) {
      console.error(err)

      setAnalysis(null)

      setError(
        "Scientific integrity analysis could not be completed.",
      )
    }
  }

  useEffect(() => {
    void loadExperiments()
  }, [])

  useEffect(() => {
    if (selectedExperimentId) {
      void loadAnalysis(selectedExperimentId)
    }
  }, [selectedExperimentId])

  if (loading) {
    return (
      <div className="integrity-page">
        <div className="integrity-loading">
          Loading scientific integrity analysis...
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

  return (
    <div className="integrity-page">
      <div className="integrity-page-header">
        <div>
          <p className="eyebrow">
            SCIENTIFIC INTEGRITY
          </p>

          <h3 className="page-title">
            Scientific Integrity
          </h3>

          <p className="page-description">
            Check whether scientific statements are
            supported by the evidence actually recorded
            in BioShield.
          </p>
        </div>
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
            onNavigate("Reports")
          }
        >
          Reports
        </button>
      </div>

      <div className="integrity-boundary">
        <div className="integrity-boundary-icon">
          !
        </div>

        <div>
          <strong>
            Evidence must be separated from interpretation.
          </strong>

          <p>
            BioShield identifies observations,
            measurements, inferences, unknowns and
            unsupported claims. It does not turn an
            interpretation into an established fact.
          </p>
        </div>
      </div>

      {error && (
        <div className="integrity-error">
          {error}
        </div>
      )}

      {experiments.length === 0 ? (
        <div className="integrity-empty">
          <h4>No experiments recorded</h4>

          <p>
            Create an experiment and record evidence
            before running a scientific integrity check.
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
      ) : (
        <>
          <div className="integrity-card">
            <div className="integrity-card-heading">
              <div>
                <p className="integrity-section-label">
                  EXPERIMENT
                </p>

                <h4>
                  Select experiment
                </h4>
              </div>
            </div>

            <select
              className="integrity-select"
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
          </div>

          {analysis && (
            <>
              <div className="integrity-summary-grid">
                <SummaryCard
                  label="Statements"
                  value={analysis.summary.total}
                />

                <SummaryCard
                  label="Observed"
                  value={analysis.summary.observed}
                />

                <SummaryCard
                  label="Measured"
                  value={analysis.summary.measured}
                />

                <SummaryCard
                  label="Inferred"
                  value={analysis.summary.inferred}
                />

                <SummaryCard
                  label="Unknown"
                  value={analysis.summary.unknown}
                />

                <SummaryCard
                  label="Unsupported"
                  value={
                    analysis.summary.unsupported
                  }
                  danger={
                    analysis.summary.unsupported > 0
                  }
                />
              </div>

              <div className="integrity-card">
                <div className="integrity-card-heading">
                  <div>
                    <p className="integrity-section-label">
                      EVIDENCE REVIEW
                    </p>

                    <h4>
                      Statement-by-statement analysis
                    </h4>
                  </div>

                  <span className="integrity-count">
                    {analysis.statements.length}{" "}
                    statements
                  </span>
                </div>

                {analysis.statements.length === 0 ? (
                  <div className="integrity-empty">
                    <h4>
                      Not enough recorded information
                    </h4>

                    <p>
                      Record observations, measurements
                      or laboratory evidence before
                      making scientific conclusions.
                    </p>
                  </div>
                ) : (
                  <div className="integrity-list">
                    {analysis.statements.map(
                      (item) => (
                        <div
                          className={`integrity-statement ${
                            item.blocked
                              ? "integrity-statement-blocked"
                              : ""
                          }`}
                          key={item.id}
                        >
                          <div className="integrity-statement-top">
                            <ClassificationBadge
                              classification={
                                item.classification
                              }
                            />

                            {item.blocked && (
                              <span className="integrity-blocked-label">
                                REPORT CLAIM BLOCKED
                              </span>
                            )}
                          </div>

                          <p className="integrity-statement-text">
                            {item.statement}
                          </p>

                          <p className="integrity-explanation">
                            {item.explanation}
                          </p>

                          {item.evidence.length > 0 && (
                            <div className="integrity-evidence">
                              <strong>
                                Evidence basis
                              </strong>

                              <ul>
                                {item.evidence.map(
                                  (evidence) => (
                                    <li
                                      key={evidence}
                                    >
                                      {evidence}
                                    </li>
                                  ),
                                )}
                              </ul>
                            </div>
                          )}

                          {item.suggestedWording && (
                            <div className="integrity-suggestion">
                              <span>
                                Suggested cautious
                                wording
                              </span>

                              <p>
                                {
                                  item.suggestedWording
                                }
                              </p>
                            </div>
                          )}
                        </div>
                      ),
                    )}
                  </div>
                )}
              </div>

              <div className="integrity-card">
                <div className="integrity-card-heading">
                  <div>
                    <p className="integrity-section-label">
                      EVIDENCE BOUNDARIES
                    </p>

                    <h4>
                      What BioShield will not assume
                    </h4>
                  </div>
                </div>

                <div className="integrity-principles-grid">
                  <Principle
                    title="Visual score ≠ bacterial count"
                    text="A visual contamination score describes what was observed. It does not establish the number of microorganisms present."
                  />

                  <Principle
                    title="Observed ≠ caused"
                    text="A pattern can be observed without proving why the pattern occurred."
                  />

                  <Principle
                    title="Laboratory evidence is separate"
                    text="Microscopy, cultivation and other laboratory findings are kept separate from researcher visual observations."
                  />

                  <Principle
                    title="Unknown stays unknown"
                    text="When the available evidence cannot establish a cause, BioShield records the uncertainty instead of inventing an explanation."
                  />
                </div>
              </div>

              <div className="integrity-card">
                <div className="integrity-card-heading">
                  <div>
                    <p className="integrity-section-label">
                      SCIENTIFIC CLAIMS
                    </p>

                    <h4>
                      Claims requiring stronger evidence
                    </h4>
                  </div>
                </div>

                <div className="integrity-claim-list">
                  <ClaimRule
                    claim="Kills bacteria"
                    requirement="Requires appropriate microbiological evidence demonstrating bacterial reduction or killing under the stated experimental conditions."
                  />

                  <ClaimRule
                    claim="99% effective"
                    requirement="Requires quantitative evidence under the exact conditions used, with a valid baseline and appropriate comparison."
                  />

                  <ClaimRule
                    claim="Prevents biofilm"
                    requirement="Requires direct assessment of biofilm formation rather than visual cleanliness alone."
                  />

                  <ClaimRule
                    claim="No bacteria"
                    requirement="Requires appropriate laboratory evidence capable of supporting the absence claim."
                  />

                  <ClaimRule
                    claim="Sterilised"
                    requirement="Requires evidence appropriate for establishing sterilisation under the stated conditions."
                  />
                </div>
              </div>

              <div className="page-navigation">
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
                  Reports
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
            </>
          )}
        </>
      )}
    </div>
  )
}

function SummaryCard({
  label,
  value,
  danger = false,
}: {
  label: string
  value: number
  danger?: boolean
}) {
  return (
    <div
      className={`integrity-summary-card ${
        danger
          ? "integrity-summary-danger"
          : ""
      }`}
    >
      <span>{label}</span>

      <strong>{value}</strong>
    </div>
  )
}

function Principle({
  title,
  text,
}: {
  title: string
  text: string
}) {
  return (
    <div className="integrity-principle">
      <strong>{title}</strong>

      <p>{text}</p>
    </div>
  )
}

function ClaimRule({
  claim,
  requirement,
}: {
  claim: string
  requirement: string
}) {
  return (
    <div className="integrity-claim-rule">
      <div className="integrity-claim-name">
        {claim}
      </div>

      <div className="integrity-claim-requirement">
        {requirement}
      </div>
    </div>
  )
}