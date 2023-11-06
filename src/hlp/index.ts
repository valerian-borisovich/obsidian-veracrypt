//

/*
declare global {
  var __DEV_MODE__: boolean
}

export function onlyUniqueArray<T>(value: T, index: number, self: T[]) {
  return self.indexOf(value) === index
}

export type ValueOf<T> = T[keyof T]
*/

//
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//

/*
 *    imports
 */
//
import { getVersion, version } from './ver'
import { log } from './log'
// import { machineId, machineIdSync } from './machine-id'
import { getID } from './machine-id'

import { filesystemType, encryptionAlgorithm, hashAlgorithm } from '../constant'
import { proxyList, proxyGet, proxySet, proxyCheck } from './proxies'
import { ps } from './ps'
import { v4 } from 'uuid'

/*
 *    exports
 */
export { v4, ps, log, getID }
export { version, getVersion }

export { filesystemType, encryptionAlgorithm, hashAlgorithm }

export { proxyList, proxyGet, proxySet, proxyCheck }
