//
import { v4 } from 'uuid'
import { App, PluginManifest, normalizePath, TFile, TFolder } from 'obsidian'

import VeraPlugin from './main'
import { execute } from './execute'

export interface VolumeSettings {
  id?: string

  enabled: boolean
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
  fs: string
  encryption: string
  hash: string
}

export const DEFAULT_VOLUME_SETTINGS: VolumeSettings = {
  id: v4(),

  enabled: false,
  mounted: false,

  mountAtStart: true,
  umountAtExit: true,

  createdTime: '',
  mountTime: '',
  umountTime: '',

  mountPath: '',
  filename: 'newVolume.vera',

  password: '',
  keyfile: '',

  size: '3M',
  fs: 'exFAT',
  encryption: 'AES',
  hash: 'SHA-512',
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

  async name() {
    return this.volume.filename.substring(
      this.volume.filename.lastIndexOf('/') ? 0 : this.volume.filename.lastIndexOf('/'),
      this.volume.filename.lastIndexOf('.'),
    )
  }

  async exists() {
    let volume = this.volume
    return await this.app.vault.adapter.exists(volume.filename)
  }

  async create() {
    let SUDO_PASSWORD = this.plugin.settings.sudoPassword
    let VOLUME_PASSWORD = this.volume.password
    let VOLUME_KEYFILE = ''
    let VOLUME_FILE = this.getAbsolutePath(this.volume.filename)
    let VOLUME_MOUNTPATH = this.getAbsolutePath(this.volume.mountPath)
    let VOLUME_HASH = this.volume.hash
    let VOLUME_ENC = this.volume.encryption
    let VOLUME_FS = this.volume.fs
    let VOLUME_SIZE = this.volume.size

    let cmd = `echo "${SUDO_PASSWORD}" | sudo -S veracrypt --text --create "${VOLUME_FILE}" --volume-type=normal --pim=0 -k "${VOLUME_KEYFILE}" --quick --encryption="${VOLUME_ENC}" --hash="${VOLUME_HASH}" --filesystem="${VOLUME_FS}" --size="${VOLUME_SIZE}" --password="${VOLUME_PASSWORD}" --random-source=/dev/urandom`
    console.log(cmd)
    let o = execute(cmd)

    this.volume.createdTime = Date.now().toString()
  }

  async delete() {
    console.log('volume.delete: ' + this.volume.filename)
    this.plugin.settings.volumes.remove(this.volume)
    await this.plugin.saveSettings()
    await this.umount()
    await this.app.vault.adapter.remove(this.volume.filename)
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
    let cmd = `echo "${SUDO_PASSWORD}" | sudo -S veracrypt -t --non-interactive --force --password="${VOLUME_PASSWORD}" --protect-hidden=no --pim=0 --keyfiles="${VOLUME_KEYFILE}" "${VOLUME_FILE}" "${VOLUME_MOUNTPATH}"`

    console.log(cmd)
    let r = execute(cmd)
    console.log(r)

    this.volume.mountTime = Date.now().toString()
  }

  async _umount() {
    let SUDO_PASSWORD = this.plugin.settings.sudoPassword
    let VOLUME_FILE = this.getAbsolutePath(this.volume.filename)
    let VOLUME_MOUNTPATH = this.getAbsolutePath(this.volume.mountPath)
    let cmd = `echo "${SUDO_PASSWORD}" | sudo -S veracrypt -t -d "${VOLUME_FILE}" --non-interactive --force`
    console.log(cmd)
    execute(cmd)
    let r = execute(cmd)
    console.log(r)

    /*
    cmd = `echo "${SUDO_PASSWORD}" | sudo -S veracrypt -t -d "${VOLUME_MOUNTPATH}" --non-interactive --force`
    console.log(cmd)
    execute(cmd)
     */

    cmd = `echo "${SUDO_PASSWORD}" | sudo -S rm -rf "${VOLUME_MOUNTPATH}"`
    console.log(cmd)
    r = execute(cmd)
    console.log(r)
    this.volume.umountTime = Date.now().toString()
  }
}
