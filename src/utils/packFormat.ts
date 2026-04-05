import type { MCVersion, PackFormatEntry } from '@/types/pack'
import { PACK_FORMAT_MAP } from '@/constants/packFormats'

export function getPackFormat(version: MCVersion): PackFormatEntry {
  return PACK_FORMAT_MAP[version]
}
