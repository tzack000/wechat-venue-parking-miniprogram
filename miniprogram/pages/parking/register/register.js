// pages/parking/register/register.js
const app = getApp()
const { parkingApi } = require('../../../utils/api')
const { validatePlateNumber, showToast, showLoading, hideLoading } = require('../../../utils/util')

Page({
  data: {
    plateNumber: '',
    purpose: '',
    expectedDuration: '2',
    durationOptions: [
      { value: '1', label: '1小时' },
      { value: '2', label: '2小时' },
      { value: '4', label: '4小时' },
      { value: '8', label: '半天' },
      { value: '24', label: '一天' }
    ],
    parkingStatus: null,
    submitting: false
  },

  onLoad() {
    this.loadParkingStatus()
  },

  onShow() {
    this.loadParkingStatus()
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

  // 输入访问目的
  onPurposeInput(e) {
    this.setData({ purpose: e.detail.value })
  },

  // 选择预计时长
  onDurationChange(e) {
    this.setData({ expectedDuration: this.data.durationOptions[e.detail.value].value })
  },

  // 验证表单
  validateForm() {
    const { plateNumber, purpose } = this.data
    
    if (!plateNumber.trim()) {
      showToast('请输入车牌号')
      return false
    }
    
    if (!validatePlateNumber(plateNumber)) {
      showToast('请输入正确的车牌号')
      return false
    }
    
    if (!purpose.trim()) {
      showToast('请输入访问目的')
      return false
    }
    
    return true
  },

  // 提交登记
  async submitRegister() {
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
      const { plateNumber, purpose, expectedDuration } = this.data
      
      const res = await parkingApi.register({
        plateNumber: plateNumber.toUpperCase(),
        purpose,
        expectedDuration: parseInt(expectedDuration) * 60 // 转换为分钟
      })
      
      hideLoading()
      
      if (res.success) {
        wx.showModal({
          title: '登记成功',
          content: '车辆已登记，请在入口出示登记凭证',
          showCancel: false,
          success: () => {
            // 清空表单
            this.setData({
              plateNumber: '',
              purpose: '',
              expectedDuration: '2'
            })
            // 跳转到停车记录
            wx.navigateTo({
              url: '/pages/parking/records/records'
            })
          }
        })
      } else {
        showToast(res.message || '登记失败')
      }
    } catch (err) {
      hideLoading()
      console.error('提交登记失败:', err)
      showToast('登记失败，请重试')
    } finally {
      this.setData({ submitting: false })
    }
  },

  // 跳转到车位预约
  goToReserve() {
    if (!app.checkLogin()) {
      showToast('请先登录')
      return
    }
    wx.navigateTo({
      url: '/pages/parking/reserve/reserve'
    })
  },

  // 跳转到停车记录
  goToRecords() {
    if (!app.checkLogin()) {
      showToast('请先登录')
      return
    }
    wx.navigateTo({
      url: '/pages/parking/records/records'
    })
  }
})
