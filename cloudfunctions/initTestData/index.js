// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 测试场馆数据
const venuesData = [
  {
    name: '篮球场A',
    type: 'basketball',
    typeName: '篮球场',
    description: '标准室内篮球场，木地板，配备空调和照明设施。可容纳10人同时使用。',
    location: 'A栋1楼',
    capacity: 10,
    price: 100,
    priceUnit: '元/小时',
    openTime: '08:00',
    closeTime: '22:00',
    images: [],
    facilities: ['空调', '照明', '更衣室', '饮水机'],
    rules: '1. 请穿运动鞋入场\n2. 请爱护场地设施\n3. 请勿携带食物入场',
    status: 'available',
    createTime: db.serverDate(),
    updateTime: db.serverDate()
  },
  {
    name: '篮球场B',
    type: 'basketball',
    typeName: '篮球场',
    description: '室外标准篮球场，塑胶地面，夜间有照明。适合业余比赛。',
    location: 'B栋户外',
    capacity: 10,
    price: 60,
    priceUnit: '元/小时',
    openTime: '06:00',
    closeTime: '22:00',
    images: [],
    facilities: ['照明', '观众席'],
    rules: '1. 雨天暂停开放\n2. 请穿运动鞋入场',
    status: 'available',
    createTime: db.serverDate(),
    updateTime: db.serverDate()
  },
  {
    name: '羽毛球馆1号场',
    type: 'badminton',
    typeName: '羽毛球场',
    description: '专业羽毛球场地，PVC运动地板，层高12米，灯光充足。',
    location: 'C栋2楼',
    capacity: 4,
    price: 50,
    priceUnit: '元/小时',
    openTime: '08:00',
    closeTime: '22:00',
    images: [],
    facilities: ['空调', '照明', '更衣室', '球拍租借'],
    rules: '1. 请穿专业羽毛球鞋\n2. 可租借球拍（10元/副）',
    status: 'available',
    createTime: db.serverDate(),
    updateTime: db.serverDate()
  },
  {
    name: '羽毛球馆2号场',
    type: 'badminton',
    typeName: '羽毛球场',
    description: '专业羽毛球场地，适合双打比赛。',
    location: 'C栋2楼',
    capacity: 4,
    price: 50,
    priceUnit: '元/小时',
    openTime: '08:00',
    closeTime: '22:00',
    images: [],
    facilities: ['空调', '照明', '更衣室'],
    rules: '1. 请穿专业羽毛球鞋',
    status: 'available',
    createTime: db.serverDate(),
    updateTime: db.serverDate()
  },
  {
    name: '游泳馆',
    type: 'swimming',
    typeName: '游泳池',
    description: '50米标准泳道，恒温水池，水深1.2-2米。配备专业救生员。',
    location: 'D栋负1楼',
    capacity: 50,
    price: 40,
    priceUnit: '元/次',
    openTime: '06:00',
    closeTime: '21:00',
    images: [],
    facilities: ['恒温', '淋浴间', '更衣室', '储物柜', '救生员'],
    rules: '1. 请佩戴泳帽\n2. 入池前请淋浴\n3. 禁止跳水\n4. 儿童需家长陪同',
    status: 'available',
    createTime: db.serverDate(),
    updateTime: db.serverDate()
  },
  {
    name: '乒乓球室',
    type: 'table_tennis',
    typeName: '乒乓球',
    description: '配备6张标准乒乓球台，空调开放。',
    location: 'A栋3楼',
    capacity: 12,
    price: 20,
    priceUnit: '元/小时',
    openTime: '08:00',
    closeTime: '22:00',
    images: [],
    facilities: ['空调', '照明', '球拍租借'],
    rules: '1. 请爱护球台\n2. 可租借球拍（5元/副）',
    status: 'available',
    createTime: db.serverDate(),
    updateTime: db.serverDate()
  },
  {
    name: '健身房',
    type: 'gym',
    typeName: '健身房',
    description: '配备各类健身器材，包括跑步机、动感单车、力量训练区等。',
    location: 'E栋1楼',
    capacity: 30,
    price: 30,
    priceUnit: '元/次',
    openTime: '06:00',
    closeTime: '23:00',
    images: [],
    facilities: ['空调', '淋浴间', '更衣室', '储物柜', '饮水机'],
    rules: '1. 请穿运动服装\n2. 使用器材后请归位\n3. 大重量训练请有人保护',
    status: 'available',
    createTime: db.serverDate(),
    updateTime: db.serverDate()
  },
  {
    name: '网球场',
    type: 'tennis',
    typeName: '网球场',
    description: '室外硬地网球场，符合国际标准。夜间有灯光照明。',
    location: 'F栋户外',
    capacity: 4,
    price: 80,
    priceUnit: '元/小时',
    openTime: '06:00',
    closeTime: '22:00',
    images: [],
    facilities: ['照明', '观众席', '休息区'],
    rules: '1. 请穿网球鞋\n2. 雨天暂停开放',
    status: 'available',
    createTime: db.serverDate(),
    updateTime: db.serverDate()
  },
  {
    name: '瑜伽室',
    type: 'yoga',
    typeName: '瑜伽室',
    description: '安静舒适的瑜伽练习空间，提供瑜伽垫和辅助器材。',
    location: 'E栋2楼',
    capacity: 15,
    price: 25,
    priceUnit: '元/次',
    openTime: '07:00',
    closeTime: '21:00',
    images: [],
    facilities: ['空调', '镜子', '瑜伽垫', '更衣室'],
    rules: '1. 请保持安静\n2. 请勿穿鞋入内\n3. 请提前10分钟到场',
    status: 'available',
    createTime: db.serverDate(),
    updateTime: db.serverDate()
  },
  {
    name: '足球场（维护中）',
    type: 'football',
    typeName: '足球场',
    description: '标准11人制足球场，天然草坪。目前正在进行草坪维护。',
    location: 'G区户外',
    capacity: 22,
    price: 500,
    priceUnit: '元/场',
    openTime: '08:00',
    closeTime: '20:00',
    images: [],
    facilities: ['照明', '更衣室', '观众席'],
    rules: '1. 请穿足球鞋\n2. 禁止携带钉鞋',
    status: 'maintenance',
    createTime: db.serverDate(),
    updateTime: db.serverDate()
  }
]

// 停车配置数据
const parkingConfigData = {
  totalSpaces: 200,
  availableSpaces: 180,
  visitorSpaces: 50,
  reservableSpaces: 30,
  maxReserveDays: 7,
  maxReserveHours: 4,
  rules: '1. 请按规定位置停放\n2. 访客请提前登记\n3. 预约车位请准时到达\n4. 超时占用将取消预约资格',
  openTime: '00:00',
  closeTime: '24:00',
  createTime: db.serverDate(),
  updateTime: db.serverDate()
}

// 示例用户数据
const usersData = [
  {
    openid: 'test_admin_openid_001',
    nickName: '管理员张三',
    avatarUrl: '',
    phone: '13800138001',
    isAdmin: true,
    createTime: db.serverDate(),
    updateTime: db.serverDate()
  },
  {
    openid: 'test_user_openid_001',
    nickName: '用户李四',
    avatarUrl: '',
    phone: '13800138002',
    isAdmin: false,
    createTime: db.serverDate(),
    updateTime: db.serverDate()
  },
  {
    openid: 'test_user_openid_002',
    nickName: '用户王五',
    avatarUrl: '',
    phone: '13800138003',
    isAdmin: false,
    createTime: db.serverDate(),
    updateTime: db.serverDate()
  }
]

// 示例预约数据
const generateBookingsData = (venueIds, userOpenids) => {
  const today = new Date()
  const bookings = []
  
  // 生成一些历史预约
  for (let i = 0; i < 5; i++) {
    const pastDate = new Date(today)
    pastDate.setDate(pastDate.getDate() - i - 1)
    const dateStr = pastDate.toISOString().split('T')[0]
    
    bookings.push({
      odid: userOpenids[i % 2 === 0 ? 1 : 2],
      venueId: venueIds[i % venueIds.length],
      venueName: venuesData[i % venuesData.length].name,
      date: dateStr,
      timeSlot: `${10 + i}:00-${11 + i}:00`,
      status: 'completed',
      totalPrice: venuesData[i % venuesData.length].price,
      contactName: i % 2 === 0 ? '李四' : '王五',
      contactPhone: i % 2 === 0 ? '13800138002' : '13800138003',
      remark: '测试历史预约',
      createTime: db.serverDate(),
      updateTime: db.serverDate()
    })
  }
  
  // 生成一些待处理的预约
  const futureDate = new Date(today)
  futureDate.setDate(futureDate.getDate() + 1)
  const futureDateStr = futureDate.toISOString().split('T')[0]
  
  bookings.push({
    openid: userOpenids[1],
    venueId: venueIds[0],
    venueName: venuesData[0].name,
    date: futureDateStr,
    timeSlot: '14:00-15:00',
    status: 'pending',
    totalPrice: venuesData[0].price,
    contactName: '李四',
    contactPhone: '13800138002',
    remark: '明天的篮球场预约',
    createTime: db.serverDate(),
    updateTime: db.serverDate()
  })
  
  bookings.push({
    openid: userOpenids[2],
    venueId: venueIds[2],
    venueName: venuesData[2].name,
    date: futureDateStr,
    timeSlot: '18:00-19:00',
    status: 'approved',
    totalPrice: venuesData[2].price,
    contactName: '王五',
    contactPhone: '13800138003',
    remark: '羽毛球场预约已通过',
    createTime: db.serverDate(),
    updateTime: db.serverDate()
  })
  
  return bookings
}

// 示例停车记录数据
const generateParkingRecordsData = (userOpenids) => {
  const today = new Date()
  const records = []
  
  // 当前在场车辆
  records.push({
    openid: userOpenids[1],
    plateNumber: '粤A12345',
    ownerName: '李四',
    phone: '13800138002',
    type: 'regular',
    typeName: '日常登记',
    entryTime: db.serverDate(),
    exitTime: null,
    status: 'in',
    remark: '员工车辆',
    createTime: db.serverDate(),
    updateTime: db.serverDate()
  })
  
  records.push({
    openid: userOpenids[2],
    plateNumber: '粤B67890',
    ownerName: '王五',
    phone: '13800138003',
    type: 'regular',
    typeName: '日常登记',
    entryTime: db.serverDate(),
    exitTime: null,
    status: 'in',
    remark: '',
    createTime: db.serverDate(),
    updateTime: db.serverDate()
  })
  
  // 访客预约
  records.push({
    openid: userOpenids[1],
    plateNumber: '粤C11111',
    ownerName: '访客张先生',
    phone: '13900139001',
    type: 'visitor',
    typeName: '访客登记',
    visitReason: '业务洽谈',
    visitee: '李四',
    expectedTime: db.serverDate(),
    status: 'pending',
    remark: '预计下午2点到达',
    createTime: db.serverDate(),
    updateTime: db.serverDate()
  })
  
  // 车位预约
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(9, 0, 0, 0)
  
  records.push({
    openid: userOpenids[2],
    plateNumber: '粤D22222',
    ownerName: '王五',
    phone: '13800138003',
    type: 'reservation',
    typeName: '车位预约',
    reserveDate: tomorrow.toISOString().split('T')[0],
    reserveStartTime: '09:00',
    reserveEndTime: '12:00',
    spaceNumber: 'A-15',
    status: 'reserved',
    remark: '明天上午开会需要车位',
    createTime: db.serverDate(),
    updateTime: db.serverDate()
  })
  
  // 历史记录
  for (let i = 1; i <= 3; i++) {
    const pastDate = new Date(today)
    pastDate.setDate(pastDate.getDate() - i)
    
    records.push({
      openid: userOpenids[1],
      plateNumber: '粤A12345',
      ownerName: '李四',
      phone: '13800138002',
      type: 'regular',
      typeName: '日常登记',
      entryTime: new Date(pastDate.setHours(8, 30, 0, 0)),
      exitTime: new Date(pastDate.setHours(18, 0, 0, 0)),
      status: 'out',
      remark: '',
      createTime: db.serverDate(),
      updateTime: db.serverDate()
    })
  }
  
  return records
}

// 云函数入口函数
exports.main = async (event, context) => {
  const { action = 'all', clear = false } = event
  
  try {
    const results = {
      success: true,
      message: '',
      data: {}
    }
    
    // 如果需要清除现有数据
    if (clear) {
      console.log('清除现有数据...')
      
      const collections = ['venues', 'users', 'bookings', 'parking_records', 'parking_config']
      for (const col of collections) {
        try {
          const countRes = await db.collection(col).count()
          if (countRes.total > 0) {
            // 分批删除
            const batchSize = 100
            const batchTimes = Math.ceil(countRes.total / batchSize)
            for (let i = 0; i < batchTimes; i++) {
              const docs = await db.collection(col).limit(batchSize).get()
              const deletePromises = docs.data.map(doc => 
                db.collection(col).doc(doc._id).remove()
              )
              await Promise.all(deletePromises)
            }
          }
        } catch (e) {
          console.log(`集合 ${col} 不存在或清除失败:`, e.message)
        }
      }
      results.data.cleared = true
    }
    
    // 初始化场馆数据
    if (action === 'all' || action === 'venues') {
      console.log('初始化场馆数据...')
      const venueIds = []
      for (const venue of venuesData) {
        const res = await db.collection('venues').add({ data: venue })
        venueIds.push(res._id)
      }
      results.data.venues = { count: venueIds.length, ids: venueIds }
    }
    
    // 初始化用户数据
    let userOpenids = ['test_admin_openid_001', 'test_user_openid_001', 'test_user_openid_002']
    if (action === 'all' || action === 'users') {
      console.log('初始化用户数据...')
      for (const user of usersData) {
        await db.collection('users').add({ data: user })
      }
      results.data.users = { count: usersData.length }
    }
    
    // 初始化停车配置
    if (action === 'all' || action === 'parking_config') {
      console.log('初始化停车配置...')
      await db.collection('parking_config').add({ data: parkingConfigData })
      results.data.parkingConfig = { initialized: true }
    }
    
    // 初始化预约数据
    if (action === 'all' || action === 'bookings') {
      console.log('初始化预约数据...')
      // 获取场馆ID
      const venuesRes = await db.collection('venues').limit(10).get()
      const venueIds = venuesRes.data.map(v => v._id)
      
      if (venueIds.length > 0) {
        const bookingsData = generateBookingsData(venueIds, userOpenids)
        for (const booking of bookingsData) {
          await db.collection('bookings').add({ data: booking })
        }
        results.data.bookings = { count: bookingsData.length }
      }
    }
    
    // 初始化停车记录
    if (action === 'all' || action === 'parking_records') {
      console.log('初始化停车记录...')
      const parkingRecordsData = generateParkingRecordsData(userOpenids)
      for (const record of parkingRecordsData) {
        await db.collection('parking_records').add({ data: record })
      }
      results.data.parkingRecords = { count: parkingRecordsData.length }
    }
    
    results.message = '测试数据初始化完成'
    return results
    
  } catch (error) {
    console.error('初始化测试数据失败:', error)
    return {
      success: false,
      message: error.message,
      error: error
    }
  }
}
