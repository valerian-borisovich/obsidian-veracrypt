//
//import { App, PluginManifest, normalizePath, TFile, TFolder } from 'obsidian'
import { App, normalizePath, TFolder } from 'obsidian'
import { ps, log, err, dbg, warn, run } from './hlp'
import VeraPlugin from './veraPlugin'
import { VeraEvents } from './vera'
import { VolumeConfig } from './volume'
import { ADMIN_PASSWORD } from './constant'

class VolumesManager {
  app!: App
  plugin!: VeraPlugin

  ev!: VeraEvents

  mounted: [] = []

  private lastRefreshed: number


  constructor(plugin: VeraPlugin) {
    this.plugin = plugin
    this.app = this.plugin.app

    this.ev = new VeraEvents()
    this.ev.addListener('onCreated', this.onCreated)
    this.ev.addListener('onRefreshed', this.onRefreshed)
    this.ev.addListener('reloadFileExplorer', this.plugin.reloadFileExplorer)
    this.ev.addListener('reloadFolder', this.plugin.reloadFolder)

    this.lastRefreshed=Date.now()
  }

  async refresh() {
    // if(Date.now()-this.plugin.settings.refreshInterval <= this.lastRefreshed) {
    if(Date.now()-this.plugin.settings.refreshInterval-this.plugin.settings.refreshTimeout <= this.lastRefreshed) {
      dbg(`refresh.skip.last: ${this.lastRefreshed}`)
      return
    }
    this.lastRefreshed=Date.now()

    let spawn = require('child_process').spawn
    // let proc = spawn(cmd, args, options)
    let proc = spawn(`veracrypt`, ['-t', '-l', '--non-interactive'])
    let result: string = ''

    //// kill by timeout
    setTimeout(() => {
      proc.kill()
    }, this.plugin.settings.refreshTimeout)

    // @ts-ignore
    proc.stdout.on('data', function(data) {
      result = data
    })
    // @ts-ignore
    proc.stderr.on('data', function(data) {
      result = data
    })
    // @ts-ignore
    proc.on('exit', (code) => {
      // dbg(`refresh.exit: ${result} `)
      this.ev.emit('onRefreshed', result)
    })
  }

  async onRefreshed(args: any[]) {
    dbg(`onRefreshed.args: ${args}`)

    let a, v
    let l: [] = []
    let nomounted = 'Error: No volumes mounted.'
    let result: string = args.at(0).toString()

    try {
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
        this.lastRefreshed = Date.now()
        // this.plugin.settings.lastRefreshed = Date.now()
      }
    } catch (e) {
      err(`volumesManager.onRefreshed.error: ${e}`)
    }
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
    this.mounted.forEach((v) => {
      dbg(`volumesManager.umountAll.volume: ${v}`)
      this.umount(v, force)
    })
  }

  async umountAll0(force: boolean = false): Promise<void> {
    log('volumesManager.umountAll')
    let result: string = ''
    let cmd: string = ''
    let OS_PASSWORD = await this.plugin.getPassword(ADMIN_PASSWORD)
    cmd = `echo "${OS_PASSWORD}" | sudo -S veracrypt -t -d --non-interactive`
    if (force) cmd = cmd + ' --force'
    dbg(`volumesManager.umountAll.cmd: ${cmd}`)
    result = run(cmd)
  }

  /*
   *
   */
  async create(volume: VolumeConfig, password: string = '', keyfile: string = '') {
    const { spawn } = require('child_process')
    log(`volumeManager.create: ${volume.filename}`)
    let OS_PASSWORD = await this.plugin.getPassword(ADMIN_PASSWORD)
    let VOLUME_FILE = volume.filename
    let VOLUME_PASSWORD = password
    let VOLUME_KEYFILE = keyfile
    let VOLUME_HASH = volume.hash
    let VOLUME_ENC = volume.encryption
    let VOLUME_FS = volume.filesystem
    let VOLUME_SIZE = volume.size
    let VOLUME_COMMAND = 'create'

    let result = ''

    if (OS_PASSWORD === '') {
      err(`volumesManager.create.error: Admin password not exists!`)
      return
    }
    if (VOLUME_PASSWORD === '') VOLUME_PASSWORD = await this.plugin.getPassword(volume.filename)
    if (await this.plugin.exists(volume.filename)) {
      err(`volumesManager.create.error: '${volume.filename}' already exists!`)
      return
    }

    let options = {
      env: {
        DEBUG: this.plugin.settings.debug,
        VERBOSE: this.plugin.settings.verbose,
        LOG_FILE: this.plugin.settings.logFilename,
        LOG_LEVEL: this.plugin.settings.logLevel,
        OS_PASSWORD: OS_PASSWORD,
        VOLUME_COMMAND: VOLUME_COMMAND,
        VOLUME_FILE: VOLUME_FILE,
        VOLUME_PASSWORD: VOLUME_PASSWORD,
        VOLUME_KEYFILE: VOLUME_KEYFILE,
        VOLUME_ENC: VOLUME_ENC,
        VOLUME_HASH: VOLUME_HASH,
        VOLUME_FS: VOLUME_FS,
        VOLUME_SIZE: VOLUME_SIZE
      }, shell: true, cwd: '/'+this.plugin.getAbsolutePath('')
    }

    let vera_sh = '/'+this.plugin.getAbsolutePath(`${this.plugin.app.vault.configDir}/plugins/obsidian-veracrypt/vera.sh`)

    /*
    if (this.plugin.settings.debug){
      dbg(`vera.sh: ${vera_sh}`)
      dbg(`options: ${JSON.stringify(options, null, 2)}`)
    }
    */

    const proc = spawn('bash', [ vera_sh, VOLUME_COMMAND], options)
    if (!proc){
      err(`create proc error: '${vera_sh}' not started`)
      return
    }

    // @ts-ignore
    proc.stdout.on('data', function(data) {
      // dbg(`exec.output: ${data}`)
      result = data
    })

    // @ts-ignore
    proc.stderr.on('data', function(data) {
      // err(`exec.stderr: ${data}`)
      result = data
    })

    // @ts-ignore
    proc.on('exit', (code) => {
      // dbg(`run.on.exit(${code}): ${result} `)
      dbg(`create.onCreated.exit: ${result} `)
      this.ev.emit('onCreated', [result, volume, this])
    })
  }

  async onCreated(args: any[]) {
    if (args.length !== 0) {
      let result: string = args.at(0)
      let volume: VolumeConfig = args.at(1)
      let self: VolumesManager = args.at(2)

      // dbg(`onCreated( result = ${result.toString()}, volume = ${JSON.stringify(volume, null, 2)}, self = ${self.toString()} `)
      //const { env } = require('node:process')
      //result = env.VERA_RESULT ?? ""
      //dbg(`env.VERA_RESULT: ${env.VERA_RESULT}`)
      //dbg(`env.VERA_RESULT: ${result}`)

      volume.version = self.plugin.manifest.version
      volume.createdTime = Date.now().toString()
      volume.enabled = true
      self.plugin.settings.volumes.push(volume)
      await self.plugin.saveSettings()
      this.ev.emit('reloadFolder', volume.mountPath)
    }else{
      warn(`onCreated is empty! `)
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
    let OS_PASSWORD = await this.plugin.getPassword(ADMIN_PASSWORD)
    let VOLUME_PASSWORD = await this.plugin.getPassword(volume.filename)
    let VOLUME_KEYFILE = ''
    let VOLUME_FILE = this.plugin.getAbsolutePath(volume.filename)
    let VOLUME_MOUNTPATH = this.plugin.getAbsolutePath(volume.mountPath)
    let cmd = `echo "${OS_PASSWORD}" | sudo -S veracrypt -t --non-interactive --password="${VOLUME_PASSWORD}" --protect-hidden=no --pim=0 --keyfiles="${VOLUME_KEYFILE}" "${VOLUME_FILE}" "${VOLUME_MOUNTPATH}"`
    //dbg(cmd)
    if (OS_PASSWORD == '') {
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
      //this.ev.emit('reloadFileExplorer')
      this.ev.emit('reloadFolder', volume.mountPath)
    }
  }

  async umount(volume: VolumeConfig, force: boolean = false) {
    log(`volumesManager.umount: ${volume.filename} from: ${volume.mountPath}`)
    let OS_PASSWORD = await this.plugin.getPassword(ADMIN_PASSWORD)
    let VOLUME_FILE = this.plugin.getAbsolutePath(volume.filename)
    let VOLUME_MOUNTPATH = this.plugin.getAbsolutePath(volume.mountPath)
    let cmd = `echo "${OS_PASSWORD}" | sudo -S veracrypt -t -d "${VOLUME_FILE}" --non-interactive`

    if (OS_PASSWORD == '') {
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
        cmd = `echo "${OS_PASSWORD}" | sudo -S rm -d "${VOLUME_MOUNTPATH}"`
        //dbg(cmd)
        ps(cmd)
        volume.umountTime = Date.now().toString()
        volume.mounted = false
        await this.plugin.saveSettings()
        // await this.plugin.reloadFolder(volume.mountPath)
        this.ev.emit('reloadFolder', volume.mountPath)
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

  // async __mount(name: string): Promise<void> {
  __mount(name: string) {
    dbg(`volumesManager.__mount ${name}`)
    let vol = this.__get(name)
    if (vol !== null) {
      this.mount(vol).then((value)=>{})
    }
  }

  __umount(name: string) {
    dbg(`volumesManager.__umount ${name}`)
    let vol = this.__get(name)
    if (vol !== null) {
      this.umount(vol).then((value)=>{})
    }
  }

  // async __is_mounted(filename: any): Promise<void> {
  __is_mounted(name: string) {
    this.is_mounted(name).then((value) => {
      return value
    })
    return false
  }

  async is_mounted(name: string) {
    dbg(`volumesManager.is_mounted ${name}`)
    try {
      let vol = await this.get(name)
      if (vol !== null) {
        this.mounted.forEach((v) => {
          let filename = v['filename']
          let mount = v['mount']
          // @ts-ignore
          if (vol.filename.endsWith(filename) || vol.mountPath.endsWith(mount)) {
            return true
          }
        })
      }
    }catch (e) {

    }
    return false
  }

  isMounted(volume: VolumeConfig, wait = 1000) {
    return this.__is_mounted(volume.filename)
  }

  isMounted0(volume: VolumeConfig, wait = 1000) {
    dbg(`volumesManager.isMounted: ${volume.filename}`)
    const sleep_interval = 333
    for (let i = 1, w = 1; w < wait; i++, w = w + sleep_interval) {
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

  async get(name: string) {
    dbg(`volumesManager.get ${name}`)
    this.plugin.settings.volumes.forEach(v => {
      if (v.filename.endsWith(name)) {return v}
      if (v.mountPath.endsWith(name)) {return v}
      if (v.id.endsWith(name)) {return v}
    })
    return null
  }

  __get(name: string) {
    this.get(name).then((value) => {
      return value
    })
    return null
  }

}

export { VolumesManager }
