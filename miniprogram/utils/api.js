// utils/api.js
// API 模块 - 自动根据 Mock 模式切换数据源

// 获取当前是否为 Mock 模式
function isMockMode() {
  const app = getApp()
  return app && app.globalData && app.globalData.useMock
}

// 获取 Mock API
function getMockApi() {
  return require('./mock-api')
}

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
  getOpenid: () => {
    if (isMockMode()) {
      return getMockApi().userApi.getOpenid()
    }
    return callFunction('user', 'getOpenid')
  },
  
  // 登录
  login: (userInfo) => {
    if (isMockMode()) {
      return getMockApi().userApi.login(userInfo)
    }
    return callFunction('user', 'login', { userInfo })
  },
  
  // 获取用户信息
  getUserInfo: () => {
    if (isMockMode()) {
      return getMockApi().userApi.getUserInfo()
    }
    return callFunction('user', 'getUserInfo')
  },
  
  // 更新用户信息
  updateUserInfo: (userInfo) => {
    if (isMockMode()) {
      return getMockApi().userApi.updateUserInfo(userInfo)
    }
    return callFunction('user', 'updateUserInfo', { userInfo })
  }
}

// ==================== 场馆相关 API ====================

const venueApi = {
  // 获取场馆列表
  getList: (params = {}) => {
    if (isMockMode()) {
      return getMockApi().venueApi.getList(params)
    }
    return callFunction('venue', 'getList', params)
  },
  
  // 获取场馆详情
  getDetail: (venueId) => {
    if (isMockMode()) {
      return getMockApi().venueApi.getDetail(venueId)
    }
    return callFunction('venue', 'getDetail', { venueId })
  },
  
  // 获取可用时段
  getTimeSlots: (venueId, date) => {
    if (isMockMode()) {
      return getMockApi().venueApi.getTimeSlots(venueId, date)
    }
    return callFunction('venue', 'getTimeSlots', { venueId, date })
  },
  
  // 添加场馆（管理员）
  add: (venueData) => {
    if (isMockMode()) {
      return getMockApi().venueApi.add(venueData)
    }
    return callFunction('venue', 'add', { venueData })
  },
  
  // 更新场馆（管理员）
  update: (venueId, venueData) => {
    if (isMockMode()) {
      return getMockApi().venueApi.update(venueId, venueData)
    }
    return callFunction('venue', 'update', { venueId, venueData })
  },
  
  // 删除/停用场馆（管理员）
  disable: (venueId) => {
    if (isMockMode()) {
      return getMockApi().venueApi.disable(venueId)
    }
    return callFunction('venue', 'disable', { venueId })
  },
  
  // 启用场馆（管理员）
  enable: (venueId) => {
    if (isMockMode()) {
      return getMockApi().venueApi.enable(venueId)
    }
    return callFunction('venue', 'enable', { venueId })
  }
}

// ==================== 预约相关 API ====================

const bookingApi = {
  // 创建预约
  create: (bookingData) => {
    if (isMockMode()) {
      return getMockApi().bookingApi.create(bookingData)
    }
    return callFunction('booking', 'create', { bookingData })
  },
  
  // 取消预约
  cancel: (bookingId) => {
    if (isMockMode()) {
      return getMockApi().bookingApi.cancel(bookingId)
    }
    return callFunction('booking', 'cancel', { bookingId })
  },
  
  // 获取我的预约列表
  getMyList: (params = {}) => {
    if (isMockMode()) {
      return getMockApi().bookingApi.getMyList(params)
    }
    return callFunction('booking', 'getMyList', params)
  },
  
  // 获取预约详情
  getDetail: (bookingId) => {
    if (isMockMode()) {
      return getMockApi().bookingApi.getDetail(bookingId)
    }
    return callFunction('booking', 'getDetail', { bookingId })
  },
  
  // 获取所有预约（管理员）
  getAllList: (params = {}) => {
    if (isMockMode()) {
      return getMockApi().bookingApi.getAllList(params)
    }
    return callFunction('booking', 'getAllList', params)
  },
  
  // 审核预约（管理员）
  approve: (bookingId) => {
    if (isMockMode()) {
      return getMockApi().bookingApi.approve(bookingId)
    }
    return callFunction('booking', 'approve', { bookingId })
  },
  
  // 拒绝预约（管理员）
  reject: (bookingId, reason) => {
    if (isMockMode()) {
      return getMockApi().bookingApi.reject(bookingId, reason)
    }
    return callFunction('booking', 'reject', { bookingId, reason })
  }
}

// ==================== 停车相关 API ====================

const parkingApi = {
  // 访客车辆登记
  register: (registerData) => {
    if (isMockMode()) {
      return getMockApi().parkingApi.register(registerData)
    }
    return callFunction('parking', 'register', { registerData })
  },
  
  // 车位预约
  reserve: (reserveData) => {
    if (isMockMode()) {
      return getMockApi().parkingApi.reserve(reserveData)
    }
    return callFunction('parking', 'reserve', { reserveData })
  },
  
  // 取消预约
  cancelReserve: (recordId) => {
    if (isMockMode()) {
      return getMockApi().parkingApi.cancelReserve(recordId)
    }
    return callFunction('parking', 'cancelReserve', { recordId })
  },
  
  // 确认入场
  confirmEntry: (recordId) => {
    if (isMockMode()) {
      return getMockApi().parkingApi.confirmEntry(recordId)
    }
    return callFunction('parking', 'confirmEntry', { recordId })
  },
  
  // 确认出场
  confirmExit: (recordId) => {
    if (isMockMode()) {
      return getMockApi().parkingApi.confirmExit(recordId)
    }
    return callFunction('parking', 'confirmExit', { recordId })
  },
  
  // 获取我的停车记录
  getMyRecords: (params = {}) => {
    if (isMockMode()) {
      return getMockApi().parkingApi.getMyRecords(params)
    }
    return callFunction('parking', 'getMyRecords', params)
  },
  
  // 获取当前在场车辆
  getCurrentParking: () => {
    if (isMockMode()) {
      return getMockApi().parkingApi.getCurrentParking()
    }
    return callFunction('parking', 'getCurrentParking')
  },
  
  // 获取车位状态
  getParkingStatus: () => {
    if (isMockMode()) {
      return getMockApi().parkingApi.getParkingStatus()
    }
    return callFunction('parking', 'getParkingStatus')
  },
  
  // 获取所有停车记录（管理员）
  getAllRecords: (params = {}) => {
    if (isMockMode()) {
      return getMockApi().parkingApi.getAllRecords(params)
    }
    return callFunction('parking', 'getAllRecords', params)
  },
  
  // 管理员手动登记
  adminRegister: (registerData) => {
    if (isMockMode()) {
      return getMockApi().parkingApi.adminRegister(registerData)
    }
    return callFunction('parking', 'adminRegister', { registerData })
  },
  
  // 管理员确认进出
  adminConfirmEntry: (recordId) => {
    if (isMockMode()) {
      return getMockApi().parkingApi.adminConfirmEntry(recordId)
    }
    return callFunction('parking', 'adminConfirmEntry', { recordId })
  },
  
  adminConfirmExit: (recordId) => {
    if (isMockMode()) {
      return getMockApi().parkingApi.adminConfirmExit(recordId)
    }
    return callFunction('parking', 'adminConfirmExit', { recordId })
  },
  
  // 更新车位配置（管理员）
  updateConfig: (config) => {
    if (isMockMode()) {
      return getMockApi().parkingApi.updateConfig(config)
    }
    return callFunction('parking', 'updateConfig', { config })
  }
}

// ==================== 管理员相关 API ====================

const adminApi = {
  // 将自己设为管理员（需要密钥）
  setSelfAdmin: (secretKey) => {
    if (isMockMode()) {
      return getMockApi().adminApi.setSelfAdmin(secretKey)
    }
    return callFunction('admin', 'setSelfAdmin', { secretKey })
  },
  
  // 将指定用户设为管理员（需要密钥）
  setAdmin: (targetOpenid, secretKey) => {
    if (isMockMode()) {
      return getMockApi().adminApi.setAdmin(targetOpenid, secretKey)
    }
    return callFunction('admin', 'setAdmin', { targetOpenid, secretKey })
  },
  
  // 获取管理员列表
  getAdminList: () => {
    if (isMockMode()) {
      return getMockApi().adminApi.getAdminList()
    }
    return callFunction('admin', 'getAdminList')
  },
  
  // 移除管理员
  removeAdmin: (targetOpenid) => {
    if (isMockMode()) {
      return getMockApi().adminApi.removeAdmin(targetOpenid)
    }
    return callFunction('admin', 'removeAdmin', { targetOpenid })
  }
}

module.exports = {
  callFunction,
  userApi,
  venueApi,
  bookingApi,
  parkingApi,
  adminApi
}
