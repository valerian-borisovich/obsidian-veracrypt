//
// import {Notice,Plugin,setIcon,TFolder,TFile,TAbstractFile,debounce,DropdownComponent,normalizePath,} from 'obsidian'
import { Plugin, Menu, TFolder, TFile, TAbstractFile, normalizePath } from 'obsidian'
import * as fsPromises from 'fs/promises'
import { I18n, log, dbg, err, warn, getId, getDeviceId } from './hlp'
import type { LangType, LangTypeAndAuto, TransItemType } from './hlp'
//
import { VeraPluginSettings, DEFAULT_SETTINGS } from './settings'
import { VeraSettingTab } from './settingsModal'
import { PasswordPromt } from './passwordModal'
import { VolumeModal } from '~/volumeModal'
import { Vera, VolumesManager, DEFAULT_VOLUME_CONFIG, ADMIN_PASSWORD, VolumeConfig } from './vera'

const ROOT_PATH = '/'

export default class VeraPlugin extends Plugin {
  settings!: VeraPluginSettings
  vera!: Vera
  mng!: VolumesManager
  //
  promts: string[] = []
  private _fsPromises!: typeof fsPromises

  /*             Lang          */
  i18n!: I18n
  t = (x: TransItemType, vars?: any) => {
    return this.i18n.t(x, vars)
  }

  //
  ribbonIconButton!: HTMLElement
  statusBarItem!: HTMLElement

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  /*          Password            */
  async getPassword(name: string, promt: boolean = true) {
    let pass = await this.vera.getPassword(name)
    // dbg(`VeraPlugin.getPassword: ${id} == ${pass}`)
    if (pass === '' && promt) {
      if (!this.promts.contains(name)) {
        this.promts.push(name)
        let dlg = new PasswordPromt(this.app, this, name, '')
        dlg.open()
        pass = await this.vera.getPassword(name)
        // dbg(`VeraPlugin.getPassword again: ${id} == ${pass}`)
      }
    }
    return pass
  }

  async setPassword(name: string, password: string) {
    await this.vera.setPassword(name, password)
    // dbg(`VeraPlugin.setPassword: ${id} : ${password}`)
  }

  /*                       Filesystem               */
  getAbsolutePath(path: String) {
    let root = (this.app.vault.adapter as any).basePath
    let result = '/' + normalizePath(`${root}/${path}`)
    //let result = normalizePath(`${root}/${path}`)
    if (result.endsWith('/')) {
      result = result.slice(0, -1)
    }
    return result
  }

  async checkFolder(path: string, create: Boolean = true) {
    let folderpath = normalizePath(path)
    //@ts-ignore
    const folder = this.app.vault.getAbstractFileByPathInsensitive(folderpath)
    if (folder && folder instanceof TFolder) {
      return
    }
    if (folder && folder instanceof TFile) {
      warn(`The folder cannot be created because it already exists as a file: ${folderpath}.`)
    }
    // if (!(await this.app.vault.adapter.exists(folderpath))) {
    if (create) {
      await this.app.vault.createFolder(folderpath)
    }
    // }
  }

  async name(filename: string) {
    return filename.substring(filename.lastIndexOf('/') ? 0 : filename.lastIndexOf('/'), filename.lastIndexOf('.'))
  }

  async exists(filename: string) {
    return await this.app.vault.adapter.exists(filename)
  }

  /*
   *                reloadFolder  &  reloadFileExplorer
   */

  //private async reloadFileExplorer(): Promise<void> {
  async reloadFileExplorer(): Promise<void> {
    await this.reloadFolder(ROOT_PATH, true)
  }

  public async reloadFolder(directoryPath: string, isRecursive: boolean = false): Promise<void> {
    const isRoot = directoryPath === ROOT_PATH
    const adapter = this.app.vault.adapter
    dbg(`Reloading directory ${directoryPath}`)
    await adapter.reconcileFolderCreation(directoryPath, directoryPath)
    const absolutePath = isRoot ? adapter.basePath : `${adapter.basePath}/${directoryPath}`
    const existingFileItems = (await this._fsPromises.readdir(absolutePath, { withFileTypes: true })).filter(
      (f) => !f.name.startsWith('.'),
    )
    const existingFileNames = new Set(existingFileItems.map((f) => f.name))
    const dir = this.app.vault.getAbstractFileByPath(directoryPath) as TFolder
    const obsidianFileNames = new Set(dir.children.map((child) => child.name).filter((name) => name))

    for (const fileName of existingFileNames) {
      if (!obsidianFileNames.has(fileName)) {
        const path = this.combinePath(directoryPath, fileName)
        dbg(`Adding new file ${path}`)
        await adapter.reconcileFile(path, path, false)
      }
    }

    for (const fileName of obsidianFileNames) {
      if (!existingFileNames.has(fileName)) {
        const path = this.combinePath(directoryPath, fileName)
        dbg(`Deleting inexistent ${path}`)
        await adapter.reconcileFile('', path, false)
      }
    }

    if (isRecursive) {
      for (const existingFileItem of existingFileItems) {
        if (existingFileItem.isDirectory()) {
          const path = this.combinePath(directoryPath, existingFileItem.name)
          await this.reloadFolder(path, true)
        }
      }
    }
  }

  private combinePath(directoryPath: string, fileName: string): string {
    const isRoot = directoryPath === ROOT_PATH
    return isRoot ? fileName : `${directoryPath}/${fileName}`
  }

  /*                    handleFileMenu              */
  private handleFileMenu(menu: Menu, file: TAbstractFile) {
    if (file instanceof TFile && file.extension === this.settings.defaultVolumefileExtention) {
      //dbg(`handleFileMenu TFile.name: ${file.name}`)
      if (this.mng.is_mounted(file.name)) {
        menu.addItem((item) => {
          item
            .setTitle(this.t('vera-mount'))
            .setIcon('vera-mount')
            .onClick(() => this.mng.mount(file.name))
        })
      } else {
        menu.addItem((item) => {
          item
            .setTitle(this.t('vera-umount'))
            .setIcon('vera-umount')
            .onClick(() => this.mng.umount(file.name))
        })
      }
    }

    if (file instanceof TFolder) {
      //dbg(`handleFileMenu TFolder: ${file.path}`)
      if (this.mng.is_mounted(file.path)) {
        // dbg(`handleFileMenu TFolder mounted: ${mounted} name: ${file.path}`)
        menu.addItem((item) => {
          item
            .setTitle(this.t('vera-umount'))
            .setIcon('vera-umount')
            .onClick(() => this.mng.umount(file.path))
        })
      }
    }

    //////
    menu.addItem((item) => {
      item
        .setTitle('Reload Folder')
        .setIcon('folder-sync')
        .onClick(() => this.reloadFolder(file.path, false))
    })

    menu.addItem((item) => {
      item
        .setTitle('Reload Folder with Subfolders')
        .setIcon('folder-sync')
        .onClick(() => this.reloadFolder(file.path, true))
    })
  }

  /*
   *          onload
   */
  async onload() {
    if (!this.app.vault.adapter.fsPromises) {
      throw new Error('app.vault.adapter.fsPromises is not initialized')
    }

    this._fsPromises = this.app.vault.adapter.fsPromises

    await this.loadSettings()
    log(`Vera plugin loaded, version ${this.manifest.version} `)

    // lang should be load early, but after settings
    this.i18n = new I18n(this.settings.lang, async (lang: LangTypeAndAuto) => {
      this.settings.lang = lang
      await this.saveSettings()
    })

    this.vera = new Vera(this.settings)
    this.mng = new VolumesManager(this)

    //await this.install(true)
    await this.install()

    await this.mng.refresh()

    /*         Add ribbon Buttons               */

    this.addRibbonIcon('eye', this.t('vera-mount-all'), async () => {
      await this.mng.mountAll()
    })

    this.addRibbonIcon('trash', this.t('vera-umount-all'), async () => {
      await this.mng.umountAll()
    })

    this.addRibbonIcon('dice', 'refresh', async () => {
      await this.mng.refresh()
    })

    this.addRibbonIcon('cloud', 'install example', async () => {
      this.install_example()
    })

    /*
     *     Add commands
     */
    this.addCommand({
      id: 'vera-create',
      name: this.t('vera-create'),
      callback: () => {
        let vol: VolumeConfig = Object.assign({}, DEFAULT_VOLUME_CONFIG)
        new VolumeModal(this.app, this, vol, true).open()
      },
    })

    this.addCommand({
      id: 'vera-mount',
      name: this.t('vera-mount'),
      callback: () => {
        this.mng.mount('')
      },
    })

    this.addCommand({
      id: 'vera-umount',
      name: this.t('vera-umount'),
      callback: () => {
        this.mng.umount('')
      },
    })

    this.addCommand({
      id: 'vera-mount-all',
      name: this.t('vera-mount-all'),
      callback: () => {
        this.mng.mountAll()
      },
    })

    this.addCommand({
      id: 'vera-umount-all',
      name: this.t('vera-umount-all'),
      callback: () => {
        this.mng.umountAll()
      },
    })

    this.addCommand({
      id: 'reload-file-explorer',
      name: 'Reload File Explorer',
      callback: this.reloadFileExplorer.bind(this),
    })

    this.registerEvent(this.app.workspace.on('file-menu', this.handleFileMenu.bind(this)))

    /*
     *       addSettingTab
     */
    this.addSettingTab(new VeraSettingTab(this.app, this))

    /*
     *       Register Events
     */

    // this.registerDomEvent(document, 'click', (evt: MouseEvent) => { log('click', evt) })
    // this.registerInterval(window.setInterval(() => log('setInterval'), 5 * 60 * 1000))

    /*
     *       Register timers
     */
    this.registerInterval(
      window.setInterval(() => {
        // dbg('mng.refresh()')
        this.mng.refresh()
      }, this.settings.refreshInterval),
    )

    /*
     *       Add StatusBar Items
     */
    this.addStatusBarItem().setText('Vera *')

    /*
     *        onLayoutReady
     */
    this.app.workspace.onLayoutReady(async () => {
      if (this.settings.mountAtStart) {
        dbg(`onLayoutReady : mountAtStart`)
        await this.mng.refresh()
        await this.mng.mountAll()
      }
    })

    this.settings.pluginLoaded = Date.now().toString()
  }

  async onunload() {
    dbg('Unloading veracrypt plugin')
    if (this.settings.umountAtExit) {
      await this.mng.umountAll()
    }
  }

  install_example(force: boolean = false) {
    /*   create exampe volume   */
    let vol: VolumeConfig
    vol = Object.assign({}, DEFAULT_VOLUME_CONFIG)
    vol.id = getId()
    vol.filename = 'example.vera'
    vol.mountPath = '==example=='
    //vol = Object.assign({id: getId(), filename: 'example.vera', mountPath: '==example=='}, DEFAULT_VOLUME_CONFIG)
    this.mng.create(vol, 'example', '',true).then((value) => {})
    sleep(3)
    let vol2: VolumeConfig = Object.assign({}, DEFAULT_VOLUME_CONFIG, {id: getId(), filename: 'example2.vera', mountPath: '==example2=='})
    this.mng.create(vol2, 'example', '',true).then((value) => {})
  }

  async install(force: boolean = false) {
    if (this.settings.deviceID !== '' && !force) return
    /*   install plugin   */
    this.settings.deviceID = getDeviceId()
    this.settings.pluginVersion = this.manifest.version
    this.settings.debug = '1'
    log(`${this.manifest.name} install on deviceId ${this.settings.deviceID}`)
    let pass = await this.getPassword(ADMIN_PASSWORD)
    //if (pass !== '') await this.setPassword(ADMIN_PASSWORD, pass)
    await this.saveSettings()
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData())
  }

  async saveSettings() {
    await this.saveData(this.settings)
  }

  /*
  async reloadFolder(folderPath: string) {
    try {
      const adapter = this.app.vault.adapter
      await reload(folderPath)
      // @ts-ignore
      const existingFileNames = new Set(await adapter.fsPromises.readdir(`${adapter.basePath}/${folderPath}`))
      const dir = this.app.vault.getAbstractFileByPath(folderPath)
      // @ts-ignore
      const obsidianFileNames = new Set(dir.children.map((child) => child.name))
      let fileName: string

      for (fileName of existingFileNames) {
        if (!obsidianFileNames.has(fileName)) {
          await reload(`${folderPath}/${fileName}`)
        }
      }

      // @ts-ignore
      for (fileName of obsidianFileNames) {
        if (!existingFileNames.has(fileName)) {
          const path = `${folderPath}/${fileName}`
          //dbg(`refreshFolder.onDeleting: ${path}`)
          // @ts-ignore
          await adapter.reconcileFile('', path)
        }
      }

      async function reload(path: string) {
        //dbg(`reconcileFile: ${path}`)
        // @ts-ignore
        await adapter.reconcileFile(path, path)
      }
    } catch (e) {
      err(`refreshFolder: ${e}`)
    }
  }
  */
}
