//
import { DEFAULT_SETTINGS, ObsidianVeracryptSettings } from './settings'
import localforage from 'localforage'

/*
localforage.config({
  driver: localforage.WEBSQL, // Force WebSQL; same as using setDriver()
  name: 'vera',  version: 1.0,
  size: 4980736, // Size of database, in bytes. WebSQL-only for now.
  storeName: 'vera',  description: '',
})
 */

export class VeraSettings {
  settings?: ObsidianVeracryptSettings
  stor?: LocalForage
  volumes?: LocalForage

  constructor(settings: ObsidianVeracryptSettings = DEFAULT_SETTINGS) {
    this.settings = settings
    this.stor = localforage.createInstance({ name: 'stor' })
    this.volumes = localforage.createInstance({ name: 'volumes' })
  }

  async get(name: string) {}
}
