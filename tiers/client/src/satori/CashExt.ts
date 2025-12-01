import cash from 'cash-dom'
import { Cash } from 'cash-dom'

declare module 'cash-dom' {
  interface Cash {
    animate(
      properties: object,
      easings: Record<string, string>,
      duration?: number,
      tick?: (this: HTMLElement, number: number) => void): Promise<void>
    animateCss(animationName: string, callback?: () => void): Promise<void>
    contains(target: Cash): boolean
    scrollToTargetBottom(target: Cash): void
    scrollToTargetTop(target: Cash): void
    scrollToTargetCenter(target: Cash): void
    focus(): this
    hideIf(cond?: boolean): Cash
    scrollTop(val?: number): number
    showIf(cond?: boolean): Cash
    stop(clearQueue: boolean, jumpToEnd: boolean): Cash
  }
}

// Easing functions
type EasingFunction = (t: number) => number
function easingLinear(t: number, b: number, c: number, d: number): number {
  return c * t / d + b
}

type Animation = {
  tick?: (number: number) => void
  complete?: () => void
  duration: number
  easings: Record<string, string>
  element: HTMLElement
  initialStyles: Record<string, number>
  properties: Record<string, number>
  start: number
}

class Animator {
  private animByID: Record<string, Animation> = {}
  private anims: Animation[] = [];
  private rafId: number | null = null; // To store the requestAnimationFrame ID
  private running: boolean = false;
  private static instance: Animator
  public easingFns: Record<string, EasingFunction> = {}

  private constructor() { }

  public static make(): Animator {
    if (!Animator.instance) {
      Animator.instance = new Animator()
    }
    return Animator.instance
  }

  public easingRegister(name: string, func: EasingFunction): void {
    this.easingFns[name] = func
  }

  public anim(
    element: HTMLElement,
    properties: Record<string, number>,
    easings: Record<string, string>,
    duration: number,
    tick?: (this: HTMLElement, value: number) => void,
    complete?: () => void
  ): void {
    this.animAdd({ element, properties, easings, duration, start: 0, initialStyles: {}, tick, complete })
  }

  public animAdd(animation: Animation): void {
    // Initialize missing easings to "linear" for each property
    animation.easings = animation.easings || {}
    Object.keys(animation.properties).forEach(property => {
      animation.easings[property] = animation.easings[property] || "linear"
    })

    if (!this.running) {
      this.running = true
      this.rafId = requestAnimationFrame(this.tick.bind(this))
    }

    animation.start = performance.now()
    animation.initialStyles = {}
    for (const property in animation.properties) {
      if (property == 'scrollTop' || property == 'scrollLeft') {
        animation.initialStyles[property] = animation.element[property]
      } else {
        const computedStyle = getComputedStyle(animation.element).getPropertyValue(property)
        animation.initialStyles[property] = parseFloat(computedStyle) || 0
      }
      this.anims.push(animation)
    }
  }

  public animDel(element: HTMLElement): void {
    this.anims = this.anims.filter(
      animation => animation.element !== element
    )

    if (this.anims.length === 0 && this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.running = false
      this.rafId = null
    }
  }

  private tick(timestamp: number): void {
    this.rafId = requestAnimationFrame(this.tick.bind(this))
    const animationsToRemove: number[] = []
    this.anims.forEach((animation, index) => {
      const { element, properties, easings, duration, start, initialStyles, complete } = animation
      const elapsed = timestamp - start
      const progress = Math.min(elapsed / duration, 1)

      for (const property in properties) {
        const easingName = easings[property]
        const easingFunc = this.easingFns[easingName]

        const initialValue = initialStyles[property]
        const change = properties[property] - initialValue
        const easedProgress = easingFunc(progress)
        const currentValue = initialValue + change * easedProgress
        if (animation.tick != null) {
          animation.tick(currentValue)
        } else if (property === 'scrollTop') {
          element.scrollTop = currentValue
        } else if (property === 'scrollLeft') {
          element.scrollLeft = currentValue
        } else {
          element.style[property as any] = currentValue.toString()
        }
      }

      if (elapsed >= duration) {
        animationsToRemove.unshift(index)
        if (complete) complete()
      }
    })

    animationsToRemove.forEach((index) => {
      this.anims.splice(index, 1)
    })

    if (this.anims.length === 0) {
      cancelAnimationFrame(this.rafId!)
      this.running = false
      this.rafId = null
    }
  }
}

var pow = Math.pow,
  sqrt = Math.sqrt,
  sin = Math.sin,
  cos = Math.cos,
  PI = Math.PI,
  c1 = 1.70158,
  c2 = c1 * 1.525,
  c3 = c1 + 1,
  c4 = (2 * PI) / 3,
  c5 = (2 * PI) / 4.5

function bounceOut(x: number) {
  var n1 = 7.5625,
    d1 = 2.75
  if (x < 1 / d1) {
    return n1 * x * x
  } else if (x < 2 / d1) {
    return n1 * (x -= (1.5 / d1)) * x + .75
  } else if (x < 2.5 / d1) {
    return n1 * (x -= (2.25 / d1)) * x + .9375
  } else {
    return n1 * (x -= (2.625 / d1)) * x + .984375
  }
}



var animator = Animator.make()
animator.easingFns = {
  easeInQuad: function (x) {
    return x * x
  },
  easeOutQuad: function (x) {
    return 1 - (1 - x) * (1 - x)
  },
  easeInOutQuad: function (x) {
    return x < 0.5 ?
      2 * x * x :
      1 - pow(-2 * x + 2, 2) / 2
  },
  easeInCubic: function (x) {
    return x * x * x
  },
  easeOutCubic: function (x) {
    return 1 - pow(1 - x, 3)
  },
  easeInOutCubic: function (x) {
    return x < 0.5 ?
      4 * x * x * x :
      1 - pow(-2 * x + 2, 3) / 2
  },
  easeInQuart: function (x) {
    return x * x * x * x
  },
  easeOutQuart: function (x) {
    return 1 - pow(1 - x, 4)
  },
  easeInOutQuart: function (x) {
    return x < 0.5 ?
      8 * x * x * x * x :
      1 - pow(-2 * x + 2, 4) / 2
  },
  easeInQuint: function (x) {
    return x * x * x * x * x
  },
  easeOutQuint: function (x) {
    return 1 - pow(1 - x, 5)
  },
  easeInOutQuint: function (x) {
    return x < 0.5 ?
      16 * x * x * x * x * x :
      1 - pow(-2 * x + 2, 5) / 2
  },
  easeInSine: function (x) {
    return 1 - cos(x * PI / 2)
  },
  easeOutSine: function (x) {
    return sin(x * PI / 2)
  },
  easeInOutSine: function (x) {
    return -(cos(PI * x) - 1) / 2
  },
  easeInExpo: function (x) {
    return x === 0 ? 0 : pow(2, 10 * x - 10)
  },
  easeOutExpo: function (x) {
    return x === 1 ? 1 : 1 - pow(2, -10 * x)
  },
  easeInOutExpo: function (x) {
    return x === 0 ? 0 : x === 1 ? 1 : x < 0.5 ?
      pow(2, 20 * x - 10) / 2 :
      (2 - pow(2, -20 * x + 10)) / 2
  },
  easeInCirc: function (x) {
    return 1 - sqrt(1 - pow(x, 2))
  },
  easeOutCirc: function (x) {
    return sqrt(1 - pow(x - 1, 2))
  },
  easeInOutCirc: function (x) {
    return x < 0.5 ?
      (1 - sqrt(1 - pow(2 * x, 2))) / 2 :
      (sqrt(1 - pow(-2 * x + 2, 2)) + 1) / 2
  },
  easeInElastic: function (x) {
    return x === 0 ? 0 : x === 1 ? 1 :
      -pow(2, 10 * x - 10) * sin((x * 10 - 10.75) * c4)
  },
  easeOutElastic: function (x) {
    return x === 0 ? 0 : x === 1 ? 1 :
      pow(2, -10 * x) * sin((x * 10 - 0.75) * c4) + 1
  },
  easeInOutElastic: function (x) {
    return x === 0 ? 0 : x === 1 ? 1 : x < 0.5 ?
      -(pow(2, 20 * x - 10) * sin((20 * x - 11.125) * c5)) / 2 :
      pow(2, -20 * x + 10) * sin((20 * x - 11.125) * c5) / 2 + 1
  },
  easeInBack: function (x) {
    return c3 * x * x * x - c1 * x * x
  },
  easeOutBack: function (x) {
    return 1 + c3 * pow(x - 1, 3) + c1 * pow(x - 1, 2)
  },
  easeInOutBack: function (x) {
    return x < 0.5 ?
      (pow(2 * x, 2) * ((c2 + 1) * 2 * x - c2)) / 2 :
      (pow(2 * x - 2, 2) * ((c2 + 1) * (x * 2 - 2) + c2) + 2) / 2
  },
  easeInBounce: function (x) {
    return 1 - bounceOut(1 - x)
  },
  easeOutBounce: bounceOut,
  easeInOutBounce: function (x) {
    return x < 0.5 ?
      (1 - bounceOut(1 - 2 * x)) / 2 :
      (1 + bounceOut(2 * x - 1)) / 2
  }

}



//  ; (properties: PlainObject<...>, duration_easing: string | number, complete?: (this: HTMLElement) => void): JQuery<...>; (properties: PlainObject<...>, options: EffectsOptions<...>): JQuer...'.
// Types of parameters 'easing' and 'complete' are incompatible.
//   Type '(this: HTMLElement) => void' is not assignable to type 'string'.

// Usage example
cash.fn.animate = function (
  properties: Record<string, number>,
  easings: Record<string, string>,
  duration: number = 400,
  tick?: (this: HTMLElement, value: number) => void,
): Promise<void> {
  var el = this.get(0)
  const animator = Animator.make()
  return new Promise<void>((resolve, reject) => {
    animator.anim(el as HTMLElement, properties, easings, duration, tick, resolve)
  })
}

cash.fn.animateCss = function (animationName, callback): Promise<void> {
  return new Promise((resolve, reject) => {
    var animationEnd = 'webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend'
    let cash = this.addClass('animated ' + animationName)
    cash.on(animationEnd, () => {
      resolve()
      this.removeClass('animated ' + animationName)
      // window.setTimeout(() => {}, 0)
    })
  })
}

cash.fn.scrollTop = function (this: Cash, val: number): number {
  var el = this.get(0)!
  if (val === undefined) { return el.scrollTop }
  el.scrollTop = val
  return val
}

cash.fn.focus = function (this: Cash): Cash {
  var el = this.get(0)!
  el.focus()
  return this
}

cash.fn.stop = function (this: Cash, clearQueue: boolean, jumpToEnd: boolean): Cash {
  animator.animDel(this.get(0)!)
  return this
}

cash.fn.showIf = function (this: Cash, cond: boolean) {
  if (cond) this.show()
  else this.hide()
  return this
}

cash.fn.hideIf = function (this: Cash, cond: boolean) {
  if (cond) this.hide()
  else this.show()
  return this
}

cash.fn.contains = function (this: Cash, target: Cash): boolean {
  return this.get(0)!.contains(target.get(0)!)
}

/**
 * Scrolls a container div so that the bottom edge of an HTML element is on screen.
 * Only scrolls if the bottom edge is not already visible within the div.
 */
cash.fn.scrollToTargetBottom = function (this: Cash, target: Cash,): void {
  const sElem = this.get(0)!
  const tElem = target.get(0)!

  // Get the element's offsetTop relative to the container
  let elementTop = tElem.offsetTop - sElem.offsetTop
  const elementHeight = tElem.offsetHeight

  // Calculate the bottom position of the element within the container
  const elementBottom = elementTop + elementHeight

  // Calculate the scroll position needed to make the element's bottom visible
  const scrollTo = elementBottom - sElem.offsetHeight

  // Get the current scroll position within the container
  const currentScroll = sElem.scrollTop

  // Check if element's bottom is not visible within the container
  if (scrollTo > currentScroll || (elementBottom > (currentScroll + sElem.offsetHeight))) {
    sElem.scrollTo({
      top: scrollTo,
      behavior: 'auto',
    })
  }
}

cash.fn.scrollToTargetCenter = function (this: Cash, target: Cash): void {
  const sElem = this.get(0)!
  const tElem = target.get(0)!

  // Get the element's offsetTop relative to the container
  let elementTop = tElem.offsetTop - sElem.offsetTop
  const elementHeight = tElem.offsetHeight

  // Calculate the center position of the element within the container
  const elementCenter = elementTop + elementHeight / 2

  // Calculate the scroll position needed to center the element in the container
  const scrollTo = elementCenter - sElem.offsetHeight / 2

  // Get the current scroll position within the container
  const currentScroll = sElem.scrollTop

  // Only scroll if the element is not already centered (within a small threshold)
  if (Math.abs(currentScroll - scrollTo) > 1) {
    sElem.scrollTo({
      top: scrollTo,
      behavior: 'auto',
    })
  }
}

/**
 * Scrolls a container div so that the top edge of an HTML element is on screen.
 * Only scrolls if the top edge is not already visible within the div.
 */
cash.fn.scrollToTargetTop = function (this: Cash, target: Cash): void {
  const sElem = this.get(0)!
  const tElem = target.get(0)!

  // Get the element's offsetTop relative to the container
  let elementTop = tElem.offsetTop - sElem.offsetTop

  // Get the current scroll position within the container
  const currentScroll = sElem.scrollTop

  // Check if element's top is not visible within the container
  if (elementTop < currentScroll || (elementTop > (currentScroll + sElem.offsetHeight))) {
    // Scroll to make the element's top edge visible within the container
    sElem.scrollTo({
      top: elementTop,
      behavior: 'auto',
    })
  }
}
