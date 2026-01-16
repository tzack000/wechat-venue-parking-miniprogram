// utils/mock-api.js
// Mock API 模块 - 用于本地测试，模拟云函数调用

const { mockUsers, mockVenues, mockBookings, mockParkingRecords, mockParkingConfig } = require('./mock-data')

// 本地存储 key 前缀
const STORAGE_PREFIX = 'mock_'

// 初始化本地存储数据
function initMockStorage() {
  if (!wx.getStorageSync(STORAGE_PREFIX + 'initialized')) {
    wx.setStorageSync(STORAGE_PREFIX + 'venues', mockVenues)
    wx.setStorageSync(STORAGE_PREFIX + 'bookings', mockBookings)
    wx.setStorageSync(STORAGE_PREFIX + 'parking_records', mockParkingRecords)
    wx.setStorageSync(STORAGE_PREFIX + 'parking_config', mockParkingConfig)
    wx.setStorageSync(STORAGE_PREFIX + 'initialized', true)
    console.log('[Mock] 初始化本地测试数据完成')
  }
}

// 获取本地存储数据
function getStorage(key) {
  return wx.getStorageSync(STORAGE_PREFIX + key) || []
}

// 设置本地存储数据
function setStorage(key, data) {
  wx.setStorageSync(STORAGE_PREFIX + key, data)
}

// 生成唯一ID
function generateId() {
  return 'mock_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}

// 模拟网络延迟
function delay(ms = 300) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// 格式化日期
function formatDate(date) {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 格式化时间
function formatTime(date) {
  const d = new Date(date)
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

// ==================== 用户相关 Mock API ====================

const userApi = {
  getOpenid: async () => {
    await delay(200)
    const userInfo = wx.getStorageSync('userInfo')
    return {
      success: true,
      openid: 'mock_openid_001',
      userInfo: userInfo || null
    }
  },

  login: async (userInfo) => {
    await delay(300)
    const savedUserInfo = {
      _id: 'user_001',
      _openid: 'mock_openid_001',
      nickName: userInfo.nickName || '测试用户',
      avatarUrl: userInfo.avatarUrl || '/images/default-avatar.png',
      phone: '',
      isAdmin: true, // Mock 模式下默认为管理员，方便测试
      createTime: new Date(),
      updateTime: new Date()
    }
    wx.setStorageSync('userInfo', savedUserInfo)
    return {
      success: true,
      openid: 'mock_openid_001',
      userInfo: savedUserInfo
    }
  },

  getUserInfo: async () => {
    await delay(200)
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo) {
      return { success: true, userInfo }
    }
    return { success: false, message: '用户不存在' }
  },

  updateUserInfo: async (userInfo) => {
    await delay(300)
    const current = wx.getStorageSync('userInfo') || {}
    const updated = { ...current, ...userInfo, updateTime: new Date() }
    wx.setStorageSync('userInfo', updated)
    return { success: true, userInfo: updated }
  }
}

// ==================== 场馆相关 Mock API ====================

const venueApi = {
  getList: async (params = {}) => {
    await delay(300)
    let venues = getStorage('venues')
    
    // 过滤启用的场馆
    venues = venues.filter(v => v.enabled !== false)
    
    // 按类型过滤
    if (params.type) {
      venues = venues.filter(v => v.type === params.type)
    }
    
    const page = params.page || 1
    const pageSize = params.pageSize || 20
    const start = (page - 1) * pageSize
    const data = venues.slice(start, start + pageSize)
    
    return {
      success: true,
      data: data,
      total: venues.length,
      page: page,
      pageSize: pageSize
    }
  },

  getDetail: async (venueId) => {
    await delay(200)
    const venues = getStorage('venues')
    const venue = venues.find(v => v._id === venueId)
    if (venue) {
      return { success: true, data: venue }
    }
    return { success: false, message: '场馆不存在' }
  },

  getTimeSlots: async (venueId, date) => {
    await delay(300)
    const venues = getStorage('venues')
    const venue = venues.find(v => v._id === venueId)
    
    if (!venue || venue.enabled === false) {
      return { success: false, message: '场馆不存在或已停用' }
    }
    
    // 生成时段
    const slots = []
    const [startHour] = venue.openTime.split(':').map(Number)
    const [endHour] = venue.closeTime.split(':').map(Number)
    const duration = venue.slotDuration || 60
    
    for (let hour = startHour; hour < endHour; hour++) {
      const startTime = `${String(hour).padStart(2, '0')}:00`
      const endTime = `${String(hour + 1).padStart(2, '0')}:00`
      slots.push({ startTime, endTime })
    }
    
    // 检查已预约时段
    const bookings = getStorage('bookings')
    const bookedSlots = new Set()
    bookings.forEach(b => {
      if (b.venueId === venueId && b.date === date && ['pending', 'confirmed'].includes(b.status)) {
        bookedSlots.add(b.startTime)
      }
    })
    
    // 标记状态
    const today = formatDate(new Date())
    const currentTime = formatTime(new Date())
    
    const slotsWithStatus = slots.map(slot => {
      let status = 'available'
      if (bookedSlots.has(slot.startTime)) {
        status = 'booked'
      } else if (date === today && slot.startTime <= currentTime) {
        status = 'expired'
      }
      return { ...slot, status }
    })
    
    return {
      success: true,
      data: slotsWithStatus,
      venue: { name: venue.name, price: venue.price, priceUnit: venue.priceUnit }
    }
  },

  add: async (venueData) => {
    await delay(400)
    const venues = getStorage('venues')
    const newVenue = {
      _id: generateId(),
      ...venueData,
      enabled: true,
      createTime: new Date(),
      updateTime: new Date()
    }
    venues.push(newVenue)
    setStorage('venues', venues)
    return { success: true, venueId: newVenue._id }
  },

  update: async (venueId, venueData) => {
    await delay(400)
    const venues = getStorage('venues')
    const index = venues.findIndex(v => v._id === venueId)
    if (index >= 0) {
      venues[index] = { ...venues[index], ...venueData, updateTime: new Date() }
      setStorage('venues', venues)
      return { success: true }
    }
    return { success: false, message: '场馆不存在' }
  },

  disable: async (venueId) => {
    await delay(300)
    const venues = getStorage('venues')
    const index = venues.findIndex(v => v._id === venueId)
    if (index >= 0) {
      venues[index].enabled = false
      venues[index].updateTime = new Date()
      setStorage('venues', venues)
      return { success: true }
    }
    return { success: false, message: '场馆不存在' }
  },

  enable: async (venueId) => {
    await delay(300)
    const venues = getStorage('venues')
    const index = venues.findIndex(v => v._id === venueId)
    if (index >= 0) {
      venues[index].enabled = true
      venues[index].updateTime = new Date()
      setStorage('venues', venues)
      return { success: true }
    }
    return { success: false, message: '场馆不存在' }
  }
}

// ==================== 预约相关 Mock API ====================

const bookingApi = {
  create: async (bookingData) => {
    await delay(500)
    const bookings = getStorage('bookings')
    const venues = getStorage('venues')
    
    const venue = venues.find(v => v._id === bookingData.venueId)
    if (!venue || venue.enabled === false) {
      return { success: false, message: '场馆不存在或已停用' }
    }
    
    // 检查时段是否已被预约
    const exists = bookings.find(b => 
      b.venueId === bookingData.venueId && 
      b.date === bookingData.date && 
      b.startTime === bookingData.startTime &&
      ['pending', 'confirmed'].includes(b.status)
    )
    
    if (exists) {
      return { success: false, message: '该时段已被预约，请选择其他时段' }
    }
    
    const newBooking = {
      _id: generateId(),
      _openid: 'mock_openid_001',
      venueId: bookingData.venueId,
      venueName: venue.name,
      venueType: venue.type,
      date: bookingData.date,
      startTime: bookingData.startTime,
      endTime: bookingData.endTime,
      status: venue.needApproval ? 'pending' : 'confirmed',
      userName: bookingData.userName,
      userPhone: bookingData.userPhone,
      remark: bookingData.remark || '',
      cancelReason: '',
      createTime: new Date(),
      updateTime: new Date()
    }
    
    bookings.push(newBooking)
    setStorage('bookings', bookings)
    
    return {
      success: true,
      bookingId: newBooking._id,
      status: newBooking.status
    }
  },

  cancel: async (bookingId) => {
    await delay(300)
    const bookings = getStorage('bookings')
    const index = bookings.findIndex(b => b._id === bookingId)
    
    if (index < 0) {
      return { success: false, message: '预约不存在' }
    }
    
    if (!['pending', 'confirmed'].includes(bookings[index].status)) {
      return { success: false, message: '该预约无法取消' }
    }
    
    bookings[index].status = 'cancelled'
    bookings[index].cancelReason = '用户取消'
    bookings[index].updateTime = new Date()
    setStorage('bookings', bookings)
    
    return { success: true }
  },

  getMyList: async (params = {}) => {
    await delay(300)
    let bookings = getStorage('bookings')
    
    // 过滤当前用户的预约
    bookings = bookings.filter(b => b._openid === 'mock_openid_001')
    
    if (params.status) {
      bookings = bookings.filter(b => b.status === params.status)
    }
    
    // 按创建时间倒序
    bookings.sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
    
    const page = params.page || 1
    const pageSize = params.pageSize || 20
    const start = (page - 1) * pageSize
    const data = bookings.slice(start, start + pageSize)
    
    return {
      success: true,
      data: data,
      total: bookings.length,
      page: page,
      pageSize: pageSize
    }
  },

  getDetail: async (bookingId) => {
    await delay(200)
    const bookings = getStorage('bookings')
    const booking = bookings.find(b => b._id === bookingId)
    if (booking) {
      return { success: true, data: booking }
    }
    return { success: false, message: '预约不存在' }
  },

  getAllList: async (params = {}) => {
    await delay(300)
    let bookings = getStorage('bookings')
    
    if (params.venueId) {
      bookings = bookings.filter(b => b.venueId === params.venueId)
    }
    if (params.date) {
      bookings = bookings.filter(b => b.date === params.date)
    }
    if (params.status) {
      bookings = bookings.filter(b => b.status === params.status)
    }
    
    bookings.sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
    
    const page = params.page || 1
    const pageSize = params.pageSize || 20
    const start = (page - 1) * pageSize
    const data = bookings.slice(start, start + pageSize)
    
    return {
      success: true,
      data: data,
      total: bookings.length,
      page: page,
      pageSize: pageSize
    }
  },

  approve: async (bookingId) => {
    await delay(300)
    const bookings = getStorage('bookings')
    const index = bookings.findIndex(b => b._id === bookingId)
    if (index >= 0) {
      bookings[index].status = 'confirmed'
      bookings[index].updateTime = new Date()
      setStorage('bookings', bookings)
      return { success: true }
    }
    return { success: false, message: '预约不存在' }
  },

  reject: async (bookingId, reason) => {
    await delay(300)
    const bookings = getStorage('bookings')
    const index = bookings.findIndex(b => b._id === bookingId)
    if (index >= 0) {
      bookings[index].status = 'cancelled'
      bookings[index].cancelReason = reason || '管理员拒绝'
      bookings[index].updateTime = new Date()
      setStorage('bookings', bookings)
      return { success: true }
    }
    return { success: false, message: '预约不存在' }
  }
}

// ==================== 停车相关 Mock API ====================

const parkingApi = {
  register: async (registerData) => {
    await delay(400)
    const records = getStorage('parking_records')
    
    const newRecord = {
      _id: generateId(),
      _openid: 'mock_openid_001',
      plateNumber: registerData.plateNumber.toUpperCase(),
      type: 'visitor',
      purpose: registerData.purpose || '',
      expectedDuration: registerData.expectedDuration || 120,
      status: 'pending',
      entryTime: null,
      exitTime: null,
      duration: null,
      qrCode: generateId(),
      createTime: new Date(),
      updateTime: new Date()
    }
    
    records.push(newRecord)
    setStorage('parking_records', records)
    
    return {
      success: true,
      recordId: newRecord._id,
      qrCode: newRecord.qrCode
    }
  },

  reserve: async (reserveData) => {
    await delay(400)
    const records = getStorage('parking_records')
    const config = getStorage('parking_config') || { totalSpaces: 100 }
    
    // 检查车位
    const reservedCount = records.filter(r => 
      r.type === 'reserve' && 
      r.reserveDate === reserveData.reserveDate &&
      ['pending', 'entered'].includes(r.status)
    ).length
    
    if (reservedCount >= config.totalSpaces) {
      return { success: false, message: '当前时段车位已满' }
    }
    
    const newRecord = {
      _id: generateId(),
      _openid: 'mock_openid_001',
      plateNumber: reserveData.plateNumber.toUpperCase(),
      type: 'reserve',
      purpose: '',
      reserveDate: reserveData.reserveDate,
      reserveStartTime: reserveData.reserveStartTime,
      reserveEndTime: reserveData.reserveEndTime || '',
      status: 'pending',
      entryTime: null,
      exitTime: null,
      duration: null,
      qrCode: generateId(),
      createTime: new Date(),
      updateTime: new Date()
    }
    
    records.push(newRecord)
    setStorage('parking_records', records)
    
    return {
      success: true,
      recordId: newRecord._id,
      qrCode: newRecord.qrCode
    }
  },

  cancelReserve: async (recordId) => {
    await delay(300)
    const records = getStorage('parking_records')
    const index = records.findIndex(r => r._id === recordId)
    
    if (index < 0) {
      return { success: false, message: '记录不存在' }
    }
    
    if (records[index].status !== 'pending') {
      return { success: false, message: '该记录无法取消' }
    }
    
    records[index].status = 'cancelled'
    records[index].updateTime = new Date()
    setStorage('parking_records', records)
    
    return { success: true }
  },

  confirmEntry: async (recordId) => {
    await delay(300)
    const records = getStorage('parking_records')
    const index = records.findIndex(r => r._id === recordId)
    
    if (index < 0) {
      return { success: false, message: '记录不存在' }
    }
    
    records[index].status = 'entered'
    records[index].entryTime = new Date()
    records[index].updateTime = new Date()
    setStorage('parking_records', records)
    
    return { success: true }
  },

  confirmExit: async (recordId) => {
    await delay(300)
    const records = getStorage('parking_records')
    const index = records.findIndex(r => r._id === recordId)
    
    if (index < 0) {
      return { success: false, message: '记录不存在' }
    }
    
    const now = new Date()
    const entryTime = new Date(records[index].entryTime)
    const duration = Math.round((now - entryTime) / (1000 * 60))
    
    records[index].status = 'exited'
    records[index].exitTime = now
    records[index].duration = duration
    records[index].updateTime = now
    setStorage('parking_records', records)
    
    return { success: true, duration: duration }
  },

  getMyRecords: async (params = {}) => {
    await delay(300)
    let records = getStorage('parking_records')
    
    records = records.filter(r => r._openid === 'mock_openid_001')
    
    if (params.status) {
      records = records.filter(r => r.status === params.status)
    }
    
    records.sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
    
    const page = params.page || 1
    const pageSize = params.pageSize || 20
    const start = (page - 1) * pageSize
    const data = records.slice(start, start + pageSize)
    
    return {
      success: true,
      data: data,
      total: records.length,
      page: page,
      pageSize: pageSize
    }
  },

  getCurrentParking: async () => {
    await delay(200)
    const records = getStorage('parking_records')
    const current = records.filter(r => 
      r._openid === 'mock_openid_001' && r.status === 'entered'
    )
    return { success: true, data: current }
  },

  getParkingStatus: async () => {
    await delay(200)
    const records = getStorage('parking_records')
    const config = getStorage('parking_config') || { totalSpaces: 100 }
    
    const enteredCount = records.filter(r => r.status === 'entered').length
    const today = formatDate(new Date())
    const reservedToday = records.filter(r => 
      r.type === 'reserve' && r.reserveDate === today && r.status === 'pending'
    ).length
    
    return {
      success: true,
      data: {
        totalSpaces: config.totalSpaces,
        usedSpaces: enteredCount,
        availableSpaces: config.totalSpaces - enteredCount,
        reservedToday: reservedToday
      }
    }
  },

  getAllRecords: async (params = {}) => {
    await delay(300)
    let records = getStorage('parking_records')
    
    if (params.plateNumber) {
      const keyword = params.plateNumber.toUpperCase()
      records = records.filter(r => r.plateNumber.includes(keyword))
    }
    if (params.status) {
      records = records.filter(r => r.status === params.status)
    }
    
    records.sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
    
    const page = params.page || 1
    const pageSize = params.pageSize || 20
    const start = (page - 1) * pageSize
    const data = records.slice(start, start + pageSize)
    
    return {
      success: true,
      data: data,
      total: records.length,
      page: page,
      pageSize: pageSize
    }
  },

  adminRegister: async (registerData) => {
    return parkingApi.register(registerData)
  },

  adminConfirmEntry: async (recordId) => {
    return parkingApi.confirmEntry(recordId)
  },

  adminConfirmExit: async (recordId) => {
    return parkingApi.confirmExit(recordId)
  },

  updateConfig: async (config) => {
    await delay(300)
    const current = getStorage('parking_config') || {}
    const updated = { ...current, ...config, updateTime: new Date() }
    setStorage('parking_config', updated)
    return { success: true }
  }
}

// ==================== 管理员相关 Mock API ====================

const adminApi = {
  setSelfAdmin: async (secretKey) => {
    await delay(300)
    // Mock 模式下任何密钥都接受
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo) {
      userInfo.isAdmin = true
      wx.setStorageSync('userInfo', userInfo)
    }
    return { success: true }
  },

  setAdmin: async (targetOpenid, secretKey) => {
    await delay(300)
    return { success: true }
  },

  getAdminList: async () => {
    await delay(200)
    const userInfo = wx.getStorageSync('userInfo')
    return {
      success: true,
      data: userInfo ? [userInfo] : []
    }
  },

  removeAdmin: async (targetOpenid) => {
    await delay(300)
    return { success: true }
  }
}

// 初始化
initMockStorage()

module.exports = {
  userApi,
  venueApi,
  bookingApi,
  parkingApi,
  adminApi,
  initMockStorage
}
