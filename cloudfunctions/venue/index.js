// 云函数入口文件 - 场馆模块
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command
const venuesCollection = db.collection('venues')
const bookingsCollection = db.collection('bookings')
const usersCollection = db.collection('users')

// 云函数入口函数
exports.main = async (event, context) => {
  const { action } = event
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  switch (action) {
    case 'getList':
      return await getList(event)
    case 'getDetail':
      return await getDetail(event.venueId)
    case 'getTimeSlots':
      return await getTimeSlots(event.venueId, event.date)
    case 'add':
      return await addVenue(openid, event.venueData)
    case 'update':
      return await updateVenue(openid, event.venueId, event.venueData)
    case 'disable':
      return await setVenueStatus(openid, event.venueId, false)
    case 'enable':
      return await setVenueStatus(openid, event.venueId, true)
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

// 获取场馆列表
async function getList(params) {
  try {
    const { type, page = 1, pageSize = 20 } = params
    
    let query = venuesCollection.where({
      enabled: true
    })
    
    if (type) {
      query = venuesCollection.where({
        enabled: true,
        type: type
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
    console.error('获取场馆列表失败:', err)
    return {
      success: false,
      message: '获取场馆列表失败'
    }
  }
}

// 获取场馆详情
async function getDetail(venueId) {
  try {
    const venueRes = await venuesCollection.doc(venueId).get()
    
    return {
      success: true,
      data: venueRes.data
    }
  } catch (err) {
    console.error('获取场馆详情失败:', err)
    return {
      success: false,
      message: '获取场馆详情失败'
    }
  }
}

// 获取可用时段
async function getTimeSlots(venueId, date) {
  try {
    // 获取场馆信息
    const venueRes = await venuesCollection.doc(venueId).get()
    const venue = venueRes.data
    
    if (!venue || !venue.enabled) {
      return {
        success: false,
        message: '场馆不存在或已停用'
      }
    }
    
    // 生成时段列表
    const slots = generateTimeSlots(
      venue.openTime,
      venue.closeTime,
      venue.slotDuration
    )
    
    // 获取该日期已预约的时段
    const bookingsRes = await bookingsCollection.where({
      venueId: venueId,
      date: date,
      status: _.in(['pending', 'confirmed'])
    }).get()
    
    const bookedSlots = new Set()
    bookingsRes.data.forEach(booking => {
      bookedSlots.add(booking.startTime)
    })
    
    // 标记时段状态
    const now = new Date()
    const today = formatDate(now)
    const currentTime = formatTime(now)
    
    const slotsWithStatus = slots.map(slot => {
      let status = 'available'
      
      // 检查是否已预约
      if (bookedSlots.has(slot.startTime)) {
        status = 'booked'
      }
      // 检查是否已过期（当天的过去时段）
      else if (date === today && slot.startTime <= currentTime) {
        status = 'expired'
      }
      
      return {
        ...slot,
        status: status
      }
    })

    return {
      success: true,
      data: slotsWithStatus,
      venue: {
        name: venue.name,
        price: venue.price,
        priceUnit: venue.priceUnit
      }
    }
  } catch (err) {
    console.error('获取时段失败:', err)
    return {
      success: false,
      message: '获取时段失败'
    }
  }
}

// 生成时段列表
function generateTimeSlots(openTime, closeTime, duration) {
  const slots = []
  let [startHour, startMin] = openTime.split(':').map(Number)
  const [endHour, endMin] = closeTime.split(':').map(Number)
  
  while (true) {
    const startTimeStr = `${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}`
    
    // 计算结束时间
    let endTimeMin = startMin + duration
    let endTimeHour = startHour
    if (endTimeMin >= 60) {
      endTimeHour += Math.floor(endTimeMin / 60)
      endTimeMin = endTimeMin % 60
    }
    
    // 检查是否超过营业时间
    if (endTimeHour > endHour || (endTimeHour === endHour && endTimeMin > endMin)) {
      break
    }
    
    const endTimeStr = `${String(endTimeHour).padStart(2, '0')}:${String(endTimeMin).padStart(2, '0')}`
    
    slots.push({
      startTime: startTimeStr,
      endTime: endTimeStr
    })
    
    // 移动到下一个时段
    startHour = endTimeHour
    startMin = endTimeMin
  }
  
  return slots
}

// 格式化日期
function formatDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 格式化时间
function formatTime(date) {
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

// 添加场馆（管理员）
async function addVenue(openid, venueData) {
  try {
    const isAdmin = await checkAdmin(openid)
    if (!isAdmin) {
      return {
        success: false,
        message: '无权限操作'
      }
    }
    
    const now = new Date()
    const newVenue = {
      ...venueData,
      enabled: true,
      createTime: now,
      updateTime: now
    }
    
    const addRes = await venuesCollection.add({
      data: newVenue
    })

    return {
      success: true,
      venueId: addRes._id
    }
  } catch (err) {
    console.error('添加场馆失败:', err)
    return {
      success: false,
      message: '添加场馆失败'
    }
  }
}

// 更新场馆（管理员）
async function updateVenue(openid, venueId, venueData) {
  try {
    const isAdmin = await checkAdmin(openid)
    if (!isAdmin) {
      return {
        success: false,
        message: '无权限操作'
      }
    }
    
    await venuesCollection.doc(venueId).update({
      data: {
        ...venueData,
        updateTime: new Date()
      }
    })

    return {
      success: true
    }
  } catch (err) {
    console.error('更新场馆失败:', err)
    return {
      success: false,
      message: '更新场馆失败'
    }
  }
}

// 设置场馆状态（管理员）
async function setVenueStatus(openid, venueId, enabled) {
  try {
    const isAdmin = await checkAdmin(openid)
    if (!isAdmin) {
      return {
        success: false,
        message: '无权限操作'
      }
    }
    
    await venuesCollection.doc(venueId).update({
      data: {
        enabled: enabled,
        updateTime: new Date()
      }
    })

    return {
      success: true
    }
  } catch (err) {
    console.error('更新场馆状态失败:', err)
    return {
      success: false,
      message: '更新场馆状态失败'
    }
  }
}
