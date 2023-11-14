//
import { VeraPluginSettings } from './settings'
import { VeraStorage } from './veraStorage'
import { dbg } from './hlp'

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
    dbg('Loading vera')
    this.settings = props
    this.storage = new VeraStorage()
  }

  async getPassword(id: string) {
    let result: string = ''
    result = await this.storage.get(id)
    return result
  }
  async setPassword(id: string, password: string) {
    return await this.storage.set(id, password)
  }
}

export { Vera, VeraSettings }
