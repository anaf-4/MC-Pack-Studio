import { create } from 'zustand'
import type { MCVersion } from '@/types/pack'
import { PACK_FORMAT_MAP, DEFAULT_VERSION } from '@/constants/packFormats'

interface PackState {
  name: string
  description: string
  mcVersion: MCVersion
  packFormat: number
  supportedFormats: [number, number] | undefined
  packIconDataURL: string | null
  isSetupComplete: boolean

  setName: (name: string) => void
  setDescription: (desc: string) => void
  setMCVersion: (version: MCVersion) => void
  setPackIcon: (dataURL: string | null) => void
  completeSetup: () => void
  reset: () => void
}

function getFormatInfo(version: MCVersion) {
  const entry = PACK_FORMAT_MAP[version]
  return {
    packFormat: entry.format,
    supportedFormats: entry.supportedRange,
  }
}

const defaultFormatInfo = getFormatInfo(DEFAULT_VERSION)

export const usePackStore = create<PackState>((set) => ({
  name: '',
  description: '',
  mcVersion: DEFAULT_VERSION,
  packFormat: defaultFormatInfo.packFormat,
  supportedFormats: defaultFormatInfo.supportedFormats,
  packIconDataURL: null,
  isSetupComplete: false,

  setName: (name) => set({ name }),
  setDescription: (desc) => set({ description: desc }),
  setMCVersion: (version) => {
    const { packFormat, supportedFormats } = getFormatInfo(version)
    set({ mcVersion: version, packFormat, supportedFormats })
  },
  setPackIcon: (dataURL) => set({ packIconDataURL: dataURL }),
  completeSetup: () => set({ isSetupComplete: true }),
  reset: () => set({
    name: '',
    description: '',
    mcVersion: DEFAULT_VERSION,
    ...getFormatInfo(DEFAULT_VERSION),
    packIconDataURL: null,
    isSetupComplete: false,
  }),
}))
