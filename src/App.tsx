import { usePackStore } from '@/store/packStore'
import { PackSetupModal } from '@/components/setup/PackSetupModal'
import { EditorPage } from '@/pages/EditorPage'

export default function App() {
  const isSetupComplete = usePackStore((s) => s.isSetupComplete)

  return (
    <>
      {!isSetupComplete && <PackSetupModal />}
      <EditorPage />
    </>
  )
}
