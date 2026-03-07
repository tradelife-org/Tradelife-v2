import { createServiceRoleClient } from '@/lib/supabase/server'
import { GlassPanel } from '@/components/ui/glass-panel'
import {
  ShieldCheck, FileText, Hammer, MapPin,
  CheckCircle2, Building, ExternalLink
} from 'lucide-react'
import { notFound } from 'next/navigation'

export default async function PublicHandoverPage({ params }: { params: { token: string } }) {
  const supabase = createServiceRoleClient()

  // 1. Fetch the handover pack and related data
  const { data: pack, error } = await supabase
    .from('handover_packs')
    .select(`
      *,
      jobs (
        title,
        address,
        uprn,
        organisations ( name ),
        job_documents (*),
        property_assets (*)
      )
    `)
    .eq('share_token', params.token)
    .single()

  if (error || !pack) {
    notFound()
  }

  const job = pack.jobs
  const org = job.organisations
  const documents = job.job_documents || []
  const assets = job.property_assets || []

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Branding & Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blueprint/10 text-blueprint text-xs font-bold uppercase tracking-widest">
            <ShieldCheck className="w-4 h-4" />
            Verified Digital Handover
          </div>
          <h1 className="text-4xl font-heading font-bold text-slate-900">
            {job.title}
          </h1>
          <p className="text-slate-500 font-medium">Prepared by {org.name}</p>
        </div>

        {/* The Golden Thread Summary */}
        <GlassPanel className="p-8 bg-white border-white shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h3 className="font-heading font-bold text-slate-900 flex items-center gap-2">
                <Building className="w-5 h-5 text-blueprint" />
                Property Details
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-slate-800">{job.address}</p>
                    <p className="text-xs text-slate-400">Site Address</p>
                  </div>
                </div>
                {job.uprn && (
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">UPRN (Land Registry Link)</p>
                    <p className="text-sm font-mono font-bold text-blueprint">{job.uprn}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-blueprint/5 rounded-2xl p-6 border border-blueprint/10 flex flex-col justify-center items-center text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-sm">
                <CheckCircle2 className="w-8 h-8 text-blueprint" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">Compliance Verified</h4>
                <p className="text-xs text-slate-500">All certificates and warranties are active and logged in the Golden Thread audit trail.</p>
              </div>
            </div>
          </div>
        </GlassPanel>

        {/* Asset Inventory */}
        <div className="space-y-4">
          <h3 className="font-heading font-bold text-xl text-slate-900 px-2 flex items-center gap-2">
            <Hammer className="w-5 h-5 text-slate-400" />
            Installed Assets
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assets.map((asset: any) => (
              <GlassPanel key={asset.id} className="p-4 bg-white hover:border-blueprint/30 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-bold text-slate-800">{asset.name}</h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-green-50 text-green-600 uppercase">Active Warranty</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <span className="text-slate-400">Manufacturer</span>
                  <span className="text-slate-700 font-medium">{asset.manufacturer || '—'}</span>
                  <span className="text-slate-400">Model</span>
                  <span className="text-slate-700 font-medium">{asset.model || '—'}</span>
                  <span className="text-slate-400">Serial</span>
                  <span className="text-slate-700 font-medium">{asset.serial_number || '—'}</span>
                </div>
              </GlassPanel>
            ))}
          </div>
        </div>

        {/* Document Library */}
        <div className="space-y-4">
          <h3 className="font-heading font-bold text-xl text-slate-900 px-2 flex items-center gap-2">
            <FileText className="w-5 h-5 text-slate-400" />
            Compliance Library
          </h3>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            {documents.map((doc: any, i: number) => (
              <div key={doc.id} className={`flex items-center justify-between p-4 ${i !== documents.length - 1 ? 'border-b border-slate-100' : ''}`}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100">
                    <FileText className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{doc.name}</p>
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{doc.compliance_bucket.replace('_', ' ')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {doc.verified_at && (
                    <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-md bg-green-50 text-[10px] font-bold text-green-600 border border-green-100">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      VERIFIED
                    </div>
                  )}
                  <a
                    href={`/api/documents/download?path=${doc.file_path}`}
                    target="_blank"
                    className="p-2 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-blueprint transition-colors"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Audit Trail */}
        <div className="text-center pt-8 border-t border-slate-200">
          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-[0.2em] mb-2">Secure Digital Handover Pack</p>
          <p className="text-xs text-slate-400">Generated on {new Date(pack.created_at).toLocaleDateString()} • Pack ID: {pack.id}</p>
        </div>

      </div>
    </div>
  )
}
