// 云函数入口文件 - 用户模块
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const usersCollection = db.collection('users')

// 云函数入口函数
exports.main = async (event, context) => {
  const { action } = event
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  switch (action) {
    case 'getOpenid':
      return await getOpenid(openid)
    case 'login':
      return await login(openid, event.userInfo)
    case 'getUserInfo':
      return await getUserInfo(openid)
    case 'updateUserInfo':
      return await updateUserInfo(openid, event.userInfo)
    default:
      return {
        success: false,
        message: '未知操作'
      }
  }
}

// 获取openid并检查用户是否已注册
async function getOpenid(openid) {
  try {
    // 查询用户是否存在
    const userRes = await usersCollection.where({
      _openid: openid
    }).get()

    return {
      success: true,
      openid: openid,
      userInfo: userRes.data.length > 0 ? userRes.data[0] : null
    }
  } catch (err) {
    console.error('获取openid失败:', err)
    return {
      success: false,
      message: '获取用户信息失败'
    }
  }
}

// 用户登录（创建或更新用户）
async function login(openid, userInfo) {
  try {
    if (!userInfo) {
      return {
        success: false,
        message: '用户信息不能为空'
      }
    }

    // 查询用户是否存在
    const userRes = await usersCollection.where({
      _openid: openid
    }).get()

    const now = new Date()
    let savedUserInfo

    if (userRes.data.length > 0) {
      // 用户已存在，更新信息
      await usersCollection.where({
        _openid: openid
      }).update({
        data: {
          nickName: userInfo.nickName,
          avatarUrl: userInfo.avatarUrl,
          updateTime: now
        }
      })
      
      savedUserInfo = {
        ...userRes.data[0],
        nickName: userInfo.nickName,
        avatarUrl: userInfo.avatarUrl,
        updateTime: now
      }
    } else {
      // 新用户，创建记录
      const newUser = {
        _openid: openid,
        nickName: userInfo.nickName,
        avatarUrl: userInfo.avatarUrl,
        phone: '',
        isAdmin: false,
        createTime: now,
        updateTime: now
      }
      
      const addRes = await usersCollection.add({
        data: newUser
      })
      
      savedUserInfo = {
        _id: addRes._id,
        ...newUser
      }
    }

    return {
      success: true,
      openid: openid,
      userInfo: savedUserInfo
    }
  } catch (err) {
    console.error('登录失败:', err)
    return {
      success: false,
      message: '登录失败'
    }
  }
}

// 获取用户信息
async function getUserInfo(openid) {
  try {
    const userRes = await usersCollection.where({
      _openid: openid
    }).get()

    if (userRes.data.length === 0) {
      return {
        success: false,
        message: '用户不存在'
      }
    }

    return {
      success: true,
      userInfo: userRes.data[0]
    }
  } catch (err) {
    console.error('获取用户信息失败:', err)
    return {
      success: false,
      message: '获取用户信息失败'
    }
  }
}

// 更新用户信息
async function updateUserInfo(openid, userInfo) {
  try {
    const updateData = {
      updateTime: new Date()
    }
    
    if (userInfo.nickName) updateData.nickName = userInfo.nickName
    if (userInfo.avatarUrl) updateData.avatarUrl = userInfo.avatarUrl
    if (userInfo.phone) updateData.phone = userInfo.phone

    await usersCollection.where({
      _openid: openid
    }).update({
      data: updateData
    })

    // 获取更新后的用户信息
    const userRes = await usersCollection.where({
      _openid: openid
    }).get()

    return {
      success: true,
      userInfo: userRes.data[0]
    }
  } catch (err) {
    console.error('更新用户信息失败:', err)
    return {
      success: false,
      message: '更新用户信息失败'
    }
  }
}
