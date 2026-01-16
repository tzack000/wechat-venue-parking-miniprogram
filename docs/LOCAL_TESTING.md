# 本地测试指南（无需云开发）

本项目支持 Mock 模式，可以在不开通微信云开发的情况下进行本地测试。

## 快速开始

### 1. 确认 Mock 模式已开启

打开 `miniprogram/app.js`，确认第 5 行：

```javascript
const USE_MOCK = true  // 设置为 true 启用本地测试模式
```

### 2. 导入项目到微信开发者工具

1. 打开微信开发者工具
2. 选择「导入项目」
3. 项目目录：选择本项目根目录
4. AppID：可以使用测试号或「使用测试号」选项
5. 点击「导入」

### 3. 开始测试

项目会自动使用本地模拟数据，无需任何配置即可测试所有功能。

---

## Mock 模式说明

### 数据存储

Mock 模式使用微信小程序的本地存储（Storage）来模拟数据库：

| 存储 Key | 说明 |
|---------|------|
| `mock_venues` | 场馆数据 |
| `mock_bookings` | 预约记录 |
| `mock_parking_records` | 停车记录 |
| `mock_parking_config` | 停车配置 |
| `userInfo` | 用户信息 |

### 预置测试数据

Mock 模式自动初始化以下测试数据：

**场馆（5个）：**
- 篮球场A - 100元/小时
- 羽毛球馆1号场 - 50元/小时
- 游泳馆 - 40元/次（需审核）
- 健身房 - 30元/次
- 网球场 - 80元/小时

**预约记录（2条）：**
- 篮球场A 预约 - 已确认
- 羽毛球馆1号场 预约 - 待审核

**停车记录（2条）：**
- 京A12345 访客登记 - 已入场
- 京B67890 车位预约 - 待入场

### 默认用户

Mock 模式下登录后，用户自动设置为**管理员**，可测试所有功能。

---

## 测试流程

### 用户功能测试

1. **登录**
   - 点击底部「我的」Tab
   - 点击「点击登录」或头像区域
   - 允许授权（模拟器中自动完成）

2. **场馆预约**
   - 点击「场馆预约」Tab
   - 浏览场馆列表
   - 选择场馆 → 查看详情
   - 选择日期和时段
   - 填写预约信息 → 提交

3. **停车登记**
   - 点击「停车登记」Tab
   - 输入车牌号（如：京A12345）
   - 填写访问目的
   - 提交登记

4. **查看记录**
   - 在「我的」页面查看预约记录
   - 查看停车记录

### 管理员功能测试

1. **进入管理后台**
   - 确保已登录
   - 在「我的」页面点击「管理后台」

2. **场馆管理**
   - 查看场馆列表
   - 添加新场馆
   - 编辑场馆信息
   - 停用/启用场馆

3. **预约管理**
   - 查看所有预约
   - 审核通过/拒绝预约

4. **停车管理**
   - 查看停车记录
   - 手动登记车辆
   - 确认入场/出场

---

## 常用操作

### 重置测试数据

在控制台执行：

```javascript
// 方法1：通过 app 实例
getApp().resetMockData()

// 方法2：手动清除
wx.clearStorageSync()
```

重启小程序后数据会重新初始化。

### 查看当前数据

在控制台执行：

```javascript
// 查看所有存储
console.log(wx.getStorageInfoSync())

// 查看场馆数据
console.log(wx.getStorageSync('mock_venues'))

// 查看预约数据
console.log(wx.getStorageSync('mock_bookings'))

// 查看停车数据
console.log(wx.getStorageSync('mock_parking_records'))
```

### 修改用户权限

```javascript
// 设置为管理员
let userInfo = wx.getStorageSync('userInfo')
userInfo.isAdmin = true
wx.setStorageSync('userInfo', userInfo)

// 设置为普通用户
userInfo.isAdmin = false
wx.setStorageSync('userInfo', userInfo)
```

修改后需要重新进入页面或重启小程序。

---

## 切换到云开发模式

准备发布时，修改 `miniprogram/app.js` 第 5 行：

```javascript
const USE_MOCK = false  // 关闭 Mock 模式
```

然后确保：
1. 已开通微信云开发
2. 已填写正确的云环境 ID（第 24 行）
3. 已上传所有云函数
4. 已创建数据库集合并导入初始数据

---

## 注意事项

1. **Mock 数据仅存储在本地**
   - 清除小程序数据会丢失所有测试数据
   - 不同设备/模拟器数据不共享

2. **网络延迟模拟**
   - Mock API 模拟了 200-500ms 的网络延迟
   - 可在 `utils/mock-api.js` 中调整 `delay()` 参数

3. **部分功能差异**
   - Mock 模式下并发控制是模拟的，不如真实云数据库事务可靠
   - 二维码为模拟 ID，非真实可扫描的二维码

4. **发布前检查清单**
   - [ ] `USE_MOCK` 已设为 `false`
   - [ ] 云环境 ID 已正确配置
   - [ ] AppID 已替换为正式 AppID
   - [ ] 所有云函数已上传
   - [ ] 数据库集合已创建
