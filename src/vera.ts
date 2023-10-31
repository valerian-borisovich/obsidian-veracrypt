//
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//

interface Manifest {
  id: string
  /**
   * The display name.
   * @public
   */
  name: string
  /**
   * The current version, using {@link https://semver.org/ Semantic Versioning}.
   * @public
   */
  version: string
  /**
   * The minimum required version to run this.
   * @public
   */
  minAppVersion: string
  /**
   * A description of the plugin.
   * @public
   */
  description: string
  /**
   * The author's name.
   * @public
   */
  author: string
  /**
   * A URL to the author's website.
   * @public
   */
  authorUrl?: string
}

//
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//

/*
 *
 */
class Vera {
  config!: any

  constructor() {
    this.config = Array
  }
}

//
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//

/*
 *    getCurrenVersion
 */
function getCurrenVersion(): string {
  let currenVersion: string = ''
  try {
    const { manifest } = require('./manifest.json')
    currenVersion = manifest.version
  } catch (e) {}
  try {
    const { manifest } = require('../manifest.json')
    currenVersion = manifest.version
  } catch (e) {}
  return currenVersion
}

//
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//

/*
 *    imports
 */
import { v4 } from 'uuid'
//
import { filesystemType, encryptionAlgorithm, hashAlgorithm } from './defines'
import { log } from './lib/log'
import { getID } from './lib/machine-id'
import { execute } from './lib/execute'

/*
 *    exports
 */
export { Vera, Manifest, getCurrenVersion, log, getID, execute, filesystemType, encryptionAlgorithm, hashAlgorithm, v4 }
