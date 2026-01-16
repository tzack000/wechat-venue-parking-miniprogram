// utils/mock-data.js
// 本地测试用 Mock 数据

// 模拟用户数据
const mockUsers = [
  {
    _id: 'user_001',
    _openid: 'mock_openid_001',
    nickName: '测试用户',
    avatarUrl: '/images/default-avatar.png',
    phone: '13800138000',
    isAdmin: true,
    createTime: new Date('2026-01-01'),
    updateTime: new Date('2026-01-01')
  }
]

// 模拟场馆数据
const mockVenues = [
  {
    _id: 'venue_001',
    name: '篮球场A',
    type: 'basketball',
    description: '标准室内篮球场，木地板，配备空调和照明设施。',
    location: 'A栋1楼',
    capacity: 10,
    price: 100,
    priceUnit: '元/小时',
    openTime: '08:00',
    closeTime: '22:00',
    slotDuration: 60,
    needApproval: false,
    enabled: true,
    images: [],
    facilities: ['空调', '照明', '更衣室'],
    createTime: new Date('2026-01-01'),
    updateTime: new Date('2026-01-01')
  },
  {
    _id: 'venue_002',
    name: '羽毛球馆1号场',
    type: 'badminton',
    description: '专业羽毛球场地，PVC运动地板，层高12米。',
    location: 'C栋2楼',
    capacity: 4,
    price: 50,
    priceUnit: '元/小时',
    openTime: '08:00',
    closeTime: '22:00',
    slotDuration: 60,
    needApproval: false,
    enabled: true,
    images: [],
    facilities: ['空调', '照明', '球拍租借'],
    createTime: new Date('2026-01-01'),
    updateTime: new Date('2026-01-01')
  },
  {
    _id: 'venue_003',
    name: '游泳馆',
    type: 'swimming',
    description: '50米标准泳道，恒温水池，配备专业救生员。',
    location: 'D栋负1楼',
    capacity: 50,
    price: 40,
    priceUnit: '元/次',
    openTime: '06:00',
    closeTime: '21:00',
    slotDuration: 60,
    needApproval: true,
    enabled: true,
    images: [],
    facilities: ['恒温', '淋浴间', '更衣室', '救生员'],
    createTime: new Date('2026-01-01'),
    updateTime: new Date('2026-01-01')
  },
  {
    _id: 'venue_004',
    name: '健身房',
    type: 'gym',
    description: '配备各类健身器材，包括跑步机、动感单车等。',
    location: 'E栋1楼',
    capacity: 30,
    price: 30,
    priceUnit: '元/次',
    openTime: '06:00',
    closeTime: '23:00',
    slotDuration: 60,
    needApproval: false,
    enabled: true,
    images: [],
    facilities: ['空调', '淋浴间', '储物柜'],
    createTime: new Date('2026-01-01'),
    updateTime: new Date('2026-01-01')
  },
  {
    _id: 'venue_005',
    name: '网球场',
    type: 'tennis',
    description: '室外硬地网球场，夜间有灯光照明。',
    location: 'F栋户外',
    capacity: 4,
    price: 80,
    priceUnit: '元/小时',
    openTime: '06:00',
    closeTime: '22:00',
    slotDuration: 60,
    needApproval: false,
    enabled: true,
    images: [],
    facilities: ['照明', '休息区'],
    createTime: new Date('2026-01-01'),
    updateTime: new Date('2026-01-01')
  }
]

// 模拟预约数据
const mockBookings = [
  {
    _id: 'booking_001',
    _openid: 'mock_openid_001',
    venueId: 'venue_001',
    venueName: '篮球场A',
    venueType: 'basketball',
    date: '2026-01-20',
    startTime: '10:00',
    endTime: '11:00',
    status: 'confirmed',
    userName: '测试用户',
    userPhone: '13800138000',
    remark: '',
    createTime: new Date('2026-01-15'),
    updateTime: new Date('2026-01-15')
  },
  {
    _id: 'booking_002',
    _openid: 'mock_openid_001',
    venueId: 'venue_002',
    venueName: '羽毛球馆1号场',
    venueType: 'badminton',
    date: '2026-01-18',
    startTime: '14:00',
    endTime: '15:00',
    status: 'pending',
    userName: '测试用户',
    userPhone: '13800138000',
    remark: '约了朋友一起',
    createTime: new Date('2026-01-16'),
    updateTime: new Date('2026-01-16')
  }
]

// 模拟停车记录
const mockParkingRecords = [
  {
    _id: 'parking_001',
    _openid: 'mock_openid_001',
    plateNumber: '京A12345',
    type: 'visitor',
    purpose: '拜访朋友',
    expectedDuration: 120,
    status: 'entered',
    entryTime: new Date('2026-01-16 09:30:00'),
    exitTime: null,
    duration: null,
    qrCode: 'mock_qr_001',
    createTime: new Date('2026-01-16 09:00:00'),
    updateTime: new Date('2026-01-16 09:30:00')
  },
  {
    _id: 'parking_002',
    _openid: 'mock_openid_001',
    plateNumber: '京B67890',
    type: 'reserve',
    purpose: '',
    reserveDate: '2026-01-17',
    reserveStartTime: '10:00',
    reserveEndTime: '12:00',
    status: 'pending',
    entryTime: null,
    exitTime: null,
    duration: null,
    qrCode: 'mock_qr_002',
    createTime: new Date('2026-01-16 10:00:00'),
    updateTime: new Date('2026-01-16 10:00:00')
  }
]

// 模拟停车配置
const mockParkingConfig = {
  _id: 'config',
  totalSpaces: 100,
  updateTime: new Date('2026-01-01')
}

module.exports = {
  mockUsers,
  mockVenues,
  mockBookings,
  mockParkingRecords,
  mockParkingConfig
}
