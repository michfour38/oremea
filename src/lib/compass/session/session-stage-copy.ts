import type { CompassSessionStage } from "./session-types"

export const SESSION_STAGE_COPY: Record<
  CompassSessionStage,
  {
    title: string
    description: string
  }
> = {
  area_discovery: {
    title: "Goal Discovery",
    description:
      "Compass will guide you through several core areas of life to better understand what currently matters most to you.",
  },

  area_confirmation: {
    title: "Signal Reflection",
    description:
      "Compass may notice stronger emotional or cognitive weighting around certain areas. You are always free to agree, disagree, refine, or clarify.",
  },

  recursive_depth: {
    title: "Deeper Clarification",
    description:
      "Compass will now take you multiple layers deeper into the goal itself. Some questions may feel repetitive. This is intentional. The purpose is to uncover the deeper values, motivations, and emotional structures beneath the goal.",
  },

  core_value_reflection: {
    title: "Core Value Reflection",
    description:
      "Your responses may point toward a deeper value or need beneath multiple goals. Compass will reflect possible patterns for your consideration, not as absolute truth.",
  },

  resistance_mapping: {
    title: "Resistance & Friction",
    description:
      "Execution often reveals emotional resistance, nervous-system friction, avoidance patterns, or conflicting behaviors. Compass helps make these visible without judgment.",
  },

  execution_calibration: {
    title: "Execution Calibration",
    description:
      "The goal is not fantasy intensity. The goal is embodied momentum. Compass will help identify a next step that feels psychologically and physically executable.",
  },

  next_step_commitment: {
    title: "Next Executable Step",
    description:
      "Compass will now help you define the clearest next physical action available to you right now.",
  },

  complete: {
    title: "Compass Reflection Complete",
    description:
      "You can return to Compass at any time to refine goals, explore resistance patterns, or continue building momentum through aligned execution.",
  },
}