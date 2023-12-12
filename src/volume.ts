//
//
//import { App, PluginManifest, normalizePath, TFile, TFolder } from 'obsidian'
//import { getVersion, ps, v4, log, dbg, err } from './hlp'
import { getVersion, v4, log, dbg, err } from './hlp'

//import VeraPlugin from './veraPlugin'
// import { ADMIN_PASSWORD } from './constant'

interface VolumeConfig {
  id: string
  version: string

  enabled: boolean
  readonly: boolean
  mounted: boolean

  mountAtStart: boolean
  umountAtExit: boolean

  createdTime?: string
  mountTime?: string
  umountTime?: string

  mountPath: string
  filename: string

  password: string
  keyfile: string

  size: string

  filesystem: string
  encryption: string
  hash: string
}

const DEFAULT_VOLUME_CONFIG: VolumeConfig = {
  id: v4(),
  version: getVersion(),

  enabled: false,
  readonly: false,
  mounted: false,

  mountAtStart: true,
  umountAtExit: true,

  createdTime: '',
  mountTime: '',
  umountTime: '',

  mountPath: '',
  filename: 'volume.vera',

  password: '',
  keyfile: '',

  size: '3M',
  filesystem: 'exFAT',
  encryption: 'AES',
  hash: 'SHA-512',
}

//
//
//
// export { Volume, VolumeConfig, DEFAULT_VOLUME_CONFIG }
export { DEFAULT_VOLUME_CONFIG }
export type { VolumeConfig }

