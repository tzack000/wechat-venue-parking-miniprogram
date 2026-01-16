# 场馆预约与停车登记微信小程序

## 快速开始

### 1. 下载项目到本地

将整个 `wechat_mini_program` 文件夹下载到你的电脑。

### 2. 微信开发者工具设置

1. 下载并安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 打开微信开发者工具，选择「小程序」
3. 点击「导入项目」
4. 选择项目目录（包含 `project.config.json` 的文件夹）
5. 填写 AppID（可使用测试号，或在 [微信公众平台](https://mp.weixin.qq.com/) 注册获取）

### 3. 开启云开发

1. 在开发者工具中，点击工具栏的「云开发」按钮
2. 点击「开通」，按提示完成云开发环境创建
3. 记住你的**环境ID**（如 `cloud1-xxx`）

### 4. 配置环境ID

修改 `miniprogram/app.js` 文件，将环境ID替换为你的实际值：

```javascript
wx.cloud.init({
  env: 'your-env-id',  // ← 替换为你的云开发环境ID
  traceUser: true
})
```

### 5. 创建数据库集合

在云开发控制台的「数据库」中，创建以下集合：

| 集合名称 | 说明 |
|---------|------|
| `users` | 用户信息 |
| `venues` | 场馆信息 |
| `bookings` | 预约记录 |
| `parking_records` | 停车记录 |
| `parking_config` | 车位配置 |

### 6. 设置数据库权限

为每个集合设置权限规则（在集合详情页的「权限设置」中）：

**users 集合：**
```json
{
  "read": "auth.openid == doc._openid",
  "write": "auth.openid == doc._openid"
}
```

**venues 集合：**
```json
{
  "read": true,
  "write": false
}
```

**bookings / parking_records 集合：**
```json
{
  "read": "auth.openid == doc._openid",
  "write": "auth.openid == doc._openid"
}
```

**parking_config 集合：**
```json
{
  "read": true,
  "write": false
}
```

### 7. 部署云函数

1. 在开发者工具左侧找到 `cloudfunctions` 目录
2. 右键点击每个云函数文件夹（user、venue、booking、parking）
3. 选择「上传并部署：云端安装依赖」

### 8. 初始化数据

在云开发控制台的数据库中添加初始数据：

**初始化车位配置（parking_config 集合）：**
```json
{
  "_id": "config",
  "totalSpaces": 100,
  "maxReserveDays": 3,
  "maxReserveHours": 4,
  "expireMinutes": 120
}
```

**添加测试场馆（venues 集合）：**
```json
{
  "name": "1号篮球场",
  "type": "basketball",
  "description": "标准室内篮球场，木质地板，配备空调",
  "location": "A区体育馆1楼",
  "images": [],
  "facilities": ["更衣室", "淋浴间", "储物柜"],
  "price": 100,
  "priceUnit": "小时",
  "openTime": "08:00",
  "closeTime": "22:00",
  "slotDuration": 60,
  "maxAdvanceDays": 7,
  "minCancelHours": 2,
  "needApproval": false,
  "enabled": true
}
```

### 9. 设置管理员

在 `users` 集合中找到你的用户记录，将 `isAdmin` 字段设为 `true`：

```json
{
  "isAdmin": true
}
```

### 10. 运行预览

点击开发者工具的「编译」按钮，即可在模拟器中预览小程序。

---

## 功能模块

### 场馆预约
- 浏览场馆列表（支持分类筛选）
- 查看场馆详情和时段
- 在线预约场地
- 查看/取消预约

### 停车登记
- 访客车辆登记
- 车位预约
- 进出记录确认
- 历史记录查询

### 管理后台（管理员）
- 场馆管理（增删改查）
- 预约审核
- 停车记录管理

---

## 技术栈

- 前端：微信小程序原生框架
- 后端：微信云开发（云函数 + 云数据库）
- 数据库：云数据库（MongoDB 风格）

---

## 目录结构

```
wechat_mini_program/
├── miniprogram/           # 小程序前端代码
│   ├── pages/             # 页面
│   ├── components/        # 组件
│   ├── utils/             # 工具函数
│   └── images/            # 图片资源
├── cloudfunctions/        # 云函数
│   ├── user/              # 用户模块
│   ├── venue/             # 场馆模块
│   ├── booking/           # 预约模块
│   └── parking/           # 停车模块
├── database/              # 数据库设计文档
└── project.config.json    # 项目配置
```

---

## 常见问题

**Q: 提示「云开发环境未初始化」？**
A: 检查 `app.js` 中的环境ID是否正确配置。

**Q: 云函数调用失败？**
A: 确保云函数已正确部署，可在云开发控制台查看日志。

**Q: 数据库操作权限错误？**
A: 检查集合的权限规则是否正确设置。

**Q: tabBar图标不显示？**
A: 确保 `images` 文件夹中的图标文件存在且路径正确。
