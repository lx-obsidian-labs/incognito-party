// Scans text for PII and other flagged content before it's posted/sent
const PII_PATTERNS = [
  { regex: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, label: 'phone_number', action: 'block' as const },
  { regex: /\b[\w.-]+@[\w.-]+\.\w+\b/g, label: 'email', action: 'block' as const },
  { regex: /\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b/g, label: 'credit_card', action: 'block' as const },
  { regex: /\b(?:https?:\/\/|www\.)\S+/g, label: 'url', action: 'warn' as const },
  { regex: /\b\d{5}(?:-\d{4})?\b/g, label: 'zip_code', action: 'warn' as const },
]

export interface FlagResult {
  flagged: boolean
  blocked: boolean
  flags: { label: string; action: 'block' | 'warn'; match: string }[]
  message?: string
}

export function scanContent(text: string): FlagResult {
  const flags: FlagResult['flags'] = []

  for (const { regex, label, action } of PII_PATTERNS) {
    const matches = text.match(regex)
    if (matches) {
      for (const match of matches) {
        flags.push({ label, action, match })
      }
    }
  }

  const hasBlocked = flags.some((f) => f.action === 'block')
  const hasWarnings = flags.some((f) => f.action === 'warn')

  let message: string | undefined
  if (hasBlocked) {
    message = 'Your message contains personal information (phone, email, etc.) which is not allowed for your safety. Please remove it and try again.'
  } else if (hasWarnings) {
    message = 'Your message contains links or location details. For your anonymity, consider removing them.'
  }

  return {
    flagged: flags.length > 0,
    blocked: hasBlocked,
    flags,
    message,
  }
}

// Simple advice categories based on content analysis
export function categorizeVibe(text: string): string {
  const lower = text.toLowerCase()
  if (lower.match(/sad|lonely|depress|cry|alone|miss|hurt|pain|lost|broken/)) return 'seeking-comfort'
  if (lower.match(/happy|excite|amazing|love|grateful|blessed|proud|joy/)) return 'celebrating'
  if (lower.match(/angry|frustrat|annoy|hate|tired of|sick of/)) return 'venting'
  if (lower.match(/help|advice|suggest|recommend|what should|how to/)) return 'seeking-advice'
  if (lower.match(/food|eat|cook|restaurant|recipe|hungry/)) return 'food'
  if (lower.match(/where|travel|visit|explore|move|city/)) return 'exploring'
  if (lower.match(/work|job|career|study|exam|interview|promot/)) return 'career'
  if (lower.match(/love|date|crush|relation|partner|romance|heart/)) return 'romance'
  return 'general'
}
