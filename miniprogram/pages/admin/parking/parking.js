// pages/admin/parking/parking.js
const app = getApp()
const { parkingApi } = require('../../../utils/api')
const { parkingStatusMap, formatDate, formatDuration, validatePlateNumber, showToast, showConfirm, showLoading, hideLoading } = require('../../../utils/util')

Page({
  data: {
    statusTabs: [
      { value: '', label: '全部' },
      { value: 'pending', label: '待入场' },
      { value: 'entered', label: '已入场' },
      { value: 'exited', label: '已出场' }
    ],
    currentStatus: '',
    records: [],
    parkingStatus: null,
    loading: false,
    page: 1,
    pageSize: 20,
    hasMore: true,
    showRegisterForm: false,
    registerPlate: '',
    registerPurpose: ''
  },

  onLoad() {
    if (!app.checkAdmin()) {
      showToast('无权限访问')
      setTimeout(() => wx.navigateBack(), 1500)
      return
    }
    this.loadParkingStatus()
    this.loadRecords()
  },

  onPullDownRefresh() {
    this.setData({ page: 1, hasMore: true })
    Promise.all([
      this.loadParkingStatus(),
      this.loadRecords()
    ]).then(() => {
      wx.stopPullDownRefresh()
    })
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadMoreRecords()
    }
  },

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

  onStatusChange(e) {
    const status = e.currentTarget.dataset.status
    this.setData({
      currentStatus: status,
      page: 1,
      hasMore: true
    })
    this.loadRecords()
  },

  async loadRecords() {
    this.setData({ loading: true })
    
    try {
      const res = await parkingApi.getAllRecords({
        status: this.data.currentStatus,
        page: 1,
        pageSize: this.data.pageSize
      })
      
      if (res.success) {
        const records = this.formatRecords(res.data)
        this.setData({
          records,
          page: 1,
          hasMore: res.data.length >= this.data.pageSize
        })
      }
    } catch (err) {
      console.error('加载停车记录失败:', err)
      showToast('加载失败')
    } finally {
      this.setData({ loading: false })
    }
  },

  async loadMoreRecords() {
    this.setData({ loading: true })
    
    try {
      const nextPage = this.data.page + 1
      const res = await parkingApi.getAllRecords({
        status: this.data.currentStatus,
        page: nextPage,
        pageSize: this.data.pageSize
      })
      
      if (res.success) {
        const newRecords = this.formatRecords(res.data)
        this.setData({
          records: [...this.data.records, ...newRecords],
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

  formatRecords(records) {
    return records.map(record => ({
      ...record,
      statusText: parkingStatusMap[record.status]?.text || record.status,
      statusClass: parkingStatusMap[record.status]?.class || '',
      typeText: record.type === 'visitor' ? '访客登记' : '车位预约',
      createTimeStr: formatDate(record.createTime, 'MM-DD HH:mm'),
      entryTimeStr: record.entryTime ? formatDate(record.entryTime, 'MM-DD HH:mm') : '-',
      exitTimeStr: record.exitTime ? formatDate(record.exitTime, 'MM-DD HH:mm') : '-',
      durationStr: record.duration ? formatDuration(record.duration) : '-',
      canConfirmEntry: record.status === 'pending',
      canConfirmExit: record.status === 'entered'
    }))
  },

  // 显示登记表单
  showRegisterForm() {
    this.setData({
      showRegisterForm: true,
      registerPlate: '',
      registerPurpose: ''
    })
  },

  hideRegisterForm() {
    this.setData({ showRegisterForm: false })
  },

  onPlateInput(e) {
    this.setData({ registerPlate: e.detail.value.toUpperCase() })
  },

  onPurposeInput(e) {
    this.setData({ registerPurpose: e.detail.value })
  },

  // 管理员手动登记
  async submitRegister() {
    const { registerPlate, registerPurpose } = this.data
    
    if (!registerPlate.trim()) {
      showToast('请输入车牌号')
      return
    }
    
    if (!validatePlateNumber(registerPlate)) {
      showToast('请输入正确的车牌号')
      return
    }
    
    showLoading('登记中...')
    
    try {
      const res = await parkingApi.adminRegister({
        plateNumber: registerPlate,
        purpose: registerPurpose || '管理员登记'
      })
      
      hideLoading()
      
      if (res.success) {
        showToast('登记成功', 'success')
        this.hideRegisterForm()
        this.loadRecords()
      } else {
        showToast(res.message || '登记失败')
      }
    } catch (err) {
      hideLoading()
      showToast('登记失败')
    }
  },

  // 确认入场
  async onConfirmEntry(e) {
    const recordId = e.currentTarget.dataset.id
    
    const confirmed = await showConfirm('提示', '确认车辆已入场？')
    if (!confirmed) return
    
    showLoading('处理中...')
    
    try {
      const res = await parkingApi.adminConfirmEntry(recordId)
      hideLoading()
      
      if (res.success) {
        showToast('已确认入场', 'success')
        this.loadParkingStatus()
        this.loadRecords()
      } else {
        showToast(res.message || '操作失败')
      }
    } catch (err) {
      hideLoading()
      showToast('操作失败')
    }
  },

  // 确认出场
  async onConfirmExit(e) {
    const recordId = e.currentTarget.dataset.id
    
    const confirmed = await showConfirm('提示', '确认车辆已出场？')
    if (!confirmed) return
    
    showLoading('处理中...')
    
    try {
      const res = await parkingApi.adminConfirmExit(recordId)
      hideLoading()
      
      if (res.success) {
        showToast(`已出场，停车${formatDuration(res.duration)}`, 'success')
        this.loadParkingStatus()
        this.loadRecords()
      } else {
        showToast(res.message || '操作失败')
      }
    } catch (err) {
      hideLoading()
      showToast('操作失败')
    }
  }
})
