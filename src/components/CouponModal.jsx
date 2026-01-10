import { useState } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import Alert from '@mui/material/Alert'

import { createCoupon, updateCoupon, deleteCoupon } from '../api'
import { SECRET_KEY } from '../config'

export default function CouponModal({ type, onClose, onSuccess, forType = 'default' }) {
  const [form, setForm] = useState({
    id: '',
    couponName: '',
    companyId: '',
    description: '',
    flatValue: 0,
    percentageDiscount: 0,
    minCart: 0,
    maxDiscount: 0,
    tags: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  function updateField(k, v) {
    setForm((s) => ({ ...s, [k]: v }))
  }

  async function handleSubmit() {
    setError(null)
    console.log('[Modal] handleSubmit called, type=', type, 'form=', form)
    try {
      setLoading(true)

      if (type === 'add') {
        // require all details for add
        const required = ['couponName', 'companyId', 'description']
        for (const r of required) {
          if (!form[r] || String(form[r]).trim() === '') {
            throw new Error(`${r} is required`)
          }
        }

        const data = {
          couponName: form.couponName.trim(),
          companyId: form.companyId.trim(),
          description: form.description.trim(),
          flatValue: Number(form.flatValue) || 0,
          percentageDiscount: Number(form.percentageDiscount) || 0,
          minCart: Number(form.minCart) || 0,
          maxDiscount: Number(form.maxDiscount) || 0,
          tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
          type: forType || 'default'
        }

        const created = await createCoupon({ secretKey: SECRET_KEY, data })
        console.log('[Modal] createCoupon success', created)
        onSuccess && onSuccess()
        onClose && onClose()
      } else if (type === 'update') {
        // require id and couponName for update
        if (!form.id || String(form.id).trim() === '') throw new Error('id is required for update')
        if (!form.couponName || String(form.couponName).trim() === '') throw new Error('couponName is required for update')

        const data = {
          couponName: form.couponName.trim(),
          companyId: form.companyId.trim(),
          description: form.description.trim(),
          flatValue: Number(form.flatValue) || 0,
          percentageDiscount: Number(form.percentageDiscount) || 0,
          minCart: Number(form.minCart) || 0,
          maxDiscount: Number(form.maxDiscount) || 0,
          tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : []
        }

        const updated = await updateCoupon({ secretKey: SECRET_KEY, id: form.id.trim(), data })
        console.log('[Modal] updateCoupon success', updated)
        onSuccess && onSuccess()
        onClose && onClose()
      } else if (type === 'delete') {
        if (!form.id || String(form.id).trim() === '') throw new Error('id is required for delete')
        const removed = await deleteCoupon({ secretKey: SECRET_KEY, id: form.id.trim() })
        console.log('[Modal] deleteCoupon success', removed)
        onSuccess && onSuccess()
        onClose && onClose()
      }
    } catch (err) {
      console.error('[Modal] operation failed', err)
      setError(err.message || 'Operation failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{type.toUpperCase()} COUPON</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {/* For update/delete require id */}
        {(type === 'update' || type === 'delete') && (
          <TextField
            label="Coupon ID"
            value={form.id}
            onChange={(e) => updateField('id', e.target.value)}
            fullWidth
            margin="normal"
            required
          />
        )}

        {type !== 'delete' && (
          <>
            <TextField label="Coupon Name" value={form.couponName} onChange={(e) => updateField('couponName', e.target.value)} fullWidth margin="normal" required />
            <TextField label="Company ID" value={form.companyId} onChange={(e) => updateField('companyId', e.target.value)} fullWidth margin="normal" required />
            <TextField label="Description" value={form.description} onChange={(e) => updateField('description', e.target.value)} fullWidth margin="normal" required />

            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField label="Flat Value" value={form.flatValue} onChange={(e) => updateField('flatValue', e.target.value)} type="number" fullWidth margin="normal" />
              <TextField label="% Discount" value={form.percentageDiscount} onChange={(e) => updateField('percentageDiscount', e.target.value)} type="number" fullWidth margin="normal" />
            </Box>

            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField label="Min Cart" value={form.minCart} onChange={(e) => updateField('minCart', e.target.value)} type="number" fullWidth margin="normal" />
              <TextField label="Max Discount" value={form.maxDiscount} onChange={(e) => updateField('maxDiscount', e.target.value)} type="number" fullWidth margin="normal" />
            </Box>

            <TextField label="Tags (comma separated)" value={form.tags} onChange={(e) => updateField('tags', e.target.value)} fullWidth margin="normal" />
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" color={type === 'delete' ? 'error' : 'primary'} disabled={loading}>
          {type === 'add' ? 'Create' : type === 'update' ? 'Update' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}