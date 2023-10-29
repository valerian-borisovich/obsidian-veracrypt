// import { spawnSync, SpawnSyncOptions, SpawnSyncReturns } from 'child_process'
// export const execute = (command: string, args?: ReadonlyArray<string>, options?: SpawnSyncOptions,):
// import { SpawnSyncOptions } from 'child_process'

// export const execute = (command: string, args?: ReadonlyArray<string>) => {
// export const execute = (command: string, args?: string[]) => {
export const execute = (command: string) => {
  let r = ''
  // const spawn = require('child_process').spawnSync
  const spawn = require('child_process').execSync

  try {
    //  r = spawn('veracrypt', ['-t', '-l', '--non-interactive', '--force']).stdout.toString('utf8')
    console.debug(command)
    // r = spawn(command, args).stdout.toString('utf8')
    r = spawn(command).stdout.toString('utf8')
    //r = spawn(command).stdout
    if (r !== null) {
      // r = r.toString()
      console.debug(command + ' : ' + r.toString())
      process.on('exit', function () {
        return r
      })
    }
  } catch (e) {
    // console.error('execute.err: ' + e)
  } finally {
    if (r === null) {
      r = ''
    }
  }
  return r
}

/*
function _execute(command: string, args?: ReadonlyArray<string>, options?: SpawnSyncOptions) {
  let r = ''
  return r
}
*/
