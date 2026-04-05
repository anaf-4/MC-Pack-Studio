import { AppLayout } from '@/components/layout/AppLayout'
import { InspectorPanel } from '@/components/layout/InspectorPanel'
import { TextureGrid } from '@/components/texture/TextureGrid'
import { PreviewPanel } from '@/components/preview/PreviewPanel'
import { PixelEditor } from '@/components/canvas/PixelEditor'
import { useEditorStore } from '@/store/editorStore'

export function EditorPage() {
  const editingTexturePath = useEditorStore((s) => s.editingTexturePath)

  return (
    <AppLayout inspector={<InspectorPanel />}>
      <div className="flex flex-1 overflow-hidden">
        {/* 왼쪽: 텍스처 그리드 or 픽셀 에디터 */}
        <div className="flex-1 min-w-0 overflow-hidden border-r border-mc-border">
          {editingTexturePath ? (
            <PixelEditor />
          ) : (
            <TextureGrid />
          )}
        </div>

        {/* 오른쪽: 프리뷰 패널 (탭 전환) */}
        <div className="w-[500px] flex-shrink-0 flex flex-col overflow-hidden border-l border-mc-border">
          <PreviewPanel />
        </div>
      </div>
    </AppLayout>
  )
}
