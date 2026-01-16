// utils/util.js

/**
 * 格式化日期
 * @param {Date|string|number} date 日期对象或时间戳
 * @param {string} format 格式化模板，默认 'YYYY-MM-DD'
 * @returns {string}
 */
const formatDate = (date, format = 'YYYY-MM-DD') => {
  if (!date) return ''
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''
  
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')
  
  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
}

/**
 * 格式化时间为相对时间
 * @param {Date|string|number} date 
 * @returns {string}
 */
const formatRelativeTime = (date) => {
  const now = Date.now()
  const d = new Date(date).getTime()
  const diff = now - d
  
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
  if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
  if (diff < 604800000) return Math.floor(diff / 86400000) + '天前'
  
  return formatDate(date)
}

/**
 * 验证车牌号格式
 * 支持普通车牌和新能源车牌
 * @param {string} plateNumber 
 * @returns {boolean}
 */
const validatePlateNumber = (plateNumber) => {
  if (!plateNumber) return false
  // 普通车牌：省份简称 + 字母 + 5位字母数字
  // 新能源车牌：省份简称 + 字母 + 6位（小型）或 省份简称 + 字母 + 字母 + 5位（大型）
  const pattern = /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领][A-HJ-NP-Z][A-HJ-NP-Z0-9]{4,5}[A-HJ-NP-Z0-9挂学警港澳]$/
  return pattern.test(plateNumber.toUpperCase())
}

/**
 * 显示提示信息
 * @param {string} title 
 * @param {string} icon 'success' | 'error' | 'loading' | 'none'
 */
const showToast = (title, icon = 'none') => {
  wx.showToast({
    title: title,
    icon: icon,
    duration: 2000
  })
}

/**
 * 显示确认对话框
 * @param {string} title 
 * @param {string} content 
 * @returns {Promise<boolean>}
 */
const showConfirm = (title, content) => {
  return new Promise((resolve) => {
    wx.showModal({
      title: title,
      content: content,
      success: (res) => {
        resolve(res.confirm)
      }
    })
  })
}

/**
 * 显示加载中
 * @param {string} title 
 */
const showLoading = (title = '加载中...') => {
  wx.showLoading({
    title: title,
    mask: true
  })
}

/**
 * 隐藏加载中
 */
const hideLoading = () => {
  wx.hideLoading()
}

/**
 * 计算时间差（分钟）
 * @param {Date|string} start 
 * @param {Date|string} end 
 * @returns {number}
 */
const getTimeDiffMinutes = (start, end) => {
  const startTime = new Date(start).getTime()
  const endTime = new Date(end).getTime()
  return Math.floor((endTime - startTime) / 60000)
}

/**
 * 格式化停车时长
 * @param {number} minutes 
 * @returns {string}
 */
const formatDuration = (minutes) => {
  if (minutes < 60) {
    return minutes + '分钟'
  }
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (mins === 0) {
    return hours + '小时'
  }
  return hours + '小时' + mins + '分钟'
}

/**
 * 生成唯一ID
 * @returns {string}
 */
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}

/**
 * 防抖函数
 * @param {Function} fn 
 * @param {number} delay 
 * @returns {Function}
 */
const debounce = (fn, delay = 300) => {
  let timer = null
  return function(...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, args)
    }, delay)
  }
}

/**
 * 节流函数
 * @param {Function} fn 
 * @param {number} interval 
 * @returns {Function}
 */
const throttle = (fn, interval = 300) => {
  let lastTime = 0
  return function(...args) {
    const now = Date.now()
    if (now - lastTime >= interval) {
      lastTime = now
      fn.apply(this, args)
    }
  }
}

/**
 * 预约状态映射
 */
const bookingStatusMap = {
  pending: { text: '待确认', class: 'status-pending' },
  confirmed: { text: '已确认', class: 'status-confirmed' },
  cancelled: { text: '已取消', class: 'status-cancelled' },
  completed: { text: '已完成', class: 'status-completed' }
}

/**
 * 停车状态映射
 */
const parkingStatusMap = {
  pending: { text: '待入场', class: 'status-pending' },
  entered: { text: '已入场', class: 'status-confirmed' },
  exited: { text: '已出场', class: 'status-completed' },
  cancelled: { text: '已取消', class: 'status-cancelled' },
  expired: { text: '已过期', class: 'status-cancelled' }
}

/**
 * 场馆类型映射
 */
const venueTypeMap = {
  basketball: { text: '篮球场', icon: '🏀' },
  badminton: { text: '羽毛球场', icon: '🏸' },
  tennis: { text: '网球场', icon: '🎾' },
  swimming: { text: '游泳池', icon: '🏊' },
  gym: { text: '健身房', icon: '🏋️' },
  football: { text: '足球场', icon: '⚽' },
  tabletennis: { text: '乒乓球', icon: '🏓' },
  other: { text: '其他', icon: '🏟️' }
}

module.exports = {
  formatDate,
  formatRelativeTime,
  validatePlateNumber,
  showToast,
  showConfirm,
  showLoading,
  hideLoading,
  getTimeDiffMinutes,
  formatDuration,
  generateId,
  debounce,
  throttle,
  bookingStatusMap,
  parkingStatusMap,
  venueTypeMap
}
