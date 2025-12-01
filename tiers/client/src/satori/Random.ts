
export function ScatIdGetUnique(existingIds: Map<string, any>): string {
  const scatSyllables = ["Doo", "Bop", "Bee", "Da", "La", "Ba", "Zoo", "Wah"]
  let uniqueId = ""

  // Function to generate a random scat syllable combination
  const generateRandomSyllables = (length: number): string => {
    return Array.from({ length }, () => scatSyllables[Math.floor(Math.random() * scatSyllables.length)]).join('')
  }

  // Keep generating a unique ID until it doesn't exist in the existingIds map
  do {
    uniqueId = generateRandomSyllables(2) // Start with a combination of 2 to keep it short
  } while (existingIds.has(uniqueId))

  return uniqueId
}
