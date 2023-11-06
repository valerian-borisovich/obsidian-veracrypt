//
import { ObsidianVeracryptSettings } from './settings'

import { getVersion } from './hlp'

interface VeraSettings extends ObsidianVeracryptSettings {}

class Vera {
  settings!: VeraSettings

  constructor(props: any) {
    console.debug('Loading vera')
    // super(props);
    this.settings = props
  }
}

export { Vera, VeraSettings }
