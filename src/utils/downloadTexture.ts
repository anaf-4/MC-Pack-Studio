/**
 * dataURL을 PNG 파일로 즉시 다운로드
 * @param dataURL  - image/png dataURL
 * @param path     - 텍스처 경로 (파일명 추출용), 또는 직접 파일명
 */
export function downloadTexture(dataURL: string, path: string) {
  // 경로에서 파일명만 추출
  const fileName = path.split('/').pop() ?? 'texture.png'

  const a = document.createElement('a')
  a.href = dataURL
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}
