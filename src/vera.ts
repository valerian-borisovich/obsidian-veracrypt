//
import { VeraPluginSettings } from './settings'
import { VeraStorage } from './veraStorage'
import { debug } from './hlp'

interface VeraSettings extends VeraPluginSettings {}

interface IVera {
  getPassword(id: string): string
  setPassword(id: string, password: string): string
}

class Vera {
  settings!: VeraSettings
  storage!: VeraStorage

  constructor(props: any) {
    // super(props);
    debug('Loading vera')
    this.settings = props
    this.storage = new VeraStorage()
  }

  async getPassword(id: string) {
    return await this.storage.get(id)
  }
  async setPassword(id: string, password: string) {
    return await this.storage.set(id, password)
  }
}

export { Vera, VeraSettings }
