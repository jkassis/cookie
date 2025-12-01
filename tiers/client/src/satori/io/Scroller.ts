import { Cash } from 'cash-dom'

export class Scroller {
  public static scrollToPlaying: boolean = false

  public static scrollToPlay(scrollingElement: Cash, fieldDob: Cash): void {
    if (Scroller.scrollToPlaying) return

    Scroller.scrollToPlaying = true

    // wait for hidden fields to render before doing the scroll
    setTimeout(() => {
      // var scrollTop = scrollingElement.scrollTop()
      let offset = fieldDob.offset()
      if (offset === undefined) return
      var topOfDob = offset.top
      // var bottomOfDob = topOfDob + parseInt(this.ioError.css(''))
      // var bottomOfDob = topOfDob
      var scrollTopTarget = topOfDob - (window.innerHeight / 2)
      // if (scrollTop + window.innerHeight < scrollTopTarget || scrollTop > scrollTopTarget) {
      scrollingElement
        .animate(
          { scrollTop: scrollTopTarget },
          { scrollTop: 'easeInOutQuad' },
          400,
          () => { Scroller.scrollToPlaying = false })
      // } else {
      //   Scroller.scrollToPlaying = false
      // }
    }, 10)
  }
}
