type DashboardProps = {
  onNavigate: (page: string) => void
}

function Dashboard({
  onNavigate,
}: DashboardProps) {
  return (
    <div className="dashboard">

      {/* =====================================================
          HERO / RESEARCH WORKSPACE
          ===================================================== */}
      <section className="welcome-panel">

        <div>
          <p className="eyebrow">
            BIOMEDICAL RESEARCH PLATFORM
          </p>

          <h3>
            Research workspace
          </h3>

          <p>
            Record, analyse and evaluate surface-treatment
            research with evidence you can trace.
          </p>

          <div className="dashboard-hero-actions">

            <button
              type="button"
              className="dashboard-primary-action"
              onClick={() => onNavigate("Builder")}
            >
              + Create experiment
            </button>

            <button
              type="button"
              className="dashboard-secondary-action"
              onClick={() => onNavigate("Research Quality")}
            >
              View research quality
            </button>

          </div>
        </div>

        <div className="quality-preview">
          <span>
            Experimental quality
          </span>

          <strong>
            —
          </strong>

          <small>
            Select an experiment to assess
            evidence quality.
          </small>
        </div>

      </section>


      {/* =====================================================
          SECTION HEADER
          ===================================================== */}
      <div className="section-header">

        <div>
          <h3>
            Research overview
          </h3>

          <p>
            Your current BioShield research workspace.
          </p>
        </div>

      </div>


      {/* =====================================================
          LIVE STATUS STRIP
          ===================================================== */}
      <div className="dashboard-status-strip">

        <div className="dashboard-status-item teal">
          <span>
            Experiments
          </span>

          <strong>
            —
          </strong>

          <small>
            Research projects
          </small>
        </div>


        <div className="dashboard-status-item">
          <span>
            Observations
          </span>

          <strong>
            —
          </strong>

          <small>
            Recorded observations
          </small>
        </div>


        <div className="dashboard-status-item">
          <span>
            Lab results
          </span>

          <strong>
            —
          </strong>

          <small>
            Laboratory evidence
          </small>
        </div>


        <div className="dashboard-status-item gold">
          <span>
            Research quality
          </span>

          <strong>
            —
          </strong>

          <small>
            Experimental assessment
          </small>
        </div>

      </div>


      {/* =====================================================
          RESEARCH TOOLS
          ===================================================== */}
      <div className="section-header">

        <div>
          <h3>
            Research tools
          </h3>

          <p>
            Move from recording evidence to evaluating
            what that evidence can support.
          </p>
        </div>

      </div>


      <div className="dashboard-grid">

        {/* EXPERIMENTS */}
        <article className="dashboard-card interactive">

          <div className="dashboard-card-top">
            <div className="card-icon">
              01
            </div>
          </div>

          <h4>
            Experiments
          </h4>

          <p>
            Create and manage your research experiments,
            variables, treatments, surfaces and controls.
          </p>

          <button
            type="button"
            onClick={() => onNavigate("Experiments")}
          >
            Open experiments →
          </button>

        </article>


        {/* OBSERVATIONS */}
        <article className="dashboard-card interactive">

          <div className="dashboard-card-top">
            <div className="card-icon">
              02
            </div>
          </div>

          <h4>
            Observations
          </h4>

          <p>
            Record observations and supporting evidence
            while keeping treatment, surface and replicate
            information traceable.
          </p>

          <button
            type="button"
            onClick={() => onNavigate("Observations")}
          >
            Record observations →
          </button>

        </article>


        {/* RESEARCH QUALITY */}
        <article className="dashboard-card interactive">

          <div className="dashboard-card-top">
            <div className="card-icon">
              03
            </div>
          </div>

          <h4>
            Research Quality
          </h4>

          <p>
            Check whether your experimental design and
            recorded evidence support the conclusions
            you want to make.
          </p>

          <button
            type="button"
            onClick={() => onNavigate("Research Quality")}
          >
            Check quality →
          </button>

        </article>


        {/* SCIENTIFIC INTEGRITY */}
        <article className="dashboard-card interactive">

          <div className="dashboard-card-top">
            <div className="card-icon">
              04
            </div>
          </div>

          <h4>
            Scientific Integrity
          </h4>

          <p>
            Separate observations, measurements,
            inferences and unknowns before making
            scientific claims.
          </p>

          <button
            type="button"
            onClick={() => onNavigate("Scientific Integrity")}
          >
            Review integrity →
          </button>

        </article>


        {/* ANALYSIS */}
        <article className="dashboard-card interactive">

          <div className="dashboard-card-top">
            <div className="card-icon">
              05
            </div>
          </div>

          <h4>
            Analysis
          </h4>

          <p>
            Explore recorded observations using actual
            research data rather than unsupported
            conclusions.
          </p>

          <button
            type="button"
            onClick={() => onNavigate("Analysis")}
          >
            Open analysis →
          </button>

        </article>


        {/* UNEXPECTED RESULTS */}
        <article className="dashboard-card interactive gold">

          <div className="dashboard-card-top">
            <div className="card-icon">
              06
            </div>
          </div>

          <h4>
            Unexpected Results
          </h4>

          <p>
            Identify patterns that do not fit the expected
            outcome and record them instead of ignoring
            them.
          </p>

          <button
            type="button"
            onClick={() => onNavigate("Unexpected Results")}
          >
            Review unexpected results →
          </button>

        </article>

      </div>


      {/* =====================================================
          RECENT ACTIVITY
          ===================================================== */}
      <section className="dashboard-activity">

        <div className="dashboard-activity-header">

          <h3>
            Recent research activity
          </h3>

        </div>


        <div className="dashboard-activity-list">

          <div className="dashboard-activity-item">

            <span className="activity-dot" />

            <div>
              <strong>
                Research workspace ready
              </strong>

              <span>
                BioShield is ready to record and evaluate
                experimental evidence.
              </span>
            </div>

          </div>


          <div className="dashboard-activity-item">

            <span className="activity-dot" />

            <div>
              <strong>
                Evidence-first research
              </strong>

              <span>
                Observations should be recorded before
                conclusions are made.
              </span>
            </div>

          </div>


          <div className="dashboard-activity-item">

            <span className="activity-dot gold" />

            <div>
              <strong>
                Scientific caution
              </strong>

              <span>
                Unknown or unverified information should
                remain clearly labelled.
              </span>
            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          RESEARCH PRINCIPLE
          ===================================================== */}
      <div className="principle">

        <span>
          BIOSHIELD RESEARCH PRINCIPLE
        </span>

        <p>
          BioShield does not simply store research.
          It helps you check whether the evidence you
          recorded can actually support the conclusion
          being made.
        </p>

      </div>


      {/* =====================================================
          DASHBOARD NAVIGATION
          ===================================================== */}
      <div className="page-navigation">

        <button
          type="button"
          className="create-button"
          onClick={() => onNavigate("Experiments")}
        >
          Open Experiments →
        </button>

        <button
          type="button"
          className="secondary-button"
          onClick={() => onNavigate("Calculator")}
        >
          Scientific Calculator
        </button>

      </div>

    </div>
  )
}

export default Dashboard