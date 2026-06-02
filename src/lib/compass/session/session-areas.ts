import type { CompassGoalArea } from "./session-types"

export type CompassAreaQuestion = {
  area: CompassGoalArea
  title: string
  question: string
  placeholder: string
}

export const COMPASS_AREA_QUESTIONS: CompassAreaQuestion[] =
  [
    {
      area: "relationships",
      title: "Relationships",
      question:
        "What feels most important to build, strengthen, repair, or create within your relationships right now?",
      placeholder:
        "Example: stronger communication, deeper trust, healthier boundaries, more consistent connection, or a more stable relationship dynamic.",
    },

    {
      area: "income",
      title: "Income",
      question:
        "What would make the biggest difference to your income and financial reality right now?",
      placeholder:
        "Example: more reliable income, debt reduction, a growing business, financial stability, greater earning capacity, or improved financial decision-making.",
    },

    {
      area: "health",
      title: "Health",
      question:
        "If you took full responsibility for your health, what feels most important to improve first?",
      placeholder:
        "Example: sleep, energy, strength, mobility, nutrition, recovery, stress management, or a more sustainable lifestyle.",
    },

    {
      area: "spirituality",
      title: "Spirituality",
      question:
        "What feels most important to deepen, explore, understand, or establish within your spiritual life right now?",
      placeholder:
        "Example: a relationship with God, faith, prayer, purpose, meaning, consciousness, service, meditation, ancestral connection, nature, universal intelligence, non-duality, energy work, scientific wonder, inner alignment, or your understanding of life itself.",
    },

    {
      area: "investments",
      title: "Investments",
      question:
        "What feels most important to build, grow, protect, or position for your future right now?",
      placeholder:
        "Example: savings, assets, property, retirement planning, wealth creation, long-term security, or investment knowledge.",
    },

    {
      area: "network",
      title: "Network",
      question:
        "Which relationships, communities, or connections would most benefit from your attention right now?",
      placeholder:
        "Example: professional relationships, friendships, mentors, collaborators, community involvement, or building a stronger support network.",
    },

    {
      area: "knowledge",
      title: "Knowledge",
      question:
        "What feels most important to learn, develop, understand, or become more capable in right now?",
      placeholder:
        "Example: communication, leadership, business, investing, research, coding, parenting, education, or mastery of a specific area of interest.",
    },

    {
      area: "lifestyle",
      title: "Lifestyle",
      question:
        "What part of your daily life would create the most meaningful improvement if you deliberately changed it?",
      placeholder:
        "Example: routines, home environment, time management, work-life balance, family life, freedom, stability, or overall quality of life.",
    },
  ]