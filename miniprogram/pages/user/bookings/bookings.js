// pages/user/bookings/bookings.js
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
    pageSize: 10,
    hasMore: true
  },

  onLoad() {
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

  // 切换状态
  onStatusChange(e) {
    const status = e.currentTarget.dataset.status
    this.setData({
      currentStatus: status,
      page: 1,
      hasMore: true
    })
    this.loadBookings()
  },

  // 加载预约列表
  async loadBookings() {
    this.setData({ loading: true })
    
    try {
      const res = await bookingApi.getMyList({
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

  // 加载更多
  async loadMoreBookings() {
    this.setData({ loading: true })
    
    try {
      const nextPage = this.data.page + 1
      const res = await bookingApi.getMyList({
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

  // 格式化预约数据
  formatBookings(bookings) {
    return bookings.map(booking => ({
      ...booking,
      statusText: bookingStatusMap[booking.status]?.text || booking.status,
      statusClass: bookingStatusMap[booking.status]?.class || '',
      venueTypeText: venueTypeMap[booking.venueType]?.text || '其他',
      venueTypeIcon: venueTypeMap[booking.venueType]?.icon || '🏟️',
      canCancel: ['pending', 'confirmed'].includes(booking.status)
    }))
  },

  // 取消预约
  async onCancelBooking(e) {
    const bookingId = e.currentTarget.dataset.id
    
    const confirmed = await showConfirm('提示', '确定要取消这个预约吗？')
    if (!confirmed) return
    
    showLoading('取消中...')
    
    try {
      const res = await bookingApi.cancel(bookingId)
      
      hideLoading()
      
      if (res.success) {
        showToast('取消成功', 'success')
        this.loadBookings()
      } else {
        showToast(res.message || '取消失败')
      }
    } catch (err) {
      hideLoading()
      console.error('取消预约失败:', err)
      showToast('取消失败')
    }
  },

  // 查看详情
  onViewDetail(e) {
    const bookingId = e.currentTarget.dataset.id
    // 可以跳转到详情页，这里简单显示详情
    const booking = this.data.bookings.find(b => b._id === bookingId)
    if (booking) {
      wx.showModal({
        title: '预约详情',
        content: `场馆: ${booking.venueName}\n日期: ${booking.date}\n时段: ${booking.startTime}-${booking.endTime}\n预约人: ${booking.userName}\n电话: ${booking.userPhone}\n状态: ${booking.statusText}`,
        showCancel: false
      })
    }
  }
})
