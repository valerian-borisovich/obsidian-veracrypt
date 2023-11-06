import { App, ButtonComponent, Modal, Notice, Setting } from 'obsidian'
import VeraPlugin from './main'

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

export { PasswordModal }
