// https://www.veracrypt.fr/en/Encryption%20Algorithms.html
export const encryptionAlgorithm = [
  'AES',
  'Camellia',
  'Kuznyechik',
  'Serpent',
  'Twofish',
  'AES-Twofish',
  'AES-Twofish-Serpent',
  'Camellia-Kuznyechik',
  'Camellia-Serpent',
  'Kuznyechik-AES',
  'Kuznyechik-Serpent-Camellia',
  'Kuznyechik-Twofish',
  'Serpent-AES',
  'Serpent-Twofish-AES',
  'Twofish-Serpent',
]

// Hash Algorithms
export const hashAlgorithm = ['BLAKE2s-256', 'SHA-256', 'SHA-512', 'Whirlpool', 'Streebog']

// Filesystem Types
export const filesystemType = ['FAT', 'exFAT', 'NTFS', 'Ext2', 'Ext3', 'Ext4', 'Btrfs', 'MacOsExt', 'APFS', 'UFS']

//
export type ConnectionStatus = 'connected' | 'disconnected'
export type PluginStatus = 'unloading' | 'unloaded' | 'loading' | 'loaded'
