
export class Ingredient {
  public title: string = ""
  public link: string = ""
}

export type Step = string

export class Creation {
  public bom: Ingredient[] = []
  public desc: string = ""
  public heroImg: string = ""
  public id: string = ""
  public notes: string = ""
  public steps: Step[] = []
  public tags: string[] = []
  public time: string = ""
  public title: string = ""
}

export interface User {
  id: UUID
  email?: string
  nameFamily?: string
  nameGiven?: string
  nameAlias?: string
  nameNick?: string
  gender?: string
  createdAt?: string
  lastLogin?: string
  role?: string
}

export type UUID = string

export function UUIDMake(): string {
  // Function to convert a number to a hexadecimal string with padding
  const toHex = (num: number, padding: number) => num.toString(16).padStart(padding, '0')

  // Generate 16 random values
  let randomValues
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    randomValues = window.crypto.getRandomValues(new Uint8Array(16))
  } else {
    throw new Error('Crypto not supported')
  }

  // Adjust specific bits for UUID v4 compliance (version and variant bits)
  randomValues[6] = (randomValues[6] & 0x0f) | 0x40 // Version 4
  randomValues[8] = (randomValues[8] & 0x3f) | 0x80 // Variant 10xx

  // Convert to a UUID string
  return `${toHex(randomValues[0], 2)}${toHex(randomValues[1], 2)}${toHex(randomValues[2], 2)}${toHex(randomValues[3], 2)}-` +
    `${toHex(randomValues[4], 2)}${toHex(randomValues[5], 2)}-` +
    `${toHex(randomValues[6], 2)}${toHex(randomValues[7], 2)}-` +
    `${toHex(randomValues[8], 2)}${toHex(randomValues[9], 2)}-` +
    `${toHex(randomValues[10], 2)}${toHex(randomValues[11], 2)}${toHex(randomValues[12], 2)}` +
    `${toHex(randomValues[13], 2)}${toHex(randomValues[14], 2)}${toHex(randomValues[15], 2)}`
}
