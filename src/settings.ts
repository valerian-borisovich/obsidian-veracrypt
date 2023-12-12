//
import { VolumeConfig } from './volume'
//
import { getVersion, LangTypeAndAuto } from './hlp'

export interface VeraPluginSettings {
  deviceID: string

  pluginVersion: string
  pluginLoaded: string

  lang: LangTypeAndAuto

  logFilename: string
  logLevel: string
  verbose: string
  debug: string

  defaultMountPath: string
  defaultVolumefileExtention: string
  mountAtStart: boolean
  umountAtExit: boolean

  refreshInterval: number
  refreshTimeout: number

  savePassword: boolean

  vaultName: string
  vaultPath: string
  vaultConfig: string

  volumes: VolumeConfig[]
}

export const DEFAULT_SETTINGS: VeraPluginSettings = {
  deviceID: '',

  pluginVersion: getVersion(),
  pluginLoaded: '',

  lang: "auto",

  logFilename: 'vera.log',
  logLevel: '1',
  verbose: '1',
  debug: '',

  defaultVolumefileExtention: 'vera',
  defaultMountPath: '==vera==',
  mountAtStart: true,
  umountAtExit: true,

  refreshInterval: 5 * 1000,
  refreshTimeout: 7 * 1000,

  savePassword: true,

  vaultName: 'vera',
  vaultPath: '/pub/==vaults==/vera',
  vaultConfig: '.obsidian',

  volumes: [],
}
