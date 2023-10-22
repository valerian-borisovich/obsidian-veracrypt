import { App, ButtonComponent, Modal, Setting } from 'obsidian'
import { Volume, VolumeSettings } from './volume'
import { encryptionAlgorithm, filesystemType, hashAlgorithm } from './volumeDef'
import VeraPlugin from './main'

export class VolumeModal extends Modal {
  plugin?: VeraPlugin
  volume?: VolumeSettings

  buttons: { cta: string; secondary: string } = {
    cta: 'Yes',
    secondary: 'No',
  }

  constructor(app: App, plugin: VeraPlugin, volume: VolumeSettings) {
    super(app)
    this.plugin = plugin
    this.volume = volume
  }

  onOpen() {
    this.display()
  }

  onClose() {
    let { contentEl } = this
    this.plugin.saveSettings()
    contentEl.empty()
  }

  private async display(focus?: boolean) {
    let volume = this.volume
    let { contentEl } = this
    contentEl.empty()
    contentEl.addClasses(['veracrypt', 'modals', 'volume', 'add'])
    this.titleEl.setText('Volume')

    let containerEl = contentEl.createDiv('volume')
    let name = volume.filename.replace('.vera', '')
    containerEl.createEl('h1', { text: '' + name })

    new Setting(containerEl)
      .setClass('enable')
      .setName('Enabled')
      .addToggle((toggle) =>
        toggle.setValue(volume.enabled).onChange(async (value) => {
          volume.enabled = value
          await this.plugin.saveSettings()
        }),
      )

    new Setting(containerEl)
      .setClass('automount')
      .setName('Auto Mount')
      .setDesc('auto mount at start')
      .addToggle((toggle) =>
        toggle.setValue(volume.mountAtStart).onChange(async (value) => {
          volume.mountAtStart = value
          await this.plugin.saveSettings()
        }),
      )

    new Setting(containerEl)
      .setClass('autoumount')
      .setName('Auto Unmount')
      .setDesc('auto unmount at exit')
      .addToggle((toggle) =>
        toggle.setValue(volume.umountAtExit).onChange(async (value) => {
          volume.umountAtExit = value
          await this.plugin.saveSettings()
        }),
      )

    containerEl.createEl('hr')

    new Setting(containerEl)
      .setClass('filename')
      .setName('Filename')
      .addText((text) =>
        text
          .setPlaceholder('volume/filename.vera')
          .setValue(volume.filename)
          .onChange(async (value) => {
            volume.filename = value
            await this.plugin.saveSettings()
          }),
      )

    new Setting(containerEl)
      .setClass('mount')
      .setName('Mount to')
      .setDesc('folder to mount')
      .addText((text) =>
        text
          .setPlaceholder('mount path')
          .setValue(volume.mountPath)
          .onChange(async (value) => {
            volume.mountPath = value
            await this.plugin.saveSettings()
          }),
      )

    containerEl.createEl('br')

    new Setting(containerEl)
      .setClass('password')
      .setName('Password')
      .setDesc('password for open volume')
      .addText((text) =>
        text
          .setPlaceholder('enter password')
          .setValue(volume.password)
          .onChange(async (value) => {
            volume.password = value
            await this.plugin.saveSettings()
          }),
      )

    new Setting(containerEl)
      .setClass('keyfile')
      .setName('Keyfile')
      .setDesc('keyfile filename for open volume (optional)')
      .addText((text) =>
        text
          .setPlaceholder('')
          .setValue(volume.keyfile)
          .onChange(async (value) => {
            volume.keyfile = value
            await this.plugin.saveSettings()
          }),
      )

    containerEl.createEl('hr')

    containerEl = contentEl.createDiv('details')
    // containerEl.createEl('h2', { text: 'Details:' })

    new Setting(containerEl)
      .setClass('size')
      .setName('Size')
      .setDesc('size in megabytes')
      .addText((text) =>
        text
          .setPlaceholder('size')
          .setValue(volume.size)
          .onChange(async (value) => {
            volume.size = value
            await this.plugin.saveSettings()
          }),
      )

    let dropdownOptions: Record<string, string> = {}
    filesystemType.forEach((s) => {
      dropdownOptions[s] = s
    })

    new Setting(containerEl)
      .setName('Filesystem')
      .setDesc('filesystem type')
      .addDropdown((dropdown) => {
        dropdown
          .addOptions(dropdownOptions)
          .setValue(volume.fs)
          .onChange(async (value) => {
            volume.fs = value
            await this.plugin.saveSettings()
          })
      })

    dropdownOptions = {}
    encryptionAlgorithm.forEach((s) => {
      dropdownOptions[s] = s
    })

    new Setting(containerEl)
      .setName('Encryption')
      .setDesc('encryption algorithm')
      .addDropdown((dropdown) => {
        dropdown
          .addOptions(dropdownOptions)
          .setValue(volume.encryption)
          .onChange(async (value) => {
            volume.encryption = value
            await this.plugin.saveSettings()
          })
      })

    dropdownOptions = {}
    hashAlgorithm.forEach((s) => {
      dropdownOptions[s] = s
    })

    new Setting(containerEl)
      .setName('Hash')
      .setDesc('hash algorithm')
      .addDropdown((dropdown) => {
        dropdown
          .addOptions(dropdownOptions)
          .setValue(volume.hash)
          .onChange(async (value) => {
            volume.hash = value
            await this.plugin.saveSettings()
          })
      })

    containerEl.createEl('hr')
    containerEl.createEl('br')

    const buttonEl = containerEl.createDiv('confirm-buttons')
    new ButtonComponent(buttonEl).setButtonText('OK').onClick(() => {
      this.plugin.saveSettings()
      this.close()
    })
  }
}
