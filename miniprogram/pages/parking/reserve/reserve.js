// pages/parking/reserve/reserve.js
const app = getApp()
const { parkingApi } = require('../../../utils/api')
const { validatePlateNumber, formatDate, showToast, showLoading, hideLoading } = require('../../../utils/util')

Page({
  data: {
    plateNumber: '',
    reserveDate: '',
    reserveStartTime: '',
    reserveEndTime: '',
    dateRange: [],
    timeRange: [],
    parkingStatus: null,
    submitting: false
  },

  onLoad() {
    this.initDateRange()
    this.initTimeRange()
    this.loadParkingStatus()
  },

  // 初始化日期范围（最近3天）
  initDateRange() {
    const dateRange = []
    const today = new Date()
    
    for (let i = 0; i < 3; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      dateRange.push(formatDate(date, 'YYYY-MM-DD'))
    }
    
    this.setData({
      dateRange,
      reserveDate: dateRange[0]
    })
  },

  // 初始化时间范围
  initTimeRange() {
    const timeRange = []
    for (let h = 6; h <= 22; h++) {
      timeRange.push(`${String(h).padStart(2, '0')}:00`)
      if (h < 22) {
        timeRange.push(`${String(h).padStart(2, '0')}:30`)
      }
    }
    
    this.setData({
      timeRange,
      reserveStartTime: '08:00',
      reserveEndTime: '10:00'
    })
  },

  // 加载车位状态
  async loadParkingStatus() {
    try {
      const res = await parkingApi.getParkingStatus()
      if (res.success) {
        this.setData({ parkingStatus: res.data })
      }
    } catch (err) {
      console.error('加载车位状态失败:', err)
    }
  },

  // 输入车牌号
  onPlateInput(e) {
    this.setData({ plateNumber: e.detail.value.toUpperCase() })
  },

  // 选择日期
  onDateChange(e) {
    this.setData({ reserveDate: this.data.dateRange[e.detail.value] })
  },

  // 选择开始时间
  onStartTimeChange(e) {
    this.setData({ reserveStartTime: this.data.timeRange[e.detail.value] })
  },

  // 选择结束时间
  onEndTimeChange(e) {
    this.setData({ reserveEndTime: this.data.timeRange[e.detail.value] })
  },

  // 验证表单
  validateForm() {
    const { plateNumber, reserveDate, reserveStartTime, reserveEndTime } = this.data
    
    if (!plateNumber.trim()) {
      showToast('请输入车牌号')
      return false
    }
    
    if (!validatePlateNumber(plateNumber)) {
      showToast('请输入正确的车牌号')
      return false
    }
    
    if (!reserveDate) {
      showToast('请选择预约日期')
      return false
    }
    
    if (!reserveStartTime) {
      showToast('请选择开始时间')
      return false
    }
    
    if (reserveEndTime && reserveEndTime <= reserveStartTime) {
      showToast('结束时间必须大于开始时间')
      return false
    }
    
    return true
  },

  // 提交预约
  async submitReserve() {
    if (!app.checkLogin()) {
      showToast('请先登录')
      wx.switchTab({
        url: '/pages/user/center/center'
      })
      return
    }
    
    if (!this.validateForm()) return
    if (this.data.submitting) return
    
    this.setData({ submitting: true })
    showLoading('提交中...')
    
    try {
      const { plateNumber, reserveDate, reserveStartTime, reserveEndTime } = this.data
      
      const res = await parkingApi.reserve({
        plateNumber: plateNumber.toUpperCase(),
        reserveDate,
        reserveStartTime,
        reserveEndTime
      })
      
      hideLoading()
      
      if (res.success) {
        wx.showModal({
          title: '预约成功',
          content: '车位已预约，请在预约时间内入场',
          showCancel: false,
          success: () => {
            wx.navigateBack()
          }
        })
      } else {
        showToast(res.message || '预约失败')
      }
    } catch (err) {
      hideLoading()
      console.error('提交预约失败:', err)
      showToast('预约失败，请重试')
    } finally {
      this.setData({ submitting: false })
    }
  }
})
