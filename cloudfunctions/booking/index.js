// 云函数入口文件 - 预约模块
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command
const bookingsCollection = db.collection('bookings')
const venuesCollection = db.collection('venues')
const usersCollection = db.collection('users')

// 云函数入口函数
exports.main = async (event, context) => {
  const { action } = event
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  switch (action) {
    case 'create':
      return await createBooking(openid, event.bookingData)
    case 'cancel':
      return await cancelBooking(openid, event.bookingId)
    case 'getMyList':
      return await getMyList(openid, event)
    case 'getDetail':
      return await getDetail(openid, event.bookingId)
    case 'getAllList':
      return await getAllList(openid, event)
    case 'approve':
      return await approveBooking(openid, event.bookingId)
    case 'reject':
      return await rejectBooking(openid, event.bookingId, event.reason)
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

// 创建预约
async function createBooking(openid, bookingData) {
  try {
    const { venueId, date, startTime, endTime, userName, userPhone, remark } = bookingData
    
    // 获取场馆信息
    const venueRes = await venuesCollection.doc(venueId).get()
    const venue = venueRes.data
    
    if (!venue || !venue.enabled) {
      return {
        success: false,
        message: '场馆不存在或已停用'
      }
    }
    
    // 检查时段是否已被预约（使用事务确保并发安全）
    const transaction = await db.startTransaction()
    
    try {
      const existingBooking = await transaction.collection('bookings').where({
        venueId: venueId,
        date: date,
        startTime: startTime,
        status: _.in(['pending', 'confirmed'])
      }).get()
      
      if (existingBooking.data.length > 0) {
        await transaction.rollback()
        return {
          success: false,
          message: '该时段已被预约，请选择其他时段'
        }
      }
      
      const now = new Date()
      const newBooking = {
        _openid: openid,
        venueId: venueId,
        venueName: venue.name,
        venueType: venue.type,
        date: date,
        startTime: startTime,
        endTime: endTime,
        status: venue.needApproval ? 'pending' : 'confirmed',
        userName: userName,
        userPhone: userPhone,
        remark: remark || '',
        cancelReason: '',
        createTime: now,
        updateTime: now
      }
      
      const addRes = await transaction.collection('bookings').add({
        data: newBooking
      })
      
      await transaction.commit()
      
      return {
        success: true,
        bookingId: addRes._id,
        status: newBooking.status
      }
    } catch (err) {
      await transaction.rollback()
      throw err
    }
  } catch (err) {
    console.error('创建预约失败:', err)
    return {
      success: false,
      message: '创建预约失败'
    }
  }
}

// 取消预约
async function cancelBooking(openid, bookingId) {
  try {
    // 获取预约信息
    const bookingRes = await bookingsCollection.doc(bookingId).get()
    const booking = bookingRes.data
    
    if (!booking) {
      return {
        success: false,
        message: '预约不存在'
      }
    }
    
    // 检查权限（只能取消自己的预约）
    if (booking._openid !== openid) {
      return {
        success: false,
        message: '无权限操作'
      }
    }
    
    // 检查状态
    if (!['pending', 'confirmed'].includes(booking.status)) {
      return {
        success: false,
        message: '该预约无法取消'
      }
    }
    
    // 检查是否在可取消时间内
    const venue = await venuesCollection.doc(booking.venueId).get()
    const minCancelHours = venue.data?.minCancelHours || 2
    
    const bookingDateTime = new Date(`${booking.date} ${booking.startTime}`)
    const now = new Date()
    const diffHours = (bookingDateTime - now) / (1000 * 60 * 60)
    
    if (diffHours < minCancelHours) {
      return {
        success: false,
        message: `已超过可取消时间，预约开始前${minCancelHours}小时内无法取消`
      }
    }
    
    // 更新状态
    await bookingsCollection.doc(bookingId).update({
      data: {
        status: 'cancelled',
        cancelReason: '用户取消',
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

// 获取我的预约列表
async function getMyList(openid, params) {
  try {
    const { status, page = 1, pageSize = 20 } = params
    
    let query = bookingsCollection.where({
      _openid: openid
    })
    
    if (status) {
      query = bookingsCollection.where({
        _openid: openid,
        status: status
      })
    }
    
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
    console.error('获取预约列表失败:', err)
    return {
      success: false,
      message: '获取预约列表失败'
    }
  }
}

// 获取预约详情
async function getDetail(openid, bookingId) {
  try {
    const bookingRes = await bookingsCollection.doc(bookingId).get()
    const booking = bookingRes.data
    
    if (!booking) {
      return {
        success: false,
        message: '预约不存在'
      }
    }
    
    // 检查权限
    const isAdmin = await checkAdmin(openid)
    if (booking._openid !== openid && !isAdmin) {
      return {
        success: false,
        message: '无权限查看'
      }
    }

    return {
      success: true,
      data: booking
    }
  } catch (err) {
    console.error('获取预约详情失败:', err)
    return {
      success: false,
      message: '获取预约详情失败'
    }
  }
}

// 获取所有预约（管理员）
async function getAllList(openid, params) {
  try {
    const isAdmin = await checkAdmin(openid)
    if (!isAdmin) {
      return {
        success: false,
        message: '无权限操作'
      }
    }
    
    const { venueId, date, status, page = 1, pageSize = 20 } = params
    
    let conditions = {}
    if (venueId) conditions.venueId = venueId
    if (date) conditions.date = date
    if (status) conditions.status = status
    
    let query = bookingsCollection.where(conditions)
    
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
    console.error('获取预约列表失败:', err)
    return {
      success: false,
      message: '获取预约列表失败'
    }
  }
}

// 审核通过（管理员）
async function approveBooking(openid, bookingId) {
  try {
    const isAdmin = await checkAdmin(openid)
    if (!isAdmin) {
      return {
        success: false,
        message: '无权限操作'
      }
    }
    
    await bookingsCollection.doc(bookingId).update({
      data: {
        status: 'confirmed',
        updateTime: new Date()
      }
    })

    return {
      success: true
    }
  } catch (err) {
    console.error('审核预约失败:', err)
    return {
      success: false,
      message: '审核预约失败'
    }
  }
}

// 拒绝预约（管理员）
async function rejectBooking(openid, bookingId, reason) {
  try {
    const isAdmin = await checkAdmin(openid)
    if (!isAdmin) {
      return {
        success: false,
        message: '无权限操作'
      }
    }
    
    await bookingsCollection.doc(bookingId).update({
      data: {
        status: 'cancelled',
        cancelReason: reason || '管理员拒绝',
        updateTime: new Date()
      }
    })

    return {
      success: true
    }
  } catch (err) {
    console.error('拒绝预约失败:', err)
    return {
      success: false,
      message: '拒绝预约失败'
    }
  }
}
