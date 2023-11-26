//
import { VolumeConfig } from './volume'
//
import { getVersion } from './hlp'
import { LangTypeAndAuto } from './hlp/i18n'

export interface VeraPluginSettings {
  devID: string

  pluginVersion: string
  pluginLoaded: boolean

  lang: LangTypeAndAuto

  logFilename: string
  logLevel: string
  verbose: string
  debug: string

  defaultMountPath: string
  defaultVolumefileExtention: string
  mountAtStart: boolean
  umountAtExit: boolean

  savePassword: boolean

  vaultName: string
  vaultPath: string
  vaultConfig: string

  volumes: VolumeConfig[]
}

export const DEFAULT_SETTINGS: VeraPluginSettings = {
  devID: '',

  pluginVersion: getVersion(),
  pluginLoaded: false,

  lang: "auto",

  logFilename: 'vera.log',
  logLevel: '1',
  verbose: '1',
  debug: '',

  defaultVolumefileExtention: 'vera',
  defaultMountPath: '==vera==',
  mountAtStart: true,
  umountAtExit: true,

  savePassword: true,

  vaultName: 'vera',
  vaultPath: '/pub/==vaults==/vera',
  vaultConfig: '.obsidian',

  volumes: [],
}
