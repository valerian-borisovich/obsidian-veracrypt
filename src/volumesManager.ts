//
//import { App, PluginManifest, normalizePath, TFile, TFolder } from 'obsidian'
import { App } from 'obsidian'
import { ps, log, err, dbg, warn, run } from './hlp'
import VeraPlugin from './main'
import { VolumeConfig } from './volume'
import { ADMIN_PASSWORD } from './constant'

class VolumesManager {
  app!: App
  plugin!: VeraPlugin

  mounted: [] = []
  private mountedRefreshStart: string
  private mountedRefreshedTime: string


  constructor(plugin: VeraPlugin) {
    this.plugin = plugin
    this.app = this.plugin.app
    this.mountedRefreshStart = ''
    this.mountedRefreshedTime = ''
  }

  /*
   *
   */
  async refresh() {
    let a, v
    let l: [] = []
    let nomounted = 'Error: No volumes mounted.'
    let result: string = ''

    try {
      this.mountedRefreshStart = Date.now().toString()
      result = run(`veracrypt`, ['-t', '-l', '--non-interactive'])
      dbg(`volumesManager.refresh.result: ${result}`)
      if (nomounted === result) {
        this.mounted = []
      } else {
        result.split('\n').forEach((v: string) => {
          if (v.length) {
            a = v.split(' ')
            // @ts-ignore
            l.push({ filename: a[1], mount: a[3] })
          }
        })
        this.mounted = l
        this.mountedRefreshedTime = Date.now().toString()
      }
    } catch (e) {
      err(`volumesManager.refresh.err: ${e}`)
    }
  }

  isMounted(volume: VolumeConfig, wait = 1000) {
    dbg(`volumesManager.isMounted: ${volume.filename}`)
    const sleep_interval = 333
    for (let i = 1, w= 1; w < wait ; i++, w = w + sleep_interval) {
      this.mounted.forEach((vol) => {
        if (volume.filename === vol['filename']) {
          return true
        }
      })
      dbg(`volumesManager.isMounted: ${volume.filename} try: ${i}`)
      sleep(sleep_interval).then(r => {
      })
    }
    return false
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

  async umountAll(force: boolean = false): Promise<void> {
    log('volumesManager.umountAll')
    let result: string = ''
    let cmd: string = ''
    let SUDO_PASSWORD = await this.plugin.getPassword(ADMIN_PASSWORD)
    cmd = `echo "${SUDO_PASSWORD}" | sudo -S veracrypt -t -d --non-interactive`
    if (force) cmd = cmd + ' --force'
    dbg(`volumesManager.umountAll.cmd: ${cmd}`)
    result = run(cmd)
  }

  /*
   *
   */

  async create(volume: VolumeConfig, password: string = '', keyfile: string = '') {
    log(`volumeManager.create: ${volume.filename}`)
    let SUDO_PASSWORD = await this.plugin.getPassword(ADMIN_PASSWORD)
    let VOLUME_PASSWORD = password
    let VOLUME_KEYFILE = keyfile
    let VOLUME_FILE = this.plugin.getAbsolutePath(volume.filename)
    let VOLUME_HASH = volume.hash
    let VOLUME_ENC = volume.encryption
    let VOLUME_FS = volume.filesystem
    let VOLUME_SIZE = volume.size
    let cmd = ''

    if (await this.plugin.exists(volume.filename)) {
      err(`volumesManager.create.error: "${volume.filename}" already exists!`)
      return
    }
    if (SUDO_PASSWORD == '') {
      err(`volumesManager.create.error: Admin password not exists!`)
      return
    }
    if(VOLUME_PASSWORD==='') VOLUME_PASSWORD = await this.plugin.getPassword(volume.filename)

    cmd = `echo "${SUDO_PASSWORD}" | sudo -S veracrypt --text --create "${VOLUME_FILE}" --volume-type=normal --pim=0 -k "${VOLUME_KEYFILE}" --quick --encryption="${VOLUME_ENC}" --hash="${VOLUME_HASH}" --filesystem="${VOLUME_FS}" --size="${VOLUME_SIZE}" --password="${VOLUME_PASSWORD}" --random-source=/dev/urandom`
    if(this.plugin.settings.pluginDebug) dbg(cmd)
    ps(cmd)

    if (await this.plugin.exists(volume.filename)) {
      volume.version = this.plugin.manifest.version
      volume.createdTime = Date.now().toString()
      volume.enabled = true
      this.plugin.settings.volumes.push(volume)
      await this.plugin.saveSettings()
    }
  }

  async delete(volume: VolumeConfig, force: boolean = true) {
    log(`volumesManager.delete: ${volume.filename}`)
    await this.umount(volume, force)
    if (this.isMounted(volume)) {
      err(`volumesManager.delete.error: ${volume.filename} not unmount from ${volume.mountPath}!`)
      return
    }
    await this.app.vault.adapter.remove(volume.filename)
    if (!await this.plugin.exists(volume.filename)) {
      this.plugin.settings.volumes.remove(volume)
      await this.plugin.saveSettings()
    }
  }

  async mount(volume: VolumeConfig, force: boolean = false) {
    log(`volumesManager.mount: ${volume.filename} to: ${volume.mountPath}`)
    let SUDO_PASSWORD = await this.plugin.getPassword(ADMIN_PASSWORD)
    let VOLUME_PASSWORD = await this.plugin.getPassword(volume.filename)
    let VOLUME_KEYFILE = ''
    let VOLUME_FILE = this.plugin.getAbsolutePath(volume.filename)
    let VOLUME_MOUNTPATH = this.plugin.getAbsolutePath(volume.mountPath)
    let cmd = `echo "${SUDO_PASSWORD}" | sudo -S veracrypt -t --non-interactive --password="${VOLUME_PASSWORD}" --protect-hidden=no --pim=0 --keyfiles="${VOLUME_KEYFILE}" "${VOLUME_FILE}" "${VOLUME_MOUNTPATH}"`
    //dbg(cmd)
    if (SUDO_PASSWORD == '') {
      err(`volumesManager.mount.error: Admin password not exists!`)
      return
    }
    if (force) cmd = cmd + ' --force'
    if (!await this.plugin.exists(volume.filename)) {
      err(`volumesManager.mount.error: "${volume.filename}" not exists!`)
      return
    }
    await this.plugin.checkFolder(volume.mountPath, true)
    ps(cmd)
    if (this.isMounted(volume)) {
      volume.mounted = true
      volume.mountTime = Date.now().toString()
      await this.plugin.saveSettings()
      await this.plugin.reloadFolder(volume.mountPath)
    }
  }

  async umount(volume: VolumeConfig, force: boolean = false) {
    log(`volumesManager.umount: ${volume.filename} from: ${volume.mountPath}`)
    let SUDO_PASSWORD = await this.plugin.getPassword(ADMIN_PASSWORD)
    let VOLUME_FILE = this.plugin.getAbsolutePath(volume.filename)
    let VOLUME_MOUNTPATH = this.plugin.getAbsolutePath(volume.mountPath)
    let cmd = `echo "${SUDO_PASSWORD}" | sudo -S veracrypt -t -d "${VOLUME_FILE}" --non-interactive`

    if (SUDO_PASSWORD == '') {
      err(`volumesManager.umount.error: Admin password not exists!`)
      return
    }
    if (force) cmd = cmd + ' --force'
    ps(cmd)

    const adapter = this.app.vault.adapter

    for (let i = 0; i <= 10; i++) {
      // @ts-ignore
      const existingFileNames = new Set(await adapter.fsPromises.readdir(`${VOLUME_MOUNTPATH}`))
      if (existingFileNames.size === 0) {
        // cmd = `echo "${SUDO_PASSWORD}" | sudo -S rm -rf "${VOLUME_MOUNTPATH}"`
        cmd = `echo "${SUDO_PASSWORD}" | sudo -S rm "${VOLUME_MOUNTPATH}"`
        dbg(cmd)
        ps(cmd)
        volume.umountTime = Date.now().toString()
        volume.mounted = false
        await this.plugin.saveSettings()
        await this.plugin.reloadFolder(volume.mountPath)
        return
      } else {
        dbg(`"${VOLUME_MOUNTPATH}" is not empty! try: ${i}`)
        await sleep(333)
      }
    }
    err(`"${VOLUME_MOUNTPATH}" is not empty! Can't remove folder!`)

    let listed = await this.app.vault.adapter.list(volume.mountPath)
    if (listed.files.length + listed.files.length <= 0) {
      dbg(`volumesManager.umount.rmdir: ${volume.mountPath}`)
      await this.app.vault.adapter.rmdir(volume.mountPath, false)
    }
    await this.plugin.saveSettings()
  }

}

export { VolumesManager }
