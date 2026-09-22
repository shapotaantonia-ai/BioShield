import {
  db,
  type ExperimentRecord,
  type ObservationRecord,
} from "./database"

import {
  getCurrentUser,
} from "./authRepository"

export type UnexpectedResultSeverity =
  | "HIGH"
  | "MODERATE"
  | "LOW"

export type UnexpectedPattern = {
  id: string
  experimentId: string
  treatment: string
  surface: string
  severity: UnexpectedResultSeverity
  title: string
  description: string
  evidence: string[]
  scores: number[]
  days: number[]
  possibleExplanations: string[]
}

export type UnexpectedResultsAnalysis = {
  experiment: ExperimentRecord
  patterns: UnexpectedPattern[]
  totalPatterns: number
}

/* =========================================================
   OWNER
   ========================================================= */

async function getOwnerId(): Promise<string> {
  const user =
    await getCurrentUser()

  if (!user) {
    throw new Error(
      "You must be signed in to analyse BioShield experiment data.",
    )
  }

  return user.id
}

/* =========================================================
   ID
   ========================================================= */

function createId(): string {
  return crypto.randomUUID()
}

/* =========================================================
   GROUP OBSERVATIONS
   ========================================================= */

function groupObservations(
  observations: ObservationRecord[],
): Map<
  string,
  ObservationRecord[]
> {
  const groups =
    new Map<
      string,
      ObservationRecord[]
    >()

  for (
    const observation of observations
  ) {
    const key =
      `${observation.treatment}|||${observation.surface}`

    const existing =
      groups.get(key) ?? []

    existing.push(
      observation,
    )

    groups.set(
      key,
      existing,
    )
  }

  return groups
}

/* =========================================================
   ANALYSE GROUP
   ========================================================= */

function analyseGroup(
  experimentId: string,
  treatment: string,
  surface: string,
  observations: ObservationRecord[],
): UnexpectedPattern[] {
  if (
    observations.length < 2
  ) {
    return []
  }

  const ordered =
    [...observations].sort(
      (a, b) =>
        a.day - b.day ||
        a.replicate - b.replicate,
    )

  const dayMap =
    new Map<number, number[]>()

  for (
    const observation of ordered
  ) {
    const scores =
      dayMap.get(
        observation.day,
      ) ?? []

    scores.push(
      observation.visualScore,
    )

    dayMap.set(
      observation.day,
      scores,
    )
  }

  const days =
    [...dayMap.keys()].sort(
      (a, b) => a - b,
    )

  const dailyScores =
    days.map((day) => {
      const values =
        dayMap.get(day) ?? []

      return (
        values.reduce(
          (sum, value) =>
            sum + value,
          0,
        ) / values.length
      )
    })

  const patterns:
    UnexpectedPattern[] = []

  const maximum =
    Math.max(...dailyScores)

  const minimum =
    Math.min(...dailyScores)

  /* =======================================================
     PATTERN 1
     SUBSTANTIAL INCREASE
     ======================================================= */

  if (
    maximum - minimum >= 4
  ) {
    const firstScore =
      dailyScores[0]

    const lastScore =
      dailyScores[
        dailyScores.length - 1
      ]

    if (
      lastScore > firstScore
    ) {
      patterns.push({
        id: createId(),

        experimentId,

        treatment,

        surface,

        severity:
          lastScore >= 6
            ? "HIGH"
            : "MODERATE",

        title:
          "Marked increase in visual contamination score",

        description:
          "The recorded visual contamination score increased substantially over the observation period.",

        evidence: [
          `Scores changed from ${firstScore.toFixed(1)} on Day ${days[0]} to ${lastScore.toFixed(1)} on Day ${days[days.length - 1]}.`,

          `The observed score range was ${minimum.toFixed(1)} to ${maximum.toFixed(1)}.`,

          "The measurement represents a visual contamination score and not a bacterial count.",
        ],

        scores:
          dailyScores,

        days,

        possibleExplanations: [
          "Possible treatment–surface interaction.",

          "Possible environmental or handling influence.",

          "Possible contamination introduced during the experimental process.",

          "Possible variation in visual scoring.",
        ],
      })
    }
  }

  /* =======================================================
     PATTERN 2
     LATE SHARP INCREASE
     ======================================================= */

  if (
    dailyScores.length >= 3
  ) {
    const previous =
      dailyScores[
        dailyScores.length - 2
      ]

    const final =
      dailyScores[
        dailyScores.length - 1
      ]

    if (
      final - previous >= 3
    ) {
      patterns.push({
        id: createId(),

        experimentId,

        treatment,

        surface,

        severity:
          final >= 6
            ? "HIGH"
            : "MODERATE",

        title:
          "Late increase detected",

        description:
          "A relatively sharp increase occurred near the end of the observation period.",

        evidence: [
          `The score changed from ${previous.toFixed(1)} to ${final.toFixed(1)} between Day ${days[days.length - 2]} and Day ${days[days.length - 1]}.`,

          "The pattern is based on recorded observations.",

          "The cause of the change has not been established.",
        ],

        scores:
          dailyScores,

        days,

        possibleExplanations: [
          "Possible treatment–surface interaction.",

          "Possible change in environmental exposure.",

          "Possible contamination or handling event.",

          "Possible measurement variation.",
        ],
      })
    }
  }

  /* =======================================================
     PATTERN 3
     PERSISTENTLY HIGH LATE-PERIOD SCORES
     ======================================================= */

  const lateScores =
    dailyScores.slice(-2)

  if (
    lateScores.length === 2 &&
    lateScores.every(
      (score) => score >= 6,
    )
  ) {
    const alreadyDetected =
      patterns.some(
        (pattern) =>
          pattern.title ===
          "Marked increase in visual contamination score",
      )

    if (!alreadyDetected) {
      patterns.push({
        id: createId(),

        experimentId,

        treatment,

        surface,

        severity: "MODERATE",

        title:
          "Persistently high late-period score",

        description:
          "The final recorded observation period contains consistently high visual contamination scores.",

        evidence: [
          `Final recorded scores were ${lateScores
            .map((score) =>
              score.toFixed(1),
            )
            .join(" and ")}.`,

          "The pattern was detected from stored observation data.",

          "Visual scores do not establish bacterial abundance or cause.",
        ],

        scores:
          dailyScores,

        days,

        possibleExplanations: [
          "Possible treatment–surface interaction.",

          "Possible environmental influence.",

          "Possible contamination during handling.",

          "Possible variation in scoring.",
        ],
      })
    }
  }

  return patterns
}

/* =========================================================
   ANALYSE UNEXPECTED RESULTS
   ========================================================= */

export async function analyseUnexpectedResults(
  experimentId: string,
): Promise<
  UnexpectedResultsAnalysis | null
> {
  const ownerId =
    await getOwnerId()

  /*
   * Verify the experiment belongs
   * to the current account.
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
   * Only analyse observations that
   * belong to the same account.
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

  const groups =
    groupObservations(
      observations,
    )

  const patterns:
    UnexpectedPattern[] = []

  for (
    const [key, group] of
      groups.entries()
  ) {
    const [
      treatment,
      surface,
    ] = key.split("|||")

    patterns.push(
      ...analyseGroup(
        experimentId,
        treatment,
        surface,
        group,
      ),
    )
  }

  return {
    experiment,

    patterns,

    totalPatterns:
      patterns.length,
  }
}