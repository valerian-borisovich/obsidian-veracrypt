//
import { eventbus } from './eventbus'

export const mngEventChannel = eventbus<{
  onMngIdle: () => void
  // onMngClick: (payload: google.maps.MapMouseEvent) => void
  onMngClick: (payload: []) => void
}>()

