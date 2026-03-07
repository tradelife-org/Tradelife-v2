import { createServiceRoleClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * API route to securely download compliance documents.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const path = searchParams.get('path')

  if (!path) {
    return new NextResponse('Missing path', { status: 400 })
  }

  const supabase = createServiceRoleClient()

  const { data, error } = await supabase.storage
    .from('gallery')
    .download(path)

  if (error || !data) {
    console.error('Download error:', error)
    return new NextResponse('File not found', { status: 404 })
  }

  let contentType = 'application/octet-stream'
  if (path.endsWith('.pdf')) contentType = 'application/pdf'
  if (path.endsWith('.jpg') || path.endsWith('.jpeg')) contentType = 'image/jpeg'
  if (path.endsWith('.png')) contentType = 'image/png'

  return new NextResponse(data, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${path.split('/').pop()}"`,
    },
  })
}
