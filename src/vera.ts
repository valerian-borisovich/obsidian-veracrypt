//
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//import fs from 'fs'
import jq from './hlp/jq.js'

// import * as jetpack from "fs-jetpack";
import * as fs from 'fs-jetpack'

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
 *
 */

const pathExist = (path: string) => {
  try {
    // return fs.existsSync(path)
    return fs.exists(path)
  } catch (err) {
    return false
  }
}

//
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//

/*
 *    getCurrenVersion
 */
function getVersion(): string {
  let ver: string = ''
  let filename: string = 'manifest.json'
  let pathup: string = '../'
  let filter = jq.compile('.version')

  /// normalizePath(

  for (let i = 1; i < 4; i++) {
    if (pathExist(filename)) {
      const data = fs.read(filename)
      ver = filter(data)
    }
    filename = pathup + filename
  }

  try {
    // const { manifest } = require(filename)
    // ver = manifest.version

    let filter = jq.compile('.x[].y')
    for (let v of filter({ x: [{ y: 2 }, { y: 4 }] })) {
    }

    return ver
  } catch (e) {}
  return ver
}

function getCurrenVersion0(): string {
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
import { normalizePath } from 'obsidian'

/*
 *    exports
 */
export {
  // Vera,
  proxyList,
  proxyGet,
  proxySet,
  proxyCheck,
  getVersion,
  log,
  getID,
  ps,
  pathExist,
  filesystemType,
  encryptionAlgorithm,
  hashAlgorithm,
  v4,
}
