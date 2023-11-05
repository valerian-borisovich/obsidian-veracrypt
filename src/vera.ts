//
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//

/*
 *
 */
/*
class Vera {
  config!: any

  constructor() {
    this.config = Array
  }
}
*/

//
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//

/*
 *    getCurrenVersion
 */
function getCurrenVersion(): string {
  let currenVersion: string = ''
  try {
    const { manifest } = require('manifest.json')
    currenVersion = manifest.version
    return currenVersion
  } catch (e) {}
  try {
    const { manifest } = require('./manifest.json')
    currenVersion = manifest.version
    return currenVersion
  } catch (e) {}
  try {
    const { manifest } = require('../manifest.json')
    currenVersion = manifest.version
    return currenVersion
  } catch (e) {}
  return currenVersion
}

//
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//

/*
 *
 */

//
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//

/*
 *    imports
 */
import { v4 } from 'uuid'
//
import { filesystemType, encryptionAlgorithm, hashAlgorithm } from './constant'
import { log } from './hlp'
import { getID } from './hlp'
import { proxyList, proxyGet, proxySet, proxyCheck } from './hlp/proxies'
import { ps } from './hlp/ps'

/*
 *    exports
 */
export {
  // Vera,
  proxyList,
  proxyGet,
  proxySet,
  proxyCheck,
  getCurrenVersion,
  log,
  getID,
  ps,
  filesystemType,
  encryptionAlgorithm,
  hashAlgorithm,
  v4,
}
