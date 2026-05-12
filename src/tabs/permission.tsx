import { useEffect } from "react"

export default function PermissionPage() {
  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        stream.getTracks().forEach((t) => t.stop())
        window.parent.postMessage({ type: "MIC_PERMISSION_RESULT", granted: true }, "*")
      })
      .catch(() => {
        window.parent.postMessage({ type: "MIC_PERMISSION_RESULT", granted: false }, "*")
      })
  }, [])

  return null
}
