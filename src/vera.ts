//
import { EventEmitter, errorMonitor } from 'node:events'
//import { eventbus } from './eventbus'
import { dbg, log, err } from './hlp'
//
import { VeraPluginSettings, DEFAULT_SETTINGS } from './settings'
import { VeraSettingTab } from './settingsModal'
import { PasswordPromt } from './passwordModal'
//
interface VeraSettings extends VeraPluginSettings {}
//
import { VeraStorage } from './veraStorage'
import VolumeConfig, { DEFAULT_VOLUME_CONFIG, } from './volume'
import { VolumesManager } from './volumesManager'
import { ADMIN_PASSWORD } from './constant'

/*
interface IVera {
  getPassword(id: string): string
  setPassword(id: string, password: string): string
}
*/


class VeraEvents extends EventEmitter {
  constructor() {
    super({ captureRejections: true })
  }

  /*
  async vera(event) {
    console.log(event.type); // Печатает 'foo'
    console.log(event.a); // Печатает 1
  }

  on('event', (...args) =>
  {
  const parameters = args.join(', ');
  console.log(`событие с параметрами ${параметры} в третьем слушателе`);
  });
 */
}


class Vera {
  settings!: VeraSettings
  storage!: VeraStorage
  ev!: VeraEvents

  constructor(props: any) {
    // super(props);
    dbg('Vera loaded')
    this.settings = props
    this.storage = new VeraStorage()
    this.ev = new VeraEvents()
    //ev.addListener('vera-proc-started', this.onProcStarted)
    //ev.addListener('vera-proc-complete', this.onProcComplete)
  }

  /*
  init = () => {

    const unsubscribeOnMapIdle = mapEventChannel.on('onMapIdle', () => {
      logUserInteraction('on map idle.')
    })

    const unsubscribeOnMapClick = mapEventChannel.on(
      'onMapClick',
      (payload) => {
        logUserInteraction('on map click.', payload)
      }
    )
    const unsubscribeOnMarkerClick = markerEventChannel.on(
      'onMarkerClick',
      (payload) => {
        logUserInteraction('on marker click.', payload)
      }
    )

    // unsubscribe events when unmount
    return () => {
      unsubscribeOnMapIdle()
      unsubscribeOnMapClick()
      unsubscribeOnMarkerClick()
    }
  }


  const
  onIdle = (map: google.maps.Map) => {
    mapEventChannel.emit('onMapIdle')

    setZoom(map.getZoom()!)
    const nextCenter = map.getCenter()
    if (nextCenter) {
      setCenter(nextCenter.toJSON())
    }
  }

  const
  onClick = (e: google.maps.MapMouseEvent) => {
    mapEventChannel.emit('onMapClick', e)
  }

  const
  onMarkerClick = (marker: MarkerData) => {
    markerEventChannel.emit('onMarkerClick', marker)
    setSelectedMarker(marker)
  }

   */

  /*
   *
   */

  private async onProcStarted(args: any[]) {
    const params = args.join(', ');
    dbg(`onProcStarted: ${params}`);
  }

  private async onProcComplete(args: []) {
    const params = args.join(', ');
    dbg(`onProcComplete: ${params}`);
  }

  /*
   *
   */
  async getPassword(name: string) {
    let result: string = ''
    result = await this.storage.get(name)
    return result
  }
  async setPassword(name: string, password: string) {
    return await this.storage.set(name, password)
  }

}

/*
 *                      exports
 */
export { Vera, VeraEvents }
export { VolumesManager, DEFAULT_VOLUME_CONFIG, }
export { ADMIN_PASSWORD, }
/*
 *
 */
export type { VolumeConfig }
export type { VeraSettings }
