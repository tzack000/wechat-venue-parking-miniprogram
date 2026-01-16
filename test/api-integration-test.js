/**
 * API 集成测试 - 验证 api.js 正确切换 Mock 模式
 */

// 模拟微信小程序环境
const storage = {}
global.wx = {
  getStorageSync: (key) => storage[key],
  setStorageSync: (key, value) => { storage[key] = value },
  removeStorageSync: (key) => { delete storage[key] },
  getStorageInfoSync: () => ({ keys: Object.keys(storage) }),
  cloud: {
    callFunction: () => Promise.reject(new Error('云函数不应被调用'))
  }
}

// 测试 Mock 模式
global.getApp = () => ({
  globalData: { useMock: true }
})

const api = require('../miniprogram/utils/api.js')

async function testApiIntegration() {
  console.log('========================================')
  console.log('API 集成测试 - Mock 模式切换')
  console.log('========================================\n')
  
  let passed = 0
  let failed = 0

  // 测试 1: Mock 模式下场馆列表
  try {
    const res = await api.venueApi.getList()
    if (res.success && res.data.length > 0) {
      console.log('✓ venueApi.getList 使用 Mock API')
      passed++
    } else {
      throw new Error('返回数据异常')
    }
  } catch (err) {
    console.log('✗ venueApi.getList 失败:', err.message)
    failed++
  }

  // 测试 2: Mock 模式下预约列表
  try {
    const res = await api.bookingApi.getMyList()
    if (res.success) {
      console.log('✓ bookingApi.getMyList 使用 Mock API')
      passed++
    } else {
      throw new Error('返回失败')
    }
  } catch (err) {
    console.log('✗ bookingApi.getMyList 失败:', err.message)
    failed++
  }

  // 测试 3: Mock 模式下停车状态
  try {
    const res = await api.parkingApi.getParkingStatus()
    if (res.success && res.data.totalSpaces !== undefined) {
      console.log('✓ parkingApi.getParkingStatus 使用 Mock API')
      passed++
    } else {
      throw new Error('返回数据异常')
    }
  } catch (err) {
    console.log('✗ parkingApi.getParkingStatus 失败:', err.message)
    failed++
  }

  // 测试 4: Mock 模式下用户登录
  try {
    const res = await api.userApi.login({ nickName: '集成测试用户' })
    if (res.success && res.userInfo.nickName === '集成测试用户') {
      console.log('✓ userApi.login 使用 Mock API')
      passed++
    } else {
      throw new Error('返回数据异常')
    }
  } catch (err) {
    console.log('✗ userApi.login 失败:', err.message)
    failed++
  }

  // 测试 5: 确保云函数没有被调用（Mock 模式下）
  try {
    // 如果调用了云函数，会抛出 "云函数不应被调用" 错误
    await api.venueApi.getDetail('venue_001')
    console.log('✓ Mock 模式下未调用云函数')
    passed++
  } catch (err) {
    if (err.message === '云函数不应被调用') {
      console.log('✗ Mock 模式下错误地调用了云函数')
      failed++
    } else {
      console.log('✓ Mock 模式下未调用云函数')
      passed++
    }
  }

  console.log('\n========================================')
  console.log(`集成测试完成: ${passed} 通过, ${failed} 失败`)
  console.log('========================================')

  if (failed > 0) {
    process.exit(1)
  }
}

testApiIntegration().catch(err => {
  console.error('测试运行错误:', err)
  process.exit(1)
})
