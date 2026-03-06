'use client'

import { useState } from 'react'
import { processReceiptAction } from '@/lib/actions/finance'
import { GlassPanel } from '@/components/ui/glass-panel'
import { Upload, Loader2, CheckCircle, FileText } from 'lucide-react'

export default function ReceiptUploader({ jobs }: { jobs: any[] }) {
  const [file, setFile] = useState<File | null>(null)
  const [jobId, setJobId] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!file || !jobId) return alert('Select job and file')

    setLoading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('jobId', jobId)

    try {
      const res = await processReceiptAction(formData)
      setResult(res.data)
      setFile(null)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <GlassPanel className="p-6 bg-white border-slate-200">
      <h3 className="font-heading font-bold text-slate-900 mb-6 flex items-center gap-2">
        <Upload className="w-5 h-5 text-blueprint" />
        Ingest Receipt
      </h3>

      {!result ? (
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Select Job</label>
            <select
              required
              className="w-full h-10 px-3 border rounded-lg bg-slate-50"
              value={jobId}
              onChange={e => setJobId(e.target.value)}
            >
              <option value="">Choose Job...</option>
              {jobs.map(j => (
                <option key={j.id} value={j.id}>{j.title} ({j.clients?.name})</option>
              ))}
            </select>
          </div>

          <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-blueprint transition-colors cursor-pointer relative">
            <input 
              type="file" 
              accept="image/*"
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={e => setFile(e.target.files?.[0] || null)}
            />
            {file ? (
              <div className="flex flex-col items-center text-blueprint">
                <FileText className="w-8 h-8 mb-2" />
                <span className="font-medium text-sm">{file.name}</span>
              </div>
            ) : (
              <div className="flex flex-col items-center text-slate-400">
                <Upload className="w-8 h-8 mb-2" />
                <span className="text-sm">Tap to scan receipt</span>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !file || !jobId}
            className="w-full h-12 bg-blueprint text-white font-bold rounded-xl hover:bg-blueprint-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Analyze & Save'}
          </button>
        </form>
      ) : (
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-6 text-center animate-fade-in">
          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3 text-emerald-600">
            <CheckCircle className="w-6 h-6" />
          </div>
          <h4 className="font-bold text-emerald-800 text-lg mb-1">Receipt Processed</h4>
          <p className="text-emerald-600 text-sm mb-4">Added to Job Ledger</p>
          
          <div className="bg-white rounded-lg p-3 text-left text-sm space-y-2 border border-emerald-100 shadow-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Merchant</span>
              <span className="font-bold text-slate-800">{result.merchant}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Date</span>
              <span className="font-bold text-slate-800">{result.date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Amount</span>
              <span className="font-mono font-bold text-slate-800">£{(result.amount/100).toFixed(2)}</span>
            </div>
          </div>

          <button 
            onClick={() => setResult(null)}
            className="mt-4 text-sm text-emerald-600 font-bold hover:underline"
          >
            Scan Another
          </button>
        </div>
      )}
    </GlassPanel>
  )
}
