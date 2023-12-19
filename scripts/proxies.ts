/*  https://www.electronjs.org/ru/docs/latest/api/command-line-switches

--ignore-certificate-errors
Игнорирует ошибки, связанные с сертификатами.

--proxy-bypass-list=хосты
Указывает Electron обходить прокси-сервер для списка хостов, разделённых точкой с запятой. Этот флаг действует только в том случае, если он используется вместе с --proxy-server.

Например:
const { app } = require('electron')
app.commandLine.appendSwitch('proxy-bypass-list', '<local>;*.google.com;*foo.com;1.2.3.4:5678')


Будет использовать прокси сервер для всех хостов, за исключением локальных адресов (localhost, 127.0.0.1 и т. д.), google.com поддоменов, хостов которые содержат foo.com и 1.2.3.4:5678.

--proxy-pac-url=ссылка
Использовать PAC скрипт для указанного url.

--proxy-server=адрес:порт
Использует указанный proxy сервер, который перезаписывает системные настройки. Этот параметр влияет только на запросы HTTP протокола, включая HTTPS и WebSocket. Примечательно также, что не все proxy серверы поддерживают HTTPS и WebSocket протоколы. В URL для прокси не поддерживается указание имени пользователя и пароля для аутентификации, из-за проблемы в Chromium.

--host-rules=правила
Список правил, разделённых точкой с запятой, которые контролируют как сопоставляются имена хостов.

Например:

MAP * 127.0.0.1 Все имена хостов будут перенаправлены на 127.0.0.1
MAP *.google.com proxy Заставляет все поддомены google.com обращаться к "proxy".
MAP test.com [::1]:77 Forces "test.com" to resolve to IPv6 loopback. Также принудительно выставит порт получаемого адреса сокета, равный 77.
MAP * baz, EXCLUDE www.google.com Перенаправляет всё на "baz", за исключением "www.google.com".
Эти перенаправления применяются к хосту конечной точки в сетевом запросе (TCP соединения и резолвер хоста в прямых соединениях, CONNECT в HTTP прокси-соединениях и хост конечной точки в SOCKS прокси-соединений).

*/

//
// import * as electron from 'electron'
//

let proxyList = ['136.244.99.51:8888']

function proxyCheck(proxy: string) {
  console.debug(`proxySet: ${proxy}`)
  return true
  // return false
}

/* get valid proxy address */
async function proxyGet(validate: boolean = false) {
  let proxy = ''
  console.log('proxyGet: ')
  proxyList.forEach((pxy) => {
    proxy = pxy
    console.log(`proxyGet: ${proxy}`)
    if (proxyCheck(proxy)) {
      return proxy
    }
  })
  return proxy
}

async function proxySet(host = '*', proxy = '') {
  if (proxy === '') {
    proxy = await proxyGet()
  }
  console.log('proxySet: ' + `MAP ${host} ${proxy}`)
  const electron = require('electron')
  // electron.commandLine.appendSwitch('host-rules', 'MAP * 127.0.0.1')
  // @ts-ignore
  electron.commandLine.appendSwitch('host-rules', `MAP ${host} ${proxy}`)
  console.log('proxySet: ' + `MAP ${host} ${proxy}`)
}

export { proxyList, proxyCheck, proxyGet, proxySet }
