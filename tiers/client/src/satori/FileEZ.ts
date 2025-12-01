declare global {
  interface Window {
    showSaveFilePicker?: (options: any) => Promise<FileSystemFileHandle>
    showOpenFilePicker?: (options: any) => Promise<FileSystemFileHandle[]>
  }
  interface FileSystemFileHandle {
    createWritable: (options?: FileSystemCreateWritableOptions) => Promise<FileSystemWritableFileStream>
  }
}

export class FileEZ {
  handle?: FileSystemFileHandle

  async PromptSave(suggestedName: string, description: string, accept: any) {
    if (!window.showSaveFilePicker) throw new Error("window does not support file saving")
    try {
      this.handle = await window.showSaveFilePicker({
        suggestedName,
        types: [{
          description,
          accept,
        }],
      })
    } catch (err: any) {
      console.error('Error getting the file handle:', err.message)
      return null
    }
  }

  async PromptOpen(description: string, accept: any) {
    if (!window.showOpenFilePicker) throw new Error("window does not support file opening")
    try {
      const [handle] = await window.showOpenFilePicker({
        multiple: false,
        types: [{
          description,
          accept,
        }],
      })
      this.handle = handle
    } catch (err: any) {
      console.error('Error getting the file handle:', err.message)
      return null
    }
  }

  OK(): boolean {
    return this.handle != null
  }

  Clear() {
    delete this.handle
  }

  // SaveText save a file to a file handle.
  async SaveText(content: string): Promise<void> {
    if (!this.handle) throw new Error("no active file")
    try {
      const writable = await this.handle.createWritable()
      const writer = writable.getWriter()
      await writer.write(content)
      await writer.close()
      // await writable.close()
    } catch (err: any) {
      console.error('Error saving the file:', err.message)
    }
  }

  async ReadText(): Promise<string> {
    if (!this.handle) throw new Error("no active file")
    try {
      const file = await this.handle.getFile()
      var contents = await file.text()
      return contents // Return the file content
    } catch (error) {
      console.error('Error reading file:', error)
      throw new Error('Failed to read file')
    }
  }

  FileInputReadText(): Promise<string> {
    return new Promise((resolve, reject) => {
      const fileInput: HTMLInputElement = document.createElement('input')
      fileInput.type = 'file'
      fileInput.accept = 'text/plain' // Restrict to text files

      fileInput.addEventListener('change', (event: Event) => {
        const target = event.target as HTMLInputElement
        const file: File | null = target.files ? target.files[0] : null

        if (!file) {
          reject(new Error("No file selected"))
          return
        }

        const reader: FileReader = new FileReader()

        reader.onload = (event: ProgressEvent<FileReader>) => {
          if (event.target?.result) {
            resolve(event.target.result as string)
          } else {
            reject(new Error("Failed to read file"))
          }
        }

        reader.onerror = () => {
          reject(new Error(`File could not be read: ${reader.error?.message}`))
        }

        reader.readAsText(file)
      }, false)

      fileInput.click()
    })
  }

  MarkLinkSaveBlob(filename: string, content: Blob) {
    console.warn('this will not work if event listeners attached to the body element call event.preventDefault()')
    const url: string = URL.createObjectURL(content)
    const element: HTMLAnchorElement = document.createElement('a')
    element.href = url
    element.download = filename
    document.body.appendChild(element) // Required for Firefox
    element.click()
    document.body.removeChild(element)
    URL.revokeObjectURL(url)
  }

  MarkLinkSaveText(filename: string, content: string) {
    console.warn('this will not work if event listeners attached to the body element call event.preventDefault()')
    const element: HTMLAnchorElement = document.createElement('a')
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content))
    element.setAttribute('download', filename)

    element.style.display = 'none'
    document.body.appendChild(element)

    element.click()

    document.body.removeChild(element)
  }
}
