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
import { ps, exec, run } from './ps'
import { getId, getDeviceId } from './ident'
//
import { filesystemType, encryptionAlgorithm, hashAlgorithm } from '~/constant'
//
import { I18n } from "./i18n"
import type { LangType, LangTypeAndAuto, TransItemType } from "./i18n"


/*
 *    exports
 */
export { log, dbg, debug, err, error, warn, warning }
export { getId, getDeviceId }
export { ps, exec, run }
export { getVersionAsync, getVersion }
//
export { filesystemType, encryptionAlgorithm, hashAlgorithm }
//
export { I18n }
export type { LangType, LangTypeAndAuto, TransItemType }
