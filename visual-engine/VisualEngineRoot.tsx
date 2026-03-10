"use client"

import SceneLayerV3 from "./scene/SceneLayerV3"

export default function VisualEngineRoot({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <SceneLayerV3 />
      {children}
    </>
  )
}