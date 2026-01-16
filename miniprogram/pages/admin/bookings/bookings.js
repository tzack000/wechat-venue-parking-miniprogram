// pages/admin/bookings/bookings.js
const app = getApp()
const { bookingApi } = require('../../../utils/api')
const { bookingStatusMap, venueTypeMap, showToast, showConfirm, showLoading, hideLoading } = require('../../../utils/util')

Page({
  data: {
    statusTabs: [
      { value: '', label: '全部' },
      { value: 'pending', label: '待确认' },
      { value: 'confirmed', label: '已确认' },
      { value: 'completed', label: '已完成' },
      { value: 'cancelled', label: '已取消' }
    ],
    currentStatus: '',
    bookings: [],
    loading: false,
    page: 1,
    pageSize: 20,
    hasMore: true
  },

  onLoad() {
    if (!app.checkAdmin()) {
      showToast('无权限访问')
      setTimeout(() => wx.navigateBack(), 1500)
      return
    }
    this.loadBookings()
  },

  onPullDownRefresh() {
    this.setData({ page: 1, hasMore: true })
    this.loadBookings().then(() => {
      wx.stopPullDownRefresh()
    })
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadMoreBookings()
    }
  },

  onStatusChange(e) {
    const status = e.currentTarget.dataset.status
    this.setData({
      currentStatus: status,
      page: 1,
      hasMore: true
    })
    this.loadBookings()
  },

  async loadBookings() {
    this.setData({ loading: true })
    
    try {
      const res = await bookingApi.getAllList({
        status: this.data.currentStatus,
        page: 1,
        pageSize: this.data.pageSize
      })
      
      if (res.success) {
        const bookings = this.formatBookings(res.data)
        this.setData({
          bookings,
          page: 1,
          hasMore: res.data.length >= this.data.pageSize
        })
      }
    } catch (err) {
      console.error('加载预约列表失败:', err)
      showToast('加载失败')
    } finally {
      this.setData({ loading: false })
    }
  },

  async loadMoreBookings() {
    this.setData({ loading: true })
    
    try {
      const nextPage = this.data.page + 1
      const res = await bookingApi.getAllList({
        status: this.data.currentStatus,
        page: nextPage,
        pageSize: this.data.pageSize
      })
      
      if (res.success) {
        const newBookings = this.formatBookings(res.data)
        this.setData({
          bookings: [...this.data.bookings, ...newBookings],
          page: nextPage,
          hasMore: res.data.length >= this.data.pageSize
        })
      }
    } catch (err) {
      console.error('加载更多失败:', err)
    } finally {
      this.setData({ loading: false })
    }
  },

  formatBookings(bookings) {
    return bookings.map(booking => ({
      ...booking,
      statusText: bookingStatusMap[booking.status]?.text || booking.status,
      statusClass: bookingStatusMap[booking.status]?.class || '',
      venueTypeText: venueTypeMap[booking.venueType]?.text || '其他',
      canApprove: booking.status === 'pending',
      canReject: booking.status === 'pending',
      canCancel: ['pending', 'confirmed'].includes(booking.status)
    }))
  },

  // 审核通过
  async onApprove(e) {
    const bookingId = e.currentTarget.dataset.id
    
    const confirmed = await showConfirm('提示', '确定通过该预约？')
    if (!confirmed) return
    
    showLoading('处理中...')
    
    try {
      const res = await bookingApi.approve(bookingId)
      hideLoading()
      
      if (res.success) {
        showToast('已通过', 'success')
        this.loadBookings()
      } else {
        showToast(res.message || '操作失败')
      }
    } catch (err) {
      hideLoading()
      showToast('操作失败')
    }
  },

  // 拒绝预约
  async onReject(e) {
    const bookingId = e.currentTarget.dataset.id
    
    const confirmed = await showConfirm('提示', '确定拒绝该预约？')
    if (!confirmed) return
    
    showLoading('处理中...')
    
    try {
      const res = await bookingApi.reject(bookingId, '管理员拒绝')
      hideLoading()
      
      if (res.success) {
        showToast('已拒绝', 'success')
        this.loadBookings()
      } else {
        showToast(res.message || '操作失败')
      }
    } catch (err) {
      hideLoading()
      showToast('操作失败')
    }
  },

  // 取消预约
  async onCancel(e) {
    const bookingId = e.currentTarget.dataset.id
    
    const confirmed = await showConfirm('提示', '确定取消该预约？')
    if (!confirmed) return
    
    showLoading('处理中...')
    
    try {
      const res = await bookingApi.reject(bookingId, '管理员取消')
      hideLoading()
      
      if (res.success) {
        showToast('已取消', 'success')
        this.loadBookings()
      } else {
        showToast(res.message || '操作失败')
      }
    } catch (err) {
      hideLoading()
      showToast('操作失败')
    }
  }
})
