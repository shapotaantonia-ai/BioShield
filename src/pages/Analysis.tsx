import { useEffect, useMemo, useState } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { listExperiments } from "../lib/bioshield/experimentRepository"
import { db, type ObservationRecord } from "../lib/bioshield/database"

type AnalysisProps = {
  onNavigate: (page: string) => void
}

type Experiment = {
  id: string
  title: string
  treatments: string[]
  surfaces: string[]
}

type SummaryRow = {
  treatment: string
  surface: string
  n: number
  mean: number | null
  median: number | null
  min: number | null
  max: number | null
  range: number | null
  sd: number | null
}

function mean(values: number[]) {
  if (values.length === 0) return null

  return (
    values.reduce((sum, value) => sum + value, 0) /
    values.length
  )
}

function median(values: number[]) {
  if (values.length === 0) return null

  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)

  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2
  }

  return sorted[middle]
}

function standardDeviation(values: number[]) {
  if (values.length < 3) return null

  const average =
    values.reduce((sum, value) => sum + value, 0) /
    values.length

  const variance =
    values.reduce(
      (sum, value) =>
        sum + Math.pow(value - average, 2),
      0,
    ) /
    (values.length - 1)

  return Math.sqrt(variance)
}

function Analysis({ onNavigate }: AnalysisProps) {
  const [experiments, setExperiments] = useState<Experiment[]>([])
  const [selectedExperimentId, setSelectedExperimentId] =
    useState("")
  const [observations, setObservations] = useState<
    ObservationRecord[]
  >([])
  const [loading, setLoading] = useState(true)

  async function loadData() {
    setLoading(true)

    try {
      const experimentData = await listExperiments()

      setExperiments(experimentData)

      const firstExperiment = experimentData[0]

      if (!firstExperiment) {
        setSelectedExperimentId("")
        setObservations([])
        return
      }

      const selectedId =
        selectedExperimentId &&
        experimentData.some(
          (experiment) =>
            experiment.id === selectedExperimentId,
        )
          ? selectedExperimentId
          : firstExperiment.id

      setSelectedExperimentId(selectedId)

      const observationData = await db.observations
        .where("experimentId")
        .equals(selectedId)
        .filter(
          (observation) => !observation.isDeleted,
        )
        .toArray()

      setObservations(observationData)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  useEffect(() => {
    async function reloadObservations() {
      if (!selectedExperimentId) return

      const data = await db.observations
        .where("experimentId")
        .equals(selectedExperimentId)
        .filter(
          (observation) => !observation.isDeleted,
        )
        .toArray()

      setObservations(data)
    }

    void reloadObservations()
  }, [selectedExperimentId])

  const selectedExperiment = experiments.find(
    (experiment) =>
      experiment.id === selectedExperimentId,
  )

  const summary = useMemo<SummaryRow[]>(() => {
    if (!selectedExperiment) return []

    const rows: SummaryRow[] = []

    for (const treatment of selectedExperiment.treatments) {
      for (const surface of selectedExperiment.surfaces) {
        const values = observations
          .filter(
            (observation) =>
              observation.treatment === treatment &&
              observation.surface === surface,
          )
          .map(
            (observation) =>
              observation.visualScore,
          )
          .filter(
            (value): value is number =>
              typeof value === "number" &&
              !Number.isNaN(value),
          )

        const average = mean(values)
        const middle = median(values)

        rows.push({
          treatment,
          surface,
          n: values.length,
          mean: average,
          median: middle,
          min: values.length
            ? Math.min(...values)
            : null,
          max: values.length
            ? Math.max(...values)
            : null,
          range: values.length
            ? Math.max(...values) -
              Math.min(...values)
            : null,
          sd: standardDeviation(values),
        })
      }
    }

    return rows
  }, [observations, selectedExperiment])

  const timeSeriesData = useMemo(() => {
    if (!selectedExperiment) return []

    const days = Array.from(
      new Set(
        observations.map(
          (observation) => observation.day,
        ),
      ),
    ).sort((a, b) => a - b)

    return days.map((day) => {
      const row: Record<
        string,
        number | string | null
      > = {
        day: `Day ${day}`,
      }

      for (const treatment of selectedExperiment.treatments) {
        const values = observations
          .filter(
            (observation) =>
              observation.day === day &&
              observation.treatment === treatment,
          )
          .map(
            (observation) =>
              observation.visualScore,
          )
          .filter(
            (value): value is number =>
              typeof value === "number" &&
              !Number.isNaN(value),
          )

        row[treatment] = mean(values)
      }

      return row
    })
  }, [observations, selectedExperiment])

  const treatmentChartData = useMemo(() => {
    if (!selectedExperiment) return []

    return selectedExperiment.treatments.map(
      (treatment) => {
        const values = observations
          .filter(
            (observation) =>
              observation.treatment === treatment,
          )
          .map(
            (observation) =>
              observation.visualScore,
          )
          .filter(
            (value): value is number =>
              typeof value === "number" &&
              !Number.isNaN(value),
          )

        return {
          treatment,
          mean: mean(values),
        }
      },
    )
  }, [observations, selectedExperiment])

  const surfaceChartData = useMemo(() => {
    if (!selectedExperiment) return []

    return selectedExperiment.surfaces.map(
      (surface) => {
        const values = observations
          .filter(
            (observation) =>
              observation.surface === surface,
          )
          .map(
            (observation) =>
              observation.visualScore,
          )
          .filter(
            (value): value is number =>
              typeof value === "number" &&
              !Number.isNaN(value),
          )

        return {
          surface,
          mean: mean(values),
        }
      },
    )
  }, [observations, selectedExperiment])

  /* =====================================================
     LOADING
     ===================================================== */

  if (loading) {
    return (
      <div>
        <p className="eyebrow">
          DATA ANALYSIS
        </p>

        <h3 className="page-title">
          Analysis
        </h3>

        <div className="empty-state">
          <h4>
            Loading analysis...
          </h4>
        </div>
      </div>
    )
  }

  /* =====================================================
     NO EXPERIMENTS
     ===================================================== */

  if (experiments.length === 0) {
    return (
      <div>
        <p className="eyebrow">
          DATA ANALYSIS
        </p>

        <h3 className="page-title">
          Analysis
        </h3>

        <p className="page-description">
          Analyse recorded visual contamination
          observations.
        </p>

        <div className="empty-state">
          <h4>
            No experiment available
          </h4>

          <p>
            Create an experiment and record observations
            before analysis can be displayed.
          </p>

          <div className="page-navigation">
            <button
              type="button"
              className="secondary-button"
              onClick={() =>
                onNavigate("Dashboard")
              }
            >
              ← Dashboard
            </button>

            <button
              type="button"
              className="create-button"
              onClick={() =>
                onNavigate("Builder")
              }
            >
              + Create experiment
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <p className="eyebrow">
        DATA ANALYSIS
      </p>

      <div className="page-heading-row">
        <div>
          <h3 className="page-title">
            Analysis
          </h3>

          <p className="page-description">
            Descriptive analysis generated from the
            observations stored in BioShield.
          </p>
        </div>

        <select
          value={selectedExperimentId}
          onChange={(event) =>
            setSelectedExperimentId(
              event.target.value,
            )
          }
          className="analysis-select"
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

      {/* =====================================================
          PAGE ACTIONS
          ===================================================== */}

      <div className="page-navigation">
        <button
          type="button"
          className="secondary-button"
          onClick={() =>
            onNavigate("Dashboard")
          }
        >
          ← Dashboard
        </button>

        <button
          type="button"
          className="secondary-button"
          onClick={() =>
            onNavigate("Observations")
          }
        >
          ← Observations
        </button>

        <button
          type="button"
          className="create-button"
          onClick={() =>
            onNavigate("Research Quality")
          }
        >
          Research Quality →
        </button>
      </div>

      <div className="analysis-warning">
        <strong>
          Measurement note
        </strong>

        <span>
          These results use the recorded visual
          contamination score (0–8). They are not
          bacterial counts and do not establish treatment
          efficacy on their own.
        </span>
      </div>

      {observations.length === 0 ? (
        <div className="empty-state">
          <h4>
            No observations yet
          </h4>

          <p>
            Record observations for this experiment
            before BioShield can calculate descriptive
            results.
          </p>

          <div className="page-navigation">
            <button
              type="button"
              className="create-button"
              onClick={() =>
                onNavigate("Observations")
              }
            >
              Record observations →
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* =====================================================
              VISUAL CONTAMINATION OVER TIME
              ===================================================== */}

          <section className="analysis-section">
            <div className="section-header">
              <h3>
                Visual contamination over time
              </h3>

              <p>
                Mean visual contamination score by
                treatment and observation day.
              </p>
            </div>

            <div className="chart-card">
              <ResponsiveContainer
                width="100%"
                height={360}
              >
                <LineChart
                  data={timeSeriesData}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                  />

                  <XAxis dataKey="day" />

                  <YAxis
                    domain={[0, 8]}
                    label={{
                      value:
                        "Visual score (0–8)",
                      angle: -90,
                      position: "insideLeft",
                    }}
                  />

                  <Tooltip />

                  <Legend />

                  {selectedExperiment?.treatments.map(
                    (treatment) => (
                      <Line
                        key={treatment}
                        type="monotone"
                        dataKey={treatment}
                        connectNulls={false}
                        strokeWidth={2}
                      />
                    ),
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>


          {/* =====================================================
              TREATMENT + SURFACE CHARTS
              ===================================================== */}

          <div className="analysis-grid">

            <section className="analysis-section">
              <div className="section-header">
                <h3>
                  Mean score by treatment
                </h3>

                <p>
                  Descriptive comparison across all
                  recorded observations.
                </p>
              </div>

              <div className="chart-card">
                <ResponsiveContainer
                  width="100%"
                  height={320}
                >
                  <BarChart
                    data={treatmentChartData}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                    />

                    <XAxis
                      dataKey="treatment"
                    />

                    <YAxis
                      domain={[0, 8]}
                    />

                    <Tooltip />

                    <Bar
                      dataKey="mean"
                      name="Mean visual score"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>


            <section className="analysis-section">
              <div className="section-header">
                <h3>
                  Mean score by surface
                </h3>

                <p>
                  Descriptive comparison across all
                  recorded observations.
                </p>
              </div>

              <div className="chart-card">
                <ResponsiveContainer
                  width="100%"
                  height={320}
                >
                  <BarChart
                    data={surfaceChartData}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                    />

                    <XAxis
                      dataKey="surface"
                    />

                    <YAxis
                      domain={[0, 8]}
                    />

                    <Tooltip />

                    <Bar
                      dataKey="mean"
                      name="Mean visual score"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

          </div>


          {/* =====================================================
              TREATMENT × SURFACE SUMMARY
              ===================================================== */}

          <section className="analysis-section">
            <div className="section-header">
              <h3>
                Treatment × surface summary
              </h3>

              <p>
                BioShield calculates descriptive
                statistics only where the available number
                of observations supports them.
              </p>
            </div>

            <div className="analysis-table-wrapper">
              <table className="analysis-table">
                <thead>
                  <tr>
                    <th>Treatment</th>
                    <th>Surface</th>
                    <th>n</th>
                    <th>Mean</th>
                    <th>Median</th>
                    <th>Min</th>
                    <th>Max</th>
                    <th>Range</th>
                    <th>SD</th>
                  </tr>
                </thead>

                <tbody>
                  {summary.map((row) => (
                    <tr
                      key={`${row.treatment}-${row.surface}`}
                    >
                      <td>
                        {row.treatment}
                      </td>

                      <td>
                        {row.surface}
                      </td>

                      <td>
                        {row.n}
                      </td>

                      <td>
                        {row.mean === null
                          ? "—"
                          : row.mean.toFixed(2)}
                      </td>

                      <td>
                        {row.median === null
                          ? "—"
                          : row.median.toFixed(2)}
                      </td>

                      <td>
                        {row.min ?? "—"}
                      </td>

                      <td>
                        {row.max ?? "—"}
                      </td>

                      <td>
                        {row.range ?? "—"}
                      </td>

                      <td>
                        {row.sd === null
                          ? row.n < 3
                            ? "Not calculated"
                            : "—"
                          : row.sd.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>


          {/* =====================================================
              INTERPRETATION RULES
              ===================================================== */}

          <section className="analysis-section">
            <div className="section-header">
              <h3>
                Interpretation rules
              </h3>

              <p>
                How BioShield treats the available data.
              </p>
            </div>

            <div className="analysis-rules">

              <div>
                <strong>
                  n &lt; 3
                </strong>

                <span>
                  Raw observations are shown. Standard
                  deviation is not calculated.
                </span>
              </div>

              <div>
                <strong>
                  n ≥ 3
                </strong>

                <span>
                  Mean, median, minimum, maximum, range
                  and sample standard deviation can be
                  calculated.
                </span>
              </div>

              <div>
                <strong>
                  No automatic p-values
                </strong>

                <span>
                  BioShield does not automatically claim
                  statistical significance without
                  established assumptions and an
                  appropriate analysis plan.
                </span>
              </div>

              <div>
                <strong>
                  Visual score ≠ bacterial count
                </strong>

                <span>
                  A visual score describes the recorded
                  appearance of the sample and should not
                  be interpreted as a microbiological count.
                </span>
              </div>

            </div>
          </section>


          {/* =====================================================
              BOTTOM NAVIGATION
              ===================================================== */}

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
              className="create-button"
              onClick={() =>
                onNavigate("Research Quality")
              }
            >
              Research Quality →
            </button>

          </div>
        </>
      )}
    </div>
  )
}

export default Analysis