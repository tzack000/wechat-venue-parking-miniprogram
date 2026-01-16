// pages/index/index.js
const app = getApp()
const { venueApi, parkingApi } = require('../../utils/api')
const { venueTypeMap } = require('../../utils/util')

Page({
  data: {
    isLoggedIn: false,
    userInfo: null,
    venues: [],
    parkingStatus: null,
    loading: true
  },

  onLoad() {
    this.checkLoginStatus()
  },

  onShow() {
    this.loadData()
  },

  onPullDownRefresh() {
    this.loadData().then(() => {
      wx.stopPullDownRefresh()
    })
  },

  checkLoginStatus() {
    const isLoggedIn = app.checkLogin()
    this.setData({
      isLoggedIn: isLoggedIn,
      userInfo: app.globalData.userInfo
    })
  },

  async loadData() {
    this.setData({ loading: true })
    
    try {
      // 并行加载数据
      const [venuesRes, parkingRes] = await Promise.all([
        venueApi.getList({ pageSize: 4 }),
        parkingApi.getParkingStatus()
      ])
      
      if (venuesRes.success) {
        const venues = venuesRes.data.map(venue => ({
          ...venue,
          typeText: venueTypeMap[venue.type]?.text || '其他',
          typeIcon: venueTypeMap[venue.type]?.icon || '🏟️'
        }))
        this.setData({ venues })
      }
      
      if (parkingRes.success) {
        this.setData({ parkingStatus: parkingRes.data })
      }
    } catch (err) {
      console.error('加载数据失败:', err)
    } finally {
      this.setData({ loading: false })
    }
  },

  // 跳转到场馆预约
  goToVenueList() {
    wx.switchTab({
      url: '/pages/venue/list/list'
    })
  },

  // 跳转到停车登记
  goToParking() {
    wx.switchTab({
      url: '/pages/parking/register/register'
    })
  },

  // 跳转到场馆详情
  goToVenueDetail(e) {
    const venueId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/venue/detail/detail?id=${venueId}`
    })
  },

  // 跳转到我的预约
  goToMyBookings() {
    if (!app.checkLogin()) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      return
    }
    wx.navigateTo({
      url: '/pages/user/bookings/bookings'
    })
  },

  // 跳转到停车记录
  goToParkingRecords() {
    if (!app.checkLogin()) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      return
    }
    wx.navigateTo({
      url: '/pages/parking/records/records'
    })
  }
})
