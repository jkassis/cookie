// Copyright © 2018 by Jeremy Kassis. All Rights Reserved.
var randomSeed = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)

export class Util {
  public static UUID() {
    return (
      s4() +
      s4() +
      '-' +
      s4() +
      '-' +
      s4() +
      '-' +
      s4() +
      '-' +
      s4() +
      s4() +
      s4()
    )

    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1)
    }
  }

  public static UUIDGroupBase() {
    var UUIDGroupBase = Util.UUID()
    return Util.stringReplaceAt(UUIDGroupBase, UUIDGroupBase.length - 1, '0')
  }

  public static async callWithRetry(
    fn: () => Promise<void>,
    baseDelayMs: number = 1000,
    attemptMax: number = 0,
    attempt: number = 0): Promise<void> {
    console.log('callWithRetry baseDelayMs:' + baseDelayMs + ' attemptMax: ' + attemptMax + ' attempt:' + attempt)
    try {
      return await fn()
    } catch (e) {
      if (attemptMax > 0 && attempt > attemptMax) {
        throw e
      }
      var durationMs = baseDelayMs * (2 ** attempt)
      durationMs *= (1 + .1 * Math.random()) // add 10% jitter
      await Util.wait(durationMs)
      return Util.callWithRetry(fn, baseDelayMs, attemptMax, attempt + 1)
    }
  }

  public static random() {
    randomSeed = (randomSeed * 9301 + 49297) % 233280
    return randomSeed / 233280
  }

  public static randomInt(lo: number, hi: number) {
    var random = lo + Math.floor((Util.random() % 1) * (hi - lo))
    return random
  }

  public static stringReplaceAt(str: string, index: number, chr: string) {
    if (index > str.length - 1) return str
    return str.substr(0, index) + chr + str.substr(index + 1)
  }

  public static async wait(ms: number): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      setTimeout(resolve, ms)
    })
  }

  public static SetMod(arr: any[], item: any, include: boolean): any[] {
    arr = arr.filter(arrItem => arrItem != item)
    if (include) arr.push(item)
    return arr
  }

  public static ArrSet(arr: any[], item: any): any[] {
    if (arr.includes(item)) { return arr }
    arr.push(item)
    return arr
  }

  public static ArrRm(arr: any[], item: any): any[] {
    return arr.filter(arrItem => arrItem != item)
  }
}
