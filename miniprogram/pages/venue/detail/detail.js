// pages/venue/detail/detail.js
const app = getApp()
const { venueApi } = require('../../../utils/api')
const { venueTypeMap, formatDate, showToast } = require('../../../utils/util')

Page({
  data: {
    venueId: '',
    venue: null,
    selectedDate: '',
    dateList: [],
    timeSlots: [],
    selectedSlot: null,
    loading: true,
    slotsLoading: false
  },

  onLoad(options) {
    const venueId = options.id
    if (!venueId) {
      showToast('参数错误')
      setTimeout(() => wx.navigateBack(), 1500)
      return
    }
    
    this.setData({ venueId })
    this.initDateList()
    this.loadVenueDetail()
  },

  // 初始化日期列表（最近7天）
  initDateList() {
    const dateList = []
    const today = new Date()
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      
      const dateStr = formatDate(date, 'YYYY-MM-DD')
      const dayStr = i === 0 ? '今天' : (i === 1 ? '明天' : weekDays[date.getDay()])
      const monthDay = formatDate(date, 'MM-DD')
      
      dateList.push({
        date: dateStr,
        day: dayStr,
        monthDay: monthDay
      })
    }
    
    this.setData({
      dateList,
      selectedDate: dateList[0].date
    })
  },

  // 加载场馆详情
  async loadVenueDetail() {
    this.setData({ loading: true })
    
    try {
      const res = await venueApi.getDetail(this.data.venueId)
      
      if (res.success) {
        const venue = {
          ...res.data,
          typeText: venueTypeMap[res.data.type]?.text || '其他',
          typeIcon: venueTypeMap[res.data.type]?.icon || '🏟️'
        }
        this.setData({ venue })
        this.loadTimeSlots()
      } else {
        showToast(res.message || '加载失败')
      }
    } catch (err) {
      console.error('加载场馆详情失败:', err)
      showToast('加载失败')
    } finally {
      this.setData({ loading: false })
    }
  },

  // 加载时段信息
  async loadTimeSlots() {
    this.setData({ slotsLoading: true, selectedSlot: null })
    
    try {
      const res = await venueApi.getTimeSlots(this.data.venueId, this.data.selectedDate)
      
      if (res.success) {
        this.setData({ timeSlots: res.data })
      }
    } catch (err) {
      console.error('加载时段失败:', err)
    } finally {
      this.setData({ slotsLoading: false })
    }
  },

  // 选择日期
  onDateSelect(e) {
    const date = e.currentTarget.dataset.date
    if (date !== this.data.selectedDate) {
      this.setData({ selectedDate: date })
      this.loadTimeSlots()
    }
  },

  // 选择时段
  onSlotSelect(e) {
    const slot = e.currentTarget.dataset.slot
    if (slot.status !== 'available') return
    
    this.setData({ selectedSlot: slot })
  },

  // 预览图片
  previewImage(e) {
    const current = e.currentTarget.dataset.url
    wx.previewImage({
      current,
      urls: this.data.venue.images
    })
  },

  // 立即预约
  goToBooking() {
    if (!app.checkLogin()) {
      showToast('请先登录')
      wx.switchTab({
        url: '/pages/user/center/center'
      })
      return
    }
    
    if (!this.data.selectedSlot) {
      showToast('请选择预约时段')
      return
    }
    
    const { venue, selectedDate, selectedSlot } = this.data
    
    // 跳转到预约确认页
    wx.navigateTo({
      url: `/pages/venue/booking/booking?venueId=${venue._id}&venueName=${encodeURIComponent(venue.name)}&venueType=${venue.type}&date=${selectedDate}&startTime=${selectedSlot.startTime}&endTime=${selectedSlot.endTime}&price=${venue.price}`
    })
  }
})
