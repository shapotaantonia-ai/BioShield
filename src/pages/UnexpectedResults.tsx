import { useEffect, useState } from "react"
import QRCode from "qrcode"

import {
  createSharedExperiment,
  listSharedExperiments,
  archiveSharedExperiment,
} from "../lib/bioshield/sharedRepository"

import {
  listExperiments,
} from "../lib/bioshield/experimentRepository"

import type {
  ExperimentRecord,
  SharedExperimentRecord,
} from "../lib/bioshield/database"

type SharedProps = {
  onNavigate: (page: string) => void
}

const APP_URL =
  import.meta.env.VITE_BIOSHIELD_PUBLIC_URL ||
  window.location.origin

function formatDate(value: string): string {
  return new Date(value).toLocaleString()
}

function Shared({
  onNavigate,
}: SharedProps) {
  const [experiments, setExperiments] =
    useState<ExperimentRecord[]>([])

  const [shared, setShared] =
    useState<SharedExperimentRecord[]>([])

  const [selectedExperiment, setSelectedExperiment] =
    useState("")

  const [selectedSharedId, setSelectedSharedId] =
    useState("")

  const [qrCode, setQrCode] =
    useState("")

  const [message, setMessage] =
    useState("")

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState("")

  async function loadData() {
    try {
      setLoading(true)
      setError("")

      const [
        experimentRecords,
        sharedRecords,
      ] = await Promise.all([
        listExperiments(),
        listSharedExperiments(),
      ])

      setExperiments(experimentRecords)
      setShared(sharedRecords)

      if (
        experimentRecords.length > 0 &&
        !selectedExperiment
      ) {
        setSelectedExperiment(
          experimentRecords[0].id,
        )
      }
    } catch (err) {
      console.error(err)

      setError(
        "Could not load BioShield shared records.",
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  async function freezeExperiment() {
    if (!selectedExperiment) {
      setMessage(
        "Select an experiment first.",
      )
      return
    }

    try {
      setMessage("")
      setError("")

      const snapshot =
        await createSharedExperiment(
          selectedExperiment,
        )

      setShared((current) => [
        snapshot,
        ...current,
      ])

      setSelectedSharedId(snapshot.id)

      setMessage(
        "Frozen shared snapshot created.",
      )

      await generateQRCode(snapshot.id)
    } catch (error) {
      console.error(error)

      setMessage(
        "The shared snapshot could not be created.",
      )
    }
  }

  async function generateQRCode(
    sharedId: string,
  ) {
    /*
     * Use the configured public BioShield address
     * rather than only the current browser origin.
     *
     * The same URL is displayed below the QR code.
     */
    const baseUrl =
      APP_URL.replace(/\/+$/, "")

    const url =
      `${baseUrl}#shared=${encodeURIComponent(sharedId)}`

    try {
      const dataUrl =
        await QRCode.toDataURL(
          url,
          {
            width: 260,
            margin: 2,
            errorCorrectionLevel: "H",
          },
        )

      setQrCode(dataUrl)
    } catch (error) {
      console.error(error)
      setQrCode("")

      setError(
        "The shared QR code could not be generated.",
      )
    }
  }

  function openShared(
    snapshot: SharedExperimentRecord,
  ) {
    setSelectedSharedId(snapshot.id)

    void generateQRCode(snapshot.id)
  }

  async function archive(
    snapshot: SharedExperimentRecord,
  ) {
    const confirmed =
      window.confirm(
        "Archive this shared snapshot? The frozen scientific record itself will not be edited.",
      )

    if (!confirmed) return

    try {
      await archiveSharedExperiment(
        snapshot.id,
      )

      setShared((current) =>
        current.filter(
          (item) =>
            item.id !== snapshot.id,
        ),
      )

      if (
        selectedSharedId ===
        snapshot.id
      ) {
        setSelectedSharedId("")
        setQrCode("")
      }

      setMessage(
        "Shared snapshot archived.",
      )
    } catch (error) {
      console.error(error)

      setMessage(
        "The shared snapshot could not be archived.",
      )
    }
  }

  const selectedShared =
    shared.find(
      (item) =>
        item.id === selectedSharedId,
    ) ?? null

  if (loading) {
    return (
      <section className="shared-page">

        <div className="shared-loading">
          Loading frozen research records…
        </div>

      </section>
    )
  }

  return (
    <section className="shared-page">

      {/* =====================================================
          HEADER
          ===================================================== */}

      <div className="shared-header">

        <div>

          <p className="eyebrow">
            READ-ONLY RESEARCH
          </p>

          <h3 className="page-title">
            Shared
          </h3>

          <p className="page-description">
            Create frozen, read-only snapshots of
            BioShield experiments for presentation,
            review and sharing.
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
            onNavigate("Reports")
          }
        >
          Reports
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

      </div>

      {/* =====================================================
          SCIENTIFIC BOUNDARY
          ===================================================== */}

      <div className="shared-warning">

        <strong>
          Frozen research record
        </strong>

        <span>
          Shared snapshots cannot be edited.
          If the underlying experiment changes,
          create a new snapshot instead.
        </span>

      </div>

      {error && (
        <div className="shared-error">
          {error}
        </div>
      )}

      {/* =====================================================
          CREATE SNAPSHOT
          ===================================================== */}

      <div className="shared-create-card">

        <div>

          <p className="eyebrow">
            CREATE SNAPSHOT
          </p>

          <h4>
            Freeze an experiment
          </h4>

          <p>
            BioShield copies the current experiment
            evidence into a separate read-only record.
          </p>

        </div>

        <div className="shared-create-controls">

          <select
            value={selectedExperiment}
            onChange={(event) =>
              setSelectedExperiment(
                event.target.value,
              )
            }
          >

            {experiments.length === 0 && (
              <option value="">
                No experiments available
              </option>
            )}

            {experiments.map(
              (experiment) => (
                <option
                  key={experiment.id}
                  value={experiment.id}
                >
                  {experiment.title ||
                    "Untitled experiment"}
                </option>
              ),
            )}

          </select>

          <button
            type="button"
            className="primary-button"
            onClick={() =>
              void freezeExperiment()
            }
            disabled={
              experiments.length === 0
            }
          >
            Freeze snapshot
          </button>

        </div>

      </div>

      {message && (
        <div className="shared-message">
          {message}
        </div>
      )}

      {/* =====================================================
          SHARED RECORDS
          ===================================================== */}

      <div className="shared-layout">

        <div className="shared-list-card">

          <div className="shared-card-heading">

            <div>

              <p className="eyebrow">
                FROZEN SNAPSHOTS
              </p>

              <h4>
                Shared experiments
              </h4>

            </div>

            <span className="shared-count">
              {shared.length}
            </span>

          </div>

          {shared.length === 0 ? (
            <div className="shared-empty">

              <h4>
                No shared snapshots yet
              </h4>

              <p>
                Freeze an experiment above to create
                the first read-only research record.
              </p>

            </div>
          ) : (
            <div className="shared-list">

              {shared.map(
                (snapshot) => (
                  <button
                    type="button"
                    key={snapshot.id}
                    className={`shared-list-item ${
                      selectedSharedId ===
                      snapshot.id
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      openShared(
                        snapshot,
                      )
                    }
                  >

                    <div>

                      <strong>
                        {snapshot.title}
                      </strong>

                      <span>
                        Frozen{" "}
                        {formatDate(
                          snapshot.frozenAt,
                        )}
                      </span>

                    </div>

                    <div className="shared-list-meta">

                      <span>
                        {snapshot.observations.length} observations
                      </span>

                      <span>
                        {snapshot.laboratoryResults.length} lab records
                      </span>

                    </div>

                  </button>
                ),
              )}

            </div>
          )}

        </div>

        {/* ===================================================
            DETAIL
            =================================================== */}

        <div className="shared-detail-card">

          {!selectedShared ? (
            <div className="shared-empty large">

              <h4>
                Select a frozen snapshot
              </h4>

              <p>
                The read-only research record will
                appear here.
              </p>

            </div>
          ) : (
            <>

              <div className="shared-detail-header">

                <div>

                  <div className="frozen-badge">
                    FROZEN • READ ONLY
                  </div>

                  <h4>
                    {selectedShared.title}
                  </h4>

                  <p>
                    Frozen{" "}
                    {formatDate(
                      selectedShared.frozenAt,
                    )}
                  </p>

                </div>

                <button
                  type="button"
                  className="danger-button"
                  onClick={() =>
                    void archive(
                      selectedShared,
                    )
                  }
                >
                  Archive
                </button>

              </div>

              <div className="shared-section">

                <span className="shared-label">
                  Research question
                </span>

                <p>
                  {selectedShared.researchQuestion ||
                    "Not recorded"}
                </p>

              </div>

              <div className="shared-section">

                <span className="shared-label">
                  Aim
                </span>

                <p>
                  {selectedShared.aim ||
                    "Not recorded"}
                </p>

              </div>

              <div className="shared-section">

                <span className="shared-label">
                  Hypothesis
                </span>

                <p>
                  {selectedShared.hypothesis ||
                    "Not recorded"}
                </p>

              </div>

              <div className="shared-stat-grid">

                <div>
                  <span>
                    Treatments
                  </span>

                  <strong>
                    {
                      selectedShared
                        .treatments.length
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Surfaces
                  </span>

                  <strong>
                    {
                      selectedShared
                        .surfaces.length
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Observations
                  </span>

                  <strong>
                    {
                      selectedShared
                        .observations.length
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Lab records
                  </span>

                  <strong>
                    {
                      selectedShared
                        .laboratoryResults.length
                    }
                  </strong>
                </div>

              </div>

              {/* =============================================
                  RELIABILITY
                  ============================================= */}

              <div className="shared-section">

                <span className="shared-label">
                  Reliability
                </span>

                <div className="shared-reliability">

                  <strong>
                    {selectedShared
                      .reliabilityScore ??
                      "Not assessed"}
                  </strong>

                  {selectedShared.reliabilityRating && (
                    <span>
                      {
                        selectedShared
                          .reliabilityRating
                      }
                    </span>
                  )}

                </div>

                {selectedShared
                  .reliabilityReasons
                  ?.map((reason) => (
                    <p
                      key={reason}
                      className="shared-reason"
                    >
                      • {reason}
                    </p>
                  ))}

              </div>

              {/* =============================================
                  SCIENTIFIC INTEGRITY
                  ============================================= */}

              <div className="shared-section">

                <span className="shared-label">
                  Scientific integrity
                </span>

                {selectedShared.integritySummary ? (
                  <div className="shared-integrity">

                    <span>
                      Observed{" "}
                      {
                        selectedShared
                          .integritySummary
                          .observed
                      }
                    </span>

                    <span>
                      Measured{" "}
                      {
                        selectedShared
                          .integritySummary
                          .measured
                      }
                    </span>

                    <span>
                      Inferred{" "}
                      {
                        selectedShared
                          .integritySummary
                          .inferred
                      }
                    </span>

                    <span>
                      Unknown{" "}
                      {
                        selectedShared
                          .integritySummary
                          .unknown
                      }
                    </span>

                    <span>
                      Unsupported{" "}
                      {
                        selectedShared
                          .integritySummary
                          .unsupported
                      }
                    </span>

                  </div>
                ) : (
                  <p>
                    Integrity analysis was not
                    available when this snapshot
                    was created.
                  </p>
                )}

              </div>

              {/* =============================================
                  UNEXPECTED RESULTS
                  ============================================= */}

              <div className="shared-section">

                <span className="shared-label">
                  Unexpected results
                </span>

                {selectedShared
                  .unexpectedResults.length ===
                0 ? (
                  <p>
                    No automated unexpected-result
                    patterns were detected.
                  </p>
                ) : (
                  selectedShared
                    .unexpectedResults
                    .map((result) => (
                      <div
                        className="shared-unexpected"
                        key={`${result.treatment}-${result.surface}-${result.title}`}
                      >

                        <strong>
                          {result.title}
                        </strong>

                        <span>
                          {
                            result.treatment
                          }{" "}
                          ×{" "}
                          {
                            result.surface
                          }
                        </span>

                        <p>
                          {result.description}
                        </p>

                        <small>
                          Cause not established from
                          available evidence.
                        </small>

                      </div>
                    ))
                )}

              </div>

              {/* =============================================
                  CONCLUSION
                  ============================================= */}

              <div className="shared-section">

                <span className="shared-label">
                  Conclusion
                </span>

                <p>
                  {selectedShared.conclusion ||
                    "Not recorded"}
                </p>

              </div>

              {/* =============================================
                  LIMITATIONS
                  ============================================= */}

              <div className="shared-section">

                <span className="shared-label">
                  Limitations
                </span>

                {selectedShared.limitations.length ===
                0 ? (
                  <p>
                    Not recorded
                  </p>
                ) : (
                  selectedShared.limitations.map(
                    (limitation) => (
                      <p
                        key={limitation}
                        className="shared-reason"
                      >
                        • {limitation}
                      </p>
                    ),
                  )
                )}

              </div>

              {/* =============================================
                  QR / URL
                  ============================================= */}

              <div className="shared-qr-section">

                <div>

                  <p className="eyebrow">
                    SHARE
                  </p>

                  <h4>
                    Share this frozen record
                  </h4>

                  <p>
                    The QR code opens the BioShield
                    application and identifies this
                    frozen snapshot.
                  </p>

                  <a
                    href={`${APP_URL.replace(
                      /\/+$/,
                      "",
                    )}#shared=${encodeURIComponent(
                      selectedShared.id,
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shared-url"
                  >
                    {APP_URL.replace(
                      /\/+$/,
                      "",
                    )}
                    #shared=
                    {selectedShared.id}
                  </a>

                </div>

                {qrCode && (
                  <img
                    src={qrCode}
                    alt="QR code for frozen BioShield experiment"
                    className="shared-qr"
                  />
                )}

              </div>

            </>
          )}

        </div>

      </div>

      {/* =====================================================
          BOTTOM NAVIGATION
          ===================================================== */}

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

        <button
          type="button"
          className="primary-button"
          onClick={() =>
            onNavigate("Dashboard")
          }
        >
          Back to Dashboard
        </button>

      </div>

    </section>
  )
}

export default Shared