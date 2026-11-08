import { RECOGNITION_OUTPUT_SCHEMA } from '../src/lib/recognition/recognition-output-schema.ts';
import { probeStructuredCompatibility } from './argus-auto-repair.mjs';

export async function probeRecognition(model, apiKey) {
  await probeStructuredCompatibility({
    model, apiKey, schema: RECOGNITION_OUTPUT_SCHEMA,
    prompt: 'Synthetic fixture. Return reply equal to ARGUS_OK and an empty remember array.',
    system: [{type:'text', text:'Return the requested synthetic test fields.', cache_control:{type:'ephemeral'}}],
    validate: value => value?.reply === 'ARGUS_OK' && Array.isArray(value.remember) && value.remember.length === 0,
  });
}
