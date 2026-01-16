// pages/venue/booking/booking.js
const app = getApp()
const { bookingApi } = require('../../../utils/api')
const { venueTypeMap, showToast, showLoading, hideLoading } = require('../../../utils/util')

Page({
  data: {
    venueId: '',
    venueName: '',
    venueType: '',
    venueTypeText: '',
    date: '',
    startTime: '',
    endTime: '',
    price: 0,
    userName: '',
    userPhone: '',
    remark: '',
    submitting: false
  },

  onLoad(options) {
    const { venueId, venueName, venueType, date, startTime, endTime, price } = options
    
    this.setData({
      venueId,
      venueName: decodeURIComponent(venueName || ''),
      venueType,
      venueTypeText: venueTypeMap[venueType]?.text || '其他',
      date,
      startTime,
      endTime,
      price: parseFloat(price) || 0
    })
    
    // 预填用户信息
    const userInfo = app.globalData.userInfo
    if (userInfo) {
      this.setData({
        userName: userInfo.nickName || ''
      })
    }
  },

  // 输入姓名
  onNameInput(e) {
    this.setData({ userName: e.detail.value })
  },

  // 输入电话
  onPhoneInput(e) {
    this.setData({ userPhone: e.detail.value })
  },

  // 输入备注
  onRemarkInput(e) {
    this.setData({ remark: e.detail.value })
  },

  // 验证表单
  validateForm() {
    const { userName, userPhone } = this.data
    
    if (!userName.trim()) {
      showToast('请输入预约人姓名')
      return false
    }
    
    if (!userPhone.trim()) {
      showToast('请输入联系电话')
      return false
    }
    
    // 验证手机号格式
    const phoneReg = /^1[3-9]\d{9}$/
    if (!phoneReg.test(userPhone)) {
      showToast('请输入正确的手机号')
      return false
    }
    
    return true
  },

  // 提交预约
  async submitBooking() {
    if (!this.validateForm()) return
    if (this.data.submitting) return
    
    this.setData({ submitting: true })
    showLoading('提交中...')
    
    try {
      const { venueId, date, startTime, endTime, userName, userPhone, remark } = this.data
      
      const res = await bookingApi.create({
        venueId,
        date,
        startTime,
        endTime,
        userName,
        userPhone,
        remark
      })
      
      hideLoading()
      
      if (res.success) {
        const statusText = res.status === 'confirmed' ? '预约成功' : '预约已提交，等待确认'
        
        wx.showModal({
          title: '提交成功',
          content: statusText,
          showCancel: false,
          success: () => {
            // 返回场馆列表
            wx.navigateBack({ delta: 2 })
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
