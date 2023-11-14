import jq from 'node-jq'
import fs from 'fs-jetpack'

let version: string = ''

function setResult(s: object | string) {
  // @ts-ignore
  version = s
}

async function getVersionAsync(): Promise<void> {
  let filename: string = 'manifest.json'
  let pathup = '../'

  for (let i = 1; i < 4; i++) {
    if (fs.exists(filename)) {
      await jq.run('.version', filename, { output: 'string' }).then((c) => {
        setResult(c)
        return c
      })
    }
    filename = pathup + filename
  }
}

function getVersion() {
  getVersionAsync().then((v) => {
    //version = v
    return v
  })
  return version
}

export { getVersion, version }
