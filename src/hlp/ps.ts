// import { SpawnSyncOptions } from 'child_process'
// import { SpawnOptionsWithoutStdio } from 'child_process'
// import { spawnSync, SpawnSyncOptions, SpawnSyncReturns } from 'child_process'

/*
 *    child_process.execSync
 */
import { SpawnSyncOptionsWithStringEncoding } from 'child_process'

const ps = (command: string) => {
  let result = ''
  // const spawn = require('child_process').spawnSync
  const start = require('child_process').execSync

  try {
    //  r = spawn('veracrypt', ['-t', '-l', '--non-interactive', '--force']).stdout.toString('utf8')
    console.debug(`ps.start("${command}")`)
    // r = spawn(command).stdout.toString('utf8')
    // result = spawn(command).toString('utf8')
    result = start(command, { encoding: 'utf8', stdio: 'inherit' }).toString()
    // result = start(command, { encoding: 'utf8', stdio: 'inherit' })
    console.debug(`ps.result : ${result}`)
    if (result !== null) {
      process.on('exit', function () {
        // console.debug(`ps.process.on => ${command} : ${result.toString()}`)
        console.debug(`ps.exit(${command}) : ${result}`)
        return result
      })
    }
  } catch (e) {
    console.error(`ps.error: ${e}`)
  }
  return result
}

/*
 *    require('child_process').execSync(cmd, { encoding: 'utf8', stdio: 'inherit' }).toString()
 */

async function exec(cmd: string) {
  try {
    // return require('child_process').execSync(cmd).toString()
    return require('child_process').execSync(cmd, { encoding: 'utf8', stdio: 'inherit' }).toString()
  } catch (e) {
    console.error(`exec.err: ${e}`)
    return ''
  }
}

/*
function _execute(command: string, args?: ReadonlyArray<string>, options?: SpawnSyncOptions) {
  let r = ''
  return r
}
*/

/*
var spawn = require('child_process').spawn;

//kick off process of listing files
var child = spawn('ls', ['-l', '/']);

//spit stdout to screen
child.stdout.on('data', function (data) {   process.stdout.write(data.toString());  });

//spit stderr to screen
child.stderr.on('data', function (data) {   process.stdout.write(data.toString());  });

child.on('close', function (code) {
    console.log("Finished with code " + code);
});
 */

/*
var spawn = require('child_process').spawn, ls = spawn('ls', ['-a']); ls.stdout.on('data', function(data) {    console.log('stdout: ' + data);}); ls.stderr.on('data', function(data) {    console.log('stderr: ' + data);}); ls.on('exit', function(code) {    console.log('exit: ' + code);});
 */

/*
// function sp(cmd: string, arg: [] = []) {
function sp(cmd: string) {
  let spawn = require('child_process').spawn
  let ls = spawn('ls', ['-a'])
  // @ts-ignore
  ls.stdout.on('data', function (data) {
    console.log('sp.stdout: ' + data)
    return data
  })
  // @ts-ignore
  ls.stderr.on('data', function (data) {
    console.log('sp.stderr: ' + data)
    return data
  })
  // @ts-ignore
  ls.on('exit', function (code) {
    console.log('sp.exit: ' + code)
    return code
  })
  return ''
}
*/

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
    return require('child_process').spawnSync(cmd, args,
      require('child_process').SpawnSyncOptionsWithStringEncoding.encoding='utf8',
      require('child_process').SpawnSyncOptionsWithStringEncoding.stdiostdio='inherit')
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
