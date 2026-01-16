// app.js
App({
  onLaunch: function () {
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
  },

  globalData: {
    userInfo: null,
    openid: null,
    isAdmin: false,
    isLoggedIn: false
  },

  // 静默登录
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

  // 用户登录
  login: function(userInfo) {
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
  },

  // 检查登录状态
  checkLogin: function() {
    return this.globalData.isLoggedIn
  },

  // 检查管理员权限
  checkAdmin: function() {
    return this.globalData.isAdmin
  }
})
