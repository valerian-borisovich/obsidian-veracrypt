//
import { v4 } from 'uuid'
import { exec as exec } from 'child_process'
import { App, PluginManifest, normalizePath, TFile, TFolder } from 'obsidian'

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

/**
 * Splits a full path including a folderpath and a filename into separate folderpath and filename components
 * @param filepath
 */
export function splitFolderAndFilename(filepath: string): {
  folderpath: string
  filename: string
  basename: string
} {
  const lastIndex = filepath.lastIndexOf('/')
  const filename = lastIndex == -1 ? filepath : filepath.substring(lastIndex + 1)
  return {
    folderpath: normalizePath(filepath.substring(0, lastIndex)),
    filename,
    basename: filename.replace(/\.[^/.]+$/, ''),
  }
}

/**
 * Download data as file from Obsidian, to store on local device
 * @param encoding
 * @param data
 * @param filename
 */
export const download = (encoding: string, data: any, filename: string) => {
  const element = document.createElement('a')
  element.setAttribute('href', (encoding ? `${encoding},` : '') + data)
  element.setAttribute('download', filename)
  element.style.display = 'none'
  document.body.appendChild(element)
  element.click()
  document.body.removeChild(element)
}

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
    let folderpath = normalizePath(this.volume.mountPath)
    console.log('volume.checkFolder: ' + folderpath.toString())

    //@ts-ignore
    const folder = this.app.vault.getAbstractFileByPathInsensitive(folderpath)
    if (folder && folder instanceof TFolder) {
      return
    }
    if (folder && folder instanceof TFile) {
      console.log(`The folder cannot be created because it already exists as a file: ${folderpath}.`)
    }

    // if (!(await this.app.vault.adapter.exists(folderpath))) {
    if (create) {
      console.log('volume.checkFolder.createFolder: ' + folderpath.toString())
      await this.app.vault.createFolder(folderpath)
    }
    // }
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
