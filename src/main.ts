import { Notice, Plugin, setIcon, TFolder, TFile, TAbstractFile, debounce } from 'obsidian'

import { ObsidianVeracryptSettings, DEFAULT_SETTINGS } from './settings'
import { Volume } from './volume'
//import { execute } from './execute'
import { VeraSettingTab } from './settingsModal'
//import { exec, spawnSync as spawn } from 'child_process'

export default class VeraPlugin extends Plugin {
  settings!: ObsidianVeracryptSettings

  ribbonIconButton!: HTMLElement
  statusBarItem!: HTMLElement

  async onload() {
    console.debug('Loading veracrypt plugin')
    await this.loadSettings()

    // This creates an icon in the left ribbon.
    this.ribbonIconButton = this.addRibbonIcon(
      this.settings.areLoaded ? 'eye' : 'eye-off',
      this.settings.areLoaded ? 'Mount all' : 'Unmount all',
      (evt: MouseEvent) => {
        this.toggleFunctionality()
      },
    )

    /*    */
    this.addRibbonIcon('dice', 'Vera', async () => {
      // new Notice('is a veracrypt notice!')
      let d = '==pvt=='
      await this.reloadDirectory(d)
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
      if (this.settings.mountAllAtStart) {
        await this.volumesMount()
      }
    })

    this.addStatusBarItem().setText('Veracrypt loaded')
  }

  onunload() {
    console.debug('Unloading veracrypt plugin')
    if (this.settings.umountAllAtExit) {
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
    this.settings.areLoaded = !this.settings.areLoaded
    this.ribbonIconButton.ariaLabel = this.settings.areLoaded ? 'Mount' : 'Unmount'
    setIcon(this.ribbonIconButton, this.settings.areLoaded ? 'eye' : 'eye-off')
    // this.statusBarItem.innerHTML = this.settings.areLoaded ? 'Loaded' : ''
    await this.volumesMount()
  }

  /*
   *
   *
   *
   *
   */

  async mountVolumes0(): Promise<void> {
    console.debug('mountVolumes')
    let skip = false
    let l = this.volumesList()
    this.settings.volumes.forEach((volume) => {
      skip = false
      l.forEach((v) => {
        if (volume.mountPath === v['mount']) {
          skip = true
        }
      })

      // if (volume.enabled && !volume.isMounted()) {
      if (!skip && volume.enabled) {
        let v = new Volume(this, volume)
        v.mount()
      }
    })
  }

  async volumesMount(): Promise<void> {
    console.log('volumesMount')
    this.settings.volumes.forEach((volume) => {
      if (volume.enabled) {
        let v = new Volume(this, volume)
        if (!v.isMounted()) {
          v.mount()
          this.reloadDirectory(v.volume.mountPath)
        } else {
          console.error('volumesMount.mount: ' + v.volume.mountPath + ' already mounted!')
        }
      }
    })
  }

  async volumesUmount(): Promise<void> {
    console.log('volumesUmount')

    this.settings.volumes.forEach((volume) => {
      console.log('volumesUmount.volume: ' + volume.filename)
      let v = new Volume(this, volume)
      if (v.isMounted()) {
        v.umount()
        this.reloadDirectory(v.volume.mountPath)
      } else {
        console.error('volumesUmount.umount: ' + v.volume.mountPath + ' already unmounted!')
      }
    })
  }

  volumesList() {
    console.log('volumesList')
    let r, a, v
    let l: [] = []
    let nomounted = 'Error: No volumes mounted.'
    let SUDO_PASSWORD = this.settings.sudoPassword
    // let cmd = `echo "${SUDO_PASSWORD}" | sudo -S veracrypt -t -l --non-interactive --force`
    const spawn = require('child_process').spawnSync

    r = spawn('veracrypt', ['-t', '-l', '--non-interactive', '--force']).stdout.toString('utf8')
    console.log(r.toString())
    if (r.substring(nomounted)) {
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
      console.log('volumesList: ')
      l.forEach((v) => {
        console.log(v['filename'])
      })
      return l
    })
    return l
  }

  async reloadDirectory(directoryPath: string) {
    const adapter = this.app.vault.adapter // const adapter = this.app.vault.adapter as any
    await reload(directoryPath)
    // @ts-ignore
    const existingFileNames = new Set(await adapter.fsPromises.readdir(`${adapter.basePath}/${directoryPath}`))
    const dir = this.app.vault.getAbstractFileByPath(directoryPath)
    // @ts-ignore
    const obsidianFileNames = new Set(dir.children.map((child) => child.name))

    for (const fileName of existingFileNames) {
      if (!obsidianFileNames.has(fileName)) {
        await reload(`${directoryPath}/${fileName}`)
      }
    }

    for (const fileName of obsidianFileNames) {
      if (!existingFileNames.has(fileName)) {
        const path = `${directoryPath}/${fileName}`
        console.debug(`Deleting ${path}`)
        // @ts-ignore
        await adapter.reconcileFile('', path)
      }
    }

    async function reload(path: string) {
      console.debug(`Reloading ${path}`)
      // @ts-ignore
      await adapter.reconcileFile(path, path)
    }
  }
}
