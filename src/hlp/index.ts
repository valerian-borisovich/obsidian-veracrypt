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
import { getVersion, getVersionAsync } from './ver'
import { log, dbg, debug, err, error, warn, warning } from './log'
// import { machineId, machineIdSync } from './machine-id'
import { machineId, machineIdSync, getID, getMachineId } from './machine-id'

import { filesystemType, encryptionAlgorithm, hashAlgorithm } from '../constant'
import { proxyList, proxyGet, proxySet, proxyCheck } from './proxies'
import { ps, exec, run } from './ps'
import { v4 } from 'uuid'

/*
 *    exports
 */
export { log, dbg, debug, err, error, warn, warning }
export { machineId, machineIdSync, getID, getMachineId }
export { v4 }
export { ps, exec, run }
export { getVersionAsync, getVersion }
export { filesystemType, encryptionAlgorithm, hashAlgorithm }
export { proxyList, proxyGet, proxySet, proxyCheck }
