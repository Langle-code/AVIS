export interface SM2State {
  ease_factor: number   // starts at 2.5
  interval: number      // days until next review
  repetitions: number
}

/**
 * SM-2 algorithm
 * quality: 0-5 (0-1 = wrong, 2 = wrong but close, 3-5 = correct with varying confidence)
 * For our binary correct/wrong: correct = 4, wrong = 1
 */
export function sm2Update(state: SM2State, quality: 0 | 1 | 2 | 3 | 4 | 5): SM2State {
  let { ease_factor, interval, repetitions } = state

  if (quality >= 3) {
    // Correct
    if (repetitions === 0) {
      interval = 1
    } else if (repetitions === 1) {
      interval = 6
    } else {
      interval = Math.round(interval * ease_factor)
    }
    repetitions += 1
    ease_factor = ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    if (ease_factor < 1.3) ease_factor = 1.3
  } else {
    // Wrong — reset repetitions and interval but keep ease_factor
    repetitions = 0
    interval = 1
  }

  return { ease_factor, interval, repetitions }
}

export function nextDueDate(intervalDays: number): string {
  const d = new Date()
  d.setDate(d.getDate() + intervalDays)
  return d.toISOString()
}
