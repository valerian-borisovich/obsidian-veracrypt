//
// import {Notice,Plugin,setIcon,TFolder,TFile,TAbstractFile,debounce,DropdownComponent,normalizePath,} from 'obsidian'
import {Plugin,TFolder,TFile,normalizePath,} from 'obsidian'
import { VeraPluginSettings, DEFAULT_SETTINGS } from './settings'
import { VeraSettingTab } from './settingsModal'
//import { Volume, DEFAULT_VOLUME_CONFIG, VolumeConfig } from './volume'
import { DEFAULT_VOLUME_CONFIG, VolumeConfig } from './volume'
import { PasswordPromt } from './passwordModal'
import { Vera } from './vera'
//import { log, dbg, err, warn, machineIdSync, ps, exec, run } from './hlp'
import { log, dbg, err, warn, machineIdSync } from './hlp'
import { I18n } from "./hlp/i18n"
import type { LangType, LangTypeAndAuto, TransItemType } from "./hlp/i18n";
import { VolumesManager } from './volumesManager'
import { ADMIN_PASSWORD } from './constant'



export default class VeraPlugin extends Plugin {
  settings!: VeraPluginSettings
  vera!: Vera

  mng!: VolumesManager
  // volumes!: VolumesManager
  // this.manifest = this.plugin.manifest

  ribbonIconButton!: HTMLElement
  statusBarItem!: HTMLElement

  promts: string[] = []

  /*
   *
   */
  i18n!: I18n

  t = (x: TransItemType, vars?: any) => {
    return this.i18n.t(x, vars);
  };
  /*
   *
   */
  async getPassword(id: string, promt: boolean = true) {
    let pass = await this.vera.getPassword(id)
    dbg(`VeraPlugin.getPassword: ${id} == ${pass}`)
    if (pass === '' && promt) {
      if (!this.promts.contains(id)) {
        this.promts.push(id)
        let dlg = new PasswordPromt(this.app, this, id, '')
        dlg.open()
        pass = await this.vera.getPassword(id)
        dbg(`VeraPlugin.getPassword again: ${id} == ${pass}`)
      }
    }
    return pass
  }

  async setPassword(id: string, password: string) {
    await this.vera.setPassword(id, password)
    dbg(`VeraPlugin.setPassword: ${id} : ${password}`)
  }
  /*
   *
   */
  getAbsolutePath(path: String) {
    let root = (this.app.vault.adapter as any).basePath
    return root + '/' + path
  }

  async checkFolder(path: string, create: Boolean = true) {
    let folderpath = normalizePath(path)

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

  async name(filename: string) {
    return filename.substring(filename.lastIndexOf('/') ? 0 : filename.lastIndexOf('/'), filename.lastIndexOf('.'))
  }

  async exists(filename: string) {
    return await this.app.vault.adapter.exists(filename)
  }

  /*
   *
   */
  async onload() {
    await this.loadSettings()
    log(`Veracrypt plugin version ${this.manifest.version} loaded.`)

    // lang should be load early, but after settings
    this.i18n = new I18n(this.settings.lang, async (lang: LangTypeAndAuto) => {
      this.settings.lang = lang;
      await this.saveSettings();
    });

    this.vera = new Vera(this.settings)
    this.mng = new VolumesManager(this)

    await this.install(true)

    await this.mng.refresh()

    /*
    // This creates an icon in the left ribbon.
    this.ribbonIconButton = this.addRibbonIcon(
      this.settings.pluginLoaded ? 'eye' : 'eye-off',
      this.settings.pluginLoaded ? 'Mount all' : 'Unmount all',
      () => {
        this.toggleFunctionality()
      },
    )
    */

    /*
    this.addRibbonIcon('dice', 'Vera', async () => {
      // new Notice('is a veracrypt notice!')
      //
      let d = '/'
      await this.refreshFolder(d)
    })
    */

    this.addRibbonIcon('eye', 'Vera mount all', async () => {
      await this.mng.mountAll()
    })

    this.addRibbonIcon('trash', 'Vera umount all', async () => {
      await this.mng.umountAll()
    })

    this.addRibbonIcon('refresh', 'Vera refresh', async () => {
      await this.mng.refresh()
    })

    /*
    this.addCommand({
      id: 'open-vera-modal',
      name: 'Open Veracrypt Modal',
      // callback: () => {
      // 	log('Veracrypt Modal Callback');
      // },
      checkCallback: (checking: boolean) => {
        let leaf = this.app.workspace.activeLeaf
        if (leaf) {
          if (!checking) {
            new VolumeModal(this.app, this, ).open()
          }
          return true
        }
        return false
      },
    })
    */
    this.addCommand({
      id: 'veracrypt-umount-all',
      name: 'Veracrypt Unmount All',
      callback: () => {
        log('Veracrypt Unmount Callback')
      },
      checkCallback: (checking: boolean) => {
        if (!checking) {
          log('Veracrypt checkCallback checking')
        }
        this.mng.umountAll()
      },
    })

    this.addSettingTab(new VeraSettingTab(this.app, this))

    // this.registerDomEvent(document, 'click', (evt: MouseEvent) => { log('click', evt) })

    // this.registerInterval(window.setInterval(() => log('setInterval'), 5 * 60 * 1000))

    /*
    this.registerInterval(
      window.setInterval(() => {
        log('listVolumes')
        this.volumesList()
      }, 2 * 1000),
    )
    */

    this.app.workspace.onLayoutReady(async () => {
      if (this.settings.mountAtStart) {
        dbg(`onLayoutReady : mountAtStart`)
        await this.mng.mountAll()
      }
    })

    this.addStatusBarItem().setText('Veracrypt loaded')
    // DropdownComponent
    this.settings.pluginLoaded = true
  }

  async onunload() {
    dbg('Unloading veracrypt plugin')
    if (this.settings.umountAtExit) {
      // this.mng.umountAll().then((r) => {})
      await this.mng.umountAll()
    }
  }

  async install(force: boolean = false) {
    if (this.settings.devID !== '' && !force) return

    /*   install plugin   */
    this.settings.devID = machineIdSync(true)
    this.settings.pluginVersion = this.manifest.version
    this.settings.pluginDebug = true
    log(`${this.manifest.name} install on device ${this.settings.devID}`)
    let pass = await this.getPassword(ADMIN_PASSWORD)
    if (pass !== '') await this.setPassword(ADMIN_PASSWORD, pass)
    await this.saveSettings()

    /*   create exampe volume   */
    let vol: VolumeConfig = DEFAULT_VOLUME_CONFIG
    vol.filename = 'example.vera'
    vol.mountPath = '==example=='
    await this.mng.create(vol, 'example')
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData())
  }

  async saveSettings() {
    await this.saveData(this.settings)
  }

  /*
    setupOnEditHandler() {
      this.log('Setup handler');

      this.registerEvent(
          this.app.vault.on('modify', (file) => {
            this.log('TRIGGER FROM MODIFY');
            return this.handleFileChange(file, 'modify');
          }),
      );
    }
  */

  /*
  async toggleFunctionality() {
    this.settings.pluginLoaded = !this.settings.pluginLoaded
    // this.ribbonIconButton.ariaLabel = this.settings.pluginLoaded ? 'Mount' : 'Unmount'
    setIcon(this.ribbonIconButton, this.settings.pluginLoaded ? 'eye' : 'eye-off')
    // this.statusBarItem.innerHTML = this.settings.pluginLoaded ? 'Loaded' : ''
    await this.volumesMount()
  }

   */

  /*
   *
   *
   *
   *

  async volumesMount0(): Promise<void> {
    log('volumesMountAll')
    this.settings.volumes.forEach((volume) => {
      if (volume.enabled) {
        if (!this.mng.isMounted(volume)) {
          this.mng.mount(volume)
          this.refreshFolder(volume.mountPath)
        } else {
          warn(`volumesMount: '${volume.mountPath}' already mounted!`)
        }
      }
    })
  }

  async volumesUmount0(): Promise<void> {
    log('volumesUmountAll')
    this.settings.volumes.forEach((volume) => {
      if (this.mng.isMounted(volume)) {
        this.mng.umount(volume)
        this.refreshFolder(volume.mountPath)
      } else {
        warn(`volumesUmount: ${volume.mountPath} already unmounted!`)
      }
    })
  }

  async volumesUmount(): Promise<void> {
    log('volumesUmountAll')
    await this.mng.umountAll()
  }

  async volumesMount(): Promise<void> {
    log('volumesMountAll')
    await this.mng.mountAll()
  }
  */

  async reloadFolder(folderPath: string) {
    try {
      const adapter = this.app.vault.adapter
      await reload(folderPath)
      // @ts-ignore
      const existingFileNames = new Set(await adapter.fsPromises.readdir(`${adapter.basePath}/${folderPath}`))
      const dir = this.app.vault.getAbstractFileByPath(folderPath)
      // @ts-ignore
      const obsidianFileNames = new Set(dir.children.map((child) => child.name))

      for (const fileName of existingFileNames) {
        if (!obsidianFileNames.has(fileName)) {
          await reload(`${folderPath}/${fileName}`)
        }
      }

      for (const fileName of obsidianFileNames) {
        if (!existingFileNames.has(fileName)) {
          const path = `${folderPath}/${fileName}`
          dbg(`refreshFolder.onDeleting: ${path}`)
          // @ts-ignore
          await adapter.reconcileFile('', path)
        }
      }

      async function reload(path: string) {
        dbg(`reconcileFile: ${path}`)
        // @ts-ignore
        await adapter.reconcileFile(path, path)
      }
    } catch (e) {
      err(`refreshFolder: ${e}`)
    }
  }
}
