'use client'

import * as React from 'react'
import { FileText, ShieldCheck, Upload, AlertCircle, CheckCircle2 } from 'lucide-react'
import { GlassPanel } from '@/components/ui/glass-panel'
import { uploadJobDocument, verifyDocument, type ComplianceBucket } from '@/lib/actions/handover'

interface JobDocument {
  id: string
  name: string
  file_path: string
  compliance_bucket: ComplianceBucket
  uploaded_at: string
  verified_at: string | null
}

export default function HandoverDocuments({
  jobId,
  initialDocuments = []
}: {
  jobId: string
  initialDocuments?: JobDocument[]
}) {
  const [documents, setDocuments] = React.useState(initialDocuments)
  const [isUploading, setIsUploading] = React.useState(false)

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsUploading(true)
    const formData = new FormData(e.currentTarget)
    formData.append('jobId', jobId)

    try {
      await uploadJobDocument(formData)
    } catch (err) {
      alert('Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  const handleVerify = async (docId: string) => {
    try {
      await verifyDocument(docId, jobId)
    } catch (err) {
      alert('Verification failed')
    }
  }

  return (
    <GlassPanel className="p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <h3 className="font-heading font-bold text-slate-900 flex items-center gap-2">
          <FileText className="w-5 h-5 text-blueprint" />
          Compliance Documents
        </h3>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blueprint uppercase tracking-wider">
          The Golden Thread
        </span>
      </div>

      <div className="space-y-4">
        {documents.map(doc => (
          <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded bg-white border border-slate-200">
                <FileText className="w-4 h-4 text-slate-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">{doc.name}</p>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-medium text-slate-400 uppercase">{doc.compliance_bucket.replace('_', ' ')}</span>
                  {doc.verified_at ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-green-600">
                      <ShieldCheck className="w-3 h-3" /> VERIFIED
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-amber-500">
                      <AlertCircle className="w-3 h-3" /> PENDING VERIFICATION
                    </span>
                  )}
                </div>
              </div>
            </div>

            {!doc.verified_at && (
              <button
                className="h-8 px-3 rounded-md border border-slate-200 bg-white text-xs font-medium inline-flex items-center gap-1.5 hover:bg-slate-50 transition-colors"
                onClick={() => handleVerify(doc.id)}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Verify
              </button>
            )}
          </div>
        ))}

        {documents.length === 0 && (
          <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl">
            <p className="text-sm text-slate-400">No documents uploaded yet</p>
          </div>
        )}
      </div>

      <form onSubmit={handleUpload} className="pt-4 border-t border-slate-100 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <input
            name="name"
            placeholder="Document Name (e.g. Part P Cert)"
            required
            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
          <select
            name="complianceBucket"
            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
          >
            <option value="PART_P">Part P Electrical</option>
            <option value="GAS_SAFETY">Gas Safety</option>
            <option value="EPC">EPC Data</option>
            <option value="WARRANTY">Warranty</option>
            <option value="CERTIFICATE">Certificate</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
        <div className="flex gap-4">
          <input
            type="file"
            name="file"
            required
            className="flex-1 text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-slate-50 file:text-slate-700 hover:file:bg-slate-100"
          />
          <button
            type="submit"
            disabled={isUploading}
            className="inline-flex items-center gap-2 h-10 px-4 bg-blueprint text-white text-sm font-semibold rounded-lg hover:bg-blueprint/90 transition-colors disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            {isUploading ? 'Uploading...' : 'Upload Document'}
          </button>
        </div>
      </form>
    </GlassPanel>
  )
}
