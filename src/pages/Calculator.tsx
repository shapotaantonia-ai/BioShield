import { useState } from "react"

type CalculatorMode =
  | "Scientific"
  | "Chemistry"
  | "Statistics"
  | "Dilution"
  | "Surface"

type CalculatorProps = {
  onNavigate: (page: string) => void
}

function calculateMean(values: number[]) {
  if (values.length === 0) return null

  return (
    values.reduce((sum, value) => sum + value, 0) /
    values.length
  )
}

function calculateMedian(values: number[]) {
  if (values.length === 0) return null

  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)

  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2
  }

  return sorted[middle]
}

function calculateSD(values: number[]) {
  if (values.length < 3) return null

  const mean = calculateMean(values)

  if (mean === null) return null

  const variance =
    values.reduce(
      (sum, value) => sum + Math.pow(value - mean, 2),
      0,
    ) /
    (values.length - 1)

  return Math.sqrt(variance)
}

export default function Calculator({
  onNavigate,
}: CalculatorProps) {
  const [mode, setMode] =
    useState<CalculatorMode>("Scientific")

  const [display, setDisplay] = useState("0")
  const [previousValue, setPreviousValue] =
    useState<number | null>(null)
  const [operator, setOperator] = useState<string | null>(null)
  const [waitingForOperand, setWaitingForOperand] =
    useState(false)

  const [c1, setC1] = useState("")
  const [v1, setV1] = useState("")
  const [v2, setV2] = useState("")

  const [chemistryValue, setChemistryValue] =
    useState("")

  const [dataset, setDataset] = useState("")
  const [volume, setVolume] = useState("")
  const [area, setArea] = useState("")

  const [researchResult, setResearchResult] =
    useState<string | null>(null)

  const [warning, setWarning] =
    useState<string | null>(null)

  function clearCalculator() {
    setDisplay("0")
    setPreviousValue(null)
    setOperator(null)
    setWaitingForOperand(false)
  }

  function clearResearch() {
    setResearchResult(null)
    setWarning(null)
  }

  function inputNumber(number: string) {
    if (waitingForOperand) {
      setDisplay(number)
      setWaitingForOperand(false)
      return
    }

    setDisplay(
      display === "0"
        ? number
        : `${display}${number}`,
    )
  }

  function inputDecimal() {
    if (waitingForOperand) {
      setDisplay("0.")
      setWaitingForOperand(false)
      return
    }

    if (!display.includes(".")) {
      setDisplay(`${display}.`)
    }
  }

  function backspace() {
    if (waitingForOperand) return

    const next = display.slice(0, -1)

    setDisplay(next || "0")
  }

  function toggleSign() {
    if (display === "0") return

    setDisplay(
      display.startsWith("-")
        ? display.slice(1)
        : `-${display}`,
    )
  }

  function calculateOperation(
    first: number,
    second: number,
    selectedOperator: string,
  ) {
    switch (selectedOperator) {
      case "+":
        return first + second

      case "-":
        return first - second

      case "×":
        return first * second

      case "÷":
        if (second === 0) return null
        return first / second

      case "^":
        return Math.pow(first, second)

      default:
        return second
    }
  }

  function chooseOperator(nextOperator: string) {
    const inputValue = Number(display)

    if (!Number.isFinite(inputValue)) return

    if (operator && previousValue !== null) {
      const result = calculateOperation(
        previousValue,
        inputValue,
        operator,
      )

      if (result === null) {
        setDisplay("Error")
        setPreviousValue(null)
        setOperator(null)
        return
      }

      setDisplay(String(result))
      setPreviousValue(result)
    } else {
      setPreviousValue(inputValue)
    }

    setOperator(nextOperator)
    setWaitingForOperand(true)
  }

  function equals() {
    if (!operator || previousValue === null) {
      return
    }

    const inputValue = Number(display)

    const result = calculateOperation(
      previousValue,
      inputValue,
      operator,
    )

    if (result === null) {
      setDisplay("Error")
    } else {
      setDisplay(String(result))
    }

    setPreviousValue(null)
    setOperator(null)
    setWaitingForOperand(true)
  }

  function calculateScientificFunction(
    functionName: string,
  ) {
    const value = Number(display)

    if (!Number.isFinite(value)) return

    let result: number

    switch (functionName) {
      case "sqrt":
        if (value < 0) {
          setDisplay("Error")
          return
        }

        result = Math.sqrt(value)
        break

      case "square":
        result = Math.pow(value, 2)
        break

      case "sin":
        result = Math.sin((value * Math.PI) / 180)
        break

      case "cos":
        result = Math.cos((value * Math.PI) / 180)
        break

      case "tan":
        result = Math.tan((value * Math.PI) / 180)
        break

      case "log":
        if (value <= 0) {
          setDisplay("Error")
          return
        }

        result = Math.log10(value)
        break

      case "ln":
        if (value <= 0) {
          setDisplay("Error")
          return
        }

        result = Math.log(value)
        break

      case "exp":
        result = Math.exp(value)
        break

      case "inverse":
        if (value === 0) {
          setDisplay("Error")
          return
        }

        result = 1 / value
        break

      default:
        return
    }

    setDisplay(String(result))
    setWaitingForOperand(true)
  }

  function runDilutionCalculation() {
    clearResearch()

    const initialConcentration = Number(c1)
    const initialVolume = Number(v1)
    const finalVolume = Number(v2)

    if (
      !Number.isFinite(initialConcentration) ||
      !Number.isFinite(initialVolume) ||
      !Number.isFinite(finalVolume) ||
      initialVolume <= 0 ||
      finalVolume <= 0
    ) {
      setWarning(
        "Enter valid positive concentration and volume values.",
      )
      return
    }

    const finalConcentration =
      (initialConcentration * initialVolume) /
      finalVolume

    setResearchResult(
      [
        `C₁ = ${initialConcentration}`,
        `V₁ = ${initialVolume}`,
        `V₂ = ${finalVolume}`,
        "",
        "C₁V₁ = C₂V₂",
        "",
        `C₂ = ${finalConcentration}`,
      ].join("\n"),
    )
  }

  function runChemistryCalculation() {
    setResearchResult(null)
    setWarning(null)

    const rawValue = chemistryValue.trim()
    const hydrogenIonConcentration = Number(rawValue)

    if (
      rawValue === "" ||
      !Number.isFinite(hydrogenIonConcentration) ||
      hydrogenIonConcentration <= 0
    ) {
      setWarning(
        "Enter a hydrogen-ion concentration greater than zero, for example 0.001.",
      )
      return
    }

    const pH = -Math.log10(hydrogenIonConcentration)
    const pOH = 14 - pH
    const hydroxideIonConcentration = Math.pow(10, -pOH)

    setResearchResult(
      [
        `[H⁺] = ${hydrogenIonConcentration} mol/L`,
        "",
        `pH = ${pH.toFixed(4)}`,
        "",
        `pOH = ${pOH.toFixed(4)}`,
        "",
        `[OH⁻] = ${hydroxideIonConcentration.toExponential(4)} mol/L`,
        "",
        "At 25°C:",
        "pH + pOH = 14",
      ].join("\n"),
    )

    setWarning(
      "The pOH relationship uses pH + pOH = 14 at 25°C.",
    )
  }

  function runStatisticsCalculation() {
    clearResearch()

    const values = dataset
      .split(",")
      .map((item) => Number(item.trim()))
      .filter((value) => Number.isFinite(value))

    if (values.length === 0) {
      setWarning(
        "Enter values separated by commas.",
      )
      return
    }

    const mean = calculateMean(values)
    const median = calculateMedian(values)
    const minimum = Math.min(...values)
    const maximum = Math.max(...values)
    const range = maximum - minimum
    const sd = calculateSD(values)

    setResearchResult(
      [
        `n = ${values.length}`,
        `Mean = ${mean?.toFixed(4)}`,
        `Median = ${median?.toFixed(4)}`,
        `Minimum = ${minimum}`,
        `Maximum = ${maximum}`,
        `Range = ${range}`,
        `Sample SD = ${
          sd === null
            ? "Not calculated — n < 3"
            : sd.toFixed(4)
        }`,
      ].join("\n"),
    )

    if (values.length < 3) {
      setWarning(
        "BioShield does not calculate sample standard deviation when fewer than 3 observations are available.",
      )
    }
  }

  function runSurfaceCalculation() {
    clearResearch()

    const treatmentVolume = Number(volume)
    const surfaceArea = Number(area)

    if (
      !Number.isFinite(treatmentVolume) ||
      !Number.isFinite(surfaceArea) ||
      treatmentVolume < 0 ||
      surfaceArea <= 0
    ) {
      setWarning(
        "Enter a valid treatment volume and surface area greater than zero.",
      )
      return
    }

    const result = treatmentVolume / surfaceArea

    setResearchResult(
      [
        `Treatment volume = ${treatmentVolume} mL`,
        `Surface area = ${surfaceArea} cm²`,
        "",
        "Volume / Area",
        "",
        `${result.toFixed(6)} mL/cm²`,
      ].join("\n"),
    )
  }

  function runResearchCalculation() {
    if (mode === "Dilution") {
      runDilutionCalculation()
    }

    if (mode === "Chemistry") {
      runChemistryCalculation()
    }

    if (mode === "Statistics") {
      runStatisticsCalculation()
    }

    if (mode === "Surface") {
      runSurfaceCalculation()
    }
  }

  return (
    <section className="page-shell calculator-page">
      <div className="page-header">
        <div>
          <p className="eyebrow">RESEARCH TOOLS</p>

          <h3 className="page-title">
            Scientific Calculator
          </h3>

          <p className="page-description">
            A working calculator for everyday scientific
            calculations and BioShield research analysis.
          </p>
        </div>
      </div>

      <div className="calculator-layout">
        {/* =====================================================
            REAL CALCULATOR
            ===================================================== */}

        <div className="calculator-panel">
          <div className="calculator-display">
            {display}
          </div>

          <div className="calculator-keypad">
            <button
              type="button"
              className="calculator-function"
              onClick={clearCalculator}
            >
              AC
            </button>

            <button
              type="button"
              className="calculator-function"
              onClick={backspace}
            >
              DEL
            </button>

            <button
              type="button"
              className="calculator-function"
              onClick={toggleSign}
            >
              +/−
            </button>

            <button
              type="button"
              className="calculator-operator"
              onClick={() => chooseOperator("÷")}
            >
              ÷
            </button>

            {["7", "8", "9"].map((number) => (
              <button
                key={number}
                type="button"
                className="calculator-number"
                onClick={() => inputNumber(number)}
              >
                {number}
              </button>
            ))}

            <button
              type="button"
              className="calculator-operator"
              onClick={() => chooseOperator("×")}
            >
              ×
            </button>

            {["4", "5", "6"].map((number) => (
              <button
                key={number}
                type="button"
                className="calculator-number"
                onClick={() => inputNumber(number)}
              >
                {number}
              </button>
            ))}

            <button
              type="button"
              className="calculator-operator"
              onClick={() => chooseOperator("-")}
            >
              −
            </button>

            {["1", "2", "3"].map((number) => (
              <button
                key={number}
                type="button"
                className="calculator-number"
                onClick={() => inputNumber(number)}
              >
                {number}
              </button>
            ))}

            <button
              type="button"
              className="calculator-operator"
              onClick={() => chooseOperator("+")}
            >
              +
            </button>

            <button
              type="button"
              className="calculator-number calculator-zero"
              onClick={() => inputNumber("0")}
            >
              0
            </button>

            <button
              type="button"
              className="calculator-number"
              onClick={inputDecimal}
            >
              .
            </button>

            <button
              type="button"
              className="calculator-operator"
              onClick={() => chooseOperator("^")}
            >
              xʸ
            </button>

            <button
              type="button"
              className="calculator-equals"
              onClick={equals}
            >
              =
            </button>
          </div>

          <div className="scientific-keypad">
            {[
              ["√", "sqrt"],
              ["x²", "square"],
              ["sin", "sin"],
              ["cos", "cos"],
              ["tan", "tan"],
              ["log", "log"],
              ["ln", "ln"],
              ["eˣ", "exp"],
              ["1/x", "inverse"],
            ].map(([label, functionName]) => (
              <button
                key={functionName}
                type="button"
                onClick={() =>
                  calculateScientificFunction(functionName)
                }
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* =====================================================
            RESEARCH CALCULATOR
            ===================================================== */}

        <aside className="calculator-research-panel">
          <div className="calculator-modes">
            {(
              [
                "Scientific",
                "Chemistry",
                "Statistics",
                "Dilution",
                "Surface",
              ] as CalculatorMode[]
            ).map((item) => (
              <button
                key={item}
                type="button"
                className={
                  mode === item
                    ? "calculator-mode active"
                    : "calculator-mode"
                }
                onClick={() => {
                  setMode(item)
                  clearResearch()
                }}
              >
                {item}
              </button>
            ))}
          </div>

          {mode === "Scientific" && (
            <div className="calculator-research-empty">
              <strong>Scientific mode</strong>

              <p>
                Use the calculator keypad on the left for
                general scientific calculations.
              </p>
            </div>
          )}

          {mode === "Chemistry" && (
            <div className="calculator-form">
              <h4>Chemistry calculation</h4>

              <p className="calculator-help">
                Enter a hydrogen-ion concentration to
                calculate pH and related values.
              </p>

              <label>
                Hydrogen-ion concentration [H⁺]
                <input
                  type="number"
                  step="any"
                  value={chemistryValue}
                  onChange={(event) =>
                    setChemistryValue(event.target.value)
                  }
                  placeholder="Example: 0.001"
                />
              </label>

              <button
                type="button"
                className="primary-button"
                onClick={runChemistryCalculation}
              >
                Calculate chemistry
              </button>
            </div>
          )}

          {mode === "Dilution" && (
            <div className="calculator-form">
              <h4>Dilution calculator</h4>

              <label>
                C₁ — initial concentration
                <input
                  type="number"
                  step="any"
                  value={c1}
                  onChange={(event) =>
                    setC1(event.target.value)
                  }
                />
              </label>

              <label>
                V₁ — initial volume
                <input
                  type="number"
                  step="any"
                  value={v1}
                  onChange={(event) =>
                    setV1(event.target.value)
                  }
                />
              </label>

              <label>
                V₂ — final volume
                <input
                  type="number"
                  step="any"
                  value={v2}
                  onChange={(event) =>
                    setV2(event.target.value)
                  }
                />
              </label>

              <div className="calculator-formula">
                C₁V₁ = C₂V₂
              </div>

              <button
                type="button"
                className="primary-button"
                onClick={runResearchCalculation}
              >
                Calculate dilution
              </button>
            </div>
          )}

          {mode === "Statistics" && (
            <div className="calculator-form">
              <h4>Research statistics</h4>

              <label>
                Observations
                <input
                  value={dataset}
                  onChange={(event) =>
                    setDataset(event.target.value)
                  }
                  placeholder="0, 1, 2, 4, 6, 6"
                />
              </label>

              <button
                type="button"
                className="primary-button"
                onClick={runResearchCalculation}
              >
                Analyse dataset
              </button>
            </div>
          )}

          {mode === "Surface" && (
            <div className="calculator-form">
              <h4>Surface treatment</h4>

              <label>
                Treatment volume (mL)
                <input
                  type="number"
                  step="any"
                  value={volume}
                  onChange={(event) =>
                    setVolume(event.target.value)
                  }
                />
              </label>

              <label>
                Surface area (cm²)
                <input
                  type="number"
                  step="any"
                  value={area}
                  onChange={(event) =>
                    setArea(event.target.value)
                  }
                />
              </label>

              <div className="calculator-formula">
                Volume / Area
              </div>

              <button
                type="button"
                className="primary-button"
                onClick={runResearchCalculation}
              >
                Calculate volume/area
              </button>
            </div>
          )}

          {researchResult && (
            <div className="calculator-research-result">
              <p className="eyebrow">RESULT</p>

              <pre>{researchResult}</pre>
            </div>
          )}

          {warning && (
            <div className="calculator-warning">
              <strong>Scientific caution</strong>
              <p>{warning}</p>
            </div>
          )}
        </aside>
      </div>

      {/* =====================================================
          PAGE NAVIGATION
          ===================================================== */}

      <div className="page-navigation">
        <button
          type="button"
          className="secondary-button"
          onClick={() => onNavigate("Dashboard")}
        >
          ← Dashboard
        </button>

        <button
          type="button"
          className="create-button"
          onClick={() => onNavigate("Formula Sheet")}
        >
          Formula Sheet →
        </button>
      </div>
    </section>
  )
}