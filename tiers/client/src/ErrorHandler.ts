export { }

// install global error handlers
var handleError = async (error: any) => {
  if (window.app) {
    // rate limiting
    if (error && error.data && error.data.code == 'too.many.requests') {
      window.app.alert(
        '<div class="h1">Request Rate Limited</div><div class=\'body\'>Are you a robot?</div>',
        'OK'
      )
      return true
    }

    // handle auth.token errors
    if (error && error.code == 'invalid.auth.token') {
      window.app.alert(
        `<div class="h1">Invalid Auth Tokens</div><div class='body'>Your authentication tokens are no longer valid.<br/><br/>
                        You may continue, but you must authenticate again to place an order.</div>`,
        'OK'
      )
        .then(() => {
          window.app.stor.clear()
          window.location.reload()
        })
      return true
    }

    // handle network exceptions.
    if (error.message == 'Network Error') {
      window.app.alert(
        '<div class="h1">Network Error</div><div class=\'body\'>The network seems to be temporarily unavailable.</div>',
        'OK'
      )
      return true
    }
  }

  return false
}

window.handleError = handleError

window.onerror = async (...args): Promise<void> => {
  var error = args.length ? args[0] : undefined
  if (error && await handleError(error)) return
  try {
    window.errorScreenPlay(error)
  } catch (err) {
    alert('Error while playing error screen. See console for root cause.')
    console.log(err)
  }
}

window.addEventListener('unhandledrejection', async function (event) {
  var error = event.reason
  if (error && !!window.app && await handleError(error)) {
    event.preventDefault()
    event.stopPropagation()
    event.cancelBubble = true
    return
  }
  try {
    window.errorScreenPlay(error)
  } catch (err) {
    alert('Error while playing error screen. See console for root cause.')
    console.log(err)
  }
})

