// 云函数入口文件 - 停车模块
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command
const parkingCollection = db.collection('parking_records')
const configCollection = db.collection('parking_config')
const usersCollection = db.collection('users')

// 云函数入口函数
exports.main = async (event, context) => {
  const { action } = event
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  switch (action) {
    case 'register':
      return await registerVehicle(openid, event.registerData)
    case 'reserve':
      return await reserveParking(openid, event.reserveData)
    case 'cancelReserve':
      return await cancelReserve(openid, event.recordId)
    case 'confirmEntry':
      return await confirmEntry(openid, event.recordId)
    case 'confirmExit':
      return await confirmExit(openid, event.recordId)
    case 'getMyRecords':
      return await getMyRecords(openid, event)
    case 'getCurrentParking':
      return await getCurrentParking(openid)
    case 'getParkingStatus':
      return await getParkingStatus()
    case 'getAllRecords':
      return await getAllRecords(openid, event)
    case 'adminRegister':
      return await adminRegister(openid, event.registerData)
    case 'adminConfirmEntry':
      return await adminConfirmEntry(openid, event.recordId)
    case 'adminConfirmExit':
      return await adminConfirmExit(openid, event.recordId)
    case 'updateConfig':
      return await updateConfig(openid, event.config)
    default:
      return {
        success: false,
        message: '未知操作'
      }
  }
}

// 检查是否为管理员
async function checkAdmin(openid) {
  const userRes = await usersCollection.where({
    _openid: openid
  }).get()
  
  return userRes.data.length > 0 && userRes.data[0].isAdmin === true
}

// 生成入场二维码内容
function generateQRCode(recordId, plateNumber) {
  return JSON.stringify({
    type: 'parking_entry',
    recordId: recordId,
    plateNumber: plateNumber,
    timestamp: Date.now()
  })
}

// 访客车辆登记
async function registerVehicle(openid, registerData) {
  try {
    const { plateNumber, purpose, expectedDuration } = registerData
    
    if (!plateNumber) {
      return {
        success: false,
        message: '请输入车牌号'
      }
    }
    
    const now = new Date()
    const newRecord = {
      _openid: openid,
      plateNumber: plateNumber.toUpperCase(),
      type: 'visitor',
      purpose: purpose || '',
      expectedDuration: expectedDuration || 120,
      status: 'pending',
      entryTime: null,
      exitTime: null,
      duration: null,
      qrCode: '',
      createTime: now,
      updateTime: now
    }
    
    const addRes = await parkingCollection.add({
      data: newRecord
    })
    
    // 生成二维码
    const qrCode = generateQRCode(addRes._id, plateNumber)
    await parkingCollection.doc(addRes._id).update({
      data: { qrCode: qrCode }
    })

    return {
      success: true,
      recordId: addRes._id,
      qrCode: qrCode
    }
  } catch (err) {
    console.error('登记车辆失败:', err)
    return {
      success: false,
      message: '登记车辆失败'
    }
  }
}

// 车位预约
async function reserveParking(openid, reserveData) {
  try {
    const { plateNumber, reserveDate, reserveStartTime, reserveEndTime } = reserveData
    
    if (!plateNumber || !reserveDate || !reserveStartTime) {
      return {
        success: false,
        message: '请填写完整信息'
      }
    }
    
    // 获取配置
    const configRes = await configCollection.doc('config').get()
    const config = configRes.data || { totalSpaces: 100 }
    
    // 检查当前时段预约数量
    const reservedCount = await parkingCollection.where({
      type: 'reserve',
      reserveDate: reserveDate,
      status: _.in(['pending', 'entered']),
      reserveStartTime: _.lte(reserveEndTime || '23:59'),
      reserveEndTime: _.gte(reserveStartTime)
    }).count()
    
    if (reservedCount.total >= config.totalSpaces) {
      return {
        success: false,
        message: '当前时段车位已满，请选择其他时段'
      }
    }
    
    const now = new Date()
    const newRecord = {
      _openid: openid,
      plateNumber: plateNumber.toUpperCase(),
      type: 'reserve',
      purpose: '',
      reserveDate: reserveDate,
      reserveStartTime: reserveStartTime,
      reserveEndTime: reserveEndTime || '',
      status: 'pending',
      entryTime: null,
      exitTime: null,
      duration: null,
      qrCode: '',
      createTime: now,
      updateTime: now
    }
    
    const addRes = await parkingCollection.add({
      data: newRecord
    })
    
    // 生成二维码
    const qrCode = generateQRCode(addRes._id, plateNumber)
    await parkingCollection.doc(addRes._id).update({
      data: { qrCode: qrCode }
    })

    return {
      success: true,
      recordId: addRes._id,
      qrCode: qrCode
    }
  } catch (err) {
    console.error('预约车位失败:', err)
    return {
      success: false,
      message: '预约车位失败'
    }
  }
}

// 取消预约
async function cancelReserve(openid, recordId) {
  try {
    const recordRes = await parkingCollection.doc(recordId).get()
    const record = recordRes.data
    
    if (!record || record._openid !== openid) {
      return {
        success: false,
        message: '记录不存在或无权限'
      }
    }
    
    if (record.status !== 'pending') {
      return {
        success: false,
        message: '该记录无法取消'
      }
    }
    
    await parkingCollection.doc(recordId).update({
      data: {
        status: 'cancelled',
        updateTime: new Date()
      }
    })

    return {
      success: true
    }
  } catch (err) {
    console.error('取消预约失败:', err)
    return {
      success: false,
      message: '取消预约失败'
    }
  }
}

// 确认入场
async function confirmEntry(openid, recordId) {
  try {
    const recordRes = await parkingCollection.doc(recordId).get()
    const record = recordRes.data
    
    if (!record || record._openid !== openid) {
      return {
        success: false,
        message: '记录不存在或无权限'
      }
    }
    
    if (record.status !== 'pending') {
      return {
        success: false,
        message: '该记录状态不正确'
      }
    }
    
    const now = new Date()
    await parkingCollection.doc(recordId).update({
      data: {
        status: 'entered',
        entryTime: now,
        updateTime: now
      }
    })

    return {
      success: true
    }
  } catch (err) {
    console.error('确认入场失败:', err)
    return {
      success: false,
      message: '确认入场失败'
    }
  }
}

// 确认出场
async function confirmExit(openid, recordId) {
  try {
    const recordRes = await parkingCollection.doc(recordId).get()
    const record = recordRes.data
    
    if (!record || record._openid !== openid) {
      return {
        success: false,
        message: '记录不存在或无权限'
      }
    }
    
    if (record.status !== 'entered') {
      return {
        success: false,
        message: '该记录状态不正确'
      }
    }
    
    const now = new Date()
    const entryTime = new Date(record.entryTime)
    const duration = Math.round((now - entryTime) / (1000 * 60)) // 分钟
    
    await parkingCollection.doc(recordId).update({
      data: {
        status: 'exited',
        exitTime: now,
        duration: duration,
        updateTime: now
      }
    })

    return {
      success: true,
      duration: duration
    }
  } catch (err) {
    console.error('确认出场失败:', err)
    return {
      success: false,
      message: '确认出场失败'
    }
  }
}

// 获取我的停车记录
async function getMyRecords(openid, params) {
  try {
    const { status, page = 1, pageSize = 20 } = params
    
    let conditions = { _openid: openid }
    if (status) conditions.status = status
    
    const query = parkingCollection.where(conditions)
    
    const countRes = await query.count()
    const total = countRes.total
    
    const listRes = await query
      .orderBy('createTime', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get()

    return {
      success: true,
      data: listRes.data,
      total: total,
      page: page,
      pageSize: pageSize
    }
  } catch (err) {
    console.error('获取停车记录失败:', err)
    return {
      success: false,
      message: '获取停车记录失败'
    }
  }
}

// 获取当前在场车辆
async function getCurrentParking(openid) {
  try {
    const listRes = await parkingCollection.where({
      _openid: openid,
      status: 'entered'
    }).get()

    return {
      success: true,
      data: listRes.data
    }
  } catch (err) {
    console.error('获取当前停车失败:', err)
    return {
      success: false,
      message: '获取当前停车失败'
    }
  }
}

// 获取车位状态
async function getParkingStatus() {
  try {
    // 获取配置
    let config = { totalSpaces: 100 }
    try {
      const configRes = await configCollection.doc('config').get()
      config = configRes.data || config
    } catch (e) {
      // 配置不存在，使用默认值
    }
    
    // 统计当前在场车辆
    const enteredCount = await parkingCollection.where({
      status: 'entered'
    }).count()
    
    // 统计今日预约（未入场）
    const today = formatDate(new Date())
    const reservedCount = await parkingCollection.where({
      type: 'reserve',
      reserveDate: today,
      status: 'pending'
    }).count()

    return {
      success: true,
      data: {
        totalSpaces: config.totalSpaces,
        usedSpaces: enteredCount.total,
        availableSpaces: config.totalSpaces - enteredCount.total,
        reservedToday: reservedCount.total
      }
    }
  } catch (err) {
    console.error('获取车位状态失败:', err)
    return {
      success: false,
      message: '获取车位状态失败'
    }
  }
}

// 格式化日期
function formatDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 获取所有停车记录（管理员）
async function getAllRecords(openid, params) {
  try {
    const isAdmin = await checkAdmin(openid)
    if (!isAdmin) {
      return {
        success: false,
        message: '无权限操作'
      }
    }
    
    const { plateNumber, status, startDate, endDate, page = 1, pageSize = 20 } = params
    
    let conditions = {}
    if (plateNumber) conditions.plateNumber = new RegExp(plateNumber.toUpperCase())
    if (status) conditions.status = status
    
    // 日期范围筛选
    if (startDate && endDate) {
      conditions.createTime = _.gte(new Date(startDate)).and(_.lte(new Date(endDate + ' 23:59:59')))
    } else if (startDate) {
      conditions.createTime = _.gte(new Date(startDate))
    } else if (endDate) {
      conditions.createTime = _.lte(new Date(endDate + ' 23:59:59'))
    }
    
    const query = parkingCollection.where(conditions)
    
    const countRes = await query.count()
    const total = countRes.total
    
    const listRes = await query
      .orderBy('createTime', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get()

    return {
      success: true,
      data: listRes.data,
      total: total,
      page: page,
      pageSize: pageSize
    }
  } catch (err) {
    console.error('获取停车记录失败:', err)
    return {
      success: false,
      message: '获取停车记录失败'
    }
  }
}

// 管理员手动登记
async function adminRegister(openid, registerData) {
  try {
    const isAdmin = await checkAdmin(openid)
    if (!isAdmin) {
      return {
        success: false,
        message: '无权限操作'
      }
    }
    
    const { plateNumber, purpose } = registerData
    
    const now = new Date()
    const newRecord = {
      _openid: 'admin_register',
      plateNumber: plateNumber.toUpperCase(),
      type: 'visitor',
      purpose: purpose || '管理员登记',
      status: 'pending',
      entryTime: null,
      exitTime: null,
      duration: null,
      qrCode: '',
      createTime: now,
      updateTime: now
    }
    
    const addRes = await parkingCollection.add({
      data: newRecord
    })
    
    const qrCode = generateQRCode(addRes._id, plateNumber)
    await parkingCollection.doc(addRes._id).update({
      data: { qrCode: qrCode }
    })

    return {
      success: true,
      recordId: addRes._id,
      qrCode: qrCode
    }
  } catch (err) {
    console.error('管理员登记失败:', err)
    return {
      success: false,
      message: '登记失败'
    }
  }
}

// 管理员确认入场
async function adminConfirmEntry(openid, recordId) {
  try {
    const isAdmin = await checkAdmin(openid)
    if (!isAdmin) {
      return {
        success: false,
        message: '无权限操作'
      }
    }
    
    const now = new Date()
    await parkingCollection.doc(recordId).update({
      data: {
        status: 'entered',
        entryTime: now,
        updateTime: now
      }
    })

    return {
      success: true
    }
  } catch (err) {
    console.error('确认入场失败:', err)
    return {
      success: false,
      message: '确认入场失败'
    }
  }
}

// 管理员确认出场
async function adminConfirmExit(openid, recordId) {
  try {
    const isAdmin = await checkAdmin(openid)
    if (!isAdmin) {
      return {
        success: false,
        message: '无权限操作'
      }
    }
    
    const recordRes = await parkingCollection.doc(recordId).get()
    const record = recordRes.data
    
    const now = new Date()
    let duration = 0
    if (record.entryTime) {
      const entryTime = new Date(record.entryTime)
      duration = Math.round((now - entryTime) / (1000 * 60))
    }
    
    await parkingCollection.doc(recordId).update({
      data: {
        status: 'exited',
        exitTime: now,
        duration: duration,
        updateTime: now
      }
    })

    return {
      success: true,
      duration: duration
    }
  } catch (err) {
    console.error('确认出场失败:', err)
    return {
      success: false,
      message: '确认出场失败'
    }
  }
}

// 更新配置（管理员）
async function updateConfig(openid, config) {
  try {
    const isAdmin = await checkAdmin(openid)
    if (!isAdmin) {
      return {
        success: false,
        message: '无权限操作'
      }
    }
    
    await configCollection.doc('config').set({
      data: {
        ...config,
        updateTime: new Date()
      }
    })

    return {
      success: true
    }
  } catch (err) {
    console.error('更新配置失败:', err)
    return {
      success: false,
      message: '更新配置失败'
    }
  }
}
