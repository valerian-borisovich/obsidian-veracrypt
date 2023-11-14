import { v4 } from 'uuid'
// import { log } from './log'
// import { machineId, machineIdSync } from 'node-machine-id'
import { machineId, machineIdSync } from 'node-machine-id'

/*
async function getMachineId() {
  let id = await machineId()
  return id
}
*/

function getID() {
  return v4()
}

async function getMachineId() {
  await machineId().then((id) => {
    // log(id)
    return id
  })
  return ''
}

// export { machineId, machineIdSync }

// machineId().then((id) => {})
//
// Syncronous call
//let id = machineIdSync()
// id = c24b0fe51856497eebb6a2bfcd120247aac0d6334d670bb92e09a00ce8169365
//let id = machineIdSync({ original: true })
// id = 98912984-c4e9-5ceb-8000-03882a0485e4
//
//log('testim')
//log(getMachineId())

export { machineId, machineIdSync, getID, getMachineId }
