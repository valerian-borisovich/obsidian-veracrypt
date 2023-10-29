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

    cmd = `echo "${SUDO_PASSWORD}" | sudo -S ln -s /tmp ./t`

    this.volume.mountTime = Date.now().toString()
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

  async _umount() {
    let SUDO_PASSWORD = this.plugin.settings.sudoPassword
    let VOLUME_FILE = this.getAbsolutePath(this.volume.filename)
    let VOLUME_MOUNTPATH = this.getAbsolutePath(this.volume.mountPath)
    let cmd = `echo "${SUDO_PASSWORD}" | sudo -S veracrypt -t -d "${VOLUME_FILE}" --non-interactive --force`
    console.log(cmd)
    execute(cmd)

    /*
    cmd = `echo "${SUDO_PASSWORD}" | sudo -S veracrypt -t -d "${VOLUME_MOUNTPATH}" --non-interactive --force`
    console.log(cmd)
    execute(cmd)
     */

    const adapter = this.app.vault.adapter

    for (let i = 0; i <= 10; i++) {
      // @ts-ignore
      const existingFileNames = new Set(await adapter.fsPromises.readdir(`${VOLUME_MOUNTPATH}`))

      console.log('existingFileNames.size ' + existingFileNames.size.toString())

      if (existingFileNames.size === 0) {
        cmd = `echo "${SUDO_PASSWORD}" | sudo -S rm -rf "${VOLUME_MOUNTPATH}"`
        console.log(cmd)
        execute(cmd)
        // await this.app.vault.adapter.rmdir(this.volume.mountPath, false)
        break
      } else {
        console.log(`Can't delete "${VOLUME_MOUNTPATH}", is not empty! ${i}`)
        await sleep(333)
      }
    }
    this.volume.umountTime = Date.now().toString()
  }

  isMounted() {
    let r = false

    this.plugin.volumesList().forEach((v) => {
      if (this.volume.mountPath === v['mount']) {
        r = true
      }
    })

    return r
  }
}
