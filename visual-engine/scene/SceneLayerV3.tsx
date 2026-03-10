"use client"

import "./SceneLayerV3.css"

export default function SceneLayerV3() {

  return (
    <div className="tl-scene-root">

      <div
        className="tl-scene-image"
        style={{
          backgroundImage: "url('/scenes/remembrance/bg.jpg')"
        }}
      />

      <div className="tl-scene-vignette" />

    </div>
  )

}