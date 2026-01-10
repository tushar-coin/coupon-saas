// Material UI Table
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'

export default function CouponTable({ coupons = [] }) {
  return (
    <TableContainer component={Paper} sx={{ mt: 2,maxHeight: 400, overflow: 'auto', scrollBehavior: 'smooth' }}>
      <Table size="small" aria-label="coupons table" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell>Coupon Name</TableCell>
            <TableCell>Company</TableCell>
            <TableCell>Description</TableCell>
            <TableCell>Flat</TableCell>
            <TableCell>%</TableCell>
            <TableCell>Min Cart</TableCell>
            <TableCell>Max Discount</TableCell>
            <TableCell>Tags</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {coupons.map((c) => (
            <TableRow key={c.id} hover>
              <TableCell>{c.couponName}</TableCell>
              <TableCell>{c.companyId}</TableCell>
              <TableCell>{c.description}</TableCell>
              <TableCell>{c.flatValue}</TableCell>
              <TableCell>{c.percentageDiscount}</TableCell>
              <TableCell>{c.minCart}</TableCell>
              <TableCell>{c.maxDiscount}</TableCell>
              <TableCell>{(c.tags || []).join(', ')}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}