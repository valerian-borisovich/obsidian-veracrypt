// import { Notice, Plugin, setIcon, TFolder, TFile, TAbstractFile, debounce } from 'obsidian'
import { Plugin, setIcon } from 'obsidian'

import { VeraSettings, ObsidianVeracryptSettings, DEFAULT_SETTINGS } from './veraSettings'
import { VeraSettingTab } from './settingsModal'
import { Volume } from './volume'
import { getCurrenVersion, proxySet } from './vera'

export default class VeraPlugin extends Plugin {
  settings!: ObsidianVeracryptSettings
  vera!: VeraSettings

  ribbonIconButton!: HTMLElement
  statusBarItem!: HTMLElement

  async onload() {
    console.log('Loading veracrypt plugin  ' + getCurrenVersion())
    await this.loadSettings()

    console.debug('Loading vera')
    // this.vera = new VeraSettings(Object.assign({}, DEFAULT_SETTINGS, await this.loadData()))
    this.vera = new VeraSettings(this.settings)

    // This creates an icon in the left ribbon.
    this.ribbonIconButton = this.addRibbonIcon(
      this.settings.pluginLoaded ? 'eye' : 'eye-off',
      this.settings.pluginLoaded ? 'Mount all' : 'Unmount all',
      (evt: MouseEvent) => {
        this.toggleFunctionality()
      },
    )

    /*    */
    this.addRibbonIcon('dice', 'Vera', async () => {
      // new Notice('is a veracrypt notice!')
      let d = '/'
      await this.refreshFolder(d)
    })

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
      // 	console.log('Veracrypt Modal Callback');
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

    this.addSettingTab(new VeraSettingTab(this.app, this))

    // this.registerDomEvent(document, 'click', (evt: MouseEvent) => { console.log('click', evt) })

    // this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000))

    /*
    this.registerInterval(
      window.setInterval(() => {
        console.log('listVolumes')
        this.volumesList()
      }, 2 * 1000),
    )
    */

    this.app.workspace.onLayoutReady(async () => {
      proxySet('*.google.com')
      if (this.settings.mountAtStart) {
        await this.volumesMount()
      }
    })

    this.addStatusBarItem().setText('Veracrypt loaded')
  }

  onunload() {
    console.log('Unloading veracrypt plugin ' + getCurrenVersion())
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
    this.ribbonIconButton.ariaLabel = this.settings.pluginLoaded ? 'Mount' : 'Unmount'
    setIcon(this.ribbonIconButton, this.settings.pluginLoaded ? 'eye' : 'eye-off')
    // this.statusBarItem.innerHTML = this.settings.pluginLoaded ? 'Loaded' : ''
    if (this.settings.pluginLoaded) {
      await this.volumesUmount()
    } else {
      await this.volumesMount()
    }
  }

  /*
   *
   *
   *
   *
   */

  async volumesMount(): Promise<void> {
    console.debug('volumesMountAll')
    this.settings.volumes.forEach((volume) => {
      if (volume.enabled) {
        let v = new Volume(this, volume)
        if (!v.isMounted()) {
          v.mount()
          this.refreshFolder(v.volume.mountPath)
        } else {
          console.warn('volumesMount.mount: ' + v.volume.mountPath + ' already mounted!')
        }
      }
    })
  }

  async volumesUmount(): Promise<void> {
    console.log('volumesUmountAll')

    this.settings.volumes.forEach((volume) => {
      let v = new Volume(this, volume)
      if (v.isMounted()) {
        v.umount()
        this.refreshFolder(v.volume.mountPath)
      } else {
        console.warn('volumesUmount.umount: ' + v.volume.mountPath + ' already unmounted!')
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
      console.debug('volumesList.spawn.r: ' + r.toString())
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
        console.debug('volumesList: ' + l.toString())
        return l
      })
    } catch (e) {
      console.error('volumesList.err: ' + e.toString())
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
          console.debug(`refreshFolder.onDeleting: ${path}`)
          // @ts-ignore
          await adapter.reconcileFile('', path)
        }
      }

      async function reload(path: string) {
        console.debug(`reconcileFile: ${path}`)
        // @ts-ignore
        await adapter.reconcileFile(path, path)
      }
    } catch (e) {
      console.error(`refreshFolder: ${e}`)
    }
  }
}
