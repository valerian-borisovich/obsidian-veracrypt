import { v4 } from 'uuid'
import { machineId, machineIdSync } from 'node-machine-id'

async function getMachineId() {
  await machineId().then((id) => {
    // log(id)
    return id
  })
  return ''
}

function getDeviceId() {
  return machineIdSync(true)
}

function getId() {
  return v4()
}

//
export { getId, getDeviceId }
