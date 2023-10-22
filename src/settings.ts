import { App, PluginSettingTab, Setting } from 'obsidian'
import VeraPlugin from './main'
import { VolumeSettings, Volume, DEFAULT_VOLUME_SETTINGS } from './volume'
import { VolumeModal } from './volumeModal'

export interface ObsidianVeracryptSettings {
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
    containerEl.addClass('veracrypt')
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

    new Setting(containerEl).addButton((button) => {
      button.setButtonText('Create new').onClick(() => {
        new VolumeModal(this.app, this.plugin, DEFAULT_VOLUME_SETTINGS).open()
      })
    })

    containerEl.createEl('hr')

    this.plugin.settings.volumes.forEach((volume) => {
      let name = volume.filename.substring(
        volume.filename.lastIndexOf('/') ? 0 : volume.filename.lastIndexOf('/'),
        volume.filename.lastIndexOf('.'),
      )
      new Setting(containerEl)
        .setName(name)
        .setDesc(volume.mountPath)

        .addButton((button) => {
          button.setButtonText('Config').onClick(() => {
            new VolumeModal(this.app, this.plugin, volume).open()
          })
        })

        .addToggle((toggle) => {
          toggle.setValue(volume.mounted).onChange(async (value) => {
            let v = new Volume(this.plugin, volume)
            if (!value) {
              await v.umount()
            } else {
              await v.mount()
            }
          })
        })
    })

    containerEl.createEl('hr')

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
