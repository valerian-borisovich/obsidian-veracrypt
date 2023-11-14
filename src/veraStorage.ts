import localforage from 'localforage'
import { log, dbg, err } from './hlp'
import { ADMIN_PASSWORD } from './constant'

class VeraStorage {
  store!: LocalForage

  constructor() {
    dbg('VeraStorage loading')

    this.store = localforage.createInstance({
      name: 'vera',
      storeName: 'vera',
      driver: localforage.INDEXEDDB,
      version: 1.0,
      size: 4980736,
    })

    log('VeraStorage loaded')
  }

  async get(name: string) {
    let result
    try {
      result = await this.store.getItem(name)
      if (result) {
        return result.toString()
      }
    } catch (e) {
      err(`veraStorage.get: ${e}`)
    }
    return ''
  }

  async set(name: string, val: string) {
    try {
      await this.store.setItem(name, val)
    } catch (e) {
      err(`veraStorage.set: ${e}`)
    }
  }
}

export { VeraStorage }

//
//
//
/*
_load_from_settings(){

  this.store.getItem('devID', function (err, deviceID) {
    log('devID: ' + deviceID)
    if (deviceID === null) {
      deviceID = getID()
      this.store.setItem('devID', deviceID, (err, value) => {})
      log('devID: ' + deviceID)
      for (let [key, value] of Object.entries(settings)) {
        log('settings: ' + key + ' == ' + value)
        this.store.setItem(key, value, (err, value) => {})
        // this.store.setItem(key, value)
        // key + ' : ' + value
      }
      // this.store.setItem('devID', getMachineId(), (error, value) => {})
    }
  })
}
*/

/*
localforage
  .ready(function () {
    console.log('ready', arguments)

    localforage.setItem('testKey', 'testValue').then(
      function () {},
      function () {
        console.log('setItem: ', arguments)
      },
    )

    localforage.getItem('testKey').then(
      function () {},
      function () {
        console.log('getItem: ', arguments)
      },
    )
  })
  .then(
    function () {},
    function () {
      console.log('ready().then', arguments)
      console.log('localforage.driver():', localforage.driver())
      localforage.setDriver(localforage.LOCALSTORAGE).then(
        function () {},
        function () {
          console.log('setDriver', arguments)
        },
      )
    },
  )
*/
