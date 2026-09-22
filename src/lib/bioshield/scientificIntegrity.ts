import {
  db,
  type ExperimentRecord,
  type ObservationRecord,
  type LaboratoryResultRecord,
} from "./database"

import { getCurrentUser } from "./authRepository"

export type IntegrityClassification =
  | "OBSERVED"
  | "MEASURED"
  | "INFERRED"
  | "UNKNOWN"
  | "UNSUPPORTED"

export type IntegrityStatement = {
  id: string
  statement: string
  classification: IntegrityClassification
  explanation: string
  evidence: string[]
  blocked: boolean
  suggestedWording?: string
}

export type IntegritySummary = {
  total: number
  observed: number
  measured: number
  inferred: number
  unknown: number
  unsupported: number
  blocked: number
}

export type IntegrityAnalysis = {
  experiment: ExperimentRecord
  statements: IntegrityStatement[]
  summary: IntegritySummary
}

async function getOwnerId(): Promise<string> {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error(
      "You must be signed in to analyse scientific integrity.",
    )
  }

  return user.id
}

function createId(): string {
  return crypto.randomUUID()
}

function containsAny(
  text: string,
  phrases: string[],
): boolean {
  const lower = text.toLowerCase()

  return phrases.some((phrase) =>
    lower.includes(
      phrase.toLowerCase(),
    ),
  )
}

function classifyStatement(
  statement: string,
  observations: ObservationRecord[],
  laboratoryResults: LaboratoryResultRecord[],
): IntegrityStatement {
  const text = statement.trim()

  const blockedClaims = [
    "killed bacteria",
    "killed the bacteria",
    "kills bacteria",
    "99% effective",
    "99% efficacy",
    "prevented bacteria",
    "prevented bacterial growth",
    "prevented biofilm",
    "prevented biofilm formation",
    "no bacteria",
    "there were no bacteria",
    "eliminated bacteria",
    "eliminated all bacteria",
    "sterilised",
    "sterilized",
    "sterile",
  ]

  if (containsAny(text, blockedClaims)) {
    return {
      id: createId(),

      statement: text,

      classification:
        "UNSUPPORTED",

      explanation:
        "This statement makes a microbiological or effectiveness claim that cannot be established from the currently recorded evidence.",

      evidence: [
        "Visual contamination scores are not bacterial counts.",
        "The active concentration of the natural treatment was not measured.",
        "The active concentration of the chemical treatment was not verified.",
        "Quantitative microbiological comparison was limited.",
      ],

      blocked: true,

      suggestedWording:
        "The treatments showed different observed contamination patterns, but comparative efficacy could not be established confidently from the available evidence.",
    }
  }

  if (
    containsAny(text, [
      "appeared",
      "was visible",
      "dark spots appeared",
      "clumping was observed",
      "particles were visible",
      "colour changed",
      "growth was observed",
      "contamination was visible",
      "observed",
    ])
  ) {
    return {
      id: createId(),

      statement: text,

      classification:
        "OBSERVED",

      explanation:
        "The statement describes something directly observed during the experiment.",

      evidence: [
        "Visual observations were recorded during the experiment.",
        "Photographic evidence may be attached where available.",
      ],

      blocked: false,
    }
  }

  if (
    containsAny(text, [
      "score increased",
      "score decreased",
      "ranged from",
      "mean",
      "median",
      "range",
      "standard deviation",
      "temperature was",
      "humidity was",
      "pressure was",
      "n =",
      "replicates",
      "measured",
      "recorded",
    ])
  ) {
    return {
      id: createId(),

      statement: text,

      classification:
        "MEASURED",

      explanation:
        "The statement refers to a numerical value or structured measurement recorded by the experiment.",

      evidence: [
        `${observations.length} observation record(s) are stored.`,
        "Visual contamination scores are explicitly labelled as scores rather than bacterial counts.",
      ],

      blocked: false,
    }
  }

  if (
    containsAny(text, [
      "may have",
      "might have",
      "could have",
      "possibly",
      "suggests",
      "suggested",
      "likely",
      "may indicate",
      "could indicate",
      "appears to have",
    ])
  ) {
    return {
      id: createId(),

      statement: text,

      classification:
        "INFERRED",

      explanation:
        "The statement proposes an interpretation rather than reporting a directly measured fact.",

      evidence: [
        "The statement is expressed as a possible explanation.",
        "The proposed explanation is not treated as established.",
      ],

      blocked: false,

      suggestedWording:
        "Proposed explanation — not established from the available evidence.",
    }
  }

  if (
    containsAny(text, [
      "cause is unknown",
      "cause unknown",
      "not known",
      "cannot be determined",
      "not established",
      "unknown cause",
      "uncertain",
    ])
  ) {
    return {
      id: createId(),

      statement: text,

      classification:
        "UNKNOWN",

      explanation:
        "The available evidence does not establish the cause or explanation.",

      evidence: [
        "No confirmed causal mechanism has been recorded.",
        "Unknown explanations are kept separate from direct observations.",
      ],

      blocked: false,
    }
  }

  if (
    laboratoryResults.length > 0 &&
    containsAny(text, [
      "laboratory",
      "microscopy",
      "culture",
      "cultivation",
      "microorganism",
      "microorganisms",
      "bacterial growth",
    ])
  ) {
    return {
      id: createId(),

      statement: text,

      classification:
        "MEASURED",

      explanation:
        "The statement refers to laboratory evidence that has been separately recorded from researcher observations.",

      evidence: [
        `${laboratoryResults.length} laboratory result(s) are recorded.`,
        "Laboratory evidence is kept separate from visual contamination scoring.",
      ],

      blocked: false,
    }
  }

  return {
    id: createId(),

    statement: text,

    classification:
      "UNKNOWN",

    explanation:
      "BioShield could not establish enough evidence to classify this statement as a direct observation or measurement.",

    evidence: [
      "The statement does not clearly correspond to a stored observation or laboratory measurement.",
      "Treat the statement cautiously until supporting evidence is recorded.",
    ],

    blocked: false,

    suggestedWording:
      "The available evidence does not currently establish this statement.",
  }
}

export async function analyseScientificIntegrity(
  experimentId: string,
): Promise<IntegrityAnalysis | null> {
  const ownerId =
    await getOwnerId()

  /*
   * First verify that the experiment belongs
   * to the currently signed-in researcher.
   */
  const experiment =
    await db.experiments.get(
      experimentId,
    )

  if (
    !experiment ||
    experiment.isDeleted ||
    experiment.ownerId !== ownerId
  ) {
    return null
  }

  /*
   * Only retrieve observations belonging
   * to this account.
   */
  const observations =
    await db.observations
      .where("experimentId")
      .equals(experimentId)
      .and(
        (observation) =>
          !observation.isDeleted &&
          observation.ownerId === ownerId,
      )
      .toArray()

  /*
   * Only retrieve laboratory evidence
   * belonging to this account.
   */
  const laboratoryResults =
    await db.laboratoryResults
      .where("experimentId")
      .equals(experimentId)
      .and(
        (result) =>
          !result.isDeleted &&
          result.ownerId === ownerId,
      )
      .toArray()

  const statements: string[] = []

  if (
    experiment.researchQuestion.trim()
  ) {
    statements.push(
      `Research question: ${experiment.researchQuestion}`,
    )
  }

  if (experiment.aim.trim()) {
    statements.push(
      `Aim: ${experiment.aim}`,
    )
  }

  if (
    experiment.hypothesis.trim()
  ) {
    statements.push(
      `Hypothesis: ${experiment.hypothesis}`,
    )
  }

  if (observations.length > 0) {
    const scores =
      observations.map(
        (observation) =>
          observation.visualScore,
      )

    const minimum =
      Math.min(...scores)

    const maximum =
      Math.max(...scores)

    statements.push(
      `Recorded visual contamination scores ranged from ${minimum} to ${maximum}.`,
    )
  }

  if (
    laboratoryResults.length > 0
  ) {
    statements.push(
      "Laboratory evidence was recorded separately from researcher observations.",
    )
  }

  const chemicalSteelObservation =
    observations.some(
      (observation) =>
        observation.treatment
          .toLowerCase()
          .includes("chemical") &&
        observation.surface
          .toLowerCase()
          .includes("steel") &&
        observation.visualScore >= 6,
    )

  if (chemicalSteelObservation) {
    statements.push(
      "Dark or increased visible contamination was observed on the chemically treated steel surface.",
    )

    statements.push(
      "The cause of the increased visible contamination on chemically treated steel is unknown.",
    )
  }

  const analysedStatements =
    statements.map(
      (statement) =>
        classifyStatement(
          statement,
          observations,
          laboratoryResults,
        ),
    )

  const summary: IntegritySummary = {
    total:
      analysedStatements.length,

    observed:
      analysedStatements.filter(
        (item) =>
          item.classification ===
          "OBSERVED",
      ).length,

    measured:
      analysedStatements.filter(
        (item) =>
          item.classification ===
          "MEASURED",
      ).length,

    inferred:
      analysedStatements.filter(
        (item) =>
          item.classification ===
          "INFERRED",
      ).length,

    unknown:
      analysedStatements.filter(
        (item) =>
          item.classification ===
          "UNKNOWN",
      ).length,

    unsupported:
      analysedStatements.filter(
        (item) =>
          item.classification ===
          "UNSUPPORTED",
      ).length,

    blocked:
      analysedStatements.filter(
        (item) =>
          item.blocked,
      ).length,
  }

  return {
    experiment,

    statements:
      analysedStatements,

    summary,
  }
}