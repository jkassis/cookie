import type { Auth0Lock as Auth0LockType } from 'auth0-lock'
declare global {
  var Auth0Lock: typeof Auth0LockType
}

// Auth: see https://auth0.com/docs/libraries/lock
export class Auth {
  accessToken?: string
  lock: typeof Auth0Lock
  onAuth: () => void
  profile?: auth0.Auth0UserProfile

  constructor(clientID: string, domainID: string, onAuth: () => void) {
    this.onAuth = onAuth
    this.lock = new Auth0Lock(clientID, domainID)
    this.lock.on("authenticated", (authResult) => {
      // Use the token in authResult to getUserInfo() and save it if necessary
      this.lock.getUserInfo(authResult.accessToken, (error, profile) => {
        if (error) {
          alert(error)
          // Handle error
          throw error
        }

        //we recommend not storing Access Tokens unless absolutely necessary
        this.accessToken = authResult.accessToken
        this.profile = profile

        this.onAuth()
      })
    })
  }

  play() {
    this.lock.show()
  }
}
