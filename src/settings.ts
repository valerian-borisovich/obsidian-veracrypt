import { App, PluginSettingTab, Setting } from 'obsidian'
import VeraPlugin from './main'
import { VolumeSettings, Volume } from './volume'
import { VolumeModal } from './volumeModal'

export interface ObsidianVeracryptSettings {
  mySetting: string

  mainDeviceId: string
  pluginVersion: string

  areLoaded: boolean

  debug: boolean
  logFilename: string

  defaultMountPath: string
  defaultVolumefileExtention: string

  mountAllAtStart: boolean
  umountAllAtExit: boolean

  sudoPassword: string

  volumes: VolumeSettings[]
}

export const DEFAULT_SETTINGS: ObsidianVeracryptSettings = {
  mySetting: 'default',

  mainDeviceId: '',
  pluginVersion: '0.3.3',

  areLoaded: false,

  debug: false,
  logFilename: 'vera.log',

  defaultMountPath: '==vera==',
  defaultVolumefileExtention: 'vera',

  mountAllAtStart: true,
  umountAllAtExit: true,

  sudoPassword: '',

  volumes: [],
}

export class VeraSettingTab extends PluginSettingTab {
  plugin: VeraPlugin

  constructor(app: App, plugin: VeraPlugin) {
    super(app, plugin)
    this.plugin = plugin
  }

  display(): void {
    let { containerEl } = this
    containerEl.empty()
    containerEl.addClass('settings')
    containerEl.createEl('h1', { text: 'Veracrypt ' + this.plugin.manifest.version })

    new Setting(containerEl)
      .setName('SUDO')
      .setDesc('sudo password')
      .addText((text) =>
        text
          .setPlaceholder('Enter your sudo password')
          .setValue(this.plugin.settings.sudoPassword)
          .onChange(async (value) => {
            console.log('set sudo password: ' + value)
            this.plugin.settings.sudoPassword = value
            await this.plugin.saveSettings()
          }),
      )

    new Setting(containerEl)
      .setName('Auto mount')
      .setDesc('Mount all enabled volumes at start')
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.mountAllAtStart).onChange(async (value) => {
          this.plugin.settings.mountAllAtStart = value
          await this.plugin.saveSettings()
        }),
      )

    new Setting(containerEl)
      .setName('Auto unmount')
      .setDesc('Unmount all enabled volumes at exit')
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.umountAllAtExit).onChange(async (value) => {
          this.plugin.settings.umountAllAtExit = value
          await this.plugin.saveSettings()
        }),
      )

    this.plugin.settings.volumes.forEach((volume) => {
      new Setting(containerEl)
        .setClass('volume')
        .setName(volume.filename)
        /*
        .addText((text) =>
          text
            .setPlaceholder('volume filename')
            .setValue(volume.filename)
            .onChange(async (value) => {
              volume.filename = value
              await this.plugin.saveSettings()
            }),
        )
        .addText((text) =>
          text
            .setPlaceholder('mount path')
            .setValue(volume.mountPath)
            .onChange(async (value) => {
              volume.mountPath = value
              await this.plugin.saveSettings()
            }),
        )
        */
        .addButton((button) => {
          button.setButtonText('edit').onClick(() => {
            new VolumeModal(this.app, this.plugin, volume).open()
          })
        })
        .addToggle((toggle) => {
          toggle.setValue(volume.mounted).onChange(async (value) => {
            let v = new Volume(this.plugin, volume)
            if (value) {
              await v.umount()
            } else {
              await v.mount()
            }
          })
        })
    })

    new Setting(containerEl)
      .setName('GitHub')
      .setDesc('Report Issues or Ideas, see the Source Code and Contribute.')
      .addButton(
        (button) =>
          (button.buttonEl.innerHTML =
            '<a href="https://github.com/valerian-borisovich/obsidian-veracrypt" target="_blank">Veracrypt for Obsidian</a>'),
      )
  }
}
