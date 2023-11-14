import { App, ButtonComponent, Modal, Notice, Setting } from 'obsidian'
import VeraPlugin from './main'
import { log, dbg, err } from './hlp'
import { ADMIN_PASSWORD } from './constant'

class PasswordModal extends Modal {
  plugin: VeraPlugin
  name: string
  newPassword: string

  constructor(app: App, plugin: VeraPlugin, name: string, newPassword: string) {
    super(app)
    this.plugin = plugin
    this.newPassword = newPassword
    this.name = name
  }

  onOpen() {
    let { contentEl } = this

    // const t = (x: TransItemType, vars?: any) => {
    const t = (x: string, vars?: any) => {
      return x
      // return this.plugin.i18n.t(x, vars)
    }

    // contentEl.setText("Add Or change password.");
    contentEl.createEl('h2', { text: t('modal_password_title') })
    t('modal_password_shortdesc')
      .split('\n')
      .forEach((val, idx) => {
        contentEl.createEl('p', {
          text: val,
        })
      })
    ;[
      t('modal_password_attn1'),
      t('modal_password_attn2'),
      t('modal_password_attn3'),
      t('modal_password_attn4'),
      t('modal_password_attn5'),
    ].forEach((val, idx) => {
      if (idx < 3) {
        contentEl.createEl('p', {
          text: val,
          cls: 'password-disclaimer',
        })
      } else {
        contentEl.createEl('p', {
          text: val,
        })
      }
    })

    new Setting(contentEl)
      .addButton((button) => {
        button.setButtonText(t('modal_password_secondconfirm'))
        button.onClick(async () => {
          await this.plugin.setPassword(this.name, this.newPassword)
          // await this.plugin.saveSettings()
          new Notice(t('modal_password_notice'))
          this.close()
        })
        button.setClass('password-second-confirm')
      })
      .addButton((button) => {
        button.setButtonText(t('goback'))
        button.onClick(() => {
          this.close()
        })
      })
  }

  onClose() {
    let { contentEl } = this
    contentEl.empty()
  }
}

class PasswordPromt extends Modal {
  plugin: VeraPlugin
  name: string
  newPassword: string
  savePassword: boolean

  constructor(app: App, plugin: VeraPlugin, name: string, newPassword: string = '') {
    super(app)
    this.plugin = plugin
    this.name = name
    this.savePassword = true
    this.newPassword = newPassword
  }

  async save() {
    if (this.savePassword) {
      await this.plugin.setPassword(this.name, this.newPassword)
      await this.plugin.saveSettings()
      new Notice(`Password for ${this.name} saved!`)
    }
  }

  onOpen() {
    let { contentEl } = this

    // const t = (x: TransItemType, vars?: any) => {
    const t = (x: string, vars?: any) => {
      return x
      // return this.plugin.i18n.t(x, vars)
    }

    if (this.newPassword === '') {
      // this.plugin.getPassword(this.name).then(value => {this.newPassword = value})
    }

    // contentEl.setText("Add Or change password.");
    // contentEl.createEl('h2', { text: t('password_promt_title') })
    contentEl.createEl('h2', { text: this.name })

    new Setting(contentEl)
      .setName('Password')
      .setDesc('password')
      .addText((text) =>
        text
          .setPlaceholder('put your password')
          .setValue(this.newPassword)
          .onChange(async (value) => {
            log('set password: ' + value)
            this.newPassword = value
            await this.save()
          }),
      )

    new Setting(contentEl)
      .setName('Save')
      .setDesc('save password')
      .addToggle((toggle) =>
        toggle.setValue(this.savePassword).onChange(async (value) => {
          this.savePassword = value
          await this.save()
        }),
      )

    new Setting(contentEl)
      .addButton((button) => {
        button.setButtonText(t('OK'))
        button.onClick(async () => {
          // await this.plugin.setPassword(this.name, this.newPassword)
          await this.save()
          this.close()
        })
        button.setClass('password-second-confirm')
      })
      .addButton((button) => {
        button.setButtonText(t('Cancel'))
        button.onClick(() => {
          this.close()
        })
      })
  }

  onClose() {
    let { contentEl } = this
    contentEl.empty()
  }
}

export { PasswordModal, PasswordPromt }
