//
//
//
import { v4 } from 'uuid'
//
//
//
import { log } from './log'
// import { machineId, machineIdSync } from './machine-id'
import { getID } from './machine-id'

//
//
//
declare global {
  var __DEV_MODE__: boolean
}

export function onlyUniqueArray<T>(value: T, index: number, self: T[]) {
  return self.indexOf(value) === index
}

//
//
//
export type ValueOf<T> = T[keyof T]

//
//
//
export { v4, log, getID }
