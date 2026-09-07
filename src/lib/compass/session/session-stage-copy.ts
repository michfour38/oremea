import type { CompassSessionStage } from "./session-types"

export const SESSION_STAGE_COPY: Record<
  CompassSessionStage,
  {
    title: string
    description: string
  }
> = {
  area_discovery: {
    title: "Direction Field",
    description:
      "Name the realities you would like to build across the eight areas. The participant's words establish the field; Compass does not rank a life for them.",
  },

  area_confirmation: {
    title: "Choose a Doorway",
    description:
      "Compass returns the named field. The participant chooses which area this run will follow.",
  },

  recursive_depth: {
    title: "The Descent",
    description:
      "Across all seven Why layers, Compass follows why the chosen direction matters. Possibility, planning, and action wait until the Descent is complete.",
  },

  core_value_reflection: {
    title: "Core Reflection",
    description:
      "Compass reflects the completed Descent from participant-written evidence. The participant may correct it before choosing to continue.",
  },

  resistance_mapping: {
    title: "Completed Reality and Objections",
    description:
      "The participant describes what is observably true when the chosen possibility exists and names any meaningful objection in their own words.",
  },

  execution_calibration: {
    title: "Working Map",
    description:
      "Compass organises participant-named goals, decisions, dependencies, and waiting items without taking ownership of the choice.",
  },

  next_step_commitment: {
    title: "Participant-Chosen Movement",
    description:
      "The participant confirms the resolution and chooses one concrete movement they can recognise as complete.",
  },

  complete: {
    title: "Movement Chosen and Saved",
    description:
      "This run can stop once the resolution and participant-chosen movement are saved. Return is useful when reality changes, not as a daily obligation.",
  },
}
