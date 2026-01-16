// utils/api.js
// 封装云函数调用

/**
 * 调用云函数的通用方法
 * @param {string} name 云函数名称
 * @param {string} action 操作类型
 * @param {object} data 请求数据
 * @returns {Promise}
 */
const callFunction = (name, action, data = {}) => {
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name: name,
      data: {
        action: action,
        ...data
      }
    }).then(res => {
      if (res.result && res.result.success) {
        resolve(res.result)
      } else {
        reject(new Error(res.result?.message || '操作失败'))
      }
    }).catch(err => {
      console.error(`调用云函数 ${name}/${action} 失败:`, err)
      reject(err)
    })
  })
}

// ==================== 用户相关 API ====================

const userApi = {
  // 获取openid
  getOpenid: () => callFunction('user', 'getOpenid'),
  
  // 登录
  login: (userInfo) => callFunction('user', 'login', { userInfo }),
  
  // 获取用户信息
  getUserInfo: () => callFunction('user', 'getUserInfo'),
  
  // 更新用户信息
  updateUserInfo: (userInfo) => callFunction('user', 'updateUserInfo', { userInfo })
}

// ==================== 场馆相关 API ====================

const venueApi = {
  // 获取场馆列表
  getList: (params = {}) => callFunction('venue', 'getList', params),
  
  // 获取场馆详情
  getDetail: (venueId) => callFunction('venue', 'getDetail', { venueId }),
  
  // 获取可用时段
  getTimeSlots: (venueId, date) => callFunction('venue', 'getTimeSlots', { venueId, date }),
  
  // 添加场馆（管理员）
  add: (venueData) => callFunction('venue', 'add', { venueData }),
  
  // 更新场馆（管理员）
  update: (venueId, venueData) => callFunction('venue', 'update', { venueId, venueData }),
  
  // 删除/停用场馆（管理员）
  disable: (venueId) => callFunction('venue', 'disable', { venueId }),
  
  // 启用场馆（管理员）
  enable: (venueId) => callFunction('venue', 'enable', { venueId })
}

// ==================== 预约相关 API ====================

const bookingApi = {
  // 创建预约
  create: (bookingData) => callFunction('booking', 'create', { bookingData }),
  
  // 取消预约
  cancel: (bookingId) => callFunction('booking', 'cancel', { bookingId }),
  
  // 获取我的预约列表
  getMyList: (params = {}) => callFunction('booking', 'getMyList', params),
  
  // 获取预约详情
  getDetail: (bookingId) => callFunction('booking', 'getDetail', { bookingId }),
  
  // 获取所有预约（管理员）
  getAllList: (params = {}) => callFunction('booking', 'getAllList', params),
  
  // 审核预约（管理员）
  approve: (bookingId) => callFunction('booking', 'approve', { bookingId }),
  
  // 拒绝预约（管理员）
  reject: (bookingId, reason) => callFunction('booking', 'reject', { bookingId, reason })
}

// ==================== 停车相关 API ====================

const parkingApi = {
  // 访客车辆登记
  register: (registerData) => callFunction('parking', 'register', { registerData }),
  
  // 车位预约
  reserve: (reserveData) => callFunction('parking', 'reserve', { reserveData }),
  
  // 取消预约
  cancelReserve: (recordId) => callFunction('parking', 'cancelReserve', { recordId }),
  
  // 确认入场
  confirmEntry: (recordId) => callFunction('parking', 'confirmEntry', { recordId }),
  
  // 确认出场
  confirmExit: (recordId) => callFunction('parking', 'confirmExit', { recordId }),
  
  // 获取我的停车记录
  getMyRecords: (params = {}) => callFunction('parking', 'getMyRecords', params),
  
  // 获取当前在场车辆
  getCurrentParking: () => callFunction('parking', 'getCurrentParking'),
  
  // 获取车位状态
  getParkingStatus: () => callFunction('parking', 'getParkingStatus'),
  
  // 获取所有停车记录（管理员）
  getAllRecords: (params = {}) => callFunction('parking', 'getAllRecords', params),
  
  // 管理员手动登记
  adminRegister: (registerData) => callFunction('parking', 'adminRegister', { registerData }),
  
  // 管理员确认进出
  adminConfirmEntry: (recordId) => callFunction('parking', 'adminConfirmEntry', { recordId }),
  adminConfirmExit: (recordId) => callFunction('parking', 'adminConfirmExit', { recordId }),
  
  // 更新车位配置（管理员）
  updateConfig: (config) => callFunction('parking', 'updateConfig', { config })
}

module.exports = {
  callFunction,
  userApi,
  venueApi,
  bookingApi,
  parkingApi
}
