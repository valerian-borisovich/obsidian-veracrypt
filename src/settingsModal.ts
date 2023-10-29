import { App, PluginSettingTab, Setting } from 'obsidian'
import VeraPlugin from './main'
import { Volume, DEFAULT_VOLUME_SETTINGS } from './volume'
import { VolumeModal } from './volumeModal'

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
        toggle.setValue(this.plugin.settings.mountAtStart).onChange(async (value) => {
          this.plugin.settings.mountAtStart = value
          await this.plugin.saveSettings()
        }),
      )

    new Setting(containerEl)
      .setName('Auto unmount')
      .setDesc('Unmount all enabled volumes at exit')
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.umountAtExit).onChange(async (value) => {
          this.plugin.settings.umountAtExit = value
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

      const v = new Volume(this.plugin, volume)

      new Setting(containerEl)
        .setName(name)
        .setDesc(volume.mountPath)

        .addButton((button) => {
          button.setButtonText('Config').onClick(() => {
            new VolumeModal(this.app, this.plugin, volume).open()
          })
        })

        .addToggle((toggle) => {
          toggle.setValue(v.isMounted()).onChange(async (value) => {
            if (v.isMounted()) {
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
