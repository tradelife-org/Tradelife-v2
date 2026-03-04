'use client'

import * as React from 'react'
import { Upload, CheckCircle, Loader2, FileText, AlertCircle } from 'lucide-react'
import { ocrReceiptAction, confirmReceiptAction, ReceiptData } from '@/lib/actions/receipts'
import { formatCurrency } from '@/lib/actions/quotes'

export default function ReceiptUploader({ jobId }: { jobId: string }) {
  const [file, setFile] = React.useState<File | null>(null)
  const [data, setData] = React.useState<ReceiptData | null>(null)
  const [processing, setProcessing] = React.useState(false)
  const [confirming, setConfirming] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setData(null)
      setError(null)
    }
  }

  const handleAnalyze = async () => {
    if (!file) return
    setProcessing(true)
    setError(null)
    
    const formData = new FormData()
    formData.append('file', file)
    
    try {
      const result = await ocrReceiptAction(formData)
      setData(result)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setProcessing(false)
    }
  }

  const handleConfirm = async () => {
    if (!data) return
    setConfirming(true)
    try {
      await confirmReceiptAction(jobId, data)
      setFile(null)
      setData(null)
      alert('Expense logged successfully')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setConfirming(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
      <h3 className="text-sm font-heading font-bold text-slate-900 mb-3 flex items-center gap-2">
        <Upload className="w-4 h-4 text-blueprint" />
        Upload Receipt
      </h3>

      {!data ? (
        <div className="space-y-3">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blueprint-50 file:text-blueprint hover:file:bg-blueprint-100"
          />
          
          {file && (
            <button
              onClick={handleAnalyze}
              disabled={processing}
              className="w-full py-2 bg-blueprint text-white text-sm font-semibold rounded-lg hover:bg-blueprint-700 disabled:opacity-50 transition-colors flex justify-center items-center gap-2"
            >
              {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Analyze with AI'}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-semibold text-slate-900">{data.supplier}</p>
              <p className="text-xs text-slate-500">{data.description}</p>
            </div>
            <p className="font-mono font-bold text-slate-900">{formatCurrency(data.totalAmount)}</p>
          </div>
          
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => setData(null)}
              className="flex-1 py-1.5 bg-white border border-slate-200 text-slate-600 text-xs font-semibold rounded hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={confirming}
              className="flex-1 py-1.5 bg-green-600 text-white text-xs font-semibold rounded hover:bg-green-700 disabled:opacity-50 flex justify-center items-center gap-1"
            >
              {confirming ? <Loader2 className="w-3 h-3 animate-spin" /> : <><CheckCircle className="w-3 h-3" /> Confirm</>}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-3 p-2 bg-red-50 text-red-600 text-xs rounded flex items-center gap-2">
          <AlertCircle className="w-3 h-3" />
          {error}
        </div>
      )}
    </div>
  )
}
