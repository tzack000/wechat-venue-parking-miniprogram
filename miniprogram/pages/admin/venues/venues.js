// pages/admin/venues/venues.js
const app = getApp()
const { venueApi } = require('../../../utils/api')
const { venueTypeMap, showToast, showConfirm, showLoading, hideLoading } = require('../../../utils/util')

Page({
  data: {
    venues: [],
    loading: false,
    showForm: false,
    editMode: false,
    currentVenue: null,
    venueTypes: [
      { value: 'basketball', label: '篮球场' },
      { value: 'badminton', label: '羽毛球场' },
      { value: 'tennis', label: '网球场' },
      { value: 'swimming', label: '游泳池' },
      { value: 'gym', label: '健身房' },
      { value: 'football', label: '足球场' },
      { value: 'tabletennis', label: '乒乓球' },
      { value: 'other', label: '其他' }
    ],
    formData: {
      name: '',
      type: 'basketball',
      typeIndex: 0,
      description: '',
      location: '',
      price: '',
      openTime: '08:00',
      closeTime: '22:00',
      slotDuration: '60',
      needApproval: false
    }
  },

  onLoad() {
    if (!app.checkAdmin()) {
      showToast('无权限访问')
      setTimeout(() => wx.navigateBack(), 1500)
      return
    }
    this.loadVenues()
  },

  onPullDownRefresh() {
    this.loadVenues().then(() => {
      wx.stopPullDownRefresh()
    })
  },

  async loadVenues() {
    this.setData({ loading: true })
    
    try {
      const res = await venueApi.getList({ pageSize: 100 })
      if (res.success) {
        const venues = res.data.map(v => ({
          ...v,
          typeText: venueTypeMap[v.type]?.text || '其他'
        }))
        this.setData({ venues })
      }
    } catch (err) {
      console.error('加载场馆失败:', err)
      showToast('加载失败')
    } finally {
      this.setData({ loading: false })
    }
  },

  // 显示添加表单
  showAddForm() {
    this.setData({
      showForm: true,
      editMode: false,
      currentVenue: null,
      formData: {
        name: '',
        type: 'basketball',
        typeIndex: 0,
        description: '',
        location: '',
        price: '',
        openTime: '08:00',
        closeTime: '22:00',
        slotDuration: '60',
        needApproval: false
      }
    })
  },

  // 显示编辑表单
  showEditForm(e) {
    const venue = e.currentTarget.dataset.venue
    const typeIndex = this.data.venueTypes.findIndex(t => t.value === venue.type)
    
    this.setData({
      showForm: true,
      editMode: true,
      currentVenue: venue,
      formData: {
        name: venue.name,
        type: venue.type,
        typeIndex: typeIndex >= 0 ? typeIndex : 0,
        description: venue.description || '',
        location: venue.location || '',
        price: String(venue.price || ''),
        openTime: venue.openTime || '08:00',
        closeTime: venue.closeTime || '22:00',
        slotDuration: String(venue.slotDuration || 60),
        needApproval: venue.needApproval || false
      }
    })
  },

  // 隐藏表单
  hideForm() {
    this.setData({ showForm: false })
  },

  // 表单输入
  onInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({
      [`formData.${field}`]: e.detail.value
    })
  },

  // 类型选择
  onTypeChange(e) {
    const index = e.detail.value
    this.setData({
      'formData.typeIndex': index,
      'formData.type': this.data.venueTypes[index].value
    })
  },

  // 时间选择
  onTimeChange(e) {
    const field = e.currentTarget.dataset.field
    this.setData({
      [`formData.${field}`]: e.detail.value
    })
  },

  // 审核开关
  onApprovalChange(e) {
    this.setData({
      'formData.needApproval': e.detail.value
    })
  },

  // 保存场馆
  async saveVenue() {
    const { formData, editMode, currentVenue } = this.data
    
    if (!formData.name.trim()) {
      showToast('请输入场馆名称')
      return
    }
    if (!formData.location.trim()) {
      showToast('请输入场馆位置')
      return
    }
    if (!formData.price || isNaN(formData.price)) {
      showToast('请输入正确的价格')
      return
    }
    
    showLoading('保存中...')
    
    try {
      const venueData = {
        name: formData.name.trim(),
        type: formData.type,
        description: formData.description.trim(),
        location: formData.location.trim(),
        price: parseFloat(formData.price),
        openTime: formData.openTime,
        closeTime: formData.closeTime,
        slotDuration: parseInt(formData.slotDuration) || 60,
        needApproval: formData.needApproval,
        images: [],
        facilities: []
      }
      
      let res
      if (editMode) {
        res = await venueApi.update(currentVenue._id, venueData)
      } else {
        res = await venueApi.add(venueData)
      }
      
      hideLoading()
      
      if (res.success) {
        showToast(editMode ? '更新成功' : '添加成功', 'success')
        this.hideForm()
        this.loadVenues()
      } else {
        showToast(res.message || '保存失败')
      }
    } catch (err) {
      hideLoading()
      showToast('保存失败')
    }
  },

  // 启用/停用场馆
  async toggleVenueStatus(e) {
    const venue = e.currentTarget.dataset.venue
    const action = venue.enabled ? '停用' : '启用'
    
    const confirmed = await showConfirm('提示', `确定要${action}该场馆吗？`)
    if (!confirmed) return
    
    showLoading('处理中...')
    
    try {
      const res = venue.enabled 
        ? await venueApi.disable(venue._id)
        : await venueApi.enable(venue._id)
      
      hideLoading()
      
      if (res.success) {
        showToast(`${action}成功`, 'success')
        this.loadVenues()
      } else {
        showToast(res.message || '操作失败')
      }
    } catch (err) {
      hideLoading()
      showToast('操作失败')
    }
  }
})
