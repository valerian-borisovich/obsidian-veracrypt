import { App, ButtonComponent, Modal, Setting } from 'obsidian'
import { Volume, VolumeSettings } from './volume'

import { ConfirmModal, confirmWithModal } from './confirm'
import { encryptionAlgorithm, filesystemType, hashAlgorithm } from './hlp'
import VeraPlugin from './main'

export class VolumeModal extends Modal {
  plugin!: VeraPlugin
  volume!: VolumeSettings

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
    contentEl.addClasses(['veracrypt', 'modals', 'volume', 'add', 'confirm-modal'])
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
          .setPlaceholder('newVolume')
          .setValue(
            volume.filename.substring(
              volume.filename.lastIndexOf('/') ? 0 : volume.filename.lastIndexOf('/'),
              volume.filename.lastIndexOf('.'),
            ),
          )
          .onChange(async (value) => {
            volume.filename = value.endsWith(this.plugin.settings.defaultVolumefileExtention)
              ? value
              : value + '.' + this.plugin.settings.defaultVolumefileExtention
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
            volume.mountPath =
              value.length > 2
                ? value
                : volume.filename.substring(
                    volume.filename.lastIndexOf('/') ? 0 : volume.filename.lastIndexOf('/'),
                    volume.filename.lastIndexOf('.'),
                  )
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
          .setValue(volume.size.substring(0, volume.size.length - 1))
          .onChange(async (value) => {
            volume.size = value + 'M'
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
          .setValue(volume.filesystem)
          .onChange(async (value) => {
            volume.filesystem = value
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
    if (volume.createdTime === '') {
      // create volume
      new ButtonComponent(buttonEl).setButtonText(' Create ').onClick(() => {
        this.plugin.settings.volumes.push(volume)
        this.plugin.saveSettings()
        this.close()
        let v = new Volume(this.plugin, volume)
        v.create()
        this.plugin.saveSettings()
        //this.plugin.app.workspace.activeLeaf.rebuildView()
      })
    } else {
      new ButtonComponent(buttonEl).setButtonText(' Save ').onClick(() => {
        this.plugin.saveSettings()
        this.close()
      })
      new ButtonComponent(buttonEl)
        .setButtonText(' Delete ')
        .setClass('delete')
        .onClick(() => {
          confirmWithModal(this.plugin.app, 'Do you have delete?', volume.filename).then((value) => {
            if (value) {
              let v = new Volume(this.plugin, volume)
              v.delete()
            }
          })

          this.plugin.saveSettings()
          this.close()
        })
    }
  }
}
