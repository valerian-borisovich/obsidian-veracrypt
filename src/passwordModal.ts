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
    this.plugin.settings.savePassword = this.savePassword
    if (this.savePassword) {
      dbg(`save password '${this.newPassword}' for ${this.name}`)
      await this.plugin.vera.setPassword(this.name, this.newPassword)
      new Notice(`Password for ${this.name} saved!`)
    }
    await this.plugin.saveSettings()
  }

  async display0() {
    let { contentEl } = this

    // const t = (x: TransItemType, vars?: any) => {
    const t = (x: string, vars?: any) => {
      return x
      // return this.plugin.i18n.t(x, vars)
    }

    if (this.newPassword === '') {
      this.plugin.vera.getPassword(this.name).then((v) => {
        this.newPassword = v
      })
    }

    // contentEl.setText("Add Or change password.");
    // contentEl.createEl('h2', { text: t('password_promt_title') })
    let title = `Password for ${this.name}`
    if (this.name === ADMIN_PASSWORD) {
      title = `Password for 'root' user or Administrator`
    }

    contentEl.createEl('h2', { text: title })

    new Setting(contentEl)
      .setName('Password')
      .setDesc('password')
      .addText((text) =>
        text
          .setPlaceholder('enter password here')
          .setValue(this.newPassword)
          .onChange(async (value) => {
            this.newPassword = value
          }),
      )

    new Setting(contentEl)
      .setName('Save')
      .setDesc('save password')
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.savePassword).onChange(async (value) => {
          this.savePassword = value
        }),
      )

    new Setting(contentEl)
      .addButton((button) => {
        button.setButtonText(t('Cancel'))
        button.onClick(() => {
          this.close()
        })
      })
      .addButton((button) => {
        button.setButtonText(t('OK'))
        button.setCta()
        button.setClass('password-confirm')
        button.onClick(async () => {
          // await this.plugin.setPassword(this.name, this.newPassword)
          await this.save()
          this.close()
        })
      })
  }

  async display(){
    this.contentEl.empty()

    let title = `password for`

    if (this.name === ADMIN_PASSWORD) {
      title += ` root or Administrator`
    }else {
      title += ` ${this.name}`
    }

    this.contentEl.addClass('confirm-modal')
    this.contentEl.createEl('h1', { text: title })

    // make a div for user's password input
    const inputPwContainerEl = this.contentEl.createDiv();
    inputPwContainerEl.style.marginBottom = '1em';
    const pwInputEl = inputPwContainerEl.createEl('input', { type: 'password', value: '' });
    pwInputEl.placeholder = this.plugin.t("place_holder_enter_password");
    pwInputEl.style.width = '70%';
    pwInputEl.focus();

    new Setting(this.contentEl)
      .setName('Save')
      .setDesc('save password')
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.savePassword).onChange(async (value) => {
          this.savePassword = value
        }),
      )

    const buttonEl = this.contentEl.createDiv('confirm-buttons')
    new ButtonComponent(buttonEl)
      .setButtonText(this.plugin.t('cancel'))
      .setCta()
      .setClass('delete')
      .onClick(() => {
        // this.confirmed = true
        this.close()
      })
    new ButtonComponent(buttonEl).setButtonText(this.plugin.t('ok')).onClick(() => {
      this.close()
    })


  }

  onOpen() {
    this.display()
  }

  onClose() {
    let { contentEl } = this
    contentEl.empty()
    this.plugin.promts.remove(this.name)
  }
}

export { PasswordModal, PasswordPromt }
