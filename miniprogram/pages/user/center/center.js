// pages/user/center/center.js
const app = getApp()
const { showToast, showConfirm } = require('../../../utils/util')

Page({
  data: {
    isLoggedIn: false,
    userInfo: null,
    isAdmin: false,
    menuList: [
      { id: 'bookings', icon: '📋', title: '我的预约', url: '/pages/user/bookings/bookings' },
      { id: 'parking', icon: '🚗', title: '停车记录', url: '/pages/user/parking/parking' }
    ],
    adminMenuList: [
      { id: 'admin', icon: '⚙️', title: '管理后台', url: '/pages/admin/index/index' }
    ]
  },

  onLoad() {
    this.checkLoginStatus()
  },

  onShow() {
    this.checkLoginStatus()
  },

  checkLoginStatus() {
    const isLoggedIn = app.checkLogin()
    const userInfo = app.globalData.userInfo
    const isAdmin = app.checkAdmin()
    
    this.setData({
      isLoggedIn,
      userInfo,
      isAdmin
    })
  },

  // 获取用户信息并登录
  getUserProfile() {
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: (res) => {
        const userInfo = res.userInfo
        this.doLogin(userInfo)
      },
      fail: (err) => {
        console.error('获取用户信息失败:', err)
        showToast('获取用户信息失败')
      }
    })
  },

  // 执行登录
  async doLogin(userInfo) {
    wx.showLoading({ title: '登录中...' })
    
    try {
      await app.login(userInfo)
      this.checkLoginStatus()
      showToast('登录成功', 'success')
    } catch (err) {
      console.error('登录失败:', err)
      showToast('登录失败，请重试')
    } finally {
      wx.hideLoading()
    }
  },

  // 菜单点击
  onMenuTap(e) {
    const { url } = e.currentTarget.dataset
    if (!this.data.isLoggedIn) {
      showToast('请先登录')
      return
    }
    wx.navigateTo({ url })
  },

  // 退出登录
  async onLogout() {
    const confirmed = await showConfirm('提示', '确定要退出登录吗？')
    if (confirmed) {
      app.logout()
      this.checkLoginStatus()
      showToast('已退出登录')
    }
  },

  // 关于我们
  onAbout() {
    wx.showModal({
      title: '关于我们',
      content: '场馆预约与停车登记小程序\n版本: 1.0.0',
      showCancel: false
    })
  }
})
