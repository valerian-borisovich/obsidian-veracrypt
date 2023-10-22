import { exec } from 'child_process'

export const execute1 = (cmd: string) => {
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

export const execute = (cmd: string) => {
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
