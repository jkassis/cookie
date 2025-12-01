// Copyright © 2018 by Jeremy Kassis. All Rights Reserved.
import { AlertResponse } from './AlertPopup.js'
import { Screen } from './Screen.js'
import { Reroute } from './Router.js'

export abstract class CRUDScreen<T> extends Screen {
  public playingSave: boolean = false

  public async saveChangesDialogPlay(): Promise<Reroute | undefined> {
    var response = await this.app.alert(
      '<div class="h1">Save Changes</div><div class="body">Do you want to save changes first?</div>',
      'Save',
      'Skip'
    )
    if (response == AlertResponse.Default) {
      try {
        await this.saveSafe()
      } catch (err: any) {
        if (err && err.code == 'cancel') return { action: 'abort' }
        else throw err
      }
    }

    return
  }

  public async saveSafe() {
    var isValid = await this.isValid()
    if (this.playingSave || !isValid) throw { code: 'cancel' }

    try {
      this.playingSave = true
      this.app.scrimPlay()
      await this.docSave()
    } finally {
      this.app.scrimStop()
      this.playingSave = false
    }
  }

  public abstract docSave(): Promise<void>
  public abstract isSaved(): boolean
  public abstract isValid(): Promise<boolean>
}
