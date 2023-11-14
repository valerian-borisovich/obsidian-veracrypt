//
//
import { App, PluginManifest, normalizePath, TFile, TFolder } from 'obsidian'
import { getVersion, ps, v4, log, dbg, err } from './hlp'
import VeraPlugin from './main'

import { ADMIN_PASSWORD } from './constant'

export interface VolumeConfig {
  id: string
  version: string

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

  filesystem: string
  encryption: string
  hash: string
}

export const DEFAULT_VOLUME_CONFIG: VolumeConfig = {
  id: v4(),
  version: getVersion(),

  enabled: false,
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

export class Volume {
  app!: App
  plugin!: VeraPlugin
  manifest!: PluginManifest
  volume!: VolumeConfig

  constructor(plugin: VeraPlugin, volume: VolumeConfig) {
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
      log(`The folder cannot be created because it already exists as a file: ${folderpath}.`)
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
    let SUDO_PASSWORD = await this.plugin.getPassword(ADMIN_PASSWORD)
    // let VOLUME_PASSWORD = this.volume.password
    let VOLUME_PASSWORD = await this.plugin.getPassword(this.volume.id)
    let VOLUME_KEYFILE = ''
    let VOLUME_FILE = this.getAbsolutePath(this.volume.filename)
    // let VOLUME_MOUNTPATH = this.getAbsolutePath(this.volume.mountPath)
    let VOLUME_HASH = this.volume.hash
    let VOLUME_ENC = this.volume.encryption
    let VOLUME_FS = this.volume.filesystem
    let VOLUME_SIZE = this.volume.size

    let cmd = `echo "${SUDO_PASSWORD}" | sudo -S veracrypt --text --create "${VOLUME_FILE}" --volume-type=normal --pim=0 -k "${VOLUME_KEYFILE}" --quick --encryption="${VOLUME_ENC}" --hash="${VOLUME_HASH}" --filesystem="${VOLUME_FS}" --size="${VOLUME_SIZE}" --password="${VOLUME_PASSWORD}" --random-source=/dev/urandom`
    log(cmd)
    let o = ps(cmd)

    this.volume.createdTime = Date.now().toString()
  }

  async delete() {
    log('volume.delete: ' + this.volume.filename)
    await this.umount()
    if (this.isMounted()) {
      await this.app.vault.adapter.remove(this.volume.filename)
      this.plugin.settings.volumes.remove(this.volume)
      await this.plugin.saveSettings()
    }
  }

  async mount() {
    dbg('volume.mount: ' + this.volume.filename.toString() + ' to: ' + this.volume.mountPath.toString())
    await this._mount()
    this.volume.mounted = true
    this.volume.mountTime = Date.now().toString()
    await this.plugin.saveSettings()
  }

  async _mount() {
    await this.checkFolder()

    let SUDO_PASSWORD = await this.plugin.getPassword(ADMIN_PASSWORD)
    // let VOLUME_PASSWORD = this.volume.password
    let VOLUME_PASSWORD = await this.plugin.getPassword(this.volume.id)
    let VOLUME_KEYFILE = ''
    let VOLUME_FILE = this.getAbsolutePath(this.volume.filename)
    let VOLUME_MOUNTPATH = this.getAbsolutePath(this.volume.mountPath)
    let cmd = `echo "${SUDO_PASSWORD}" | sudo -S veracrypt -t --non-interactive --force --password="${VOLUME_PASSWORD}" --protect-hidden=no --pim=0 --keyfiles="${VOLUME_KEYFILE}" "${VOLUME_FILE}" "${VOLUME_MOUNTPATH}"`
    //dbg(cmd)
    ps(cmd)
    this.volume.mountTime = Date.now().toString()
  }

  async umount() {
    dbg('volume.umount: ' + this.volume.filename.toString() + ' from: ' + this.volume.mountPath.toString())
    await this._umount()
    let l = await this.app.vault.adapter.list(this.volume.mountPath)
    if (l.files.length + l.files.length <= 0) {
      //log('volume.umount.rmdir: ' + this.volume.mountPath.toString())
      //await this.app.vault.adapter.rmdir(this.volume.mountPath, true)
    }
    this.volume.mounted = false
    await this.plugin.saveSettings()
  }

  async _umount() {
    let SUDO_PASSWORD = await this.plugin.getPassword(ADMIN_PASSWORD)
    let VOLUME_FILE = this.getAbsolutePath(this.volume.filename)
    let VOLUME_MOUNTPATH = this.getAbsolutePath(this.volume.mountPath)
    let cmd = `echo "${SUDO_PASSWORD}" | sudo -S veracrypt -t -d "${VOLUME_FILE}" --non-interactive --force`
    dbg(cmd)
    ps(cmd)

    /*
    cmd = `echo "${SUDO_PASSWORD}" | sudo -S veracrypt -t -d "${VOLUME_MOUNTPATH}" --non-interactive --force`
    console.log(cmd)
    execute(cmd)
     */

    const adapter = this.app.vault.adapter

    for (let i = 0; i <= 10; i++) {
      // @ts-ignore
      const existingFileNames = new Set(await adapter.fsPromises.readdir(`${VOLUME_MOUNTPATH}`))

      dbg('existingFileNames.size ' + existingFileNames.size.toString())

      if (existingFileNames.size === 0) {
        cmd = `echo "${SUDO_PASSWORD}" | sudo -S rm -rf "${VOLUME_MOUNTPATH}"`
        cmd = `echo "${SUDO_PASSWORD}" | sudo -S rm "${VOLUME_MOUNTPATH}"`
        dbg(cmd)
        ps(cmd)
        this.volume.umountTime = Date.now().toString()
        return
      } else {
        log(`"${VOLUME_MOUNTPATH}" is not empty! ${i}`)
        await sleep(333)
      }
    }
    err(`"${VOLUME_MOUNTPATH}" is not empty! Can't remove folder!`)
  }

  isMounted() {
    const volumes = this.plugin.volumesList()
    dbg('isMounted.volumes: ' + volumes.toString())
    volumes.forEach((v) => {
      dbg('isMounted: ' + v['mount'])
      dbg('isMounted: ' + v)
      // console.log('isMounted: ' + v['mount'])
      if (this.volume.mountPath === v['mount']) {
        return true
      }
    })
    return false
  }
}
