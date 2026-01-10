// import { useEffect, useState } from 'react'
// import CouponTable from '../components/CouponTable'
// import CouponModal from '../components/CouponModal'

// // Material UI
// import Container from '@mui/material/Container'
// import Typography from '@mui/material/Typography'
// import Stack from '@mui/material/Stack'
// import Button from '@mui/material/Button'
// import Paper from '@mui/material/Paper'
// import TextField from '@mui/material/TextField'
// import InputAdornment from '@mui/material/InputAdornment'
// import Box from '@mui/material/Box'

// // Icons
// import SearchIcon from '@mui/icons-material/Search'
// import AddIcon from '@mui/icons-material/Add'
// import EditIcon from '@mui/icons-material/Edit'
// import DeleteIcon from '@mui/icons-material/Delete'

// import { fetchCoupons } from '../api'
// import { SECRET_KEY } from '../config'

// export default function Dashboard() {
//   const [type, setType] = useState('default')
//   const [coupons, setCoupons] = useState([])
//   const [modal, setModal] = useState(null)
//   const [query, setQuery] = useState('')
//   const [loading, setLoading] = useState(false)
//   const [error, setError] = useState(null)

//   async function load(typeToLoad = type) {
//     setLoading(true)
//     setError(null)
//     try {
//       const data = await fetchCoupons({ secretKey: SECRET_KEY, type: typeToLoad })
//       setCoupons(data)
//     } catch (err) {
//       setError(err.message || 'Failed to load coupons')
//     } finally {
//       setLoading(false)
//     }
//   }

//   useEffect(() => {
//     load(type)
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [type])

//   const filtered = coupons.filter((c) => {
//     if (!query) return true
//     const q = query.toLowerCase()
//     return (
//       (c.couponName || '').toLowerCase().includes(q) ||
//       (c.companyId || '').toLowerCase().includes(q) ||
//       (c.description || '').toLowerCase().includes(q) ||
//       (c.tags || []).join(' ').toLowerCase().includes(q)
//     )
//   })

//   return (
//     <Container maxWidth="lg" sx={{ py: 4 }}>
//       <Typography variant="h4" component="h1" gutterBottom>
//         Coupon Manager
//       </Typography>

//       <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
//         <Button variant={type === 'default' ? 'contained' : 'outlined'} onClick={() => setType('default')}>
//           Default
//         </Button>
//         <Button variant={type === 'custom' ? 'contained' : 'outlined'} onClick={() => setType('custom')}>
//           Custom
//         </Button>

//         <Box sx={{ flex: 1 }} />

//         <TextField
//           size="small"
//           variant="outlined"
//           placeholder="Search coupons..."
//           value={query}
//           onChange={(e) => setQuery(e.target.value)}
//           InputProps={{
//             startAdornment: (
//               <InputAdornment position="start">
//                 <SearchIcon />
//               </InputAdornment>
//             ),
//           }}
//           sx={{ width: 280 }}
//         />
//       </Stack>

//       <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
//         {loading ? (
//           <Typography>Loading...</Typography>
//         ) : error ? (
//           <Typography color="error">{error}</Typography>
//         ) : (
//           <>
//             <CouponTable coupons={filtered} />

//             <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 2 }}>
//               <Typography variant="caption">Showing {filtered.length} of {coupons.length} coupons</Typography>

//               <Stack direction="row" spacing={2}>
//                 <Button startIcon={<AddIcon />} variant="contained" color="primary" onClick={() => setModal({ type: 'add' })}>Add New Coupon</Button>
//                 <Button startIcon={<EditIcon />} variant="outlined" onClick={() => setModal({ type: 'update' })}>Update Coupon</Button>
//                 <Button startIcon={<DeleteIcon />} variant="outlined" color="error" onClick={() => setModal({ type: 'delete' })}>Delete Coupon</Button>
//               </Stack>
//             </Box>
//           </>
//         )}
//       </Paper>

//       {modal && (
//         <CouponModal
//           type={modal.type}
//           onClose={() => setModal(null)}
//           onSuccess={() => load(type)}
//         />
//       )}
//     </Container>
//   )
// }

// import { useEffect, useState } from 'react'
// import CouponTable from '../components/CouponTable'
// import CouponModal from '../components/CouponModal'

// // Material UI
// import Container from '@mui/material/Container'
// import Typography from '@mui/material/Typography'
// import Stack from '@mui/material/Stack'
// import Button from '@mui/material/Button'
// import Paper from '@mui/material/Paper'
// import TextField from '@mui/material/TextField'
// import InputAdornment from '@mui/material/InputAdornment'
// import IconButton from '@mui/material/IconButton'
// import Box from '@mui/material/Box'
// import Chip from '@mui/material/Chip'

// // Icons
// import SearchIcon from '@mui/icons-material/Search'
// import AddIcon from '@mui/icons-material/Add'
// import EditIcon from '@mui/icons-material/Edit'
// import DeleteIcon from '@mui/icons-material/Delete'

// export default function Dashboard() {
//   const [type, setType] = useState('default')
//   const [coupons, setCoupons] = useState([])
//   const [modal, setModal] = useState(null)
//   const [query, setQuery] = useState('')

//   useEffect(() => {
//     // mock backend fetch
//     setCoupons([
//       {
//         id: 'SUMMER2024_ACME',
//         couponName: 'SUMMER2024',
//         companyId: 'ACME',
//         description: 'Summer Sale',
//         flatValue: 0,
//         percentageDiscount: 20,
//         minCart: 500,
//         maxDiscount: 200,
//         tags: ['seasonal']
//       },
//       {
//         id: 'WINTER2024_ACME',
//         couponName: 'WINTER2024',
//         companyId: 'ACME',
//         description: 'Summer Sale',
//         flatValue: 0,
//         percentageDiscount: 20,
//         minCart: 500,
//         maxDiscount: 200,
//         tags: ['seasonal']
//       },
//       {
//         id: 'NEW2024_ACME',
//         couponName: 'NEW2024',
//         companyId: 'ACME',
//         description: 'Summer Sale',
//         flatValue: 0,
//         percentageDiscount: 20,
//         minCart: 500,
//         maxDiscount: 200,
//         tags: ['seasonal']
//       },
//       {
//         id: 'SALESALE',
//         couponName: 'SALESALE',
//         companyId: 'ACME',
//         description: 'Summer Sale',
//         flatValue: 0,
//         percentageDiscount: 20,
//         minCart: 500,
//         maxDiscount: 200,
//         tags: ['seasonal']
//       },
//       {
//         id: 'SUMMER2024_ACME',
//         couponName: 'SUMMER2024',
//         companyId: 'ACME',
//         description: 'Summer Sale',
//         flatValue: 0,
//         percentageDiscount: 20,
//         minCart: 500,
//         maxDiscount: 200,
//         tags: ['seasonal']
//       },
//       {
//         id: 'SUMMER2024_ACME',
//         couponName: 'SUMMER2024',
//         companyId: 'ACME',
//         description: 'Summer Sale',
//         flatValue: 0,
//         percentageDiscount: 20,
//         minCart: 500,
//         maxDiscount: 200,
//         tags: ['seasonal']
//       },
//       {
//         id: 'SUMMER2024_ACME',
//         couponName: 'SUMMER2024',
//         companyId: 'ACME',
//         description: 'Summer Sale',
//         flatValue: 0,
//         percentageDiscount: 20,
//         minCart: 500,
//         maxDiscount: 200,
//         tags: ['seasonal']
//       },
//       {
//         id: 'SUMMER2024_ACME',
//         couponName: 'SUMMER2024',
//         companyId: 'ACME',
//         description: 'Summer Sale',
//         flatValue: 0,
//         percentageDiscount: 20,
//         minCart: 500,
//         maxDiscount: 200,
//         tags: ['seasonal']
//       },
//       {
//         id: 'SUMMER2024_ACME',
//         couponName: 'SUMMER2024',
//         companyId: 'ACME',
//         description: 'Summer Sale',
//         flatValue: 0,
//         percentageDiscount: 20,
//         minCart: 500,
//         maxDiscount: 200,
//         tags: ['seasonal']
//       },
//       {
//         id: 'SUMMER2024_ACME',
//         couponName: 'SUMMER2024',
//         companyId: 'ACME',
//         description: 'Summer Sale',
//         flatValue: 0,
//         percentageDiscount: 20,
//         minCart: 500,
//         maxDiscount: 200,
//         tags: ['seasonal']
//       },
//       {
//         id: 'SUMMER2024_ACME',
//         couponName: 'SUMMER2024',
//         companyId: 'ACME',
//         description: 'Summer Sale',
//         flatValue: 0,
//         percentageDiscount: 20,
//         minCart: 500,
//         maxDiscount: 200,
//         tags: ['seasonal']
//       },
//       {
//         id: 'SUMMER2024_ACME',
//         couponName: 'SUMMER2024',
//         companyId: 'ACME',
//         description: 'Summer Sale',
//         flatValue: 0,
//         percentageDiscount: 20,
//         minCart: 500,
//         maxDiscount: 200,
//         tags: ['seasonal']
//       },
//       {
//         id: 'SUMMER2024_ACME',
//         couponName: 'SUMMER2024',
//         companyId: 'ACME',
//         description: 'Summer Sale',
//         flatValue: 0,
//         percentageDiscount: 20,
//         minCart: 500,
//         maxDiscount: 200,
//         tags: ['seasonal']
//       },
//       {
//         id: 'SUMMER2024_ACME',
//         couponName: 'SUMMER2024',
//         companyId: 'ACME',
//         description: 'Summer Sale',
//         flatValue: 0,
//         percentageDiscount: 20,
//         minCart: 500,
//         maxDiscount: 200,
//         tags: ['seasonal']
//       },
//       {
//         id: 'SUMMER2024_ACME',
//         couponName: 'SUMMER2024',
//         companyId: 'ACME',
//         description: 'Summer Sale',
//         flatValue: 0,
//         percentageDiscount: 20,
//         minCart: 500,
//         maxDiscount: 200,
//         tags: ['seasonal']
//       },
//       {
//         id: 'SUMMER2024_ACME',
//         couponName: 'SUMMER2024',
//         companyId: 'ACME',
//         description: 'Summer Sale',
//         flatValue: 0,
//         percentageDiscount: 20,
//         minCart: 500,
//         maxDiscount: 200,
//         tags: ['seasonal']
//       },
//       {
//         id: 'SUMMER2024_ACME',
//         couponName: 'SUMMER2024',
//         companyId: 'ACME',
//         description: 'Summer Sale',
//         flatValue: 0,
//         percentageDiscount: 20,
//         minCart: 500,
//         maxDiscount: 200,
//         tags: ['seasonal']
//       },
//       {
//         id: 'SUMMER2024_ACME',
//         couponName: 'SUMMER2024',
//         companyId: 'ACME',
//         description: 'Summer Sale',
//         flatValue: 0,
//         percentageDiscount: 20,
//         minCart: 500,
//         maxDiscount: 200,
//         tags: ['seasonal']
//       },
//       {
//         id: 'SUMMER2024_ACME',
//         couponName: 'SUMMER2024',
//         companyId: 'ACME',
//         description: 'Summer Sale',
//         flatValue: 0,
//         percentageDiscount: 20,
//         minCart: 500,
//         maxDiscount: 200,
//         tags: ['seasonal']
//       }
//     ])
//   }, [type])

//   const filtered = coupons.filter((c) => {
//     if (!query) return true
//     const q = query.toLowerCase()
//     return (
//       c.couponName.toLowerCase().includes(q) ||
//       c.companyId.toLowerCase().includes(q) ||
//       (c.description || '').toLowerCase().includes(q) ||
//       import { fetchCoupons } from '../api'
//       import { SECRET_KEY } from '../config'

//       export default function Dashboard() {
//         const [type, setType] = useState('default')
//         const [coupons, setCoupons] = useState([])
//         const [modal, setModal] = useState(null)
//         const [query, setQuery] = useState('')
//         const [loading, setLoading] = useState(false)
//         const [error, setError] = useState(null)

//         async function load(typeToLoad = type) {
//           setLoading(true)
//           setError(null)
//           try {
//             const data = await fetchCoupons({ secretKey: SECRET_KEY, type: typeToLoad })
//             setCoupons(data)
//           } catch (err) {
//             setError(err.message || 'Failed to load coupons')
//           } finally {
//             setLoading(false)
//           }
//         }

//         useEffect(() => {
//           load(type)
//         }, [type])

//         const filtered = coupons.filter((c) => {
//           if (!query) return true
//           const q = query.toLowerCase()
//           return (
//             (c.couponName || '').toLowerCase().includes(q) ||
//             (c.companyId || '').toLowerCase().includes(q) ||
//             (c.description || '').toLowerCase().includes(q) ||
//             (c.tags || []).join(' ').toLowerCase().includes(q)
//           )
//         })

//         return (
//           <Container maxWidth="lg" sx={{ py: 4 }}>
//             <Typography variant="h4" component="h1" gutterBottom>
//               Coupon Manager
//             </Typography>

//             <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
//               <Button variant={type === 'default' ? 'contained' : 'outlined'} onClick={() => setType('default')}>
//                 Default
//               </Button>
//               <Button variant={type === 'custom' ? 'contained' : 'outlined'} onClick={() => setType('custom')}>
//                 Custom
//               </Button>

//               <Box sx={{ flex: 1 }} />

//               <TextField
//                 size="small"
//                 variant="outlined"
//                 placeholder="Search coupons..."
//                 value={query}
//                 onChange={(e) => setQuery(e.target.value)}
//                 InputProps={{
//                   startAdornment: (
//                     <InputAdornment position="start">
//                       <SearchIcon />
//                     </InputAdornment>
//                   ),
//                 }}
//                 sx={{ width: 280 }}
//               />
//             </Stack>

//             <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
//               {loading ? (
//                 <Typography>Loading...</Typography>
//               ) : error ? (
//                 <Typography color="error">{error}</Typography>
//               ) : (
//                 <>
//                   <CouponTable coupons={filtered} />

//                   <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 2 }}>
//                     <Typography variant="caption">Showing {filtered.length} of {coupons.length} coupons</Typography>

//                     <Stack direction="row" spacing={2}>
//                       <Button startIcon={<AddIcon />} variant="contained" color="primary" onClick={() => setModal({ type: 'add' })}>Add New Coupon</Button>
//                       <Button startIcon={<EditIcon />} variant="outlined" onClick={() => setModal({ type: 'update' })}>Update Coupon</Button>
//                       <Button startIcon={<DeleteIcon />} variant="outlined" color="error" onClick={() => setModal({ type: 'delete' })}>Delete Coupon</Button>
//                     </Stack>
//                   </Box>
//                 </>
//               )}
//             </Paper>

//             {modal && (
//               <CouponModal
//                 type={modal.type}
//                 onClose={() => setModal(null)}
//                 onSuccess={() => load(type)}
//               />
//             )}
//           </Container>
//         )
//       }