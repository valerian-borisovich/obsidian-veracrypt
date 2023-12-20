import { App, ButtonComponent, Modal, Notice, Setting } from 'obsidian'
import VeraPlugin from './veraPlugin'
import { log, dbg, err, TransItemType } from './hlp'
import { ADMIN_PASSWORD } from './constant'

/*
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

    // const t = (x: TransItemType, vars?: any) => {return this.plugin.i18n.t(x, vars)}
    // const t = (x: string, vars?: any) => {return x}

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
*/

class PasswordPromt extends Modal {
  plugin: VeraPlugin
  name: string
  newPassword: string
  bSave: boolean

  constructor(app: App, plugin: VeraPlugin, name: string, newPassword: string = '') {
    super(app)
    this.plugin = plugin
    this.name = name
    this.bSave = true
    this.newPassword = newPassword
  }

  async save(force: boolean = false) {
    this.plugin.settings.savePassword = this.bSave
    if (this.bSave || force) {
      dbg(`save password '${this.newPassword}' for '${this.name}'`)
      await this.plugin.vera.setPassword(this.name, this.newPassword)
      new Notice(`Password for ${this.name} saved!`)
    }
    await this.plugin.saveSettings()
  }

  async display(){
    this.contentEl.empty()

    let title = `Enter password for `
    if (this.name === ADMIN_PASSWORD) {
      title = `Enter root or Administrator password`
    }else {
      title += ` ${this.name}`
    }

    this.contentEl.addClass('confirm-modal')
    this.contentEl.createEl('h2', { text: title })


    //const inputPwContainerEl = this.contentEl.createDiv();
    //inputPwContainerEl.style.marginBottom = '1em';
    //const pwInputEl = inputPwContainerEl.createEl('input', { type: 'password',  value: '' });
    // pwInputEl.placeholder = this.plugin.t("place_holder_enter_password");
    //pwInputEl.style.width = '70%';
    //pwInputEl.focus();

    new Setting(this.contentEl)
      .setName('Password')
      .setDesc('password')
      .addText((text) =>
        text
          .setPlaceholder(this.plugin.t("place_holder_enter_password"))
          .setValue(this.newPassword)
          .onChange(async (value) => {
            this.newPassword = value
          })
          .inputEl.type='password'
      )

    new Setting(this.contentEl)
      .setName('Save')
      .setDesc('save password')
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.savePassword).onChange(async (value) => {
          this.bSave = value
        }),
      )

    const buttonEl = this.contentEl.createDiv('confirm-buttons')
    new ButtonComponent(buttonEl)
      .setButtonText(this.plugin.t('cancel'))
      .setClass('cancel')
      .onClick(() => {
        // this.confirmed = true
        this.close()
      })
    new ButtonComponent(buttonEl)
      .setButtonText(this.plugin.t('ok'))
      .setCta()
      .setClass('password-confirm')
      .onClick(() => {
      this.save()
      this.close()
    })


  }

  onOpen() {
    this.display().then((value)=>{})
  }

  onClose() {
    let { contentEl } = this
    contentEl.empty()
    this.plugin.promts.remove(this.name)
  }
}

// export { PasswordModal, }
export { PasswordPromt }
