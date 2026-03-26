import { google } from '@ai-sdk/google'

// Default text models now use Gemini to avoid OpenAI key dependency.
export const agentModel = google('gemini-2.5-flash')
export const powerModel = google('gemini-2.5-pro')

// Gemini — Used for campaign HTML generation
export const geminiModel = google('gemini-2.5-flash')
