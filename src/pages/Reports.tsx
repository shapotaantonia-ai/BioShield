import { useEffect, useState } from "react"
import jsPDF from "jspdf"

import {
  buildReportText,
  createRawCSV,
  createRawJSON,
  downloadTextFile,
  getReportData,
  type ReportData,
} from "../lib/bioshield/reportRepository"

import { listExperiments } from "../lib/bioshield/experimentRepository"

import type { ExperimentRecord } from "../lib/bioshield/database"

type ReportsProps = {
  onNavigate: (page: string) => void
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString()
}

function Reports({ onNavigate }: ReportsProps) {
  const [experiments, setExperiments] = useState<
    ExperimentRecord[]
  >([])

  const [selectedId, setSelectedId] = useState("")

  const [report, setReport] =
    useState<ReportData | null>(null)

  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    async function load() {
      try {
        const records = await listExperiments()

        setExperiments(records)

        if (records.length > 0) {
          setSelectedId(records[0].id)
        }
      } catch (error) {
        console.error(error)
        setMessage("Experiments could not be loaded.")
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [])

  useEffect(() => {
    if (!selectedId) {
      setReport(null)
      return
    }

    async function loadReport() {
      setGenerating(true)
      setMessage("")

      try {
        const data = await getReportData(selectedId)

        setReport(data)
      } catch (error) {
        console.error(error)
        setMessage("Report data could not be loaded.")
      } finally {
        setGenerating(false)
      }
    }

    void loadReport()
  }, [selectedId])

  function exportPDF() {
    if (!report) return

    const text = buildReportText(report)

    const pdf = new jsPDF({
      unit: "mm",
      format: "a4",
    })

    const margin = 18
    const pageWidth = 210
    const usableWidth = pageWidth - margin * 2

    pdf.setFont("helvetica", "bold")
    pdf.setFontSize(18)

    pdf.text(
      "BioShield Research Report",
      margin,
      20,
    )

    pdf.setFontSize(10)
    pdf.setFont("helvetica", "normal")

    const lines = pdf.splitTextToSize(
      text,
      usableWidth,
    )

    let y = 32

    for (const line of lines) {
      if (y > 280) {
        pdf.addPage()
        y = 20
      }

      pdf.text(line, margin, y)
      y += 5
    }

    const safeTitle =
      report.experiment.title
        .replace(/[^a-z0-9]+/gi, "-")
        .replace(/^-|-$/g, "")
        .toLowerCase() || "experiment"

    pdf.save(
      `BioShield-${safeTitle}-report.pdf`,
    )

    setMessage("PDF report exported successfully.")
  }

  function exportTXT() {
    if (!report) return

    const text = buildReportText(report)

    downloadTextFile(
      text,
      "bioshield-report.txt",
      "text/plain;charset=utf-8",
    )

    setMessage("Text report exported successfully.")
  }

  function exportCSV() {
    if (!report) return

    const csv = createRawCSV(report)

    downloadTextFile(
      csv,
      "bioshield-raw-observations.csv",
      "text/csv;charset=utf-8",
    )

    setMessage(
      "Raw observation CSV exported successfully.",
    )
  }

  function exportJSON() {
    if (!report) return

    const json = createRawJSON(report)

    downloadTextFile(
      json,
      "bioshield-raw-data.json",
      "application/json;charset=utf-8",
    )

    setMessage(
      "Raw JSON data exported successfully.",
    )
  }

  if (loading) {
    return (
      <section className="reports-page">
        <p className="eyebrow">
          REPRODUCIBLE REPORTING
        </p>

        <h3 className="page-title">
          Reports
        </h3>

        <div className="empty-state">
          Loading report workspace…
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
      </section>
    )
  }

  return (
    <section className="reports-page">
      <div className="reports-header">
        <div>
          <p className="eyebrow">
            REPRODUCIBLE REPORTING
          </p>

          <h3 className="page-title">
            Reports
          </h3>

          <p className="page-description">
            Generate reports directly from the recorded
            BioShield experiment data.
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
      </div>

      {experiments.length === 0 ? (
        <div className="empty-state">
          <h4>No experiments available</h4>

          <p>
            Create an experiment and record research
            data before generating a report.
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
          <div className="report-selector-card">
            <label htmlFor="report-experiment">
              Experiment
            </label>

            <select
              id="report-experiment"
              value={selectedId}
              onChange={(event) =>
                setSelectedId(event.target.value)
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

          {generating && (
            <div className="report-status">
              Updating report from stored research
              data…
            </div>
          )}

          {message && (
            <div className="report-message">
              {message}
            </div>
          )}

          {report && (
            <>
              <div className="report-summary-grid">
                <div className="report-summary-card">
                  <span>Observations</span>

                  <strong>
                    {report.observations.length}
                  </strong>
                </div>

                <div className="report-summary-card">
                  <span>Lab records</span>

                  <strong>
                    {report.laboratoryResults.length}
                  </strong>
                </div>

                <div className="report-summary-card">
                  <span>Photos</span>

                  <strong>
                    {report.photos.length}
                  </strong>
                </div>

                <div className="report-summary-card">
                  <span>Unexpected patterns</span>

                  <strong>
                    {report.unexpectedResults
                      ?.totalPatterns ?? 0}
                  </strong>
                </div>
              </div>

              <div className="report-integrity-card">
                <div>
                  <p className="eyebrow">
                    REPORT INTEGRITY
                  </p>

                  <h4>
                    Scientific evidence check
                  </h4>
                </div>

                {report.integrity?.summary.blocked &&
                report.integrity.summary.blocked > 0 ? (
                  <div className="report-danger">
                    Report requires revision before
                    finalisation.
                    <br />
                    Unsupported scientific claims were
                    detected.
                  </div>
                ) : (
                  <div className="report-safe">
                    No blocked unsupported claims
                    detected.
                  </div>
                )}

                <p>
                  BioShield keeps visual observations,
                  measurements, laboratory evidence and
                  interpretations separate.
                </p>
              </div>

              <div className="report-preview-card">
                <div className="report-preview-header">
                  <div>
                    <p className="eyebrow">
                      REPORT PREVIEW
                    </p>

                    <h4>
                      {report.experiment.title}
                    </h4>

                    <small>
                      Generated{" "}
                      {formatDate(report.generatedAt)}
                    </small>
                  </div>

                  <div className="report-actions">
                    <button
                      type="button"
                      className="primary-button"
                      onClick={exportPDF}
                    >
                      Export PDF
                    </button>

                    <button
                      type="button"
                      className="secondary-button"
                      onClick={exportTXT}
                    >
                      Export TXT
                    </button>

                    <button
                      type="button"
                      className="secondary-button"
                      onClick={exportCSV}
                    >
                      Raw CSV
                    </button>

                    <button
                      type="button"
                      className="secondary-button"
                      onClick={exportJSON}
                    >
                      Raw JSON
                    </button>
                  </div>
                </div>

                <pre className="report-preview">
                  {buildReportText(report)}
                </pre>
              </div>

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
    </section>
  )
}

export default Reports