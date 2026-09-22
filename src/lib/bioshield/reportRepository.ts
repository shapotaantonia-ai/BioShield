import {
  db,
  type ExperimentRecord,
} from "./database"

import { listPhotos } from "./photoRepository"
import { listLaboratoryResults } from "./laboratoryRepository"
import { analyseScientificIntegrity } from "./scientificIntegrity"
import { analyseUnexpectedResults } from "./unexpectedResults"
import { getCurrentUser } from "./authRepository"

export type ReportObservation = {
  id: string
  treatment: string
  surface: string
  replicate: number
  day: number
  visualScore: number
  notes: string
}

export type ReportData = {
  experiment: ExperimentRecord
  observations: ReportObservation[]
  laboratoryResults: Awaited<
    ReturnType<typeof listLaboratoryResults>
  >
  photos: Awaited<
    ReturnType<typeof listPhotos>
  >
  integrity: Awaited<
    ReturnType<typeof analyseScientificIntegrity>
  >
  unexpectedResults: Awaited<
    ReturnType<typeof analyseUnexpectedResults>
  >
  generatedAt: string
}

async function getOwnerId(): Promise<string> {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error(
      "You must be signed in to generate BioShield reports.",
    )
  }

  return user.id
}

export async function getReportData(
  experimentId: string,
): Promise<ReportData | null> {
  const ownerId =
    await getOwnerId()

  /*
   * A report may only be generated from
   * an experiment belonging to the
   * currently signed-in researcher.
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
   * Only include observations belonging
   * to the same account.
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

  const [
    laboratoryResults,
    photos,
    integrity,
    unexpectedResults,
  ] = await Promise.all([
    listLaboratoryResults(
      experimentId,
    ),

    listPhotos(
      experimentId,
    ),

    analyseScientificIntegrity(
      experimentId,
    ),

    analyseUnexpectedResults(
      experimentId,
    ),
  ])

  return {
    experiment,

    observations:
      observations
        .sort(
          (a, b) =>
            a.day - b.day ||
            a.treatment.localeCompare(
              b.treatment,
            ) ||
            a.surface.localeCompare(
              b.surface,
            ) ||
            a.replicate - b.replicate,
        )
        .map(
          (observation) => ({
            id: observation.id,

            treatment:
              observation.treatment,

            surface:
              observation.surface,

            replicate:
              observation.replicate,

            day:
              observation.day,

            visualScore:
              observation.visualScore,

            notes:
              observation.notes,
          }),
        ),

    laboratoryResults,

    photos,

    integrity,

    unexpectedResults,

    generatedAt:
      new Date().toISOString(),
  }
}

export function createRawCSV(
  data: ReportData,
): string {
  const header = [
    "Observation ID",
    "Experiment ID",
    "Treatment",
    "Surface",
    "Replicate",
    "Day",
    "Visual contamination score (0-8)",
    "Notes",
  ]

  const rows =
    data.observations.map(
      (observation) => [
        observation.id,
        data.experiment.id,
        observation.treatment,
        observation.surface,
        observation.replicate,
        observation.day,
        observation.visualScore,
        observation.notes,
      ],
    )

  return [header, ...rows]
    .map((row) =>
      row
        .map(
          (value) =>
            `"${String(
              value ?? "",
            ).replace(
              /"/g,
              '""',
            )}"`,
        )
        .join(","),
    )
    .join("\n")
}

export function createRawJSON(
  data: ReportData,
): string {
  return JSON.stringify(
    {
      exportType:
        "BioShield raw research data",

      exportedAt:
        data.generatedAt,

      experiment:
        data.experiment,

      observations:
        data.observations,

      laboratoryResults:
        data.laboratoryResults,

      unexpectedResults:
        data.unexpectedResults
          ?.patterns ?? [],
    },
    null,
    2,
  )
}

function calculateSummary(
  observations: ReportObservation[],
) {
  if (
    observations.length === 0
  ) {
    return {
      n: 0,
      minimum: null,
      maximum: null,
      mean: null,
    }
  }

  const scores =
    observations.map(
      (observation) =>
        observation.visualScore,
    )

  const total =
    scores.reduce(
      (sum, value) =>
        sum + value,
      0,
    )

  return {
    n: scores.length,

    minimum:
      Math.min(...scores),

    maximum:
      Math.max(...scores),

    mean:
      total / scores.length,
  }
}

export function buildReportText(
  data: ReportData,
): string {
  const experiment =
    data.experiment

  const summary =
    calculateSummary(
      data.observations,
    )

  const integrityBlocked =
    data.integrity?.summary
      .blocked ?? 0

  const unexpectedCount =
    data.unexpectedResults
      ?.totalPatterns ?? 0

  const lines: string[] = []

  lines.push(
    "BIOSHIELD RESEARCH REPORT",
  )

  lines.push(
    "Beyond Disinfection",
  )

  lines.push("")

  lines.push(
    `Report generated: ${data.generatedAt}`,
  )

  lines.push(
    `Experiment ID: ${experiment.id}`,
  )

  lines.push(
    `Researcher: ${
      experiment.researcher ||
      "Not recorded"
    }`,
  )

  lines.push("")

  lines.push(
    "1. RESEARCH QUESTION",
  )

  lines.push(
    experiment.researchQuestion ||
      "Not recorded",
  )

  lines.push("")

  lines.push("2. AIM")

  lines.push(
    experiment.aim ||
      "Not recorded",
  )

  lines.push("")

  lines.push(
    "3. HYPOTHESIS",
  )

  lines.push(
    experiment.hypothesis ||
      "Not recorded",
  )

  lines.push("")

  lines.push(
    "4. EXPERIMENT DESIGN",
  )

  lines.push(
    `Treatments: ${
      experiment.treatments
        .join(", ") ||
      "Not recorded"
    }`,
  )

  lines.push(
    `Surfaces: ${
      experiment.surfaces
        .join(", ") ||
      "Not recorded"
    }`,
  )

  lines.push(
    `Replicates recorded: ${experiment.replicates}`,
  )

  lines.push("")

  lines.push(
    "5. OBSERVATION DATA",
  )

  lines.push(
    `Number of recorded observations: ${summary.n}`,
  )

  if (summary.n > 0) {
    lines.push(
      `Visual contamination score range: ${summary.minimum}–${summary.maximum}`,
    )

    lines.push(
      `Mean visual contamination score: ${summary.mean?.toFixed(2)}`,
    )
  } else {
    lines.push(
      "No observations recorded.",
    )
  }

  lines.push(
    "Important: visual contamination scores are observational scores and are not bacterial counts.",
  )

  lines.push("")

  lines.push(
    "6. LABORATORY EVIDENCE",
  )

  if (
    data.laboratoryResults
      .length === 0
  ) {
    lines.push(
      "No laboratory results recorded.",
    )
  } else {
    data.laboratoryResults.forEach(
      (result, index) => {
        lines.push(
          `${index + 1}. ${
            result.methodName ||
            result.method
          }`,
        )

        lines.push(
          `Observation: ${result.observation}`,
        )

        lines.push(
          `Interpretation: ${
            result.interpretation ||
            "Not recorded"
          }`,
        )

        lines.push(
          `Countable: ${
            result.countable
              ? "Yes"
              : "No"
          }`,
        )

        lines.push(
          `Confirmation: ${
            result.confirmationStatus ||
            "Not recorded"
          }`,
        )

        lines.push("")
      },
    )
  }

  lines.push(
    "7. PHOTOGRAPHIC EVIDENCE",
  )

  lines.push(
    `Photographs recorded: ${data.photos.length}`,
  )

  lines.push("")

  lines.push(
    "8. UNEXPECTED RESULTS",
  )

  if (
    unexpectedCount === 0
  ) {
    lines.push(
      "No automated unexpected-result patterns detected.",
    )
  } else {
    data.unexpectedResults?.patterns.forEach(
      (pattern, index) => {
        lines.push(
          `${index + 1}. ${pattern.title}`,
        )

        lines.push(
          `Treatment: ${pattern.treatment}`,
        )

        lines.push(
          `Surface: ${pattern.surface}`,
        )

        lines.push(
          `Severity: ${pattern.severity}`,
        )

        lines.push(
          `Description: ${pattern.description}`,
        )

        lines.push(
          "Cause: Not established from available evidence.",
        )

        lines.push("")
      },
    )
  }

  lines.push(
    "9. SCIENTIFIC INTEGRITY",
  )

  if (!data.integrity) {
    lines.push(
      "Scientific integrity analysis unavailable.",
    )
  } else {
    lines.push(
      `Statements analysed: ${data.integrity.summary.total}`,
    )

    lines.push(
      `Observed: ${data.integrity.summary.observed}`,
    )

    lines.push(
      `Measured: ${data.integrity.summary.measured}`,
    )

    lines.push(
      `Inferred: ${data.integrity.summary.inferred}`,
    )

    lines.push(
      `Unknown: ${data.integrity.summary.unknown}`,
    )

    lines.push(
      `Unsupported: ${data.integrity.summary.unsupported}`,
    )

    lines.push(
      `Blocked claims: ${data.integrity.summary.blocked}`,
    )
  }

  lines.push("")

  lines.push(
    "10. CONCLUSION",
  )

  if (
    integrityBlocked > 0
  ) {
    lines.push(
      "Report requires revision before finalisation because one or more unsupported scientific claims were detected.",
    )
  } else if (
    !experiment
      .qualityEvidence
      ?.activeConcentrationVerified
  ) {
    lines.push(
      "The recorded treatments showed different observed contamination patterns; however, comparative efficacy could not be established confidently because active treatment concentrations were not fully verified and quantitative microbiological measurements were limited.",
    )
  } else {
    lines.push(
      "The experiment produced recorded observational evidence that can be interpreted within the stated experimental conditions and measurement limitations.",
    )
  }

  lines.push("")

  lines.push(
    "11. LIMITATIONS",
  )

  const limitations = [
    "Visual contamination scoring is observational and does not represent bacterial counts.",
    "Unverified active treatment concentration limits direct comparison of treatment efficacy.",
    "Surface area and volume-per-area may not have been formally recorded.",
    "Where replicate numbers are limited, descriptive statistics should be interpreted cautiously.",
    "Unexpected results do not establish causation.",
  ]

  limitations.forEach(
    (item) => {
      lines.push(
        `• ${item}`,
      )
    },
  )

  lines.push("")

  lines.push(
    "12. RECOMMENDATIONS",
  )

  lines.push(
    "• Verify active treatment concentrations where possible.",
  )

  lines.push(
    "• Record surface area and treatment volume consistently.",
  )

  lines.push(
    "• Use appropriate replication and clearly defined controls.",
  )

  lines.push(
    "• Use quantitative microbiological measurements where the research question requires them.",
  )

  lines.push(
    "• Investigate unexpected treatment–surface patterns using a follow-up experiment.",
  )

  lines.push("")

  lines.push(
    "13. DATA TRACEABILITY",
  )

  lines.push(
    "This report was generated from BioShield records stored for the selected experiment.",
  )

  lines.push(
    `Experiment last updated: ${experiment.updatedAt}`,
  )

  return lines.join("\n")
}

export function downloadTextFile(
  content: string,
  fileName: string,
  mimeType: string,
): void {
  const blob = new Blob(
    [content],
    {
      type: mimeType,
    },
  )

  const url =
    URL.createObjectURL(
      blob,
    )

  const link =
    document.createElement(
      "a",
    )

  link.href = url
  link.download = fileName
  link.click()

  URL.revokeObjectURL(url)
}