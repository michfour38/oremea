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
        "What would you most want to improve, experience, repair, create, or feel inside your relationships right now?",
      placeholder:
        "Example: I want calmer communication, deeper connection, trust, or a healthier relationship dynamic.",
    },

    {
      area: "income",
      title: "Income",
      question:
        "What would you most want to change, stabilize, increase, or experience financially right now?",
      placeholder:
        "Example: I want stable income, financial freedom, less pressure, or consistent growth.",
    },

    {
      area: "health",
      title: "Health",
      question:
        "What would feeling physically healthier, stronger, calmer, or more energized actually look like for you?",
      placeholder:
        "Example: I want more energy, better sleep, less anxiety, strength, or consistency with movement.",
    },

    {
      area: "spirituality",
      title: "Spirituality",
      question:
        "What are you currently seeking spiritually, internally, energetically, or emotionally that feels important to your growth?",
      placeholder:
        "Example: I want peace, connection, meaning, embodiment, direction, or inner clarity.",
    },

    {
      area: "investments",
      title: "Investments",
      question:
        "What kind of long-term security, ownership, stability, or future-building feels important to you right now?",
      placeholder:
        "Example: I want savings, investments, property, security, or long-term stability.",
    },

    {
      area: "network",
      title: "Network",
      question:
        "What kind of people, environments, support systems, or opportunities do you want more access to?",
      placeholder:
        "Example: I want aligned people, better connections, stronger community, or growth-oriented environments.",
    },

    {
      area: "knowledge",
      title: "Knowledge",
      question:
        "What skills, understanding, education, or mastery do you most want to develop right now?",
      placeholder:
        "Example: I want to understand business, relationships, investing, coding, or myself more deeply.",
    },

    {
      area: "lifestyle",
      title: "Lifestyle",
      question:
        "What kind of daily life, rhythm, freedom, environment, or experience are you trying to build toward?",
      placeholder:
        "Example: I want more freedom, peace, travel, structure, beauty, flexibility, or balance.",
    },
  ]