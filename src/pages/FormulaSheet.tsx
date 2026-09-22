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

  const filteredFormulas = useMemo(() => {
    const query = search.trim().toLowerCase()

    return formulas.filter((formula) => {
      const categoryMatch =
        category === "All" ||
        formula.category === category ||
        (category === "Chemistry" &&
          [
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
          ].includes(formula.category))

      const searchMatch =
        !query ||
        formula.name.toLowerCase().includes(query) ||
        formula.category.toLowerCase().includes(query) ||
        formula.formula.toLowerCase().includes(query) ||
        formula.variables.toLowerCase().includes(query) ||
        formula.use.toLowerCase().includes(query)

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