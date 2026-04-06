import { useState } from 'react'
import { ExportSettingsModal } from './ExportSettingsModal'

export function ExportButton() {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 bg-mc-accent hover:bg-mc-accent-hover text-black font-bold px-4 py-1.5 rounded text-sm transition-colors"
      >
        <span>⬇</span>
        <span>다운로드 .zip</span>
      </button>

      {showModal && <ExportSettingsModal onClose={() => setShowModal(false)} />}
    </>
  )
}
