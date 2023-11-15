//
//
import { App, PluginManifest, normalizePath, TFile, TFolder } from 'obsidian'
import { ps, log, err, dbg, warn } from './hlp'
import VeraPlugin from './main'
import { VolumeConfig } from './volume'
import { ADMIN_PASSWORD } from './constant'

export class VolumesManager {
  app!: App
  plugin!: VeraPlugin

  // volumes: [] = []

  constructor(plugin: VeraPlugin) {
    this.plugin = plugin
    this.app = this.plugin.app
  }

  /*
   *
   */

  async mountAll(): Promise<void> {
    log('volumesManager.mountAll')
    this.plugin.settings.volumes.forEach((volume) => {
      if (volume.enabled) {
        if (!this.isMounted(volume)) {
          this.mount(volume)
          //this.refreshFolder(v.volume.mountPath)
        } else {
          warn(`volumesManager.mountAll: ${volume.mountPath} already mounted!`)
        }
      }
    })
  }

  async umountAll(): Promise<void> {
    dbg('volumesManager.umountAll')

    this.plugin.settings.volumes.forEach((volume) => {
      if (this.isMounted(volume)) {
        this.umount(volume)
        // this.refreshFolder(v.volume.mountPath)
      } else {
        warn(`volumesManager.umountAll: ${volume.mountPath} not mounted!`)
      }
    })
  }

  async listRefresh() {
    let a, v
    let l: [] = []
    let nomounted = 'Error: No volumes mounted.'
    let result: string = ''
    // let cmd = `echo "${SUDO_PASSWORD}" | sudo -S veracrypt -t -l --non-interactive --force`
    const spawn = require('child_process').spawnSync

    try {
      // r = spawn('veracrypt', ['-t', '-l', '--non-interactive', '--force']).stdout.toString('utf8')
      result = spawn('veracrypt', ['-t', '-l', '--non-interactive', '--force']).toString('utf8')
      dbg(`listRefresh.spawn: ${result}`)

      result.split('\n').forEach((v: string) => {
        if (v.length) {
          a = v.split(' ')
          // @ts-ignore
          l.push({ filename: a[1], mount: a[3] })
        }
      })

      process.on('exit', function () {
        // dbg(`listRefresh.on.exit: ${l.toString()}`)
        dbg(`listRefresh.on.exit: ${l}`)
        return l
      })
    } catch (e) {
      err(`listRefresh.err: ${e}`)
    }
    return l
  }

  /*
   *
   */

  async create(volume: VolumeConfig) {
    log(`volumeManager.create: ${volume.filename}`)
    let SUDO_PASSWORD = await this.plugin.getPassword(ADMIN_PASSWORD)
    // let VOLUME_PASSWORD = this.volume.password
    let VOLUME_PASSWORD = await this.plugin.getPassword(volume.id)
    let VOLUME_KEYFILE = ''
    let VOLUME_FILE = this.plugin.getAbsolutePath(volume.filename)
    // let VOLUME_MOUNTPATH = this.getAbsolutePath(this.volume.mountPath)
    let VOLUME_HASH = volume.hash
    let VOLUME_ENC = volume.encryption
    let VOLUME_FS = volume.filesystem
    let VOLUME_SIZE = volume.size

    let cmd = `echo "${SUDO_PASSWORD}" | sudo -S veracrypt --text --create "${VOLUME_FILE}" --volume-type=normal --pim=0 -k "${VOLUME_KEYFILE}" --quick --encryption="${VOLUME_ENC}" --hash="${VOLUME_HASH}" --filesystem="${VOLUME_FS}" --size="${VOLUME_SIZE}" --password="${VOLUME_PASSWORD}" --random-source=/dev/urandom`
    log(cmd)
    let o = ps(cmd)

    volume.createdTime = Date.now().toString()
  }

  async delete(volume: VolumeConfig) {
    log(`volumesManager.delete: ${volume.filename}`)
    await this.umount(volume)
    if (this.isMounted(volume)) {
      await this.app.vault.adapter.remove(volume.filename)
      this.plugin.settings.volumes.remove(volume)
      await this.plugin.saveSettings()
    }
  }

  async mount(volume: VolumeConfig) {
    log(`volumesManager.mount: ${volume.filename} => ${volume.mountPath}`)
    await this.plugin.checkFolder(volume.mountPath, true)

    let SUDO_PASSWORD = await this.plugin.getPassword(ADMIN_PASSWORD)
    // let VOLUME_PASSWORD = this.volume.password
    let VOLUME_PASSWORD = await this.plugin.getPassword(volume.id)
    let VOLUME_KEYFILE = ''
    let VOLUME_FILE = this.plugin.getAbsolutePath(volume.filename)
    let VOLUME_MOUNTPATH = this.plugin.getAbsolutePath(volume.mountPath)
    let cmd = `echo "${SUDO_PASSWORD}" | sudo -S veracrypt -t --non-interactive --force --password="${VOLUME_PASSWORD}" --protect-hidden=no --pim=0 --keyfiles="${VOLUME_KEYFILE}" "${VOLUME_FILE}" "${VOLUME_MOUNTPATH}"`
    //dbg(cmd)
    ps(cmd)
    volume.mounted = true
    volume.mountTime = Date.now().toString()
    await this.plugin.saveSettings()
  }

  async umount(volume: VolumeConfig) {
    dbg(`volumesManager.umount: ${volume.filename} from: ${volume.mountPath}`)

    let SUDO_PASSWORD = await this.plugin.getPassword(ADMIN_PASSWORD)
    let VOLUME_FILE = this.plugin.getAbsolutePath(volume.filename)
    let VOLUME_MOUNTPATH = this.plugin.getAbsolutePath(volume.mountPath)
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
        volume.umountTime = Date.now().toString()
        volume.mounted = false
        await this.plugin.saveSettings()
        return
      } else {
        log(`"${VOLUME_MOUNTPATH}" is not empty! ${i}`)
        await sleep(333)
      }
    }
    err(`"${VOLUME_MOUNTPATH}" is not empty! Can't remove folder!`)

    let listed = await this.app.vault.adapter.list(volume.mountPath)
    if (listed.files.length + listed.files.length <= 0) {
      log(`volumesManager.umount.rmdir: ${volume.mountPath}`)
      await this.app.vault.adapter.rmdir(volume.mountPath, false)
    }
    volume.mounted = false
    await this.plugin.saveSettings()
  }

  isMounted(volume: VolumeConfig) {
    const volumes = this.plugin.volumesList()
    dbg(`volumesManager.isMounted: ${volume.id}`)
    volumes.forEach((v) => {
      // console.log('isMounted: ' + v['mount'])
      if (volume.mountPath === v['mount']) {
        return true
      }
    })
    return false
  }
}
