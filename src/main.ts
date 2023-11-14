import { Notice, Plugin, setIcon, TFolder, TFile, TAbstractFile, debounce } from 'obsidian'

import { VeraPluginSettings, DEFAULT_SETTINGS } from './settings'
import { VeraSettingTab } from './settingsModal'
import { Volume } from './volume'
import { PasswordPromt } from './passwordModal'
import { Vera } from './vera'
// import { getVersion, proxySet } from './hlp'
import { getVersion, log, dbg, err, warn } from './hlp'
// import { ADMIN_PASSWORD } from './constant'
// import electron, { app } from 'electron'

export default class VeraPlugin extends Plugin {
  settings!: VeraPluginSettings
  vera!: Vera

  ribbonIconButton!: HTMLElement
  statusBarItem!: HTMLElement

  async getPassword(id: string) {
    let pass = await this.vera.getPassword(id)
    // dbg('VeraPlugin.getPassword: ' + id + ' == ' + pass)
    if (pass === '') {
      let dlg = new PasswordPromt(this.app, this, id, '')
      dlg.open()
      // pass = dlg.newPassword
      pass = await this.vera.getPassword(id)
    }
    return pass
  }

  async setPassword(id: string, password: string) {
    let pass = await this.vera.setPassword(id, password)
    dbg('VeraPlugin.getPassword: ' + id + ' : ' + password + ' == ' + pass)
  }

  async onload() {
    let plugin_version = await getVersion()
    dbg(`Loading veracrypt plugin ${plugin_version} version`)
    await this.loadSettings()

    this.vera = new Vera(this.settings)

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
      //await proxySet()
    })

     */

    this.addRibbonIcon('eye', 'Vera', async () => {
      await this.volumesMount()
    })

    this.addRibbonIcon('trash', 'Vera', async () => {
      await this.volumesUmount()
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
        this.volumesUmount()
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
        log(`app.workspace.onLayoutReady : settings.mountAtStart`)
        await this.volumesMount()
      }
    })

    this.addStatusBarItem().setText('Veracrypt loaded')
  }

  onunload() {
    dbg('Unloading veracrypt plugin')
    if (this.settings.umountAtExit) {
      this.volumesUmount().then((r) => {})
    }
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

  async toggleFunctionality() {
    this.settings.pluginLoaded = !this.settings.pluginLoaded
    // this.ribbonIconButton.ariaLabel = this.settings.pluginLoaded ? 'Mount' : 'Unmount'
    setIcon(this.ribbonIconButton, this.settings.pluginLoaded ? 'eye' : 'eye-off')
    // this.statusBarItem.innerHTML = this.settings.pluginLoaded ? 'Loaded' : ''
    await this.volumesMount()
  }

  /*
   *
   *
   *
   *
   */

  async volumesMount(): Promise<void> {
    dbg('volumesMountAll')
    this.settings.volumes.forEach((volume) => {
      if (volume.enabled) {
        let v = new Volume(this, volume)
        if (!v.isMounted()) {
          v.mount()
          this.refreshFolder(v.volume.mountPath)
        } else {
          warn('volumesMount.mount: ' + v.volume.mountPath + ' already mounted!')
        }
      }
    })
  }

  async volumesUmount(): Promise<void> {
    log('volumesUmountAll')

    this.settings.volumes.forEach((volume) => {
      let v = new Volume(this, volume)
      if (v.isMounted()) {
        v.umount()
        this.refreshFolder(v.volume.mountPath)
      } else {
        warn('volumesUmount.umount: ' + v.volume.mountPath + ' already unmounted!')
      }
    })
  }

  volumesList() {
    let r, a, v
    let l: [] = []
    let nomounted = 'Error: No volumes mounted.'
    // let cmd = `echo "${SUDO_PASSWORD}" | sudo -S veracrypt -t -l --non-interactive --force`
    const spawn = require('child_process').spawnSync

    try {
      r = spawn('veracrypt', ['-t', '-l', '--non-interactive', '--force']).stdout.toString('utf8')
      dbg('volumesList.spawn.r: ' + r.toString())
      if (r.substring(nomounted).length) {
        return l
      }

      r.split('\n').forEach((v: string) => {
        if (v.length) {
          a = v.split(' ')
          // @ts-ignore
          l.push({ filename: a[1], mount: a[3] })
        }
      })

      process.on('exit', function () {
        dbg('volumesList: ' + l.toString())
        return l
      })
    } catch (e) {
      err('volumesList.err: ' + e)
    }
    return l
  }

  async refreshFolder(folderPath: string) {
    try {
      const adapter = this.app.vault.adapter // const adapter = this.app.vault.adapter as any
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
