"use client"

import "./SceneLayerV3.css"

export default function SceneLayerV3({
  scene = "remembrance",
  children
}: {
  scene?: string
  children?: React.ReactNode
}) {
  return (
    <>
      <div className="tl-scene-root">
        <div
          className="tl-scene-image"
          style={{
            backgroundImage: `url('/scenes/${scene}/bg.jpg')`
          }}
        />
        <div className="tl-scene-vignette" />
      </div>
      <div className="relative z-10 w-full min-h-screen">
        {children}
      </div>
    </>
  )
}
