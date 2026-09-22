import { useState } from "react"
import { createExperiment } from "../lib/bioshield/experimentRepository"

type BuilderProps = {
  onSaved?: () => void
  onNavigate: (page: string) => void
}

function Builder({ onSaved, onNavigate }: BuilderProps) {
  const [title, setTitle] = useState("")
  const [researchQuestion, setResearchQuestion] = useState("")
  const [aim, setAim] = useState("")
  const [hypothesis, setHypothesis] = useState("")
  const [researcher, setResearcher] = useState("")
  const [replicates, setReplicates] = useState("3")

  const [treatments, setTreatments] = useState([
    "Untreated control",
    "Natural citrus",
    "Chemical treatment",
  ])

  const [surfaces, setSurfaces] = useState([
    "Plastic",
    "Steel",
    "Wood",
  ])

  const [message, setMessage] = useState("")

  async function saveExperiment() {
    if (!title.trim()) {
      setMessage("Please enter an experiment title.")
      return
    }

    if (!researchQuestion.trim()) {
      setMessage("Please enter a research question.")
      return
    }

    const validTreatments = treatments
      .map((item) => item.trim())
      .filter(Boolean)

    const validSurfaces = surfaces
      .map((item) => item.trim())
      .filter(Boolean)

    const replicateCount = Number(replicates)

    if (
      validTreatments.length === 0 ||
      validSurfaces.length === 0
    ) {
      setMessage(
        "Please add at least one treatment and one surface.",
      )
      return
    }

    if (
      !Number.isInteger(replicateCount) ||
      replicateCount < 1
    ) {
      setMessage(
        "Replicates must be a whole number of at least 1.",
      )
      return
    }

    try {
      await createExperiment({
        title: title.trim(),
        researchQuestion: researchQuestion.trim(),
        aim: aim.trim(),
        hypothesis: hypothesis.trim(),
        researcher: researcher.trim(),
        replicates: replicateCount,
        treatments: validTreatments,
        surfaces: validSurfaces,
      })

      setMessage(
        "Experiment saved successfully to this device.",
      )

      onSaved?.()
    } catch {
      setMessage(
        "The experiment could not be saved. Please try again.",
      )
    }
  }

  function addTreatment() {
    setTreatments([...treatments, ""])
  }

  function addSurface() {
    setSurfaces([...surfaces, ""])
  }

  function updateTreatment(
    index: number,
    value: string,
  ) {
    const updated = [...treatments]
    updated[index] = value
    setTreatments(updated)
  }

  function updateSurface(
    index: number,
    value: string,
  ) {
    const updated = [...surfaces]
    updated[index] = value
    setSurfaces(updated)
  }

  return (
    <div>
      <p className="eyebrow">
        EXPERIMENT DESIGN
      </p>

      <h3 className="page-title">
        Experiment Builder
      </h3>

      <p className="page-description">
        Define your research before observations begin.
        Method details will be protected once observations
        are recorded.
      </p>

      <div className="builder-form">

        {/* =====================================================
            01 — RESEARCH INFORMATION
            ===================================================== */}

        <section className="form-section">
          <div className="form-section-header">
            <span>01</span>

            <div>
              <h4>Research information</h4>
              <p>
                Define what the experiment is investigating.
              </p>
            </div>
          </div>

          <label>
            Experiment title

            <input
              value={title}
              onChange={(event) =>
                setTitle(event.target.value)
              }
              placeholder="e.g. Surface-treatment contamination study"
            />
          </label>

          <label>
            Research question

            <textarea
              value={researchQuestion}
              onChange={(event) =>
                setResearchQuestion(event.target.value)
              }
              placeholder="How do treatment type and surface material influence changes in visual contamination over time?"
            />
          </label>

          <label>
            Aim

            <textarea
              value={aim}
              onChange={(event) =>
                setAim(event.target.value)
              }
              placeholder="State what the experiment aims to investigate."
            />
          </label>

          <label>
            Hypothesis

            <textarea
              value={hypothesis}
              onChange={(event) =>
                setHypothesis(event.target.value)
              }
              placeholder="State your testable prediction."
            />
          </label>

          <label>
            Researcher name

            <input
              value={researcher}
              onChange={(event) =>
                setResearcher(event.target.value)
              }
              placeholder="Optional"
            />
          </label>
        </section>


        {/* =====================================================
            02 — TREATMENTS
            ===================================================== */}

        <section className="form-section">
          <div className="form-section-header">
            <span>02</span>

            <div>
              <h4>Treatments</h4>
              <p>
                Define every treatment used in the experiment.
              </p>
            </div>
          </div>

          <div className="dynamic-list">
            {treatments.map((treatment, index) => (
              <div
                className="dynamic-row"
                key={index}
              >
                <span>{index + 1}</span>

                <input
                  value={treatment}
                  onChange={(event) =>
                    updateTreatment(
                      index,
                      event.target.value,
                    )
                  }
                />
              </div>
            ))}
          </div>

          <button
            type="button"
            className="outline-button"
            onClick={addTreatment}
          >
            + Add treatment
          </button>
        </section>


        {/* =====================================================
            03 — SURFACES
            ===================================================== */}

        <section className="form-section">
          <div className="form-section-header">
            <span>03</span>

            <div>
              <h4>Surfaces</h4>
              <p>
                Define the materials being investigated.
              </p>
            </div>
          </div>

          <div className="dynamic-list">
            {surfaces.map((surface, index) => (
              <div
                className="dynamic-row"
                key={index}
              >
                <span>{index + 1}</span>

                <input
                  value={surface}
                  onChange={(event) =>
                    updateSurface(
                      index,
                      event.target.value,
                    )
                  }
                />
              </div>
            ))}
          </div>

          <button
            type="button"
            className="outline-button"
            onClick={addSurface}
          >
            + Add surface
          </button>
        </section>


        {/* =====================================================
            04 — REPLICATION
            ===================================================== */}

        <section className="form-section">
          <div className="form-section-header">
            <span>04</span>

            <div>
              <h4>Replication</h4>

              <p>
                Set the number of replicates used for each
                treatment × surface combination.
              </p>
            </div>
          </div>

          <label>
            Replicates per treatment × surface

            <input
              type="number"
              min="1"
              value={replicates}
              onChange={(event) =>
                setReplicates(event.target.value)
              }
            />
          </label>

          {Number(replicates) < 3 && (
            <div className="warning-box">
              Fewer than 3 replicates limits the reliability
              statistics BioShield can calculate.
            </div>
          )}
        </section>


        {/* =====================================================
            05 — EXPERIMENTAL DESIGN
            ===================================================== */}

        <section className="form-section">
          <div className="form-section-header">
            <span>05</span>

            <div>
              <h4>Experimental design</h4>

              <p>
                BioShield will combine every treatment with
                every surface.
              </p>
            </div>
          </div>

          <div className="design-preview">
            {treatments.map((treatment) =>
              surfaces.map((surface) => (
                <div
                  className="design-cell"
                  key={`${treatment}-${surface}`}
                >
                  <strong>
                    {treatment || "Unnamed treatment"}
                  </strong>

                  <span>
                    {surface || "Unnamed surface"}
                  </span>
                </div>
              )),
            )}
          </div>
        </section>


        {/* =====================================================
            MESSAGE
            ===================================================== */}

        {message && (
          <div
            className={
              message.includes("successfully")
                ? "success-box"
                : "warning-box"
            }
          >
            {message}
          </div>
        )}


        {/* =====================================================
            SAVE + NAVIGATION
            ===================================================== */}

        <div className="builder-actions">

          <button
            type="button"
            className="secondary-button"
            onClick={() =>
              onNavigate("Experiments")
            }
          >
            ← Back to Experiments
          </button>

          <button
            type="button"
            className="create-button"
            onClick={saveExperiment}
          >
            Save experiment
          </button>

        </div>


        {/* =====================================================
            PAGE NAVIGATION
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
            className="create-button"
            onClick={() =>
              onNavigate("Observations")
            }
          >
            Continue to Observations →
          </button>

        </div>

      </div>
    </div>
  )
}

export default Builder