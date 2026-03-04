'use client'

import * as React from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  ArrowLeft, Briefcase, Clock, MapPin, 
  Calendar, CreditCard
} from 'lucide-react'
import JobFinancials from '@/components/job-financials'
import ReceiptUploader from '@/components/receipt-uploader'
import SmallWorksLogger from '@/components/small-works-logger'

interface Job {
  id: string
  org_id: string
  title: string
  status: string
  client_id: string | null
  client_name?: string
  address: string | null
  target_start_date: string | null
  target_end_date: string | null
  created_at: string
}

function formatDate(iso: string | null) {
  if (!iso) return 'Not set'
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric'
  })
}

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const [job, setJob] = React.useState<Job | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    async function fetchJob() {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          clients ( name )
        `)
        .eq('id', params.id)
        .single()
      
      if (error) {
        setError('Failed to load job details.')
      } else if (data) {
        setJob({
          ...data,
          client_name: (data as any).clients?.name
        })
      }
      setLoading(false)
    }
    fetchJob()
  }, [params.id])

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-pulse text-slate-400">Loading Job...</div>
    </div>
  )

  if (error || !job) return (
    <div className="max-w-5xl mx-auto px-4 py-8 text-center text-red-500">
      {error || 'Job not found'}
      <br />
      <Link href="/jobs" className="text-blueprint hover:underline mt-4 inline-block">Back to Jobs</Link>
    </div>
  )

  const statusColors: Record<string, string> = {
    ENQUIRY: 'bg-slate-100 text-slate-600',
    BOOKED: 'bg-blue-50 text-blue-700',
    ON_SITE: 'bg-amber-50 text-amber-700',
    COMPLETED: 'bg-green-50 text-green-700',
    SNAGGING: 'bg-orange-50 text-orange-700',
    SIGNED_OFF: 'bg-emerald-50 text-emerald-700',
    CANCELLED: 'bg-red-50 text-red-700',
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <Link href="/jobs" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-900 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Jobs
        </Link>
        
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-heading font-bold text-slate-900">{job.title}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${statusColors[job.status] || 'bg-slate-100'}`}>
                {job.status.replace('_', ' ')}
              </span>
            </div>
            <p className="text-slate-500 font-medium">{job.client_name || 'Unknown Client'}</p>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Details & Financials */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Details Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
            <h3 className="font-heading font-semibold text-slate-900 flex items-center gap-2 pb-4 border-b border-slate-100">
              <Briefcase className="w-5 h-5 text-slate-400" />
              Job Details
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Site Address</label>
                <div className="flex items-start gap-2 text-slate-700 text-sm">
                  <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <span>{job.address || 'No address set'}</span>
                </div>
              </div>
              
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Schedule</label>
                <div className="space-y-1 text-sm text-slate-700">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>Start: {formatDate(job.target_start_date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>End: {formatDate(job.target_end_date)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Health View (Task 2) */}
          <div className="space-y-4">
            <h3 className="font-heading font-bold text-xl text-slate-900 flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-blueprint" />
              Financial Health
            </h3>
            <JobFinancials jobId={job.id} orgId={job.org_id} />
          </div>

        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          
          {/* Small Works Engine (Module 5.2) */}
          <SmallWorksLogger jobId={job.id} />

          {/* Receipt OCR (Task 3) */}
          <ReceiptUploader jobId={job.id} />

          {/* Timeline Placeholder */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-heading font-semibold text-slate-900 mb-4">Timeline</h3>
            <div className="space-y-4">
              <div className="flex gap-3 relative">
                <div className="absolute left-1 top-2 bottom-0 w-0.5 bg-slate-100" />
                <div className="mt-1.5 w-2 h-2 rounded-full bg-blueprint shrink-0 relative z-10" />
                <div>
                   <p className="text-sm font-medium text-slate-900">Job created</p>
                   <p className="text-xs text-slate-400 mt-0.5">{formatDate(job.created_at)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
