// pages/venue/list/list.js
const { venueApi } = require('../../../utils/api')
const { venueTypeMap, showToast } = require('../../../utils/util')

Page({
  data: {
    venueTypes: [
      { value: '', label: '全部' },
      { value: 'basketball', label: '篮球场' },
      { value: 'badminton', label: '羽毛球' },
      { value: 'tennis', label: '网球场' },
      { value: 'swimming', label: '游泳池' },
      { value: 'gym', label: '健身房' },
      { value: 'football', label: '足球场' },
      { value: 'tabletennis', label: '乒乓球' }
    ],
    currentType: '',
    venues: [],
    loading: false,
    page: 1,
    pageSize: 10,
    hasMore: true
  },

  onLoad() {
    this.loadVenues()
  },

  onPullDownRefresh() {
    this.setData({ page: 1, hasMore: true })
    this.loadVenues().then(() => {
      wx.stopPullDownRefresh()
    })
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadMoreVenues()
    }
  },

  // 切换类型
  onTypeChange(e) {
    const type = e.currentTarget.dataset.type
    this.setData({
      currentType: type,
      page: 1,
      hasMore: true
    })
    this.loadVenues()
  },

  // 加载场馆列表
  async loadVenues() {
    this.setData({ loading: true })
    
    try {
      const res = await venueApi.getList({
        type: this.data.currentType,
        page: 1,
        pageSize: this.data.pageSize
      })
      
      if (res.success) {
        const venues = this.formatVenues(res.data)
        this.setData({
          venues,
          page: 1,
          hasMore: res.data.length >= this.data.pageSize
        })
      }
    } catch (err) {
      console.error('加载场馆失败:', err)
      showToast('加载失败，请重试')
    } finally {
      this.setData({ loading: false })
    }
  },

  // 加载更多
  async loadMoreVenues() {
    this.setData({ loading: true })
    
    try {
      const nextPage = this.data.page + 1
      const res = await venueApi.getList({
        type: this.data.currentType,
        page: nextPage,
        pageSize: this.data.pageSize
      })
      
      if (res.success) {
        const newVenues = this.formatVenues(res.data)
        this.setData({
          venues: [...this.data.venues, ...newVenues],
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

  // 格式化场馆数据
  formatVenues(venues) {
    return venues.map(venue => ({
      ...venue,
      typeText: venueTypeMap[venue.type]?.text || '其他',
      typeIcon: venueTypeMap[venue.type]?.icon || '🏟️'
    }))
  },

  // 跳转到场馆详情
  goToDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/venue/detail/detail?id=${id}`
    })
  }
})
