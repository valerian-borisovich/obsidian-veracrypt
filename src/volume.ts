//
import { v4 } from 'uuid'
import { exec as exec } from 'child_process'
import { App, PluginManifest } from 'obsidian'

import VeraPlugin from './main'

export interface VolumeSettings {
  id?: string

  enabled: boolean
  mounted: boolean

  mountAtStart: boolean
  umountAtExit: boolean
  mountTime?: string
  umountTime?: string

  mountPath: string
  filename: string

  password: string
  keyfile: string

  size: string
  fs: string
  encryption: string
  hash: string
}

export const DEFAULT_VOLUME_SETTINGS: VolumeSettings = {
  id: v4(),

  enabled: true,
  mounted: false,

  mountAtStart: true,
  umountAtExit: true,
  mountTime: '',
  umountTime: '',

  mountPath: '',
  filename: '',

  password: '',
  keyfile: '',

  size: '44M',
  fs: 'ext4',
  encryption: 'aes',
  hash: 'sha-512',
}

export type ConnectionStatus = 'connected' | 'disconnected'
export type PluginStatus = 'unloading' | 'unloaded' | 'loading' | 'loaded'

export class Volume {
  app?: App
  plugin?: VeraPlugin
  manifest?: PluginManifest
  volume?: VolumeSettings

  constructor(plugin: VeraPlugin, volume: VolumeSettings) {
    this.plugin = plugin
    this.app = this.plugin.app
    this.manifest = this.plugin.manifest
    this.volume = volume
  }

  getAbsolutePath(path: String) {
    let root = (this.app.vault.adapter as any).basePath
    return root + '/' + path
  }

  async checkFolder(create: Boolean = true) {
    console.log('volume.checkFolder: ' + this.volume.mountPath.toString())
    if (!(await this.app.vault.adapter.exists(this.volume.mountPath))) {
      if (create) {
        console.log('volume.checkFolder.createFolder: ' + this.volume.mountPath.toString())
        await this.app.vault.createFolder(this.volume.mountPath)
      }
    }
  }

  async exists() {
    let volume = this.volume
    return await this.app.vault.adapter.exists(volume.filename)
  }

  async mount() {
    console.log('volume.mount: ' + this.volume.filename.toString() + ' to: ' + this.volume.mountPath.toString())
    await this._mount()
    this.volume.mounted = true
    await this.plugin.saveSettings()
  }

  async umount() {
    console.log('volume.umount: ' + this.volume.filename.toString() + ' from: ' + this.volume.mountPath.toString())
    await this._umount()
    let l = await this.app.vault.adapter.list(this.volume.mountPath)
    if (l.files.length + l.files.length <= 0) {
      console.log('volume.umount.rmdir: ' + this.volume.mountPath.toString())
      await this.app.vault.adapter.rmdir(this.volume.mountPath, true)
      this.volume.mounted = false
      await this.plugin.saveSettings()
    }
  }

  async _mount() {
    await this.checkFolder()

    let SUDO_PASSWORD = this.plugin.settings.sudoPassword
    let VOLUME_PASSWORD = this.volume.password
    let VOLUME_KEYFILE = ''
    let VOLUME_FILE = this.getAbsolutePath(this.volume.filename)
    let VOLUME_MOUNTPATH = this.getAbsolutePath(this.volume.mountPath)
    let cmd = `echo "${SUDO_PASSWORD}" | sudo -S veracrypt --text --password="${VOLUME_PASSWORD}" --protect-hidden=no --pim=0 --keyfiles="${VOLUME_KEYFILE}" "${VOLUME_FILE}" "${VOLUME_MOUNTPATH}"`

    console.log(cmd)
    exec(cmd)
  }

  async _umount() {
    let SUDO_PASSWORD = this.plugin.settings.sudoPassword
    let VOLUME_FILE = this.getAbsolutePath(this.volume.filename)
    let VOLUME_MOUNTPATH = this.getAbsolutePath(this.volume.mountPath)
    let cmd = `echo "${SUDO_PASSWORD}" | sudo -S veracrypt -t -d "${VOLUME_FILE}" --non-interactive --force`

    console.log(cmd)
    exec(cmd)
    cmd = `echo "${SUDO_PASSWORD}" | sudo -S veracrypt -t -d "${VOLUME_MOUNTPATH}" --non-interactive --force`
    console.log(cmd)
    exec(cmd)
  }
}
