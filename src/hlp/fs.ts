//
// import { loadPdfJs, normalizePath, Notice, requestUrl, RequestUrlResponse, TAbstractFile, TFile, TFolder, Vault } from "obsidian";
import { normalizePath, Notice, TAbstractFile, TFile, TFolder, Vault } from 'obsidian'
//import { date2DateString, date2TimeString } from "./dateUtils";

declare global {
  var __DEV_MODE__: boolean
}

/**
 * Splits a full path including a folderpath and a filename into separate folderpath and filename components
 * @param filepath
 */
export function splitFolderAndFilename(filepath: string): {
  folderpath: string
  filename: string
  basename: string
} {
  const lastIndex = filepath.lastIndexOf('/')
  const filename = lastIndex == -1 ? filepath : filepath.substring(lastIndex + 1)
  return {
    folderpath: normalizePath(filepath.substring(0, lastIndex)),
    filename,
    basename: filename.replace(/\.[^/.]+$/, ''),
  }
}

/**
 * Download data as file from Obsidian, to store on local device
 * @param encoding
 * @param data
 * @param filename
 */
export const download = (encoding: string, data: any, filename: string) => {
  const element = document.createElement('a')
  element.setAttribute('href', (encoding ? `${encoding},` : '') + data)
  element.setAttribute('download', filename)
  element.style.display = 'none'
  document.body.appendChild(element)
  element.click()
  document.body.removeChild(element)
}

/**
 * Generates the image filename based on the filename
 * @param path - path to the file
 * @param extension - extension without the preceeding "."
 * @returns
 */
export function getFilename(path: string, extension: string): string {
  return `${path.substring(0, path.lastIndexOf('.'))}.${extension}`
}

/**
 * Create new file, if file already exists find first unique filename by adding a number to the end of the filename
 * @param vault
 * @param filename
 * @param folderpath
 * @returns
 */
export function getNewUniqueFilepath(vault: Vault, filename: string, folderpath: string): string {
  let fname = normalizePath(`${folderpath}/${filename}`)
  let file: TAbstractFile = vault.getAbstractFileByPath(fname)
  let i = 0
  const extension = filename.endsWith('.vera') ? '.vera' : filename.slice(filename.lastIndexOf('.'))
  while (file) {
    fname = normalizePath(`${folderpath}/${filename.slice(0, filename.lastIndexOf(extension))}_${i}${extension}`)
    i++
    file = vault.getAbstractFileByPath(fname)
  }
  return fname
}

/**
 * Open or create a folderpath if it does not exist
 * @param folderpath
 */
export async function checkAndCreateFolder(folderpath: string) {
  const vault = app.vault
  folderpath = normalizePath(folderpath)
  //https://github.com/zsviczian/obsidian-excalidraw-plugin/issues/658
  //@ts-ignore
  const folder = vault.getAbstractFileByPathInsensitive(folderpath)
  if (folder && folder instanceof TFolder) {
    return
  }
  if (folder && folder instanceof TFile) {
    new Notice(`The folder cannot be created because it already exists as a file: ${folderpath}.`)
  }
  await vault.createFolder(folderpath)
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////

export function onlyUniqueArray<T>(value: T, index: number, self: T[]) {
  return self.indexOf(value) === index
}

export function isTFile(value: TAbstractFile): value is TFile {
  return 'stat' in value
}

export const defaultDelimiter = '\n\n***\n\n'

// Create a folder path if it does not exist
export async function createFolderIfNotExist(vault: Vault, folderPath: string) {
  if (!vault || !folderPath) {
    return
  }
  const folder = vault.getAbstractFileByPath(normalizePath(folderPath))

  if (folder && folder instanceof TFolder) {
    return
  }

  if (folder && folder instanceof TFile) {
    throw new URIError(
      `Folder "${folderPath}" can't be created because there is a file with the same name. Change the path or rename the file.`,
    )
  }

  await vault.createFolder(folderPath).catch((error) => {
    if (error.message !== 'Folder already exists.') {
      throw error
    }
  })
}

export function sanitizeFileName(fileName: string): string {
  const invalidCharacters = /[\\/:*?"<>|\n\r]/g
  const replacementCharacter = '_'
  return fileName.replace(invalidCharacters, replacementCharacter)
}

export async function getUniqueFilePath(
  vault: Vault,
  generatedFilePaths: string[],
  locationPath: string,
  baseForFileName: string,
  fileExtension: string, // with dot
  unixTime: number,
): Promise<string> {
  const _fileExtension = fileExtension.startsWith('.') ? fileExtension.slice(1) : fileExtension
  await createFolderIfNotExist(vault, locationPath)
  const title = sanitizeFileName(baseForFileName.slice(0, 30))
  const messageDate = new Date(unixTime * 1000)
  // const messageDateString = date2DateString(messageDate);
  // let fileId = Number(date2TimeString(messageDate));
  const messageDateString = messageDate
  let fileId = Number(messageDate)
  let fileName = `${title} - ${messageDateString}${fileId}.${_fileExtension}`
  let filePath = normalizePath(locationPath ? `${locationPath}/${fileName}` : fileName)
  let previousFilePath = ''
  while (
    previousFilePath != filePath &&
    (generatedFilePaths.includes(filePath) || vault.getAbstractFileByPath(filePath) instanceof TFile)
  ) {
    previousFilePath = filePath
    fileId += 1
    fileName = `${title} - ${messageDateString}${fileId}.${_fileExtension}`
    filePath = normalizePath(locationPath ? `${locationPath}/${fileName}` : fileName)
  }
  generatedFilePaths.push(filePath)
  return filePath
}

export async function appendContentToNote(
  vault: Vault,
  notePath: string,
  newContent: string,
  startLine = '',
  delimiter = defaultDelimiter,
  reversedOrder = false,
) {
  let noteFile: TFile = vault.getAbstractFileByPath(notePath) as TFile

  if (!noteFile) {
    noteFile = await vault.create(notePath, newContent)
  } else {
    const currentContent = await vault.read(noteFile)
    const content = startLine
      ? currentContent.replace(startLine, startLine + delimiter + newContent)
      : reversedOrder
      ? newContent + delimiter + currentContent
      : currentContent + delimiter + newContent
    if (currentContent != content) await vault.modify(noteFile, content)
  }
}

export function base64ToString(base64: string): string {
  return Buffer.from(base64, 'base64').toString('utf-8')
}

export async function replaceMainJs(vault: Vault, mainJs: Buffer | 'main-prod.js') {
  const mainJsPath = normalizePath(vault.configDir + '/plugins/telegram-sync/main.js')
  const mainProdJsPath = normalizePath(vault.configDir + '/plugins/telegram-sync/main-prod.js')
  if (mainJs instanceof Buffer) {
    await vault.adapter.writeBinary(mainProdJsPath, await vault.adapter.readBinary(mainJsPath))
    await vault.adapter.writeBinary(mainJsPath, mainJs)
  } else {
    if (!(await vault.adapter.exists(mainProdJsPath))) return
    await vault.adapter.writeBinary(mainJsPath, await vault.adapter.readBinary(mainProdJsPath))
  }
}
