/**
 * Mock 模式验证测试脚本
 * 在 Node.js 环境中模拟微信小程序 API 进行测试
 */

// 模拟微信小程序 wx 对象
const storage = {}
global.wx = {
  getStorageSync: (key) => storage[key],
  setStorageSync: (key, value) => { storage[key] = value },
  removeStorageSync: (key) => { delete storage[key] },
  getStorageInfoSync: () => ({ keys: Object.keys(storage) }),
  showToast: () => {},
  showLoading: () => {},
  hideLoading: () => {}
}

// 模拟 getApp
global.getApp = () => ({
  globalData: {
    useMock: true,
    userInfo: null,
    openid: 'mock_openid_001',
    isAdmin: true,
    isLoggedIn: false
  }
})

// 导入 Mock 模块
const mockData = require('../miniprogram/utils/mock-data.js')
const mockApi = require('../miniprogram/utils/mock-api.js')

// 测试结果统计
let passed = 0
let failed = 0

function test(name, fn) {
  try {
    fn()
    console.log(`✓ ${name}`)
    passed++
  } catch (err) {
    console.log(`✗ ${name}`)
    console.log(`  Error: ${err.message}`)
    failed++
  }
}

function assertEqual(actual, expected, message = '') {
  if (actual !== expected) {
    throw new Error(`${message} Expected: ${expected}, Got: ${actual}`)
  }
}

function assertTrue(value, message = '') {
  if (!value) {
    throw new Error(`${message} Expected truthy value, got: ${value}`)
  }
}

async function runTests() {
  console.log('========================================')
  console.log('Mock 模式验证测试')
  console.log('========================================\n')

  // ========== 测试 Mock 数据 ==========
  console.log('--- Mock 数据测试 ---')
  
  test('mockVenues 应包含 5 个场馆', () => {
    assertEqual(mockData.mockVenues.length, 5)
  })

  test('mockVenues 第一个应为篮球场', () => {
    assertEqual(mockData.mockVenues[0].type, 'basketball')
    assertEqual(mockData.mockVenues[0].name, '篮球场A')
  })

  test('mockBookings 应包含 2 条预约', () => {
    assertEqual(mockData.mockBookings.length, 2)
  })

  test('mockParkingRecords 应包含 2 条记录', () => {
    assertEqual(mockData.mockParkingRecords.length, 2)
  })

  // ========== 测试用户 API ==========
  console.log('\n--- 用户 API 测试 ---')

  test('userApi.getOpenid 应返回 mock openid', async () => {
    const res = await mockApi.userApi.getOpenid()
    assertTrue(res.success)
    assertEqual(res.openid, 'mock_openid_001')
  })

  test('userApi.login 应成功创建用户', async () => {
    const res = await mockApi.userApi.login({ nickName: '测试用户', avatarUrl: '/test.png' })
    assertTrue(res.success)
    assertEqual(res.userInfo.nickName, '测试用户')
    assertTrue(res.userInfo.isAdmin) // Mock 模式默认管理员
  })

  // ========== 测试场馆 API ==========
  console.log('\n--- 场馆 API 测试 ---')

  test('venueApi.getList 应返回场馆列表', async () => {
    const res = await mockApi.venueApi.getList()
    assertTrue(res.success)
    assertTrue(res.data.length >= 5)
    assertTrue(res.total >= 5)
  })

  test('venueApi.getList 按类型过滤', async () => {
    const res = await mockApi.venueApi.getList({ type: 'basketball' })
    assertTrue(res.success)
    assertTrue(res.data.every(v => v.type === 'basketball'))
  })

  test('venueApi.getDetail 应返回场馆详情', async () => {
    const res = await mockApi.venueApi.getDetail('venue_001')
    assertTrue(res.success)
    assertEqual(res.data.name, '篮球场A')
  })

  test('venueApi.getTimeSlots 应返回时段列表', async () => {
    const res = await mockApi.venueApi.getTimeSlots('venue_001', '2026-01-20')
    assertTrue(res.success)
    assertTrue(res.data.length > 0)
    assertTrue(res.data[0].startTime !== undefined)
    assertTrue(res.data[0].status !== undefined)
  })

  test('venueApi.add 应添加新场馆', async () => {
    const res = await mockApi.venueApi.add({
      name: '测试场馆',
      type: 'other',
      location: '测试位置',
      price: 50
    })
    assertTrue(res.success)
    assertTrue(res.venueId !== undefined)
  })

  // ========== 测试预约 API ==========
  console.log('\n--- 预约 API 测试 ---')

  test('bookingApi.getMyList 应返回预约列表', async () => {
    const res = await mockApi.bookingApi.getMyList()
    assertTrue(res.success)
    assertTrue(Array.isArray(res.data))
  })

  test('bookingApi.create 应创建预约', async () => {
    const res = await mockApi.bookingApi.create({
      venueId: 'venue_001',
      date: '2026-01-25',
      startTime: '14:00',
      endTime: '15:00',
      userName: '测试用户',
      userPhone: '13800138000'
    })
    assertTrue(res.success)
    assertTrue(res.bookingId !== undefined)
  })

  test('bookingApi.create 重复时段应失败', async () => {
    // 先创建一个预约
    await mockApi.bookingApi.create({
      venueId: 'venue_002',
      date: '2026-01-26',
      startTime: '10:00',
      endTime: '11:00',
      userName: '测试用户',
      userPhone: '13800138000'
    })
    // 尝试预约同一时段
    const res = await mockApi.bookingApi.create({
      venueId: 'venue_002',
      date: '2026-01-26',
      startTime: '10:00',
      endTime: '11:00',
      userName: '另一用户',
      userPhone: '13900139000'
    })
    assertTrue(!res.success)
    assertTrue(res.message.includes('已被预约'))
  })

  test('bookingApi.cancel 应取消预约', async () => {
    // 先创建一个预约
    const createRes = await mockApi.bookingApi.create({
      venueId: 'venue_001',
      date: '2026-01-27',
      startTime: '16:00',
      endTime: '17:00',
      userName: '测试用户',
      userPhone: '13800138000'
    })
    // 取消预约
    const cancelRes = await mockApi.bookingApi.cancel(createRes.bookingId)
    assertTrue(cancelRes.success)
  })

  // ========== 测试停车 API ==========
  console.log('\n--- 停车 API 测试 ---')

  test('parkingApi.getParkingStatus 应返回车位状态', async () => {
    const res = await mockApi.parkingApi.getParkingStatus()
    assertTrue(res.success)
    assertTrue(res.data.totalSpaces !== undefined)
    assertTrue(res.data.availableSpaces !== undefined)
  })

  test('parkingApi.register 应登记车辆', async () => {
    const res = await mockApi.parkingApi.register({
      plateNumber: '京C11111',
      purpose: '测试登记',
      expectedDuration: 60
    })
    assertTrue(res.success)
    assertTrue(res.recordId !== undefined)
    assertTrue(res.qrCode !== undefined)
  })

  test('parkingApi.register 车牌应转大写', async () => {
    const res = await mockApi.parkingApi.register({
      plateNumber: 'jing d22222',
      purpose: '测试',
      expectedDuration: 60
    })
    assertTrue(res.success)
    // 验证存储的数据
    const records = wx.getStorageSync('mock_parking_records')
    const record = records.find(r => r._id === res.recordId)
    assertTrue(record.plateNumber === record.plateNumber.toUpperCase())
  })

  test('parkingApi.reserve 应预约车位', async () => {
    const res = await mockApi.parkingApi.reserve({
      plateNumber: '京E33333',
      reserveDate: '2026-01-20',
      reserveStartTime: '09:00',
      reserveEndTime: '12:00'
    })
    assertTrue(res.success)
    assertTrue(res.recordId !== undefined)
  })

  test('parkingApi.confirmEntry 应确认入场', async () => {
    // 先登记
    const registerRes = await mockApi.parkingApi.register({
      plateNumber: '京F44444',
      purpose: '测试入场'
    })
    // 确认入场
    const entryRes = await mockApi.parkingApi.confirmEntry(registerRes.recordId)
    assertTrue(entryRes.success)
  })

  test('parkingApi.confirmExit 应确认出场并计算时长', async () => {
    // 先登记并入场
    const registerRes = await mockApi.parkingApi.register({
      plateNumber: '京G55555',
      purpose: '测试出场'
    })
    await mockApi.parkingApi.confirmEntry(registerRes.recordId)
    
    // 确认出场
    const exitRes = await mockApi.parkingApi.confirmExit(registerRes.recordId)
    assertTrue(exitRes.success)
    assertTrue(exitRes.duration !== undefined)
  })

  test('parkingApi.getMyRecords 应返回停车记录', async () => {
    const res = await mockApi.parkingApi.getMyRecords()
    assertTrue(res.success)
    assertTrue(Array.isArray(res.data))
  })

  // ========== 测试管理员 API ==========
  console.log('\n--- 管理员 API 测试 ---')

  test('bookingApi.getAllList 应返回所有预约（管理员）', async () => {
    const res = await mockApi.bookingApi.getAllList()
    assertTrue(res.success)
    assertTrue(Array.isArray(res.data))
  })

  test('bookingApi.approve 应审核通过预约', async () => {
    // 创建需要审核的预约（游泳馆需审核）
    const createRes = await mockApi.bookingApi.create({
      venueId: 'venue_003',
      date: '2026-01-28',
      startTime: '10:00',
      endTime: '11:00',
      userName: '测试用户',
      userPhone: '13800138000'
    })
    // 审核通过
    const approveRes = await mockApi.bookingApi.approve(createRes.bookingId)
    assertTrue(approveRes.success)
  })

  test('parkingApi.getAllRecords 应返回所有停车记录（管理员）', async () => {
    const res = await mockApi.parkingApi.getAllRecords()
    assertTrue(res.success)
    assertTrue(Array.isArray(res.data))
  })

  // ========== 输出测试结果 ==========
  console.log('\n========================================')
  console.log(`测试完成: ${passed} 通过, ${failed} 失败`)
  console.log('========================================')

  if (failed > 0) {
    process.exit(1)
  }
}

// 运行测试
runTests().catch(err => {
  console.error('测试运行错误:', err)
  process.exit(1)
})
