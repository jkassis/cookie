
import { Cash } from 'cash-dom'


/**
 * Scrolls the window so that the bottom edge of an HTML element is on screen.
 * Only scrolls if the bottom edge is not already visible.
 */
function windowScrollToElementBottom(dob: Cash): void {
  const element = dob.get(0)!

  // Get the element's offset top and its height
  const elementTop = element.offsetTop
  const elementHeight = element.offsetHeight

  // Calculate the bottom position of the element
  const elementBottom = elementTop + elementHeight

  // Calculate how far to scroll
  // Note: window.innerHeight gives the viewport height
  const scrollTo = elementBottom - window.innerHeight

  // Get the current scroll position
  const currentScroll = window.pageYOffset

  // Check if element's bottom is not visible
  if (scrollTo > currentScroll || (elementBottom > (currentScroll + window.innerHeight))) {
    window.scrollTo({
      top: scrollTo,
      behavior: 'smooth',
    })
  }
}

/**
 * Scrolls the window so that the top edge of an HTML element is on screen.
 * Only scrolls if the top edge is not already visible.
 */
function windowScrollToElementTop(dob: Cash): void {
  const element = dob.get(0)!

  // Get the element's offset top
  const elementTop = element.offsetTop

  // Get the current scroll position
  const currentScroll = window.pageYOffset

  // Check if element's top is not visible
  if (elementTop < currentScroll || (elementTop > (currentScroll + window.innerHeight))) {
    // Scroll to the element's top edge
    window.scrollTo({
      top: elementTop,
      behavior: 'smooth',
    })
  }
}
