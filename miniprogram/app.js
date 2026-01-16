// app.js

// ============ Mock 模式开关 ============
// 设置为 true 可在不开通云开发的情况下本地测试
// 发布前请改为 false
const USE_MOCK = false
// ======================================

App({
  onLaunch: function () {
    // 保存 Mock 模式状态到全局
    this.globalData.useMock = USE_MOCK

    if (USE_MOCK) {
      console.log('[App] 当前运行在 Mock 模式，使用本地模拟数据')
      // Mock 模式下初始化本地数据
      const { initMockStorage } = require('./utils/mock-api')
      initMockStorage()
      // 尝试静默登录
      this.silentLoginMock()
    } else {
      // 云开发模式
      if (!wx.cloud) {
        console.error('请使用 2.2.3 或以上的基础库以使用云能力')
      } else {
        wx.cloud.init({
          env: 'your-env-id', // 替换为实际的云开发环境ID
          traceUser: true
        })
      }
      // 尝试静默登录
      this.silentLogin()
    }
  },

  globalData: {
    userInfo: null,
    openid: null,
    isAdmin: false,
    isLoggedIn: false,
    useMock: USE_MOCK
  },

  // Mock 模式静默登录
  silentLoginMock: function() {
    const that = this
    const userInfo = wx.getStorageSync('userInfo')
    
    if (userInfo) {
      that.globalData.userInfo = userInfo
      that.globalData.openid = 'mock_openid_001'
      that.globalData.isAdmin = userInfo.isAdmin || false
      that.globalData.isLoggedIn = true
      console.log('[App] Mock 静默登录成功', userInfo.nickName)
    } else {
      that.globalData.openid = 'mock_openid_001'
      console.log('[App] Mock 模式：用户未登录，请前往"我的"页面登录')
    }
  },

  // 云开发模式静默登录
  silentLogin: function() {
    const that = this
    // 检查本地存储的用户信息
    const userInfo = wx.getStorageSync('userInfo')
    const openid = wx.getStorageSync('openid')
    
    if (userInfo && openid) {
      that.globalData.userInfo = userInfo
      that.globalData.openid = openid
      that.globalData.isAdmin = userInfo.isAdmin || false
      that.globalData.isLoggedIn = true
      return
    }

    // 调用云函数获取openid
    wx.cloud.callFunction({
      name: 'user',
      data: {
        action: 'getOpenid'
      }
    }).then(res => {
      if (res.result && res.result.openid) {
        that.globalData.openid = res.result.openid
        wx.setStorageSync('openid', res.result.openid)
        
        // 检查用户是否已注册
        if (res.result.userInfo) {
          that.globalData.userInfo = res.result.userInfo
          that.globalData.isAdmin = res.result.userInfo.isAdmin || false
          that.globalData.isLoggedIn = true
          wx.setStorageSync('userInfo', res.result.userInfo)
        }
      }
    }).catch(err => {
      console.error('静默登录失败', err)
    })
  },

  // 用户登录（Mock 模式）
  loginMock: function(userInfo) {
    const that = this
    return new Promise((resolve, reject) => {
      const { userApi } = require('./utils/mock-api')
      userApi.login(userInfo).then(res => {
        if (res.success) {
          that.globalData.userInfo = res.userInfo
          that.globalData.openid = res.openid
          that.globalData.isAdmin = res.userInfo.isAdmin || false
          that.globalData.isLoggedIn = true
          resolve(res)
        } else {
          reject(new Error('登录失败'))
        }
      }).catch(reject)
    })
  },

  // 用户登录（根据模式自动选择）
  login: function(userInfo) {
    if (this.globalData.useMock) {
      return this.loginMock(userInfo)
    }
    
    return new Promise((resolve, reject) => {
      const that = this
      wx.cloud.callFunction({
        name: 'user',
        data: {
          action: 'login',
          userInfo: userInfo
        }
      }).then(res => {
        if (res.result && res.result.success) {
          that.globalData.userInfo = res.result.userInfo
          that.globalData.openid = res.result.openid
          that.globalData.isAdmin = res.result.userInfo.isAdmin || false
          that.globalData.isLoggedIn = true
          
          wx.setStorageSync('userInfo', res.result.userInfo)
          wx.setStorageSync('openid', res.result.openid)
          resolve(res.result)
        } else {
          reject(new Error('登录失败'))
        }
      }).catch(err => {
        reject(err)
      })
    })
  },

  // 退出登录
  logout: function() {
    this.globalData.userInfo = null
    this.globalData.openid = null
    this.globalData.isAdmin = false
    this.globalData.isLoggedIn = false
    wx.removeStorageSync('userInfo')
    wx.removeStorageSync('openid')
    
    if (this.globalData.useMock) {
      // Mock 模式下保留 openid
      this.globalData.openid = 'mock_openid_001'
    }
  },

  // 检查登录状态
  checkLogin: function() {
    return this.globalData.isLoggedIn
  },

  // 检查管理员权限
  checkAdmin: function() {
    return this.globalData.isAdmin
  },

  // 重置 Mock 数据（用于测试）
  resetMockData: function() {
    if (this.globalData.useMock) {
      // 清除所有 mock 数据
      const keys = wx.getStorageInfoSync().keys
      keys.forEach(key => {
        if (key.startsWith('mock_')) {
          wx.removeStorageSync(key)
        }
      })
      // 重新初始化
      const { initMockStorage } = require('./utils/mock-api')
      wx.setStorageSync('mock_initialized', false)
      initMockStorage()
      console.log('[App] Mock 数据已重置')
    }
  }
})
