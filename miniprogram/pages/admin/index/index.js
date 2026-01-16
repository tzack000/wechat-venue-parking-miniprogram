// pages/admin/index/index.js
const app = getApp()
const { showToast } = require('../../../utils/util')

Page({
  data: {
    menuList: [
      { id: 'venues', icon: '🏟️', title: '场馆管理', desc: '添加、编辑、管理场馆信息', url: '/pages/admin/venues/venues' },
      { id: 'bookings', icon: '📋', title: '预约管理', desc: '查看、审核所有预约记录', url: '/pages/admin/bookings/bookings' },
      { id: 'parking', icon: '🚗', title: '停车管理', desc: '查看停车记录、手动登记', url: '/pages/admin/parking/parking' }
    ]
  },

  onLoad() {
    // 检查管理员权限
    if (!app.checkAdmin()) {
      showToast('无权限访问')
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    }
  },

  onMenuTap(e) {
    const { url } = e.currentTarget.dataset
    wx.navigateTo({ url })
  }
})
