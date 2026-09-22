import { useEffect, useState } from "react"
import {
  listExperiments,
  type ExperimentRecord,
} from "../lib/bioshield/experimentRepository"

type ExperimentsProps = {
  onOpenBuilder: () => void
  onNavigate: (page: string) => void
}

function Experiments({ onOpenBuilder, onNavigate }: ExperimentsProps) {
  const [experiments, setExperiments] = useState<ExperimentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  async function loadExperiments() {
    setLoading(true)
    setError("")

    try {
      setExperiments(await listExperiments())
    } catch {
      setError("Experiments could not be loaded from this device.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadExperiments()
  }, [])

  return (
    <div>
      <p className="eyebrow">RESEARCH</p>

      <div className="page-heading-row">
        <div>
          <h3 className="page-title">Experiments</h3>
          <p className="page-description">
            Create and manage your experimental records.
          </p>
        </div>

        {experiments.length > 0 && (
          <button
            className="create-button"
            onClick={onOpenBuilder}
          >
            + Create experiment
          </button>
        )}
      </div>

      {loading ? (
        <div className="empty-state">
          <h4>Loading experiments…</h4>
          <p>Reading your research records from this device.</p>
        </div>
      ) : error ? (
        <div className="warning-box">
          {error}
        </div>
      ) : experiments.length === 0 ? (
        <div className="empty-state">
          <h4>No experiments yet</h4>

          <p>
            Create your first experiment to begin recording treatments,
            surfaces, replicates and controls.
          </p>

          <button
            className="create-button"
            onClick={onOpenBuilder}
          >
            + Create experiment
          </button>
        </div>
      ) : (
        <div className="experiment-list">
          {experiments.map((experiment) => (
            <div
              className="experiment-card"
              key={experiment.id}
            >
              <div>
                <span className="experiment-status">
                  {experiment.methodLocked
                    ? "METHOD LOCKED"
                    : "DRAFT"}
                </span>

                <h4>{experiment.title}</h4>

                <p>{experiment.researchQuestion}</p>

                <div className="experiment-meta">
                  <span>
                    {experiment.treatments.length} treatments
                  </span>

                  <span>
                    {experiment.surfaces.length} surfaces
                  </span>

                  <span>
                    {experiment.replicates} replicates
                  </span>
                </div>
              </div>

              <button
                className="secondary-button"
                onClick={() => void loadExperiments()}
              >
                Refresh
              </button>
            </div>
          ))}
        </div>
      )}

      {/* PAGE NAVIGATION */}
      <div className="page-navigation">
        <button
          className="secondary-button"
          onClick={() => onNavigate("Dashboard")}
        >
          ← Dashboard
        </button>

        <button
          className="create-button"
          onClick={onOpenBuilder}
        >
          + Create Experiment
        </button>
      </div>
    </div>
  )
}

export default Experiments