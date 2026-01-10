import { useMock, SECRET_KEY } from '../config'

// Simple in-memory mock data store and API emulation
// This module logs incoming calls and the mock store state to help debugging.
// Behavior: when `useMock` is true (from `src/config.js`) the functions operate
// against the in-memory `mockStore`. When false, they'll throw until real
// API integration is implemented.
const mockStore = {
  coupons: [
    {
      id: 'SUMMER2024_ACME',
      couponName: 'SUMMER2024',
      companyId: 'ACME',
      description: 'Summer blowout sale for all electronics.',
      flatValue: 0,
      percentageDiscount: 20,
      minCart: 500,
      maxDiscount: 200,
      tags: ['seasonal'],
      type: 'default'
    },
    {
      id: 'WELCOME10_GLOBAL',
      couponName: 'WELCOME10',
      companyId: 'Global Tech',
      description: 'First time user discount.',
      flatValue: 10,
      percentageDiscount: 0,
      minCart: 0,
      maxDiscount: 10,
      tags: ['new_user'],
      type: 'custom'
    }
  ]
}

function ensureKey(key) {
  if (!key || key !== SECRET_KEY) {
    const err = new Error('Invalid or missing secret key')
    err.status = 401
    console.warn('[API] ensureKey failed, provided key:', key)
    throw err
  }
}

const delay = (ms = 300) => new Promise((res) => setTimeout(res, ms))

export async function fetchCoupons({ secretKey, type = 'default' } = {}) {
  console.log('[API] fetchCoupons called', { secretKey: Boolean(secretKey), type })
  if (!useMock) {
    // TODO: replace with real API call
    console.warn('[API] fetchCoupons: real API not implemented')
    throw new Error('Real API integration not implemented')
  }

  ensureKey(secretKey)
  await delay()
  const result = mockStore.coupons.filter((c) => (type ? c.type === type : true))
  console.log('[API] fetchCoupons returning', result.length, 'items')
  return result
}

export async function createCoupon({ secretKey, data } = {}) {
  console.log('[API] createCoupon called', { data })
  if (!useMock) {
    console.warn('[API] createCoupon: real API not implemented')
    throw new Error('Real API integration not implemented')
  }

  ensureKey(secretKey)
  await delay()

  // basic validation
  const required = ['couponName', 'companyId']
  for (const f of required) {
    if (!data[f]) {
      const e = new Error(`${f} is required`)
      e.status = 400
      console.warn('[API] createCoupon validation failed', e.message)
      throw e
    }
  }

  const id = data.id || `${data.couponName}_${data.companyId}`.replace(/\s+/g, '').toUpperCase()
  const newItem = { ...data, id }
  mockStore.coupons.unshift(newItem)
  console.log('[API] createCoupon added id=', id, 'current count=', mockStore.coupons.length)
  return newItem
}

export async function updateCoupon({ secretKey, id, data } = {}) {
  console.log('[API] updateCoupon called', { id, data })
  if (!useMock) {
    console.warn('[API] updateCoupon: real API not implemented')
    throw new Error('Real API integration not implemented')
  }

  ensureKey(secretKey)
  await delay()

  const idx = mockStore.coupons.findIndex((c) => c.id === id)
  if (idx === -1) {
    const e = new Error('Coupon not found')
    e.status = 404
    console.warn('[API] updateCoupon not found id=', id)
    throw e
  }

  // require id and couponName for update as mandatory
  if (!data.couponName) {
    const e = new Error('couponName is required for update')
    e.status = 400
    console.warn('[API] updateCoupon validation failed', e.message)
    throw e
  }

  mockStore.coupons[idx] = { ...mockStore.coupons[idx], ...data }
  console.log('[API] updateCoupon updated id=', id)
  return mockStore.coupons[idx]
}

export async function deleteCoupon({ secretKey, id } = {}) {
  console.log('[API] deleteCoupon called', { id })
  if (!useMock) {
    console.warn('[API] deleteCoupon: real API not implemented')
    throw new Error('Real API integration not implemented')
  }

  ensureKey(secretKey)
  await delay()

  const idx = mockStore.coupons.findIndex((c) => c.id === id)
  if (idx === -1) {
    const e = new Error('Coupon not found')
    e.status = 404
    console.warn('[API] deleteCoupon not found id=', id)
    throw e
  }

  const removed = mockStore.coupons.splice(idx, 1)[0]
  console.log('[API] deleteCoupon removed id=', id, 'remaining count=', mockStore.coupons.length)
  return removed
}
