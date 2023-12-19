//
import { getVersion, getId, getDeviceId, } from '~/hlp'

export default interface VolumeConfig {
  device: string
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
  device: getDeviceId(),
  id: getId(),
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

export { DEFAULT_VOLUME_CONFIG }

