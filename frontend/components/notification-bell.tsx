'use client'

import { Bell } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function NotificationBell() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const supabase = createClient()
    
    async function fetchCount() {
      const { count } = await supabase
        .from('inbox_messages')
        .select('id', { count: 'exact', head: true })
        .eq('is_read', false)
      setCount(count || 0)
    }
    
    fetchCount()

    // Realtime subscription
    const channel = supabase
      .channel('inbox-count')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inbox_messages' }, () => {
        fetchCount()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  return (
    <Link href="/assistant" className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
      <Bell className="w-5 h-5" />
      {count > 0 && (
        <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full ring-2 ring-white">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </Link>
  )
}
