import { Notice, Plugin, setIcon, TFolder } from 'obsidian'
import { ObsidianVeracryptSettings, VeraSettingTab, DEFAULT_SETTINGS } from './settings'
import { Volume } from './volume'
import { execute } from './execute.mjs'

const __DEV_MODE__ = true

export default class VeraPlugin extends Plugin {
  settings!: ObsidianVeracryptSettings
  ribbonIconButton!: HTMLElement
  statusBarItem!: HTMLElement

  async toggleFunctionality() {
    this.settings.areLoaded = !this.settings.areLoaded
    this.ribbonIconButton.ariaLabel = this.settings.areLoaded ? 'Mount' : 'Unmount'
    setIcon(this.ribbonIconButton, this.settings.areLoaded ? 'eye' : 'eye-off')
    this.statusBarItem.innerHTML = this.settings.areLoaded ? 'Loaded' : ''
    await this.mountVolumes()
  }

  async onload() {
    console.log('loading veracrypt plugin')
    await this.loadSettings()

    // This creates an icon in the left ribbon.
    this.ribbonIconButton = this.addRibbonIcon(
      this.settings.areLoaded ? 'eye' : 'eye-off',
      this.settings.areLoaded ? 'Mount all' : 'Unmount all',
      (evt: MouseEvent) => {
        this.toggleFunctionality()
      },
    )

    this.addRibbonIcon('dice', 'Plugin', async () => {
      // new Notice('This is a veracrypt notice!')
      // await this.mountVolumes()
      await this.list()
    })

    this.addStatusBarItem().setText('Veracrypt loaded')

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

    // this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
    //  console.log('click', evt) })

    // this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000))

    this.app.workspace.onLayoutReady(async () => {
      if (this.settings.mountAllAtStart) {
        await this.mountVolumes()
      }
    })
  }

  onunload() {
    console.log('unloading veracrypt plugin')
    if (this.settings.umountAllAtExit) {
      this.umountVolumes().then((r) => {})
    }
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData())
  }

  async saveSettings() {
    await this.saveData(this.settings)
  }

  log(...data: any[]) {
    if (!__DEV_MODE__) {
      return
    }
    console.log('[vera]:', ...data)
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

  async mountVolumes(): Promise<void> {
    console.log('mountVolumes')
    this.settings.volumes.forEach((volume) => {
      if (volume.enabled) {
        let v = new Volume(this, volume)
        v.mount()
      }
    })
  }

  async umountVolumes(): Promise<void> {
    console.log('umountVolumes')
    this.settings.volumes.forEach((volume) => {
      let v = new Volume(this, volume)
      v.umount()
    })
  }

  async list(): Promise<void> {
    console.log('list mounted')
    let nomounted = 'Error: No volumes mounted.'
    let SUDO_PASSWORD = this.settings.sudoPassword
    let cmd = `echo "${SUDO_PASSWORD}" | sudo -S veracrypt -t -l --non-interactive --force`

    await execute(cmd).then((o) => {
      console.log('list mounted: ' + o.toString())
    })
  }

  test() {
    this.app.vault.adapter.read()
  }
}
