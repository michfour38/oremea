import { redirect } from "next/navigation"

export default async function HarmonizeRecognitionRedirect(
  props: {
    params: Promise<{ systemId: string; cycleId: string }>
  }
) {
  const params = await props.params;
  redirect(
    `/harmonize/system/${params.systemId}/cycle/${params.cycleId}/question/where_you_go_inside`,
  )
}