import {
  useEffect,
  useRef,
  useState,
} from "react"

import type { Session } from "@supabase/supabase-js"

import Dashboard from "./pages/Dashboard"
import Experiments from "./pages/Experiments"
import Builder from "./pages/Builder"
import Observations from "./pages/Observations"
import Analysis from "./pages/Analysis"
import ResearchQuality from "./pages/ResearchQuality"
import Files from "./pages/Files"
import Lab from "./pages/Lab"
import ScientificIntegrity from "./pages/ScientificIntegrity"
import UnexpectedResults from "./pages/UnexpectedResults"
import FollowUp from "./pages/FollowUp"
import FormulaSheet from "./pages/FormulaSheet"
import Calculator from "./pages/Calculator"
import Reports from "./pages/Reports"
import Shared from "./pages/Shared"
import Settings from "./pages/Settings"
import Auth from "./pages/Auth"

import {
  getSession,
  signOut,
} from "./lib/bioshield/authRepository"

import { supabase } from "./lib/supabase"

import {
  seedDemoExperiment,
} from "./lib/bioshield/experimentRepository"

import {
  getSettings,
} from "./lib/bioshield/settingsRepository"

const navigation = [
  "Dashboard",
  "Experiments",
  "Builder",
  "Observations",
  "Lab",
  "Analysis",
  "Research Quality",
  "Scientific Integrity",
  "Unexpected Results",
  "Follow-Up",
  "Formula Sheet",
  "Calculator",
  "Files",
  "Reports",
  "Shared",
  "Settings",
]

function applyTheme(
  darkMode: boolean,
) {
  const root =
    document.documentElement

  const body =
    document.body

  if (darkMode) {
    root.setAttribute(
      "data-theme",
      "dark",
    )

    root.classList.add("dark")
    body.classList.add("dark")
  } else {
    root.removeAttribute(
      "data-theme",
    )

    root.classList.remove("dark")
    body.classList.remove("dark")
  }
}

function App() {
  const [session, setSession] =
    useState<Session | null>(null)

  const [authLoading, setAuthLoading] =
    useState(true)

  const [currentPage, setCurrentPage] =
    useState("Dashboard")

  const [sidebarOpen, setSidebarOpen] =
    useState(true)

  const [tabPosition, setTabPosition] =
    useState(50)

  const [isDraggingTab, setIsDraggingTab] =
    useState(false)

  const tabRef =
    useRef<HTMLButtonElement | null>(
      null,
    )

  useEffect(() => {
    let mounted = true

    async function initialiseAuth() {
      try {
        const currentSession =
          await getSession()

        if (!mounted) return

        setSession(currentSession)

        if (currentSession) {
          try {
            const settings =
              await getSettings()

            if (mounted) {
              applyTheme(
                settings.darkMode,
              )
            }
          } catch (error) {
            console.error(
              "BioShield settings could not be loaded:",
              error,
            )

            applyTheme(false)
          }

          try {
            await seedDemoExperiment()
          } catch (error) {
            console.error(
              "BioShield demo data could not be loaded:",
              error,
            )
          }
        } else {
          applyTheme(false)
        }
      } catch (error) {
        console.error(
          "BioShield authentication could not be initialised:",
          error,
        )
      } finally {
        if (mounted) {
          setAuthLoading(false)
        }
      }
    }

    void initialiseAuth()

    const {
      data: {
        subscription,
      },
    } =
      supabase.auth.onAuthStateChange(
        (_event, newSession) => {
          if (!mounted) return

          setSession(newSession)

          if (!newSession) {
            applyTheme(false)
            setCurrentPage(
              "Dashboard",
            )
            return
          }

          void getSettings()
            .then((settings) => {
              if (!mounted) return

              applyTheme(
                settings.darkMode,
              )
            })
            .catch((error) => {
              console.error(
                "BioShield settings could not be loaded:",
                error,
              )

              applyTheme(false)
            })

          void seedDemoExperiment().catch(
            (error) => {
              console.error(
                "BioShield demo data could not be loaded:",
                error,
              )
            },
          )
        },
      )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!isDraggingTab) return

    function handlePointerMove(
      event: PointerEvent,
    ) {
      const height =
        window.innerHeight

      if (height <= 0) return

      const percentage =
        (event.clientY / height) *
        100

      const clamped =
        Math.min(
          92,
          Math.max(
            8,
            percentage,
          ),
        )

      setTabPosition(clamped)
    }

    function handlePointerUp() {
      setIsDraggingTab(false)
    }

    window.addEventListener(
      "pointermove",
      handlePointerMove,
    )

    window.addEventListener(
      "pointerup",
      handlePointerUp,
    )

    return () => {
      window.removeEventListener(
        "pointermove",
        handlePointerMove,
      )

      window.removeEventListener(
        "pointerup",
        handlePointerUp,
      )
    }
  }, [isDraggingTab])

  async function handleSignOut() {
    try {
      await signOut()

      applyTheme(false)

      setSession(null)
      setCurrentPage(
        "Dashboard",
      )
    } catch (error) {
      console.error(
        "BioShield sign out failed:",
        error,
      )
    }
  }

  function goToBuilder() {
    setCurrentPage("Builder")
  }

  function handleNavigation(
    page: string,
  ) {
    setCurrentPage(page)
  }

  function renderPage() {
    switch (currentPage) {

      case "Dashboard":
        return (
          <Dashboard
            onNavigate={
              handleNavigation
            }
          />
        )

     case "Experiments":
  return (
    <Experiments
      onOpenBuilder={goToBuilder}
      onNavigate={handleNavigation}
    />
  )

      case "Builder":
        return (
          <Builder
            onSaved={() =>
              handleNavigation(
                "Experiments",
              )
            }
            onNavigate={
              handleNavigation
            }
          />
        )

      case "Observations":
        return (
          <Observations
            onNavigate={
              handleNavigation
            }
          />
        )

      case "Lab":
        return (
          <Lab
            onNavigate={
              handleNavigation
            }
          />
        )

      case "Analysis":
        return (
          <Analysis
            onNavigate={
              handleNavigation
            }
          />
        )

      case "Research Quality":
        return (
          <ResearchQuality
            onNavigate={
              handleNavigation
            }
          />
        )

      case "Scientific Integrity":
        return (
          <ScientificIntegrity
            onNavigate={
              handleNavigation
            }
          />
        )

      case "Unexpected Results":
        return (
          <UnexpectedResults
            onNavigate={
              handleNavigation
            }
          />
        )

      case "Follow-Up":
        return (
          <FollowUp
            onNavigate={
              handleNavigation
            }
          />
        )

      case "Formula Sheet":
        return (
          <FormulaSheet
            onNavigate={
              handleNavigation
            }
          />
        )

      case "Calculator":
        return (
          <Calculator
            onNavigate={
              handleNavigation
            }
          />
        )

      case "Files":
        return (
          <Files
            onNavigate={
              handleNavigation
            }
          />
        )

      case "Reports":
        return (
          <Reports
            onNavigate={
              handleNavigation
            }
          />
        )

      case "Shared":
        return (
          <Shared
            onNavigate={
              handleNavigation
            }
          />
        )

      case "Settings":
        return (
          <Settings
            onNavigate={
              handleNavigation
            }
          />
        )

      default:
        return (
          <Dashboard
            onNavigate={
              handleNavigation
            }
          />
        )
    }
  }

  if (authLoading) {
    return (
      <div className="auth-loading">

        <div className="auth-card">

          <div className="auth-brand">

            <div className="auth-brand-mark">
              B
            </div>

            <div>

              <h1>
                BioShield
              </h1>

              <p>
                Beyond Disinfection
              </p>

            </div>

          </div>

          <p>
            Connecting to your research
            workspace...
          </p>

        </div>

      </div>
    )
  }

  if (!session) {
    return (
      <Auth
        onAuthenticated={() => {
          setCurrentPage(
            "Dashboard",
          )
        }}
      />
    )
  }

  return (
    <div
      className={`bioshield-app ${
        sidebarOpen
          ? "sidebar-is-open"
          : "sidebar-is-closed"
      }`}
    >

      {/* =====================================================
          COLLAPSIBLE SIDEBAR
          ===================================================== */}

      <aside className="sidebar">

        <div className="brand">

          <div className="brand-mark">
            B
          </div>

          <div>

            <h1>
              BioShield
            </h1>

            <p>
              Beyond Disinfection
            </p>

          </div>

          <button
            type="button"
            className="sidebar-close-button"
            aria-label="Close navigation"
            title="Close navigation"
            onClick={() =>
              setSidebarOpen(false)
            }
          >
            ×
          </button>

        </div>

        <nav>

          {navigation.map(
            (item) => (
              <button
                key={item}
                type="button"
                className={`nav-item ${
                  currentPage === item
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  handleNavigation(
                    item,
                  )
                }
              >
                {item}
              </button>
            ),
          )}

        </nav>

        <div className="sidebar-footer">

          <span className="status-dot" />

          <div className="account-details">

            <strong>
              Account secured
            </strong>

            <small>
              {session.user.email}
            </small>

          </div>

          <button
            type="button"
            className="sidebar-signout-button"
            onClick={
              handleSignOut
            }
          >
            Sign out
          </button>

        </div>

      </aside>

      {/* =====================================================
          MOVABLE OPEN/CLOSE TAB
          ===================================================== */}

      {!sidebarOpen && (
        <button
          ref={tabRef}
          type="button"
          className={`sidebar-open-tab ${
            isDraggingTab
              ? "dragging"
              : ""
          }`}
          style={{
            top: `${tabPosition}%`,
          }}
          aria-label="Open navigation"
          title="Open navigation"
          onClick={() => {
            if (!isDraggingTab) {
              setSidebarOpen(true)
            }
          }}
          onPointerDown={(event) => {
            event.preventDefault()

            setIsDraggingTab(true)

            event.currentTarget
              .setPointerCapture?.(
                event.pointerId,
              )
          }}
        >

          <span className="sidebar-tab-grip">
            ⋮
          </span>

          <span className="sidebar-tab-letter">
            B
          </span>

        </button>
      )}

      {/* =====================================================
          MAIN WORKSPACE
          ===================================================== */}

      <main className="main-content">

        <header className="topbar">

          <div className="topbar-left">

            <p className="breadcrumb">
              BioShield /{" "}
              {currentPage}
            </p>

          </div>

          <div className="topbar-actions">

            {currentPage ===
              "Experiments" && (
              <button
                type="button"
                className="create-button"
                onClick={
                  goToBuilder
                }
              >
                + Create experiment
              </button>
            )}

            {!sidebarOpen && (
              <button
                type="button"
                className="sidebar-mobile-open-button"
                onClick={() =>
                  setSidebarOpen(
                    true,
                  )
                }
              >
                ☰
              </button>
            )}

          </div>

        </header>

        <div className="page-content">
          {renderPage()}
        </div>

      </main>

    </div>
  )
}

export default App