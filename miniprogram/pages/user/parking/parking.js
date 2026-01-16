// pages/parking/records/records.js
const { parkingApi } = require('../../../utils/api')
const { parkingStatusMap, formatDate, formatDuration, showToast, showConfirm, showLoading, hideLoading } = require('../../../utils/util')

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
    currentParking: [],
    loading: false,
    page: 1,
    pageSize: 10,
    hasMore: true
  },

  onLoad() {
    this.loadCurrentParking()
    this.loadRecords()
  },

  onPullDownRefresh() {
    this.setData({ page: 1, hasMore: true })
    Promise.all([
      this.loadCurrentParking(),
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

  // 加载当前在场车辆
  async loadCurrentParking() {
    try {
      const res = await parkingApi.getCurrentParking()
      if (res.success) {
        const records = res.data.map(r => ({
          ...r,
          entryTimeStr: r.entryTime ? formatDate(r.entryTime, 'MM-DD HH:mm') : '',
          duration: r.entryTime ? this.calcDuration(r.entryTime) : 0,
          durationStr: r.entryTime ? formatDuration(this.calcDuration(r.entryTime)) : ''
        }))
        this.setData({ currentParking: records })
      }
    } catch (err) {
      console.error('加载当前停车失败:', err)
    }
  },

  // 计算停车时长
  calcDuration(entryTime) {
    const now = Date.now()
    const entry = new Date(entryTime).getTime()
    return Math.round((now - entry) / 60000)
  },

  // 切换状态
  onStatusChange(e) {
    const status = e.currentTarget.dataset.status
    this.setData({
      currentStatus: status,
      page: 1,
      hasMore: true
    })
    this.loadRecords()
  },

  // 加载停车记录
  async loadRecords() {
    this.setData({ loading: true })
    
    try {
      const res = await parkingApi.getMyRecords({
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

  // 加载更多
  async loadMoreRecords() {
    this.setData({ loading: true })
    
    try {
      const nextPage = this.data.page + 1
      const res = await parkingApi.getMyRecords({
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

  // 格式化记录数据
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
      canConfirmExit: record.status === 'entered',
      canCancel: record.status === 'pending'
    }))
  },

  // 确认入场
  async onConfirmEntry(e) {
    const recordId = e.currentTarget.dataset.id
    
    const confirmed = await showConfirm('提示', '确认车辆已入场？')
    if (!confirmed) return
    
    showLoading('处理中...')
    
    try {
      const res = await parkingApi.confirmEntry(recordId)
      
      hideLoading()
      
      if (res.success) {
        showToast('已确认入场', 'success')
        this.loadCurrentParking()
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
      const res = await parkingApi.confirmExit(recordId)
      
      hideLoading()
      
      if (res.success) {
        showToast(`已出场，停车${formatDuration(res.duration)}`, 'success')
        this.loadCurrentParking()
        this.loadRecords()
      } else {
        showToast(res.message || '操作失败')
      }
    } catch (err) {
      hideLoading()
      showToast('操作失败')
    }
  },

  // 取消登记/预约
  async onCancelRecord(e) {
    const recordId = e.currentTarget.dataset.id
    
    const confirmed = await showConfirm('提示', '确定要取消吗？')
    if (!confirmed) return
    
    showLoading('取消中...')
    
    try {
      const res = await parkingApi.cancelReserve(recordId)
      
      hideLoading()
      
      if (res.success) {
        showToast('已取消', 'success')
        this.loadRecords()
      } else {
        showToast(res.message || '取消失败')
      }
    } catch (err) {
      hideLoading()
      showToast('取消失败')
    }
  },

  // 查看二维码
  onViewQRCode(e) {
    const qrCode = e.currentTarget.dataset.qrcode
    if (qrCode) {
      // 这里可以展示二维码图片，暂时用文本显示
      wx.showModal({
        title: '入场凭证',
        content: '请在入口向保安出示此页面或报车牌号',
        showCancel: false
      })
    }
  }
})
