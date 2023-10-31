//
//
//
//
import localforage from 'localforage'
import { LOCALSTORAGE, WEBSQL, INDEXEDDB } from 'localforage'
//
//
//
import { ObsidianVeracryptSettings, DEFAULT_SETTINGS } from './settings'
// import { getMachineId } from './lib/machine-id'
import { log, getID } from './vera'

localforage.config({
  driver: localforage.WEBSQL, // Force WebSQL; same as using setDriver()
  name: 'vera',
  version: 1.0,
  size: 4980736, // Size of database, in bytes. WebSQL-only for now.
  storeName: 'store',
  description: 'vera store',
})

export class VeraSettings {
  settings?: ObsidianVeracryptSettings
  store?: LocalForage
  volumes?: LocalForage

  constructor(settings: ObsidianVeracryptSettings = DEFAULT_SETTINGS) {
    this.settings = settings
    // this.volumes = localforage.createInstance({ name: 'volumes', storeName: 'volumes' })
    // this.store = localforage.createInstance({ name: 'store', storeName: 'store' })
    let volumes = localforage.createInstance({
      name: 'volumes',
      storeName: 'volumes',
      driver: WEBSQL,
      version: 1.0,
      size: 4980736,
    })
    this.volumes = volumes

    let store = localforage.createInstance({
      name: 'store',
      storeName: 'store',
      driver: INDEXEDDB,
      version: 1.0,
      size: 4980736,
    })
    this.store = store

    log('VeraSettings loading')

    store.getItem('devID', function (err, deviceID) {
      log('devID1: ' + deviceID)
      if (deviceID === null) {
        deviceID = getID()
        store.setItem('devID', deviceID, (err, value) => {})
        log('devID: ' + deviceID)
        for (let [key, value] of Object.entries(settings)) {
          log('settings: ' + key + ' == ' + value)
          store.setItem(key, value, (err, value) => {})
          // this.store.setItem(key, value)
          // key + ' : ' + value
        }
        // this.store.setItem('devID', getMachineId(), (error, value) => {})
      }
    })
  }

  async get(name: string) {
    let result
    result = this.volumes.getItem(name)
    if (result) {
      return result
    }

    /*
    if (name in this.settings) {
      result = this.settings..pop(name)
      return result
    }
    */

    result = this.store.getItem(name)
    if (result) {
      return result
    }
  }

  async set(name: string, val: string) {}
}

//
//
//
export { ObsidianVeracryptSettings, DEFAULT_SETTINGS }

//
//
//
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
