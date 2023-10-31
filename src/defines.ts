// https://www.veracrypt.fr/en/Encryption%20Algorithms.html
// Encryption Algorithms
type encryptionAlgorithm = [
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
type hashAlgorithm = ['BLAKE2s-256', 'SHA-256', 'SHA-512', 'Whirlpool', 'Streebog']

// Filesystem Types
type filesystemType = ['FAT', 'exFAT', 'NTFS', 'Ext2', 'Ext3', 'Ext4', 'Btrfs', 'MacOsExt', 'APFS', 'UFS']

// Mounted Status
type MountStatus = ['mounted', 'dismount']

//
//
//
// Connection Status
type ConnectionStatus = ['connected', 'disconnected']

// Plugin Status
type PluginStatus = ['unloading', 'unloaded', 'loading', 'loaded', 'ready']

export { encryptionAlgorithm, hashAlgorithm, filesystemType, MountStatus, ConnectionStatus, PluginStatus }
