//
//import { App, PluginManifest, normalizePath, TFile, TFolder } from 'obsidian'
import { App, Notice } from 'obsidian'
import { ps, log, err, dbg, warn } from './hlp'
import VeraPlugin from './veraPlugin'
//
//import { VeraEvents } from './vera'
//import VolumeConfig from './volume'
//import { ADMIN_PASSWORD } from './constant'
import { VolumeConfig, VeraEvents, ADMIN_PASSWORD } from './vera'

class VolumesManager {
  app!: App
  plugin!: VeraPlugin
  ev!: VeraEvents

  mounted: [] = []
  private lastRefreshed: number

  constructor(plugin: VeraPlugin) {
    this.plugin = plugin
    this.app = this.plugin.app
    // this.ev = new VeraEvents()
    this.ev = this.plugin.vera.ev
    this.ev.addListener('onCreated', this.onCreated)
    this.ev.addListener('onRefreshed', this.onRefreshed)
    this.ev.addListener('reloadFolder', this.plugin.reloadFolder)
    // this.ev.addListener('reloadFileExplorer', this.plugin.reloadFileExplorer)
    // this.ev.addListener('volumeAdd', this.add)

    this.lastRefreshed = Date.now()
  }

  async refresh() {
    if (Date.now() - this.plugin.settings.refreshInterval - this.plugin.settings.refreshTimeout <= this.lastRefreshed) {
      // dbg(`refresh.skip.last: ${this.lastRefreshed}`)
      return
    }
    this.lastRefreshed = Date.now()

    let spawn = require('child_process').spawn
    // let proc = spawn(cmd, args, options)
    let proc = spawn(`veracrypt`, ['-t', '-l', '--non-interactive'])
    let result: string = ''

    //// kill by timeout
    setTimeout(() => {
      proc.kill()
    }, this.plugin.settings.refreshTimeout)

    // @ts-ignore
    proc.stdout.on('data', function (data) {
      result = data
    })
    // @ts-ignore
    proc.stderr.on('data', function (data) {
      result = data
    })
    // @ts-ignore
    proc.on('exit', (code) => {
      // dbg(`refresh.exit: ${result} `)
      this.ev.emit('onRefreshed', result)
    })
  }

  async onRefreshed(args: any[]) {
    // dbg(`onRefreshed.args: ${args}`)
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
      }
    } catch (e) {
      err(`volumesManager.onRefreshed: ${e}`)
    }
  }

  /*
   *                    mountAll    umountAll
   */
  async mountAll(): Promise<void> {
    log(`volumesManager.mountAll`)
    this.plugin.settings.volumes.forEach((volume) => {
        if ((volume.enabled) && (!this.is_mounted(volume))) {
          this.mount(volume)
        } else {
          warn(`volumesManager.mountAll: ${volume.mountPath} already mounted!`)
        }
    })
    await this.plugin.saveSettings()
    // this.ev.emit('reloadFileExplorer')
  }

  async umountAll(force: boolean = false): Promise<void> {
    log(`volumesManager.umountAll: ${this.mounted}`)
    try {
      this.mounted.forEach((v) => {
        dbg(`volumesManager.umountAll.volume: ${v}`)
        this.umount(v, force)
      })
    } catch (e) {
      err(`volumesManager.umountAll: ${e}`)
    }
    // this.ev.emit('reloadFileExplorer')
  }

  /*
   *        Create new Volume
   */
  async create(volume: VolumeConfig, password: string = '', keyfile: string = '') {
    const { spawn } = require('child_process')
    log(`create: ${volume.filename}`)
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
      err(`create.error: Admin password not exists!`)
      return
    }
    if (VOLUME_PASSWORD === '') VOLUME_PASSWORD = await this.plugin.getPassword(volume.filename)
    if (await this.plugin.exists(volume.filename)) {
      err(`create.error: '${volume.filename}' already exists!`)
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
        VOLUME_SIZE: VOLUME_SIZE,
      },
      shell: true,
      cwd: this.plugin.getAbsolutePath(''),
    }

    //let vera_sh = this.plugin.getAbsolutePath(`${this.plugin.app.vault.configDir}/plugins/${this.plugin.name}/vera.sh`)
    let vera_sh = this.plugin.getAbsolutePath(`${this.plugin.app.vault.configDir}/plugins/obsidian-veracrypt/vera.sh`)
    dbg(`vera_sh: ${vera_sh}`)
    dbg(`options: ${JSON.stringify(options, null, 2)}`)
    const proc = spawn('bash', [vera_sh, VOLUME_COMMAND], options)
    if (!proc) {
      err(`create.proc.error: '${vera_sh}' not started`)
      return
    }
    // @ts-ignore
    proc.stdout.on('data', function (data) {
      // dbg(`exec.output: ${data}`)
      result = data
    })
    // @ts-ignore
    proc.stderr.on('data', function (data) {
      // err(`exec.stderr: ${data}`)
      result = data
    })
    // @ts-ignore
    proc.on('exit', (code) => {
      // dbg(`create.on.exit: ${result} `)
      this.ev.emit('onCreated', [result, volume, this])
    })
  }

  async onCreated(args: any[]) {
    if (args.length !== 0) {
      let result: string = args.at(0)
      let volume: VolumeConfig = args.at(1)
      let self: VolumesManager = args.at(2)
      await self.add(volume)
      new Notice(`created ${volume.filename}`)
    } else {
      warn(`onCreated is empty! `)
    }
  }

  async add(volume: VolumeConfig) {
    volume.version = this.plugin.manifest.version
    volume.createdTime = Date.now().toString()
    volume.enabled = true
    this.plugin.settings.volumes.push(volume)
    await this.plugin.saveSettings()
    new Notice(`added: ${volume.filename}`)
  }

  async delete(volume: VolumeConfig, force: boolean = true) {
    log(`volumesManager.delete: ${volume.filename}`)
    let old_filename = volume.filename
    await this.umount(volume, force)
    if (await this.is_mounted(volume)) {
      err(`volumesManager.delete.error: ${volume.filename} not unmount from ${volume.mountPath}!`)
      return
    }
    await this.app.vault.adapter.remove(volume.filename)
    if (!(await this.plugin.exists(volume.filename))) {
      this.plugin.settings.volumes.remove(volume)
      await this.plugin.saveSettings()
    }
    new Notice(`deleted: ${old_filename}`)
  }

  async mount(v: VolumeConfig | string, force: boolean = false) {
    let volume: VolumeConfig
    if (typeof v === 'string') {
      // @ts-ignore
      volume = await this.get(v)
      if (volume === null) {
        err(`mount.volume ${volume} not exist !`)
        return
      }
    } else {
      volume = v
    }

    log(`mount: ${volume.filename} to: ${volume.mountPath}`)
    let OS_PASSWORD = await this.plugin.getPassword(ADMIN_PASSWORD)
    let VOLUME_PASSWORD = await this.plugin.getPassword(volume.filename)
    let VOLUME_KEYFILE = ''
    let VOLUME_FILE = this.plugin.getAbsolutePath(volume.filename)
    let VOLUME_MOUNTPATH = this.plugin.getAbsolutePath(volume.mountPath)
    let cmd = `echo "${OS_PASSWORD}" | sudo -S veracrypt -t --non-interactive --password="${VOLUME_PASSWORD}" --protect-hidden=no --pim=0 --keyfiles="${VOLUME_KEYFILE}" "${VOLUME_FILE}" "${VOLUME_MOUNTPATH}"`
    dbg(cmd)
    if (OS_PASSWORD == '') {
      err(`mount.error: Admin password not exists!`)
      return
    }
    if (force) cmd = cmd + ' --force'
    if (!(await this.plugin.exists(volume.filename))) {
      err(`mount.error: "${volume.filename}" not exists!`)
      return
    }
    await this.plugin.checkFolder(volume.mountPath, true)
    ps(cmd)
    if (await this.is_mounted(volume)) {
      volume.mounted = true
      volume.mountTime = Date.now().toString()
      await this.plugin.saveSettings()
      this.ev.emit('reloadFolder', volume.mountPath)
      new Notice(`mounted  ${volume.filename} => ${volume.mountPath}`)
    }
  }

  async umount(v: VolumeConfig | string, force: boolean = false) {
    let volume: VolumeConfig
    if (typeof v === 'string') {
      // @ts-ignore
      volume = await this.get(v)
      if (volume === null) {
        err(`umount.volume ${volume} not exist !`)
        return
      }
    } else {
      volume = v
    }

    log(`umount: ${volume.filename} from ${volume.mountPath}`)
    let OS_PASSWORD = await this.plugin.getPassword(ADMIN_PASSWORD)
    let VOLUME_FILE = this.plugin.getAbsolutePath(volume.filename)
    let VOLUME_MOUNTPATH = this.plugin.getAbsolutePath(volume.mountPath)
    let cmd = `echo "${OS_PASSWORD}" | sudo -S veracrypt -t -d "${VOLUME_FILE}" --non-interactive`

    if (OS_PASSWORD == '') {
      err(`umount.error: Admin password not exists!`)
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
        this.ev.emit('reloadFolder', volume.mountPath)
        new Notice(`unmounted  ${volume.filename} => ${volume.mountPath}`)
        return
      } else {
        dbg(`"${VOLUME_MOUNTPATH}" is not empty! try: ${i}`)
        await sleep(333)
      }
    }
    err(`"${VOLUME_MOUNTPATH}" is not empty! Can't remove folder!`)

    let listed = await this.app.vault.adapter.list(volume.mountPath)
    if (listed.files.length + listed.files.length <= 0) {
      dbg(`umount.rmdir: ${volume.mountPath}`)
      await this.app.vault.adapter.rmdir(volume.mountPath, false)
    }
    await this.plugin.saveSettings()
  }

  async is_mounted(v: VolumeConfig | string, wait = 1000) {
    let volume: VolumeConfig
    let name: string = ''
    if (typeof v === 'string') {
      // @ts-ignore
      volume = await this.get(v)
      if (volume === null) {
        warn(`is_mounted.volume '${v}' not exist !`)
      }else {
        name = volume.filename
      }
    } else {
      if (v !== null) {
        name = v.filename
      }
    }
    //
    try {
      // @ts-ignore
      volume = await this.get(name)
      if (volume !== null) {
        let filename_abs = this.plugin.getAbsolutePath(volume.filename)
        let mount_abs = this.plugin.getAbsolutePath(volume.mountPath)

        this.mounted.forEach((v) => {
          let vfilename = this.plugin.getAbsolutePath(v['filename'])
          let vmount = this.plugin.getAbsolutePath(v['mount'])
          dbg(`is_mounted.forEach: ${vfilename} ${filename_abs} ${vmount} ${mount_abs}`)
          // @ts-ignore
          if ((vfilename === filename_abs) || (vmount === mount_abs)) {
            return volume
          }
        })
      }
    } catch (e) {
      dbg(`is_mounted.err: ${e}`)
    }
    return null
  }

  async get(name: string) {
    let name_abs = this.plugin.getAbsolutePath(name)
    dbg(`get name: ${name} name_abs: ${name_abs}`)
    this.plugin.settings.volumes.forEach((vol) => {
      dbg(`get ${name} == ${vol.filename}`)
      if (vol.filename.includes(name_abs)) {
        return vol
      }
      if (vol.mountPath.includes(name_abs)) {
        return vol
      }
      if (vol.filename.includes(name)) {
        return vol
      }
      if (vol.mountPath.includes(name)) {
        return vol
      }
      if (vol.id.includes(name)) {
        return vol
      }
    })
    return null
  }
}

export { VolumesManager }
