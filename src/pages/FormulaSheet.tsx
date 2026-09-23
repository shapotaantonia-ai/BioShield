import { useMemo, useState } from "react"

type FormulaSheetProps = {
  onNavigate: (page: string) => void
}

type FormulaCategory =
  | "All"
  | "Chemistry"
  | "Moles"
  | "Concentration"
  | "Acids & Bases"
  | "Stoichiometry"
  | "Rates"
  | "Equilibrium"
  | "Electrochemistry"
  | "Gases"
  | "Thermochemistry"
  | "Organic Chemistry"
  | "Statistics"
  | "Experimental"
  | "Units"

type Formula = {
  name: string
  category: Exclude<FormulaCategory, "All">
  formula: string
  variables: string
  units: string
  use: string
  caution?: string
}

const formulas: Formula[] = [
  // =========================================================
  // MOLES
  // =========================================================

  {
    name: "Number of Moles from Mass",
    category: "Moles",
    formula: "n = m / M",
    variables:
      "n = amount of substance · m = mass · M = molar mass",
    units: "n: mol · m: g · M: g·mol⁻¹",
    use: "Calculate the number of moles when mass and molar mass are known.",
  },

  {
    name: "Mass from Moles",
    category: "Moles",
    formula: "m = nM",
    variables:
      "m = mass · n = amount of substance · M = molar mass",
    units: "m: g · n: mol · M: g·mol⁻¹",
    use: "Calculate mass from the number of moles.",
  },

  {
    name: "Particles from Moles",
    category: "Moles",
    formula: "N = nNₐ",
    variables:
      "N = number of particles · n = moles · Nₐ = Avogadro constant",
    units: "Nₐ = 6.022 × 10²³ mol⁻¹",
    use: "Convert between moles and number of particles.",
  },

  {
    name: "Moles from Particles",
    category: "Moles",
    formula: "n = N / Nₐ",
    variables:
      "n = moles · N = number of particles · Nₐ = Avogadro constant",
    units: "mol",
    use: "Calculate moles from the number of particles.",
  },

  // =========================================================
  // CONCENTRATION
  // =========================================================

  {
    name: "Molar Concentration",
    category: "Concentration",
    formula: "c = n / V",
    variables:
      "c = concentration · n = amount of substance · V = solution volume",
    units: "mol·dm⁻³",
    use: "Calculate molar concentration of a solution.",
  },

  {
    name: "Moles from Concentration",
    category: "Concentration",
    formula: "n = cV",
    variables:
      "n = moles · c = concentration · V = solution volume",
    units: "mol",
    use: "Calculate the number of moles in a solution.",
    caution:
      "Volume must be expressed in dm³ when concentration is in mol·dm⁻³.",
  },

  {
    name: "Mass Concentration",
    category: "Concentration",
    formula: "cₘ = m / V",
    variables:
      "cₘ = mass concentration · m = solute mass · V = solution volume",
    units: "g·dm⁻³",
    use: "Calculate concentration when mass rather than moles is used.",
  },

  {
    name: "Dilution Equation",
    category: "Concentration",
    formula: "C₁V₁ = C₂V₂",
    variables:
      "C₁ = initial concentration · V₁ = initial volume · C₂ = final concentration · V₂ = final volume",
    units: "Use consistent concentration and volume units.",
    use: "Calculate concentration or volume after dilution.",
    caution:
      "The original concentration must be known or verified. BioShield must not invent an active concentration.",
  },

  {
    name: "Dilution Factor",
    category: "Concentration",
    formula: "DF = V₂ / V₁",
    variables:
      "DF = dilution factor · V₂ = final volume · V₁ = stock volume",
    units: "Dimensionless",
    use: "Describe how much a solution has been diluted.",
  },

  {
    name: "Percentage Concentration",
    category: "Concentration",
    formula: "% = (amount of solute / total amount) × 100",
    variables:
      "Amount of solute = quantity of substance · Total amount = final mixture quantity",
    units: "%",
    use: "Calculate percentage concentration when the quantities are defined.",
  },

  {
    name: "Volume per Surface Area",
    category: "Concentration",
    formula: "V/A",
    variables:
      "V = treatment volume · A = surface area",
    units: "mL·cm⁻²",
    use: "Compare treatment volume relative to the area treated.",
    caution:
      "Surface area must actually be measured or recorded. Do not assume it.",
  },

  // =========================================================
  // ACIDS & BASES
  // =========================================================

  {
    name: "pH",
    category: "Acids & Bases",
    formula: "pH = −log[H⁺]",
    variables:
      "[H⁺] = hydrogen-ion concentration",
    units: "[H⁺] in mol·dm⁻³",
    use: "Calculate the pH from hydrogen-ion concentration.",
  },

  {
    name: "Hydrogen-Ion Concentration",
    category: "Acids & Bases",
    formula: "[H⁺] = 10⁻ᵖᴴ",
    variables:
      "[H⁺] = hydrogen-ion concentration · pH = acidity measure",
    units: "mol·dm⁻³",
    use: "Calculate hydrogen-ion concentration from pH.",
  },

  {
    name: "pOH",
    category: "Acids & Bases",
    formula: "pOH = −log[OH⁻]",
    variables:
      "[OH⁻] = hydroxide-ion concentration",
    units: "[OH⁻] in mol·dm⁻³",
    use: "Calculate pOH from hydroxide-ion concentration.",
  },

  {
    name: "Hydroxide-Ion Concentration",
    category: "Acids & Bases",
    formula: "[OH⁻] = 10⁻ᵖᴼᴴ",
    variables:
      "[OH⁻] = hydroxide-ion concentration · pOH = basicity measure",
    units: "mol·dm⁻³",
    use: "Calculate hydroxide-ion concentration from pOH.",
  },

  {
    name: "Relationship Between pH and pOH",
    category: "Acids & Bases",
    formula: "pH + pOH = 14",
    variables:
      "pH = acidity measure · pOH = basicity measure",
    units: "Dimensionless",
    use: "Convert between pH and pOH at 25 °C.",
    caution:
      "The familiar value 14 applies to water at approximately 25 °C.",
  },

  {
    name: "Ionisation Constant of Water",
    category: "Acids & Bases",
    formula: "Kᵥ = [H⁺][OH⁻]",
    variables:
      "Kᵥ = ionisation constant of water · [H⁺] = hydrogen ions · [OH⁻] = hydroxide ions",
    units: "Approximately 1.0 × 10⁻¹⁴ at 25 °C",
    use: "Relate hydrogen-ion and hydroxide-ion concentrations.",
  },

  {
    name: "Acid Ionisation Constant",
    category: "Acids & Bases",
    formula: "Kₐ = ([H⁺][A⁻]) / [HA]",
    variables:
      "Kₐ = acid ionisation constant · [H⁺] = hydrogen ions · [A⁻] = conjugate base · [HA] = weak acid",
    units: "Depends on convention",
    use: "Describe the equilibrium ionisation of a weak acid.",
  },

  {
    name: "Base Ionisation Constant",
    category: "Acids & Bases",
    formula: "Kᵦ = ([BH⁺][OH⁻]) / [B]",
    variables:
      "Kᵦ = base ionisation constant · [BH⁺] = conjugate acid · [OH⁻] = hydroxide ions · [B] = weak base",
    units: "Depends on convention",
    use: "Describe the equilibrium ionisation of a weak base.",
  },

  {
    name: "Neutralisation",
    category: "Acids & Bases",
    formula: "n(acid) : n(base) = stoichiometric ratio",
    variables: "n = number of moles",
    units: "mol",
    use: "Use the balanced chemical equation to determine reacting mole ratios.",
    caution:
      "Do not automatically assume a 1:1 ratio. The balanced equation determines the ratio.",
  },

  // =========================================================
  // STOICHIOMETRY
  // =========================================================

  {
    name: "Percentage Yield",
    category: "Stoichiometry",
    formula: "% yield = (actual yield / theoretical yield) × 100",
    variables:
      "Actual yield = experimentally obtained product · Theoretical yield = calculated maximum",
    units: "%",
    use: "Compare actual product obtained with the theoretical amount.",
  },

  {
    name: "Percentage Purity",
    category: "Stoichiometry",
    formula: "% purity = (mass of pure substance / total sample mass) × 100",
    variables:
      "Pure substance mass · Total sample mass",
    units: "%",
    use: "Determine how much of a sample is the desired substance.",
  },

  {
    name: "Atom Economy",
    category: "Stoichiometry",
    formula: "Atom economy = (Mr of desired product / total Mr of reactants) × 100",
    variables: "Mr = relative formula mass",
    units: "%",
    use: "Assess how efficiently reactant atoms become the desired product.",
  },

  {
    name: "Empirical Formula",
    category: "Stoichiometry",
    formula: "Moles → divide by smallest mole value → simplest whole-number ratio",
    variables: "Use mole quantities of each element.",
    units: "Ratio",
    use: "Determine the simplest whole-number ratio of atoms.",
  },

  {
    name: "Percentage Composition",
    category: "Stoichiometry",
    formula: "% element = (mass of element in compound / Mr of compound) × 100",
    variables:
      "Mass contribution of element · Mr = relative formula mass",
    units: "%",
    use: "Calculate the percentage by mass of an element in a compound.",
  },

  // =========================================================
  // RATES
  // =========================================================

  {
    name: "Average Reaction Rate",
    category: "Rates",
    formula: "Rate = Δconcentration / Δtime",
    variables:
      "Δconcentration = change in concentration · Δtime = change in time",
    units: "mol·dm⁻³·s⁻¹",
    use: "Calculate the average rate of a reaction from concentration data.",
  },

  {
    name: "Rate from Reactant Disappearance",
    category: "Rates",
    formula: "Rate = −Δ[reactant] / Δt",
    variables:
      "Δ[reactant] = change in reactant concentration · Δt = time change",
    units: "mol·dm⁻³·s⁻¹",
    use: "Use when a reactant concentration decreases during a reaction.",
  },

  {
    name: "Rate from Product Formation",
    category: "Rates",
    formula: "Rate = Δ[product] / Δt",
    variables:
      "Δ[product] = change in product concentration · Δt = time change",
    units: "mol·dm⁻³·s⁻¹",
    use: "Use when product concentration increases.",
  },

  {
    name: "Arrhenius Equation",
    category: "Rates",
    formula: "k = Ae⁻ᴱᵃ⁄ᴿᵀ",
    variables:
      "k = rate constant · A = frequency factor · Eₐ = activation energy · R = gas constant · T = temperature",
    units: "T in kelvin · Eₐ in J·mol⁻¹",
    use: "Relate reaction rate constant to temperature and activation energy.",
  },

  // =========================================================
  // EQUILIBRIUM
  // =========================================================

  {
    name: "Equilibrium Constant",
    category: "Equilibrium",
    formula: "Kc = products / reactants",
    variables:
      "Concentrations are raised to powers given by coefficients in the balanced equation.",
    units: "Depends on reaction",
    use: "Describe the position of a chemical equilibrium.",
    caution:
      "Pure solids and pure liquids are not included in the standard concentration expression.",
  },

  {
    name: "Reaction Quotient",
    category: "Equilibrium",
    formula: "Q = products / reactants",
    variables:
      "Use current concentrations rather than necessarily equilibrium concentrations.",
    units: "Depends on reaction",
    use: "Compare the current reaction state with equilibrium.",
  },

  // =========================================================
  // ELECTROCHEMISTRY
  // =========================================================

  {
    name: "Cell Potential",
    category: "Electrochemistry",
    formula: "E°cell = E°cathode − E°anode",
    variables:
      "E°cathode = standard reduction potential at cathode · E°anode = standard reduction potential at anode",
    units: "V",
    use: "Calculate standard cell potential.",
  },

  {
    name: "Electrical Charge",
    category: "Electrochemistry",
    formula: "Q = It",
    variables:
      "Q = charge · I = current · t = time",
    units: "C · A · s",
    use: "Calculate electrical charge transferred.",
  },

  {
    name: "Moles of Electrons",
    category: "Electrochemistry",
    formula: "n(e⁻) = Q / F",
    variables:
      "Q = charge · F = Faraday constant",
    units: "F ≈ 96 485 C·mol⁻¹",
    use: "Relate charge transferred to amount of electrons.",
  },

  // =========================================================
  // GASES
  // =========================================================

  {
    name: "Ideal Gas Equation",
    category: "Gases",
    formula: "PV = nRT",
    variables:
      "P = pressure · V = volume · n = moles · R = gas constant · T = temperature",
    units: "T in K · P and V must match the chosen R",
    use: "Relate pressure, volume, amount and temperature of a gas.",
    caution:
      "Temperature must be converted to kelvin.",
  },

  {
    name: "Boyle's Law",
    category: "Gases",
    formula: "P₁V₁ = P₂V₂",
    variables: "P = pressure · V = volume",
    units: "Consistent units",
    use: "Use for a fixed amount of gas at constant temperature.",
  },

  {
    name: "Charles' Law",
    category: "Gases",
    formula: "V₁/T₁ = V₂/T₂",
    variables: "V = volume · T = absolute temperature",
    units: "Temperature in kelvin",
    use: "Relate gas volume and temperature at constant pressure.",
  },

  // =========================================================
  // THERMOCHEMISTRY
  // =========================================================

  {
    name: "Heat Energy",
    category: "Thermochemistry",
    formula: "q = mcΔT",
    variables:
      "q = heat energy · m = mass · c = specific heat capacity · ΔT = temperature change",
    units:
      "q: J · m: g or kg depending on c · c: J·g⁻¹·°C⁻¹ or J·kg⁻¹·°C⁻¹",
    use: "Calculate heat transferred when temperature changes.",
  },

  {
    name: "Enthalpy per Mole",
    category: "Thermochemistry",
    formula: "ΔH = q / n",
    variables:
      "ΔH = molar enthalpy change · q = heat energy · n = moles",
    units: "J·mol⁻¹ or kJ·mol⁻¹",
    use: "Calculate enthalpy change per mole.",
  },

  {
    name: "Bond Energy",
    category: "Thermochemistry",
    formula: "ΔH = Σ(bonds broken) − Σ(bonds formed)",
    variables:
      "Bond energies represent energy required to break bonds.",
    units: "kJ·mol⁻¹",
    use: "Estimate reaction enthalpy using bond energies.",
    caution: "Bond-energy calculations are estimates.",
  },

  // =========================================================
  // ORGANIC CHEMISTRY
  // =========================================================

  {
    name: "Alkane General Formula",
    category: "Organic Chemistry",
    formula: "CₙH₂ₙ₊₂",
    variables: "n = number of carbon atoms",
    units: "Molecular formula",
    use: "General formula for acyclic saturated hydrocarbons.",
  },

  {
    name: "Alkene General Formula",
    category: "Organic Chemistry",
    formula: "CₙH₂ₙ",
    variables: "n = number of carbon atoms",
    units: "Molecular formula",
    use: "General formula for acyclic hydrocarbons containing one double bond.",
  },

  {
    name: "Alkyne General Formula",
    category: "Organic Chemistry",
    formula: "CₙH₂ₙ₋₂",
    variables: "n = number of carbon atoms",
    units: "Molecular formula",
    use: "General formula for acyclic hydrocarbons containing one triple bond.",
  },

  {
    name: "Combustion",
    category: "Organic Chemistry",
    formula: "hydrocarbon + O₂ → CO₂ + H₂O",
    variables:
      "Balance carbon first, then hydrogen, then oxygen.",
    units: "Stoichiometric equation",
    use: "Represent complete combustion of hydrocarbons.",
  },

  // =========================================================
  // STATISTICS
  // =========================================================

  {
    name: "Arithmetic Mean",
    category: "Statistics",
    formula: "x̄ = Σx / n",
    variables:
      "Σx = sum of values · n = number of observations",
    units: "Same as original measurement",
    use: "Describe the central value of a dataset.",
  },

  {
    name: "Median",
    category: "Statistics",
    formula: "Middle value after ordering",
    variables:
      "If n is even, average the two central values.",
    units: "Same as original measurement",
    use: "Describe the centre of a dataset.",
  },

  {
    name: "Range",
    category: "Statistics",
    formula: "Range = maximum − minimum",
    variables:
      "Maximum = largest observation · Minimum = smallest observation",
    units: "Same as original measurement",
    use: "Describe the spread of observations.",
  },

  {
    name: "Sample Standard Deviation",
    category: "Statistics",
    formula: "s = √[Σ(x − x̄)² / (n − 1)]",
    variables:
      "x = observation · x̄ = sample mean · n = sample size",
    units: "Same as original measurement",
    use: "Describe variation within a sample.",
    caution:
      "BioShield requires at least 3 observations before calculating sample SD.",
  },

  {
    name: "Percentage Change",
    category: "Statistics",
    formula: "% change = ((new − original) / original) × 100",
    variables:
      "Original = starting value · New = later value",
    units: "%",
    use: "Describe relative change.",
    caution:
      "Percentage change does not prove causation or treatment effectiveness.",
  },

  // =========================================================
  // EXPERIMENTAL
  // =========================================================

  {
    name: "Volume per Surface Area",
    category: "Experimental",
    formula: "V/A",
    variables:
      "V = treatment volume · A = surface area",
    units: "mL·cm⁻²",
    use: "Standardise treatment volume relative to surface area.",
  },

  {
    name: "Percentage Uncertainty",
    category: "Experimental",
    formula: "% uncertainty = (absolute uncertainty / measured value) × 100",
    variables:
      "Absolute uncertainty = uncertainty associated with measurement.",
    units: "%",
    use: "Express measurement uncertainty relative to the measured value.",
  },

  {
    name: "Percentage Difference",
    category: "Experimental",
    formula: "% difference = |A − B| / ((A + B)/2) × 100",
    variables:
      "A and B = two values being compared.",
    units: "%",
    use: "Compare two measurements without selecting one as the reference.",
  },

  // =========================================================
  // UNITS
  // =========================================================

  {
    name: "Celsius to Kelvin",
    category: "Units",
    formula: "T(K) = T(°C) + 273.15",
    variables: "T = temperature",
    units: "K",
    use: "Convert Celsius to kelvin.",
  },

  {
    name: "Kelvin to Celsius",
    category: "Units",
    formula: "T(°C) = T(K) − 273.15",
    variables: "T = temperature",
    units: "°C",
    use: "Convert kelvin to Celsius.",
  },

  {
    name: "Kilopascal to Hectopascal",
    category: "Units",
    formula: "1 kPa = 10 hPa",
    variables: "kPa = kilopascal · hPa = hectopascal",
    units: "Pressure",
    use: "Convert between kPa and hPa.",
  },

  {
    name: "Litres to Cubic Decimetres",
    category: "Units",
    formula: "1 L = 1 dm³",
    variables: "L = litre · dm³ = cubic decimetre",
    units: "Volume",
    use: "Convert volumes used in concentration calculations.",
  },

  {
    name: "Millilitres to Cubic Decimetres",
    category: "Units",
    formula: "1 mL = 0.001 dm³",
    variables: "mL = millilitre · dm³ = cubic decimetre",
    units: "Volume",
    use: "Convert mL to dm³ before molarity calculations.",
  },
]

const categories: FormulaCategory[] = [
  "All",
  "Chemistry",
  "Moles",
  "Concentration",
  "Acids & Bases",
  "Stoichiometry",
  "Rates",
  "Equilibrium",
  "Electrochemistry",
  "Gases",
  "Thermochemistry",
  "Organic Chemistry",
  "Statistics",
  "Experimental",
  "Units",
]

export default function FormulaSheet({
  onNavigate,
}: FormulaSheetProps) {
  const [category, setCategory] =
    useState<FormulaCategory>("All")

  const [search, setSearch] = useState("")

 const allFormulas = [...formulas, ...expandedFormulas]

const filteredFormulas = useMemo(() => {
  const query = search.trim().toLowerCase()

  return allFormulas.filter((formula) => {
    const categoryMatch =
      category === "All" ||
      formula.category === category

    const searchMatch =
      !query ||
      formula.name.toLowerCase().includes(query) ||
      formula.category.toLowerCase().includes(query) ||
      formula.formula.toLowerCase().includes(query) ||
      formula.variables.toLowerCase().includes(query) ||
      formula.units.toLowerCase().includes(query) ||
      formula.use.toLowerCase().includes(query) ||
      (formula.caution?.toLowerCase().includes(query) ?? false)

    return categoryMatch && searchMatch
  })
}, [category, search])
  return (
    <section className="page-shell formula-sheet-page">
      <div className="page-header">
        <div>
          <p className="eyebrow">RESEARCH TOOLS</p>

          <h3 className="page-title">
            Scientific Formula Centre
          </h3>

          <p className="page-description">
            Chemistry, experimental science, statistics and
            research formulas used throughout BioShield.
          </p>
        </div>

        <div className="formula-count">
          <strong>{filteredFormulas.length}</strong>
          <span>formulas</span>
        </div>
      </div>

      {/* PAGE NAVIGATION */}
      <div className="page-navigation">
        <button
          type="button"
          className="secondary-button"
          onClick={() => onNavigate("Dashboard")}
        >
          Dashboard
        </button>

        <button
          type="button"
          className="secondary-button"
          onClick={() => onNavigate("Calculator")}
        >
          Calculator
        </button>

        <button
          type="button"
          className="secondary-button"
          onClick={() => onNavigate("Observations")}
        >
          Observations
        </button>

        <button
          type="button"
          className="secondary-button"
          onClick={() => onNavigate("Analysis")}
        >
          Analysis
        </button>
      </div>

      <div className="formula-toolbar">
        <input
          type="search"
          value={search}
          placeholder="Search pH, moles, dilution, rate, gas, statistics..."
          onChange={(event) =>
            setSearch(event.target.value)
          }
        />

        <div className="formula-category-list">
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              className={
                category === item
                  ? "formula-category active"
                  : "formula-category"
              }
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="formula-grid">
        {filteredFormulas.map((formula, index) => (
          <article
            className="formula-card"
            key={`${formula.name}-${index}`}
          >
            <div className="formula-card-top">
              <span className="formula-number">
                {String(index + 1).padStart(2, "0")}
              </span>

              <span className="formula-category-label">
                {formula.category}
              </span>
            </div>

            <h4>{formula.name}</h4>

            <div className="formula-equation">
              {formula.formula}
            </div>

            <div className="formula-detail">
              <strong>Variables</strong>
              <p>{formula.variables}</p>
            </div>

            <div className="formula-detail">
              <strong>Units</strong>
              <p>{formula.units}</p>
            </div>

            <div className="formula-detail">
              <strong>When to use</strong>
              <p>{formula.use}</p>
            </div>

            {formula.caution && (
              <div className="formula-warning">
                <strong>Scientific caution</strong>
                <p>{formula.caution}</p>
              </div>
            )}
          </article>
        ))}
      </div>

      {filteredFormulas.length === 0 && (
        <div className="empty-state">
          <h4>No formulas found</h4>
          <p>
            Try another chemistry term, formula or category.
          </p>
        </div>
      )}

      {/* BOTTOM NAVIGATION */}
      <div className="page-navigation">
        <button
          type="button"
          className="secondary-button"
          onClick={() => onNavigate("Dashboard")}
        >
          Dashboard
        </button>

        <button
          type="button"
          className="create-button"
          onClick={() => onNavigate("Calculator")}
        >
          Open Calculator
        </button>
      </div>
    </section>
  )
}
// =========================================================
// EXPANDED SCIENTIFIC FORMULA LIBRARY
// SCHOOL → UNIVERSITY → RESEARCH
// =========================================================

const expandedFormulas: Formula[] = [
  // =========================================================
  // MATHEMATICS — ALGEBRA
  // =========================================================

  {
    name: "Linear Equation",
    category: "Statistics",
    formula: "ax + b = 0  →  x = −b/a",
    variables: "a, b = constants · x = unknown",
    units: "Depends on quantity",
    use: "Solve a first-degree linear equation.",
  },

  {
    name: "Quadratic Formula",
    category: "Statistics",
    formula: "x = (−b ± √(b² − 4ac)) / 2a",
    variables: "a, b, c = coefficients · x = roots",
    units: "Depends on equation",
    use: "Solve quadratic equations.",
  },

  {
    name: "Discriminant",
    category: "Statistics",
    formula: "Δ = b² − 4ac",
    variables: "a, b, c = quadratic coefficients",
    units: "Depends on equation",
    use: "Determine the nature and number of quadratic roots.",
  },

  {
    name: "Difference of Squares",
    category: "Statistics",
    formula: "a² − b² = (a − b)(a + b)",
    variables: "a, b = algebraic quantities",
    units: "Depends on quantity",
    use: "Factorise expressions involving a difference of squares.",
  },

  {
    name: "Arithmetic Sequence",
    category: "Statistics",
    formula: "aₙ = a₁ + (n − 1)d",
    variables: "aₙ = nth term · a₁ = first term · d = common difference",
    units: "Same as sequence",
    use: "Calculate a term in an arithmetic sequence.",
  },

  {
    name: "Arithmetic Series",
    category: "Statistics",
    formula: "Sₙ = n/2[2a₁ + (n − 1)d]",
    variables: "Sₙ = sum · n = number of terms · a₁ = first term · d = difference",
    units: "Same as sequence",
    use: "Calculate the sum of an arithmetic sequence.",
  },

  {
    name: "Geometric Sequence",
    category: "Statistics",
    formula: "aₙ = a₁rⁿ⁻¹",
    variables: "aₙ = nth term · a₁ = first term · r = common ratio",
    units: "Same as sequence",
    use: "Calculate a term in a geometric sequence.",
  },

  {
    name: "Finite Geometric Series",
    category: "Statistics",
    formula: "Sₙ = a₁(1 − rⁿ)/(1 − r)",
    variables: "a₁ = first term · r = common ratio · n = number of terms",
    units: "Same as sequence",
    use: "Calculate the sum of a finite geometric series.",
  },

  {
    name: "Infinite Geometric Series",
    category: "Statistics",
    formula: "S∞ = a₁/(1 − r),  |r| < 1",
    variables: "a₁ = first term · r = common ratio",
    units: "Same as sequence",
    use: "Calculate the sum of a convergent infinite geometric series.",
  },

  // =========================================================
  // MATHEMATICS — EXPONENTS & LOGARITHMS
  // =========================================================

  {
    name: "Exponent Product Rule",
    category: "Statistics",
    formula: "aᵐaⁿ = aᵐ⁺ⁿ",
    variables: "a = base · m,n = exponents",
    units: "Dimensionless",
    use: "Simplify products with the same base.",
  },

  {
    name: "Exponent Quotient Rule",
    category: "Statistics",
    formula: "aᵐ/aⁿ = aᵐ⁻ⁿ",
    variables: "a = base · m,n = exponents",
    units: "Dimensionless",
    use: "Simplify quotients with the same base.",
  },

  {
    name: "Power of a Power",
    category: "Statistics",
    formula: "(aᵐ)ⁿ = aᵐⁿ",
    variables: "a = base · m,n = exponents",
    units: "Dimensionless",
    use: "Simplify nested powers.",
  },

  {
    name: "Logarithm Definition",
    category: "Statistics",
    formula: "log_b(x) = y  ⇔  bʸ = x",
    variables: "b = base · x = argument · y = logarithm",
    units: "Dimensionless",
    use: "Convert between logarithmic and exponential form.",
  },

  {
    name: "Change of Base",
    category: "Statistics",
    formula: "log_b(x) = log(x)/log(b)",
    variables: "b = logarithm base · x = argument",
    units: "Dimensionless",
    use: "Evaluate logarithms using another base.",
  },

  // =========================================================
  // MATHEMATICS — TRIGONOMETRY
  // =========================================================

  {
    name: "Pythagorean Theorem",
    category: "Experimental",
    formula: "a² + b² = c²",
    variables: "a,b = perpendicular sides · c = hypotenuse",
    units: "Length",
    use: "Calculate an unknown side of a right-angled triangle.",
  },

  {
    name: "Sine Rule",
    category: "Experimental",
    formula: "a/sin A = b/sin B = c/sin C",
    variables: "a,b,c = side lengths · A,B,C = opposite angles",
    units: "Lengths and degrees/radians",
    use: "Solve non-right-angled triangles.",
  },

  {
    name: "Cosine Rule",
    category: "Experimental",
    formula: "c² = a² + b² − 2ab cos C",
    variables: "a,b,c = side lengths · C = included angle",
    units: "Length and angle",
    use: "Find a side or angle in a non-right triangle.",
  },

  {
    name: "Sine of an Angle",
    category: "Experimental",
    formula: "sin θ = opposite / hypotenuse",
    variables: "θ = angle",
    units: "Dimensionless",
    use: "Relate an angle to sides in a right triangle.",
  },

  {
    name: "Cosine of an Angle",
    category: "Experimental",
    formula: "cos θ = adjacent / hypotenuse",
    variables: "θ = angle",
    units: "Dimensionless",
    use: "Relate an angle to sides in a right triangle.",
  },

  {
    name: "Tangent of an Angle",
    category: "Experimental",
    formula: "tan θ = opposite / adjacent",
    variables: "θ = angle",
    units: "Dimensionless",
    use: "Relate an angle to sides in a right triangle.",
  },

  // =========================================================
  // MATHEMATICS — ANALYTICAL GEOMETRY
  // =========================================================

  {
    name: "Gradient",
    category: "Experimental",
    formula: "m = (y₂ − y₁)/(x₂ − x₁)",
    variables: "m = gradient · (x₁,y₁),(x₂,y₂) = points",
    units: "y-units per x-unit",
    use: "Calculate the gradient of a straight line.",
  },

  {
    name: "Straight-Line Equation",
    category: "Experimental",
    formula: "y = mx + c",
    variables: "m = gradient · c = y-intercept",
    units: "Depends on axes",
    use: "Represent a straight line.",
  },

  {
    name: "Distance Between Two Points",
    category: "Experimental",
    formula: "d = √[(x₂ − x₁)² + (y₂ − y₁)²]",
    variables: "Coordinates define the two points.",
    units: "Coordinate units",
    use: "Calculate distance between two points.",
  },

  {
    name: "Midpoint",
    category: "Experimental",
    formula: "M = ((x₁+x₂)/2, (y₁+y₂)/2)",
    variables: "Coordinates define the endpoints.",
    units: "Coordinate units",
    use: "Find the midpoint of a line segment.",
  },

  // =========================================================
  // MATHEMATICS — CALCULUS
  // =========================================================

  {
    name: "Derivative Definition",
    category: "Statistics",
    formula: "f′(x) = lim[h→0] [f(x+h) − f(x)]/h",
    variables: "f(x) = function · h = change in x",
    units: "Rate of change",
    use: "Define the derivative of a function.",
  },

  {
    name: "Power Rule",
    category: "Statistics",
    formula: "d/dx(xⁿ) = nxⁿ⁻¹",
    variables: "n = constant exponent",
    units: "Depends on function",
    use: "Differentiate powers of x.",
  },

  {
    name: "Product Rule",
    category: "Statistics",
    formula: "(fg)′ = f′g + fg′",
    variables: "f,g = differentiable functions",
    units: "Depends on functions",
    use: "Differentiate a product of functions.",
  },

  {
    name: "Quotient Rule",
    category: "Statistics",
    formula: "(f/g)′ = (gf′ − fg′)/g²",
    variables: "f,g = differentiable functions",
    units: "Depends on functions",
    use: "Differentiate a quotient.",
  },

  {
    name: "Chain Rule",
    category: "Statistics",
    formula: "d/dx[f(g(x))] = f′(g(x))g′(x)",
    variables: "f,g = differentiable functions",
    units: "Depends on functions",
    use: "Differentiate composite functions.",
  },

  {
    name: "Derivative of Exponential",
    category: "Statistics",
    formula: "d/dx(eˣ) = eˣ",
    variables: "x = independent variable",
    units: "Depends on function",
    use: "Differentiate natural exponential functions.",
  },

  {
    name: "Derivative of ln(x)",
    category: "Statistics",
    formula: "d/dx[ln x] = 1/x",
    variables: "x > 0",
    units: "Depends on x",
    use: "Differentiate natural logarithms.",
  },

  {
    name: "Fundamental Theorem of Calculus",
    category: "Statistics",
    formula: "∫ₐᵇ f(x)dx = F(b) − F(a)",
    variables: "F′(x) = f(x)",
    units: "Depends on function",
    use: "Evaluate a definite integral using an antiderivative.",
  },

  {
    name: "Integration Power Rule",
    category: "Statistics",
    formula: "∫xⁿdx = xⁿ⁺¹/(n+1) + C",
    variables: "n ≠ −1 · C = constant",
    units: "Depends on function",
    use: "Integrate powers of x.",
  },

  // =========================================================
  // PHYSICS — MECHANICS
  // =========================================================

  {
    name: "Average Speed",
    category: "Experimental",
    formula: "v = Δd/Δt",
    variables: "Δd = displacement/distance change · Δt = time change",
    units: "m·s⁻¹",
    use: "Calculate average speed or velocity.",
  },

  {
    name: "Acceleration",
    category: "Experimental",
    formula: "a = Δv/Δt",
    variables: "Δv = change in velocity · Δt = time",
    units: "m·s⁻²",
    use: "Calculate acceleration.",
  },

  {
    name: "SUVAT Equation 1",
    category: "Experimental",
    formula: "v = u + at",
    variables: "u = initial velocity · v = final velocity · a = acceleration · t = time",
    units: "SI units",
    use: "Motion under constant acceleration.",
  },

  {
    name: "SUVAT Equation 2",
    category: "Experimental",
    formula: "Δx = ut + ½at²",
    variables: "Δx = displacement · u = initial velocity · a = acceleration · t = time",
    units: "m, m·s⁻¹, m·s⁻², s",
    use: "Calculate displacement under constant acceleration.",
  },

  {
    name: "SUVAT Equation 3",
    category: "Experimental",
    formula: "v² = u² + 2aΔx",
    variables: "u,v = velocities · a = acceleration · Δx = displacement",
    units: "SI units",
    use: "Relate velocity, acceleration and displacement.",
  },

  {
    name: "Newton's Second Law",
    category: "Experimental",
    formula: "F = ma",
    variables: "F = net force · m = mass · a = acceleration",
    units: "N, kg, m·s⁻²",
    use: "Relate net force to acceleration.",
  },

  {
    name: "Weight",
    category: "Experimental",
    formula: "F_g = mg",
    variables: "m = mass · g = gravitational acceleration",
    units: "N",
    use: "Calculate gravitational force.",
  },

  {
    name: "Momentum",
    category: "Experimental",
    formula: "p = mv",
    variables: "p = momentum · m = mass · v = velocity",
    units: "kg·m·s⁻¹",
    use: "Calculate linear momentum.",
  },

  {
    name: "Impulse",
    category: "Experimental",
    formula: "J = FΔt = Δp",
    variables: "J = impulse · F = force · Δt = time · Δp = momentum change",
    units: "N·s",
    use: "Relate force, time and change in momentum.",
  },

  {
    name: "Kinetic Energy",
    category: "Experimental",
    formula: "Eₖ = ½mv²",
    variables: "m = mass · v = velocity",
    units: "J",
    use: "Calculate translational kinetic energy.",
  },

  {
    name: "Gravitational Potential Energy",
    category: "Experimental",
    formula: "Eₚ = mgh",
    variables: "m = mass · g = gravitational acceleration · h = height",
    units: "J",
    use: "Calculate gravitational potential energy.",
  },

  {
    name: "Work Done",
    category: "Experimental",
    formula: "W = Fd cos θ",
    variables: "F = force · d = displacement · θ = angle between force and displacement",
    units: "J",
    use: "Calculate mechanical work.",
  },

  {
    name: "Power",
    category: "Experimental",
    formula: "P = W/t",
    variables: "P = power · W = work/energy · t = time",
    units: "W",
    use: "Calculate rate of energy transfer.",
  },

  // =========================================================
  // PHYSICS — ELECTRICITY
  // =========================================================

  {
    name: "Ohm's Law",
    category: "Experimental",
    formula: "V = IR",
    variables: "V = potential difference · I = current · R = resistance",
    units: "V, A, Ω",
    use: "Relate voltage, current and resistance.",
  },

  {
    name: "Electrical Power",
    category: "Experimental",
    formula: "P = VI",
    variables: "P = power · V = voltage · I = current",
    units: "W",
    use: "Calculate electrical power.",
  },

  {
    name: "Electrical Energy",
    category: "Experimental",
    formula: "E = Pt = VIt",
    variables: "P = power · t = time · V = voltage · I = current",
    units: "J",
    use: "Calculate electrical energy transferred.",
  },

  {
    name: "Series Resistance",
    category: "Experimental",
    formula: "Rₜ = R₁ + R₂ + R₃ + …",
    variables: "R = resistance",
    units: "Ω",
    use: "Calculate equivalent resistance in series.",
  },

  {
    name: "Parallel Resistance",
    category: "Experimental",
    formula: "1/Rₜ = 1/R₁ + 1/R₂ + 1/R₃ + …",
    variables: "R = resistance",
    units: "Ω",
    use: "Calculate equivalent resistance in parallel.",
  },

  // =========================================================
  // PHYSICS — WAVES
  // =========================================================

  {
    name: "Wave Equation",
    category: "Experimental",
    formula: "v = fλ",
    variables: "v = wave speed · f = frequency · λ = wavelength",
    units: "m·s⁻¹, Hz, m",
    use: "Relate wave speed, frequency and wavelength.",
  },

  {
    name: "Frequency and Period",
    category: "Experimental",
    formula: "f = 1/T",
    variables: "f = frequency · T = period",
    units: "Hz, s",
    use: "Convert between frequency and period.",
  },

  {
    name: "Angular Frequency",
    category: "Experimental",
    formula: "ω = 2πf",
    variables: "ω = angular frequency · f = frequency",
    units: "rad·s⁻¹",
    use: "Convert frequency to angular frequency.",
  },

  // =========================================================
  // PHYSICS — THERMODYNAMICS
  // =========================================================

  {
    name: "Thermal Energy",
    category: "Thermochemistry",
    formula: "Q = mcΔT",
    variables: "Q = heat · m = mass · c = specific heat capacity · ΔT = temperature change",
    units: "J",
    use: "Calculate heat transferred during a temperature change.",
  },

  {
    name: "Latent Heat",
    category: "Thermochemistry",
    formula: "Q = mL",
    variables: "Q = heat · m = mass · L = specific latent heat",
    units: "J",
    use: "Calculate energy involved in a phase change.",
  },

  // =========================================================
  // CHEMISTRY — ATOMIC STRUCTURE
  // =========================================================

  {
    name: "Photon Energy",
    category: "Experimental",
    formula: "E = hf",
    variables: "E = photon energy · h = Planck constant · f = frequency",
    units: "J",
    use: "Calculate energy of electromagnetic radiation.",
  },

  {
    name: "Photon Wavelength",
    category: "Experimental",
    formula: "c = fλ",
    variables: "c = speed of light · f = frequency · λ = wavelength",
    units: "m·s⁻¹, Hz, m",
    use: "Relate electromagnetic frequency and wavelength.",
  },

  {
    name: "de Broglie Wavelength",
    category: "Experimental",
    formula: "λ = h/p",
    variables: "λ = wavelength · h = Planck constant · p = momentum",
    units: "m",
    use: "Calculate the wavelength associated with a particle.",
  },

  // =========================================================
  // BIOLOGY / LIFE SCIENCES
  // =========================================================

  {
    name: "Population Density",
    category: "Experimental",
    formula: "D = N/A",
    variables: "D = population density · N = number of organisms · A = area",
    units: "organisms·area⁻¹",
    use: "Calculate population density in ecological studies.",
  },

  {
    name: "Population Growth Rate",
    category: "Statistics",
    formula: "Growth rate = (births + immigration) − (deaths + emigration)",
    variables: "Population changes are determined by gains and losses.",
    units: "Individuals per time",
    use: "Describe population change.",
  },

  {
    name: "Percentage Population Change",
    category: "Statistics",
    formula: "% change = [(final − initial)/initial] × 100",
    variables: "Initial = starting population · Final = later population",
    units: "%",
    use: "Calculate relative population change.",
  },

  {
    name: "Hardy–Weinberg Equation",
    category: "Statistics",
    formula: "p² + 2pq + q² = 1",
    variables: "p = frequency of allele 1 · q = frequency of allele 2",
    units: "Frequency",
    use: "Model allele and genotype frequencies in an ideal population.",
  },

  {
    name: "Hardy–Weinberg Allele Relationship",
    category: "Statistics",
    formula: "p + q = 1",
    variables: "p,q = allele frequencies",
    units: "Frequency",
    use: "Calculate allele frequencies.",
  },

  // =========================================================
  // ENGINEERING / RESEARCH
  // =========================================================

  {
    name: "Stress",
    category: "Experimental",
    formula: "σ = F/A",
    variables: "σ = stress · F = force · A = cross-sectional area",
    units: "Pa",
    use: "Calculate mechanical stress in a material.",
  },

  {
    name: "Strain",
    category: "Experimental",
    formula: "ε = ΔL/L₀",
    variables: "ΔL = change in length · L₀ = original length",
    units: "Dimensionless",
    use: "Calculate deformation relative to original length.",
  },

  {
    name: "Young's Modulus",
    category: "Experimental",
    formula: "E = σ/ε",
    variables: "E = Young's modulus · σ = stress · ε = strain",
    units: "Pa",
    use: "Characterise elastic stiffness of a material.",
  },

  {
    name: "Pressure",
    category: "Experimental",
    formula: "P = F/A",
    variables: "P = pressure · F = perpendicular force · A = area",
    units: "Pa",
    use: "Calculate pressure from force and area.",
  },

  {
    name: "Density",
    category: "Experimental",
    formula: "ρ = m/V",
    variables: "ρ = density · m = mass · V = volume",
    units: "kg·m⁻³",
    use: "Calculate density of a material.",
  },

  {
    name: "Flow Rate",
    category: "Experimental",
    formula: "Q = V/t",
    variables: "Q = volumetric flow rate · V = volume · t = time",
    units: "m³·s⁻¹",
    use: "Calculate volumetric flow rate.",
  },

  {
    name: "Electrical Resistance from Material",
    category: "Experimental",
    formula: "R = ρL/A",
    variables: "R = resistance · ρ = resistivity · L = length · A = area",
    units: "Ω",
    use: "Relate resistance to material and conductor geometry.",
  },

  // =========================================================
  // RESEARCH / STATISTICS
  // =========================================================

  {
    name: "Sample Variance",
    category: "Statistics",
    formula: "s² = Σ(x − x̄)²/(n − 1)",
    variables: "x = observation · x̄ = sample mean · n = sample size",
    units: "Squared measurement units",
    use: "Quantify variation within a sample.",
  },

  {
    name: "Z-Score",
    category: "Statistics",
    formula: "z = (x − μ)/σ",
    variables: "x = observation · μ = mean · σ = standard deviation",
    units: "Dimensionless",
    use: "Express a value relative to a population mean.",
  },

  {
    name: "Standard Error of the Mean",
    category: "Statistics",
    formula: "SE = s/√n",
    variables: "s = sample SD · n = sample size",
    units: "Same as measurement",
    use: "Estimate the variability of a sample mean.",
  },

  {
    name: "Pearson Correlation",
    category: "Statistics",
    formula: "r = Σ[(x−x̄)(y−ȳ)] / √[Σ(x−x̄)²Σ(y−ȳ)²]",
    variables: "x,y = observations · x̄,ȳ = means",
    units: "Dimensionless",
    use: "Measure linear association between two variables.",
    caution:
      "Correlation does not establish causation.",
  },

  {
    name: "Coefficient of Variation",
    category: "Statistics",
    formula: "CV = (s/x̄) × 100",
    variables: "s = standard deviation · x̄ = mean",
    units: "%",
    use: "Compare relative variability between datasets.",
  },

  {
    name: "Percentage Error",
    category: "Experimental",
    formula: "% error = |experimental − accepted|/|accepted| × 100",
    variables: "Experimental = measured value · Accepted = reference value",
    units: "%",
    use: "Quantify difference between a measured and accepted value.",
  },

  {
    name: "Absolute Error",
    category: "Experimental",
    formula: "Absolute error = |measured − accepted|",
    variables: "Measured = experimental result · Accepted = reference",
    units: "Same as measurement",
    use: "Calculate absolute difference from a reference value.",
  },

  {
    name: "Relative Error",
    category: "Experimental",
    formula: "Relative error = |measured − accepted|/|accepted|",
    variables: "Measured = experimental result · Accepted = reference",
    units: "Dimensionless",
    use: "Express error relative to an accepted value.",
  },

  {
    name: "Mean Absolute Error",
    category: "Statistics",
    formula: "MAE = Σ|yᵢ − ŷᵢ|/n",
    variables: "yᵢ = observed value · ŷᵢ = predicted value · n = observations",
    units: "Same as response variable",
    use: "Measure average prediction error.",
  },

  {
    name: "Root Mean Square Error",
    category: "Statistics",
    formula: "RMSE = √[Σ(yᵢ − ŷᵢ)²/n]",
    variables: "yᵢ = observed · ŷᵢ = predicted · n = observations",
    units: "Same as response variable",
    use: "Measure the magnitude of prediction errors.",
  },

  // =========================================================
  // ENGINEERING — POWER
  // =========================================================

  {
    name: "Electrical Energy",
    category: "Experimental",
    formula: "E = Pt",
    variables: "E = energy · P = power · t = time",
    units: "J",
    use: "Calculate energy consumed or transferred.",
  },

  {
    name: "Three-Phase Apparent Power",
    category: "Experimental",
    formula: "S = √3 V_L I_L",
    variables: "S = apparent power · V_L = line voltage · I_L = line current",
    units: "VA",
    use: "Calculate apparent power in a balanced three-phase system.",
  },

  {
    name: "Power Factor",
    category: "Experimental",
    formula: "PF = P/S",
    variables: "P = real power · S = apparent power",
    units: "Dimensionless",
    use: "Calculate electrical power factor.",
  },

  {
    name: "Transformer Voltage Ratio",
    category: "Experimental",
    formula: "Vₛ/Vₚ = Nₛ/Nₚ",
    variables: "V = voltage · N = number of turns",
    units: "V and turns",
    use: "Relate primary and secondary transformer voltages.",
  },

  {
    name: "Transformer Current Ratio",
    category: "Experimental",
    formula: "Iₛ/Iₚ = Nₚ/Nₛ",
    variables: "I = current · N = number of turns",
    units: "A and turns",
    use: "Relate current and turns in an ideal transformer.",
  },

  // =========================================================
  // RESEARCH — EXPERIMENTAL DESIGN
  // =========================================================

  {
    name: "Treatment Volume per Area",
    category: "Experimental",
    formula: "Application rate = V/A",
    variables: "V = treatment volume · A = treated surface area",
    units: "mL·cm⁻²",
    use: "Standardise how much treatment is applied to a surface.",
    caution:
      "Do not calculate if the surface area has not actually been measured.",
  },

  {
    name: "Replication Mean",
    category: "Statistics",
    formula: "x̄ = Σx/n",
    variables: "x = replicate measurement · n = number of valid replicates",
    units: "Same as measurement",
    use: "Summarise repeated experimental measurements.",
  },

  {
    name: "Coefficient of Variation for Replicates",
    category: "Statistics",
    formula: "CV = (SD/mean) × 100",
    variables: "SD = standard deviation · mean = replicate mean",
    units: "%",
    use: "Describe relative variation between experimental replicates.",
    caution:
      "Do not interpret CV when the mean is zero or when the measurement scale makes the calculation inappropriate.",
  },
]