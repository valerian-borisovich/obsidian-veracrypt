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

  constructor(plugin: VeraPlugin) {
    this.plugin = plugin
    this.app = this.plugin.app
  }

  /*
   *
   */
  private mountedRefreshStart = ''
  private mountedRefreshedTime = ''

  async mountedRefresh() {
    let a, v
    let l: [] = []
    let nomounted = 'Error: No volumes mounted.'
    let result: string = ''

    try {
      this.mountedRefreshStart = Date.now().toString()
      result = run('veracrypt', ['-t', '-l', '--non-interactive', '--force'])
      dbg(`mountedRefresh.result: ${result}`)
      if(nomounted===result){
        this.mounted = []
      }else {
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
      err(`mountedRefresh.err: ${e}`)
    }
  }

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
    let result: string = ''
    let cmd: string = ''
    let SUDO_PASSWORD = await this.plugin.getPassword(ADMIN_PASSWORD)
    /*
    this.plugin.settings.volumes.forEach((volume) => {
      if (this.isMounted(volume)) {
        this.umount(volume)
        // this.refreshFolder(v.volume.mountPath)
      } else {
        warn(`volumesManager.umountAll: ${volume.mountPath} not mounted!`)
      }
    })
    */
    cmd = `echo "${SUDO_PASSWORD}" | sudo -S veracrypt -t -d --non-interactive`
    dbg(`volumesManager.umountAll.cmd: ${cmd}`)
    result = run(cmd)
  }

  /*
   *
   */

  async create(volume: VolumeConfig) {
    log(`volumeManager.create: ${volume.filename}`)
    let SUDO_PASSWORD = await this.plugin.getPassword(ADMIN_PASSWORD)
    let VOLUME_PASSWORD = await this.plugin.getPassword(volume.id)
    let VOLUME_KEYFILE = ''
    let VOLUME_FILE = this.plugin.getAbsolutePath(volume.filename)
    // let VOLUME_MOUNTPATH = this.getAbsolutePath(this.volume.mountPath)
    let VOLUME_HASH = volume.hash
    let VOLUME_ENC = volume.encryption
    let VOLUME_FS = volume.filesystem
    let VOLUME_SIZE = volume.size

    let cmd = `echo "${SUDO_PASSWORD}" | sudo -S veracrypt --text --create "${VOLUME_FILE}" --volume-type=normal --pim=0 -k "${VOLUME_KEYFILE}" --quick --encryption="${VOLUME_ENC}" --hash="${VOLUME_HASH}" --filesystem="${VOLUME_FS}" --size="${VOLUME_SIZE}" --password="${VOLUME_PASSWORD}" --random-source=/dev/urandom`
    dbg(cmd)
    let o = ps(cmd)

    volume.version = this.plugin.manifest.version
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
    if (SUDO_PASSWORD == '') {
      err(`Admin password not exists!`)
      return
    }
    ps(cmd)
    volume.mounted = true
    volume.mountTime = Date.now().toString()
    await this.plugin.saveSettings()
  }

  async umount(volume: VolumeConfig) {
    log(`volumesManager.umount: ${volume.filename} from: ${volume.mountPath}`)
    let cmd = ''
    let SUDO_PASSWORD = await this.plugin.getPassword(ADMIN_PASSWORD)
    let VOLUME_FILE = this.plugin.getAbsolutePath(volume.filename)
    let VOLUME_MOUNTPATH = this.plugin.getAbsolutePath(volume.mountPath)
    // cmd = `echo "${SUDO_PASSWORD}" | sudo -S veracrypt -t -d "${VOLUME_FILE}" --non-interactive --force`
    cmd = `echo "${SUDO_PASSWORD}" | sudo -S veracrypt -t -d "${VOLUME_FILE}" --non-interactive`
    // dbg(cmd)
    if (SUDO_PASSWORD == '') {
      err(`Admin password not exists!`)
      return
    }
    ps(cmd)

    /*
    cmd = `echo "${SUDO_PASSWORD}" | sudo -S veracrypt -t -d "${VOLUME_MOUNTPATH}" --non-interactive --force`
    log(cmd)
    exec(cmd)
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

export { VolumesManager }
