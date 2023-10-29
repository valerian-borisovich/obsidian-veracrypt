//
//
//
// https://www.veracrypt.fr/en/Encryption%20Algorithms.html
// Encryption Algorithms
export type encryptionAlgorithm =
  | 'AES'
  | 'Camellia'
  | 'Kuznyechik'
  | 'Serpent'
  | 'Twofish'
  | 'AES-Twofish'
  | 'AES-Twofish-Serpent'
  | 'Camellia-Kuznyechik'
  | 'Camellia-Serpent'
  | 'Kuznyechik-AES'
  | 'Kuznyechik-Serpent-Camellia'
  | 'Kuznyechik-Twofish'
  | 'Serpent-AES'
  | 'Serpent-Twofish-AES'
  | 'Twofish-Serpent'

// Hash Algorithms
export type hashAlgorithm = 'BLAKE2s-256' | 'SHA-256' | 'SHA-512' | 'Whirlpool' | 'Streebog'

// Filesystem Types
export type filesystemType = 'FAT' | 'exFAT' | 'NTFS' | 'Ext2' | 'Ext3' | 'Ext4' | 'Btrfs' | 'MacOsExt' | 'APFS' | 'UFS'

// Mounted Status
export type MountStatus = 'mounted' | 'dismount'

//
//
//
// Connection Status
export type ConnectionStatus = 'connected' | 'disconnected'

// Plugin Status
export type PluginStatus = 'unloading' | 'unloaded' | 'loading' | 'loaded'
