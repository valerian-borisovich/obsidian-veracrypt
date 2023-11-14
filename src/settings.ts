import { getVersion } from './hlp'
import { VolumeConfig } from './volume'

export interface VeraPluginSettings {
  devID: string

  pluginVersion: string
  pluginLoaded: boolean
  pluginDebug: boolean
  logFilename: string

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
  pluginDebug: false,

  logFilename: 'vera.log',

  defaultMountPath: '==vera==',
  defaultVolumefileExtention: 'vera',

  mountAtStart: true,
  umountAtExit: true,

  savePassword: true,

  vaultName: 'vera',
  vaultPath: '/pub/==vaults==/vera',
  vaultConfig: '.obsidian',

  volumes: [],
}
