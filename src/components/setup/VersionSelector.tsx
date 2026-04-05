import { MC_VERSIONS_ORDERED } from '@/constants/packFormats'
import { PACK_FORMAT_MAP } from '@/constants/packFormats'
import type { MCVersion } from '@/types/pack'

interface Props {
  value: MCVersion
  onChange: (v: MCVersion) => void
  className?: string
}

export function VersionSelector({ value, onChange, className = '' }: Props) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as MCVersion)}
      className={`bg-mc-bg-panel border border-mc-border text-mc-text-primary rounded px-3 py-2 text-sm focus:outline-none focus:border-mc-accent ${className}`}
    >
      {MC_VERSIONS_ORDERED.map((v) => {
        const fmt = PACK_FORMAT_MAP[v].format
        return (
          <option key={v} value={v}>
            {v} (pack_format: {fmt})
          </option>
        )
      })}
    </select>
  )
}
