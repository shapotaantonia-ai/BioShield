import { useState } from "react"
import type { FormEvent } from "react"

import {
  signIn,
  signUp,
} from "../lib/bioshield/authRepository"

interface AuthProps {
  onAuthenticated: () => void
}

export default function Auth({ onAuthenticated }: AuthProps) {
  const [mode, setMode] = useState<"login" | "signup">("login")

  const [researcherName, setResearcherName] = useState("")
  const [institution, setInstitution] = useState("")
  const [projectId, setProjectId] = useState("")

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setError("")
    setMessage("")
    setLoading(true)

    try {
      if (mode === "signup") {
        if (!researcherName.trim()) {
          throw new Error("Please enter your researcher name.")
        }

        const data = await signUp(
          email.trim(),
          password,
          researcherName.trim(),
          institution.trim(),
          projectId.trim(),
        )

        if (!data.session) {
          setMessage(
            "Account created. Check your email to confirm your account before signing in.",
          )
        } else {
          onAuthenticated()
        }
      } else {
        await signIn(email.trim(), password)

        onAuthenticated()
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("Something went wrong. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  function switchMode() {
    setMode(mode === "login" ? "signup" : "login")
    setError("")
    setMessage("")
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-brand-mark">B</div>

          <div>
            <h1>BioShield</h1>
            <p>Beyond Disinfection</p>
          </div>
        </div>

        <div className="auth-heading">
          <h2>
            {mode === "login"
              ? "Welcome back"
              : "Create your researcher account"}
          </h2>

          <p>
            {mode === "login"
              ? "Sign in to access your BioShield research workspace."
              : "Create an account to keep your research workspace connected to your identity."}
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === "signup" && (
            <>
              <label>
                Researcher name
                <input
                  type="text"
                  value={researcherName}
                  onChange={(event) =>
                    setResearcherName(event.target.value)
                  }
                  placeholder="Your name"
                  autoComplete="name"
                  required
                />
              </label>

              <label>
                Institution
                <input
                  type="text"
                  value={institution}
                  onChange={(event) =>
                    setInstitution(event.target.value)
                  }
                  placeholder="School, university or organisation"
                  autoComplete="organization"
                />
              </label>

              <label>
                Project ID
                <input
                  type="text"
                  value={projectId}
                  onChange={(event) =>
                    setProjectId(event.target.value)
                  }
                  placeholder="Optional project ID"
                />
              </label>
            </>
          )}

          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="researcher@example.com"
              autoComplete="email"
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              autoComplete={
                mode === "login"
                  ? "current-password"
                  : "new-password"
              }
              minLength={6}
              required
            />
          </label>

          {error && (
            <div className="auth-message auth-error">
              {error}
            </div>
          )}

          {message && (
            <div className="auth-message auth-success">
              {message}
            </div>
          )}

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading
              ? "Please wait..."
              : mode === "login"
                ? "Sign in"
                : "Create account"}
          </button>
        </form>

        <div className="auth-switch">
          <span>
            {mode === "login"
              ? "Don't have an account?"
              : "Already have an account?"}
          </span>

          <button
            type="button"
            onClick={switchMode}
            disabled={loading}
          >
            {mode === "login"
              ? "Create account"
              : "Sign in"}
          </button>
        </div>

        <div className="auth-security">
          <strong>Research data protection</strong>

          <p>
            Your BioShield account is used to identify your research
            workspace. Scientific records will remain subject to
            BioShield's audit, versioning and integrity controls.
          </p>
        </div>

        <div className="auth-local-note">
          <span className="status-dot" />
          <span>
            Secure account connection • BioShield
          </span>
        </div>
      </div>
    </div>
  )
}