import { useEffect, useState } from "react"

import type {
  BioShieldSettingsRecord,
} from "../lib/bioshield/database"

import {
  DEFAULT_SETTINGS,
  getSettings,
  saveSettings,
  resetPreferences,
  exportResearchBackup,
} from "../lib/bioshield/settingsRepository"

import QRCode from "qrcode"

type SettingsProps = {
  onNavigate: (page: string) => void
}

const APP_URL =
  import.meta.env.VITE_BIOSHIELD_PUBLIC_URL ||
  window.location.origin

function downloadJson(
  fileName: string,
  data: unknown,
) {
  const blob = new Blob(
    [JSON.stringify(data, null, 2)],
    {
      type: "application/json",
    },
  )

  const url = URL.createObjectURL(blob)

  const link = document.createElement("a")
  link.href = url
  link.download = fileName

  document.body.appendChild(link)
  link.click()
  link.remove()

  URL.revokeObjectURL(url)
}

function applyTheme(darkMode: boolean) {
  const root = document.documentElement

  if (darkMode) {
    root.setAttribute("data-theme", "dark")
    root.classList.add("dark")
    document.body.classList.add("dark")
  } else {
    root.removeAttribute("data-theme")
    root.classList.remove("dark")
    document.body.classList.remove("dark")
  }
}

export default function Settings({
  onNavigate,
}: SettingsProps) {
  const [settings, setSettings] =
    useState<BioShieldSettingsRecord>(
      DEFAULT_SETTINGS,
    )

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [exporting, setExporting] =
    useState(false)

  const [message, setMessage] =
    useState("")

  const [error, setError] =
    useState("")

  const [qrDataUrl, setQrDataUrl] =
    useState("")

  useEffect(() => {
    void loadSettings()
  }, [])

  async function loadSettings() {
    try {
      setLoading(true)
      setError("")

      const saved = await getSettings()

      setSettings(saved)

      applyTheme(saved.darkMode)
    } catch (err) {
      console.error(err)

      setError(
        "Could not load BioShield settings.",
      )
    } finally {
      setLoading(false)
    }
  }

  async function generateAppQr() {
    try {
      setError("")

      const dataUrl = await QRCode.toDataURL(
        APP_URL,
        {
          width: 320,
          margin: 2,
          errorCorrectionLevel: "H",
        },
      )

      setQrDataUrl(dataUrl)
    } catch (err) {
      console.error(err)

      setError(
        "Could not generate the BioShield QR code.",
      )
    }
  }

  useEffect(() => {
    if (!loading) {
      void generateAppQr()
    }
  }, [loading])

  function updateSetting<
    K extends keyof BioShieldSettingsRecord,
  >(
    key: K,
    value: BioShieldSettingsRecord[K],
  ) {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }))

    setMessage("")
    setError("")

    if (key === "darkMode") {
      applyTheme(Boolean(value))
    }
  }

  async function handleSave() {
    try {
      setSaving(true)
      setMessage("")
      setError("")

      const updated =
        await saveSettings(settings)

      setSettings(updated)

      applyTheme(updated.darkMode)

      setMessage(
        "Settings saved successfully.",
      )
    } catch (err) {
      console.error(err)

      setError(
        "Could not save BioShield settings.",
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleResetPreferences() {
    try {
      setSaving(true)
      setMessage("")
      setError("")

      const reset =
        await resetPreferences(settings)

      setSettings(reset)

      applyTheme(false)

      setMessage(
        "Preferences have been reset. Your research data was not deleted.",
      )
    } catch (err) {
      console.error(err)

      setError(
        "Could not reset preferences.",
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleExportBackup() {
    try {
      setExporting(true)
      setMessage("")
      setError("")

      const backup =
        await exportResearchBackup()

      const date =
        new Date()
          .toISOString()
          .slice(0, 10)

      downloadJson(
        `BioShield-backup-${date}.json`,
        backup,
      )

      setMessage(
        "Backup exported successfully.",
      )
    } catch (err) {
      console.error(err)

      setError(
        "Could not export the BioShield backup.",
      )
    } finally {
      setExporting(false)
    }
  }

  function downloadQrCode() {
    if (!qrDataUrl) return

    const link =
      document.createElement("a")

    link.href = qrDataUrl
    link.download =
      "BioShield-app-QR.png"

    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  if (loading) {
    return (
      <div className="settings-page">
        <div className="settings-loading">
          Loading BioShield settings…
        </div>
      </div>
    )
  }

  return (
    <div className="settings-page">

      {/* =====================================================
          HEADER
          ===================================================== */}

      <div className="settings-header">

        <p className="eyebrow">
          APPLICATION SETTINGS
        </p>

        <h3 className="page-title">
          Settings
        </h3>

        <p className="page-description">
          Manage researcher information, scientific
          defaults, data preferences and BioShield
          application behaviour.
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
              onNavigate("Reports")
            }
          >
            Reports
          </button>

          <button
            type="button"
            className="secondary-button"
            onClick={() =>
              onNavigate("Files")
            }
          >
            Files
          </button>

        </div>

      </div>

      {/* =====================================================
          MESSAGES
          ===================================================== */}

      {error && (
        <div className="settings-error">
          {error}
        </div>
      )}

      {message && (
        <div className="settings-success">
          {message}
        </div>
      )}

      {/* =====================================================
          01 — RESEARCHER PROFILE
          ===================================================== */}

      <section className="form-section settings-section">

        <div className="form-section-header">

          <span>01</span>

          <div>

            <h4>
              Researcher profile
            </h4>

            <p>
              Information used to identify your
              research records and generated reports.
            </p>

          </div>

        </div>

        <div className="settings-form-grid">

          <label>
            Researcher name

            <input
              type="text"
              value={
                settings.researcherName
              }
              onChange={(event) =>
                updateSetting(
                  "researcherName",
                  event.target.value,
                )
              }
              placeholder="Enter researcher name"
            />
          </label>

          <label>
            Institution

            <input
              type="text"
              value={
                settings.institution
              }
              onChange={(event) =>
                updateSetting(
                  "institution",
                  event.target.value,
                )
              }
              placeholder="School, laboratory or institution"
            />
          </label>

          <label className="settings-field-full">
            Project ID

            <input
              type="text"
              value={
                settings.projectId
              }
              onChange={(event) =>
                updateSetting(
                  "projectId",
                  event.target.value,
                )
              }
              placeholder="Optional project or research identifier"
            />
          </label>

        </div>

      </section>

      {/* =====================================================
          02 — SCIENTIFIC DEFAULTS
          ===================================================== */}

      <section className="form-section settings-section">

        <div className="form-section-header">

          <span>02</span>

          <div>

            <h4>
              Scientific defaults
            </h4>

            <p>
              Set the units and date format used
              throughout BioShield.
            </p>

          </div>

        </div>

        <div className="settings-form-grid">

          <label>
            Temperature unit

            <select
              value={
                settings.temperatureUnit
              }
              onChange={(event) =>
                updateSetting(
                  "temperatureUnit",
                  event.target.value as
                    | "C"
                    | "F",
                )
              }
            >

              <option value="C">
                Celsius (°C)
              </option>

              <option value="F">
                Fahrenheit (°F)
              </option>

            </select>
          </label>

          <label>
            Pressure unit

            <select
              value={
                settings.pressureUnit
              }
              onChange={(event) =>
                updateSetting(
                  "pressureUnit",
                  event.target.value as
                    | "hPa"
                    | "kPa",
                )
              }
            >

              <option value="hPa">
                hPa
              </option>

              <option value="kPa">
                kPa
              </option>

            </select>
          </label>

          <label>
            Date format

            <select
              value={
                settings.dateFormat
              }
              onChange={(event) =>
                updateSetting(
                  "dateFormat",
                  event.target.value as
                    | "DD/MM/YYYY"
                    | "MM/DD/YYYY",
                )
              }
            >

              <option value="DD/MM/YYYY">
                DD/MM/YYYY
              </option>

              <option value="MM/DD/YYYY">
                MM/DD/YYYY
              </option>

            </select>
          </label>

        </div>

      </section>

      {/* =====================================================
          03 — SCIENTIFIC INTEGRITY
          ===================================================== */}

      <section className="form-section settings-section">

        <div className="form-section-header">

          <span>03</span>

          <div>

            <h4>
              Scientific integrity
            </h4>

            <p>
              Protect BioShield's evidence-checking
              and unsupported-claim safeguards.
            </p>

          </div>

        </div>

        <div className="settings-option">

          <div>

            <strong>
              Scientific integrity protection
            </strong>

            <p>
              Warn when a conclusion goes beyond
              the evidence recorded in the experiment.
            </p>

          </div>

          <button
            type="button"
            className={`settings-toggle ${
              settings.scientificIntegrityProtection
                ? "active"
                : ""
            }`}
            onClick={() =>
              updateSetting(
                "scientificIntegrityProtection",
                !settings.scientificIntegrityProtection,
              )
            }
            aria-label="Toggle scientific integrity protection"
            aria-pressed={
              settings.scientificIntegrityProtection
            }
          >
            <span />
          </button>

        </div>

        <div className="settings-integrity-note">

          <strong>
            BioShield does not weaken scientific
            evidence requirements.
          </strong>

          <p>
            Claims such as "killed bacteria",
            "99% effective" or "prevented biofilm"
            remain subject to appropriate evidence.
          </p>

        </div>

      </section>

      {/* =====================================================
          04 — APPEARANCE
          ===================================================== */}

      <section className="form-section settings-section">

        <div className="form-section-header">

          <span>04</span>

          <div>

            <h4>
              Appearance
            </h4>

            <p>
              Control how BioShield is displayed
              on this device.
            </p>

          </div>

        </div>

        <div className="settings-option">

          <div>

            <strong>
              Dark research interface
            </strong>

            <p>
              Use the dark BioShield interface.
              Your preference is saved to your
              BioShield settings.
            </p>

          </div>

          <button
            type="button"
            className={`settings-toggle ${
              settings.darkMode
                ? "active"
                : ""
            }`}
            onClick={() =>
              updateSetting(
                "darkMode",
                !settings.darkMode,
              )
            }
            aria-label="Toggle dark mode"
            aria-pressed={
              settings.darkMode
            }
          >
            <span />
          </button>

        </div>

      </section>

      {/* =====================================================
          05 — LOCAL DATA & BACKUP
          ===================================================== */}

      <section className="form-section settings-section">

        <div className="form-section-header">

          <span>05</span>

          <div>

            <h4>
              Local data & backup
            </h4>

            <p>
              BioShield stores research data locally
              on this device in the current local mode.
            </p>

          </div>

        </div>

        <div className="settings-data-grid">

          <div className="settings-data-card">

            <span>
              STORAGE
            </span>

            <strong>
              IndexedDB
            </strong>

            <p>
              Local scientific research database.
            </p>

          </div>

          <div className="settings-data-card">

            <span>
              MODE
            </span>

            <strong>
              Local / Demo
            </strong>

            <p>
              Data is stored on this device.
            </p>

          </div>

          <div className="settings-data-card">

            <span>
              RESEARCH RECORDS
            </span>

            <strong>
              Protected
            </strong>

            <p>
              Scientific records use soft deletion.
            </p>

          </div>

        </div>

        <div className="settings-actions">

          <button
            type="button"
            className="primary-button"
            onClick={() =>
              void handleExportBackup()
            }
            disabled={exporting}
          >
            {exporting
              ? "Exporting…"
              : "Export research backup"}
          </button>

          <button
            type="button"
            className="secondary-button"
            onClick={() =>
              void handleResetPreferences()
            }
            disabled={saving}
          >
            Reset preferences
          </button>

        </div>

      </section>

      {/* =====================================================
          06 — FUNCTIONAL APP QR + URL
          ===================================================== */}

      <section className="form-section settings-section">

        <div className="form-section-header">

          <span>06</span>

          <div>

            <h4>
              BioShield app QR code
            </h4>

            <p>
              Scan this QR code on another device
              to open the BioShield application.
            </p>

          </div>

        </div>

        <div className="settings-qr-note">

          <div className="settings-qr-preview">

            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="QR code for the BioShield application"
              />
            ) : (
              <div className="settings-qr-loading">
                Generating QR…
              </div>
            )}

          </div>

          <div>

            <strong>
              BioShield application address
            </strong>

            <a
              href={APP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="settings-app-url"
            >
              {APP_URL}
            </a>

            <p className="settings-small-note">
              This is the exact address encoded
              into the QR code. You can open it
              directly or scan the QR code from
              another device.
            </p>

            <div className="settings-actions">

              <button
                type="button"
                className="primary-button"
                onClick={downloadQrCode}
                disabled={!qrDataUrl}
              >
                Download QR code
              </button>

              <button
                type="button"
                className="secondary-button"
                onClick={() =>
                  void generateAppQr()
                }
              >
                Regenerate QR
              </button>

              <a
                href={APP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="secondary-button settings-open-link"
              >
                Open BioShield
              </a>

            </div>

          </div>

        </div>

      </section>

      {/* =====================================================
          07 — ABOUT BIOSHIELD
          ===================================================== */}

      <section className="form-section settings-section">

        <div className="form-section-header">

          <span>07</span>

          <div>

            <h4>
              About BioShield
            </h4>

            <p>
              Research software identity and
              scientific purpose.
            </p>

          </div>

        </div>

        <div className="settings-about">

          <div className="settings-about-mark">
            BS
          </div>

          <div>

            <strong>
              BioShield
            </strong>

            <p>
              Beyond Disinfection
            </p>

            <span>
              Better Evidence for Surface-Treatment
              Research
            </span>

          </div>

        </div>

      </section>

      {/* =====================================================
          SAVE BAR
          ===================================================== */}

      <div className="settings-save-bar">

        <div>

          <strong>
            Save your BioShield settings
          </strong>

          <p>
            Changes are stored for your signed-in
            BioShield account on this device.
          </p>

        </div>

        <button
          type="button"
          className="primary-button settings-save-button"
          onClick={() =>
            void handleSave()
          }
          disabled={saving}
        >
          {saving
            ? "Saving settings…"
            : "Save settings"}
        </button>

      </div>

      {/* =====================================================
          BOTTOM NAVIGATION
          ===================================================== */}

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
          className="primary-button"
          onClick={() =>
            onNavigate("Reports")
          }
        >
          Reports
        </button>

      </div>

      <div className="settings-footer">
        BioShield · Beyond Disinfection · Better
        Evidence for Surface-Treatment Research
      </div>

    </div>
  )
}