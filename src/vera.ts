//
import { ObsidianVeracryptSettings } from './settings'
import { VeraStorage } from './veraStorage'

interface VeraSettings extends ObsidianVeracryptSettings {}

interface IVera {
  getPassword(id: string): string
  setPassword(id: string, password: string): string
}

class Vera {
  settings!: VeraSettings
  storage!: VeraStorage

  constructor(props: any) {
    console.debug('Loading vera')
    // super(props);
    this.settings = props
  }

  async getPassword(id: string) {
    return await this.storage.get(id)
  }
  async setPassword(id: string, password: string) {
    return await this.storage.set(id, password)
  }
}

export { Vera, VeraSettings }
