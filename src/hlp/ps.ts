// import { SpawnSyncOptions } from 'child_process'
// import { SpawnOptionsWithoutStdio } from 'child_process'
// import { spawnSync, SpawnSyncOptions, SpawnSyncReturns } from 'child_process'
// import { SpawnSyncOptionsWithStringEncoding } from 'child_process'

/*
 *    child_process.execSync
 */
const ps = (command: string) => {
  let result = ''
  // const spawn = require('child_process').spawnSync
  const start = require('child_process').execSync

  try {
    // result = start(command, { encoding: 'utf8', stdio: 'inherit' }).toString()
    result = start(command, { encoding: 'utf8', stdio: 'inherit' })
    if (result !== null) {
      console.debug(`ps.start.result : ${result}`)
      process.on('exit', function () {
        // console.debug(`ps.process.on => ${command} : ${result.toString()}`)
        console.debug(`ps.on.exit(${command}) : ${result}`)
        return result
      })
    }
  } catch (e) {
    // console.error(`ps.error: ${e}`)
    console.debug(`ps.error: ${e}`)
  }
  return result
}

/*
 *    require('child_process').execSync(cmd, { encoding: 'utf8', stdio: 'inherit' }).toString()
 */
async function exec0(cmd: string) {
  try {
    // return require('child_process').execSync(cmd).toString()
    return require('child_process').execSync(cmd, { encoding: 'utf8', stdio: 'inherit' }).toString()
  } catch (e) {
    console.error(`exec.err: ${e}`)
    return ''
  }
}

/*
 *    child_process.exec(cmd)
 */

// export function run(cmd: string, args?: ReadonlyArray<string>, options?: SpawnOptionsWithoutStdio) {
function exec(cmd: string) {
  let result: string = ''
  const { start } = require('child_process').exec
  const proc = start(cmd)

  // @ts-ignore
  proc.stdout.on('data', function (data) {
    console.debug(`exec.output: ${data}`)
    result = data
  })

  // @ts-ignore
  proc.stderr.on('data', function (data) {
    console.error(`exec.stderr: ${data}`)
    // console.debug(`run.err: ${data}`)
    result = data
  })

  // @ts-ignore
  proc.on('exit', function (code) {
    // console.debug(`run.on.exit(${code}): ${result} `)
    console.log(`exec.exit: ${result} `)
    return result
  })
  return result
}

/*
 *    child_process.spawn(cmd, args)
 *
 */

// export function run(cmd: string, args?: ReadonlyArray<string>, options?: SpawnOptionsWithoutStdio) {
function run(cmd: string, args?: ReadonlyArray<string>) {
  let spawn = require('child_process').spawn
  // let proc = spawn(cmd, args, options)
  let proc = spawn(cmd, args)
  let result: string = ''

  // @ts-ignore
  proc.stdout.on('data', function (data) {
    // console.debug(`run.output: ${data}`)
    result = data
  })

  // @ts-ignore
  proc.stderr.on('data', function (data) {
    // console.error(`run.stderr: ${data}`)
    // console.debug(`run.err: ${data}`)
    result = data
  })
  // @ts-ignore
  proc.on('exit', function (code) {
    // console.debug(`run.on.exit(${code}): ${result} `)
    console.log(`run.exit: ${result} `)
    return result
  })

  return result
}

/*
 *    child_process.spawnSync(cmd, args)
 *
 */
function runSync(cmd: string, args?: ReadonlyArray<string>) {
  try {
    return require('child_process')
      .spawnSync(
        cmd,
        args,
        (require('child_process').SpawnSyncOptionsWithStringEncoding.encoding = 'utf8'),
        (require('child_process').SpawnSyncOptionsWithStringEncoding.stdiostdio = 'inherit'),
      )
      .toString()
  } catch (e) {
    console.error(`runSync.error: ${e}`)
    return ''
  }
}

/*
 *
 *
 *
 */
export { run, runSync, exec, ps }
