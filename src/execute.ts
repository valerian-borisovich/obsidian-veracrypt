import { exec } from 'child_process'

export const execute = (cmd: string) => {
  try {
    exec(cmd)
  } catch (e) {
    console.error(`exec error: ${e}`)
  }

  /*
  exec(cmd, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`)
      return
    }
    console.log(`stdout: ${stdout}`)
    console.error(`stderr: ${stderr}`)
    return stdout
  })
  */
  return ''
}

export const execute1 = (cmd: string) => {
  try {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`)
        return error
      }
      console.log(`stdout: ${stdout}`)
      // console.error(`stderr: ${stderr}`)
      return stdout
    })
  } catch (error) {
    console.error(`run error: ${error}`)
    return error
  }
}

export const execute2 = (cmd: string) => {
  try {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`)
        return error
      }
      console.log(`stdout: ${stdout}`)
      // console.error(`stderr: ${stderr}`)
      return stdout
    })
  } catch (error) {
    console.error(`run error: ${error}`)
    return error
  }
}

import { spawn as process_spawn } from 'node:child_process'

export const spawn = (cmd: string) => {
  const ls = process_spawn('ls', ['-lh', '/usr'])

  ls.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`)
  })

  ls.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`)
  })

  ls.on('close', (code) => {
    console.log(`child process exited with code ${code}`)
  })
}
