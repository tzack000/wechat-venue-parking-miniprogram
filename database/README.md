# 数据库集合设计

## 集合列表

### 1. users - 用户信息

```json
{
  "_id": "自动生成",
  "openid": "微信openid",
  "nickName": "用户昵称",
  "avatarUrl": "头像URL",
  "phone": "手机号（可选）",
  "isAdmin": false,
  "createTime": "创建时间",
  "updateTime": "更新时间"
}
```

**索引**:
- `openid` (唯一)

**权限规则**:
```json
{
  "read": "auth.openid == doc.openid || doc.isAdmin == true",
  "write": "auth.openid == doc.openid"
}
```

### 2. venues - 场馆信息

```json
{
  "_id": "自动生成",
  "name": "场馆名称",
  "type": "场馆类型：basketball/badminton/tennis/swimming/gym/football/table_tennis/yoga/other",
  "typeName": "类型中文名",
  "description": "场馆描述",
  "location": "场馆位置",
  "capacity": 10,
  "images": ["图片URL数组"],
  "facilities": ["设施列表"],
  "rules": "使用规则",
  "price": 100,
  "priceUnit": "元/小时",
  "openTime": "08:00",
  "closeTime": "22:00",
  "status": "状态：available/maintenance/disabled",
  "createTime": "创建时间",
  "updateTime": "更新时间"
}
```

**索引**:
- `type`
- `status`

**权限规则**:
```json
{
  "read": true,
  "write": false
}
```

### 3. bookings - 预约记录

```json
{
  "_id": "自动生成",
  "openid": "用户openid",
  "venueId": "场馆ID",
  "venueName": "场馆名称（冗余）",
  "date": "预约日期 YYYY-MM-DD",
  "timeSlot": "时间段 HH:mm-HH:mm",
  "status": "状态：pending/approved/rejected/cancelled/completed",
  "totalPrice": 100,
  "contactName": "联系人姓名",
  "contactPhone": "联系人电话",
  "remark": "备注",
  "rejectReason": "拒绝原因",
  "createTime": "创建时间",
  "updateTime": "更新时间"
}
```

**索引**:
- `openid`
- `venueId`
- `date`
- `status`
- 复合索引: `venueId + date + timeSlot`

**权限规则**:
```json
{
  "read": "auth.openid == doc.openid",
  "write": "auth.openid == doc.openid"
}
```

### 4. parking_records - 停车登记记录

```json
{
  "_id": "自动生成",
  "openid": "用户openid",
  "plateNumber": "车牌号",
  "ownerName": "车主姓名",
  "phone": "联系电话",
  "type": "类型：regular/visitor/reservation",
  "typeName": "类型中文名",
  "visitReason": "来访事由（访客）",
  "visitee": "被访人（访客）",
  "expectedTime": "预计到达时间（访客）",
  "reserveDate": "预约日期（车位预约）",
  "reserveStartTime": "预约开始时间",
  "reserveEndTime": "预约结束时间",
  "spaceNumber": "车位号",
  "status": "状态：pending/in/out/reserved/cancelled/expired",
  "entryTime": "入场时间",
  "exitTime": "出场时间",
  "remark": "备注",
  "createTime": "创建时间",
  "updateTime": "更新时间"
}
```

**索引**:
- `openid`
- `plateNumber`
- `status`
- `type`
- `createTime`

**权限规则**:
```json
{
  "read": "auth.openid == doc.openid",
  "write": "auth.openid == doc.openid"
}
```

### 5. parking_config - 停车配置

```json
{
  "_id": "自动生成或固定为config",
  "totalSpaces": 200,
  "availableSpaces": 180,
  "visitorSpaces": 50,
  "reservableSpaces": 30,
  "maxReserveDays": 7,
  "maxReserveHours": 4,
  "rules": "停车规则说明",
  "openTime": "00:00",
  "closeTime": "24:00",
  "createTime": "创建时间",
  "updateTime": "更新时间"
}
```

**权限规则**:
```json
{
  "read": true,
  "write": false
}
```

---

## 测试数据

### 方式一：使用云函数初始化（推荐）

1. 在微信开发者工具中，右键点击 `cloudfunctions/initTestData` 目录
2. 选择"上传并部署：云端安装依赖"
3. 部署完成后，在云开发控制台调用该云函数：

```javascript
// 初始化所有测试数据（会先清除现有数据）
wx.cloud.callFunction({
  name: 'initTestData',
  data: {
    action: 'all',  // 可选：'all', 'venues', 'users', 'bookings', 'parking_records', 'parking_config'
    clear: true     // 是否先清除现有数据
  }
}).then(res => {
  console.log('测试数据初始化结果:', res.result)
})
```

### 方式二：手动导入 JSON 文件

1. 打开云开发控制台 -> 数据库
2. 选择对应的集合
3. 点击"导入"按钮
4. 选择 `database/test_data/` 目录下对应的 JSON 文件：
   - `venues.json` - 10个场馆数据
   - `users.json` - 3个用户数据（含1个管理员）
   - `parking_config.json` - 停车配置
   - `parking_records.json` - 7条停车记录
   - `bookings.json` - 8条预约记录

**注意**：bookings.json 中的 `venueId` 是占位符，导入后需要手动替换为实际的场馆 `_id`。

---

## 测试数据说明

### 场馆数据（10个）

| 名称 | 类型 | 价格 | 位置 | 状态 |
|------|------|------|------|------|
| 篮球场A | basketball | 100元/小时 | A栋1楼 | 可用 |
| 篮球场B | basketball | 60元/小时 | B栋户外 | 可用 |
| 羽毛球馆1号场 | badminton | 50元/小时 | C栋2楼 | 可用 |
| 羽毛球馆2号场 | badminton | 50元/小时 | C栋2楼 | 可用 |
| 游泳馆 | swimming | 40元/次 | D栋负1楼 | 可用 |
| 乒乓球室 | table_tennis | 20元/小时 | A栋3楼 | 可用 |
| 健身房 | gym | 30元/次 | E栋1楼 | 可用 |
| 网球场 | tennis | 80元/小时 | F栋户外 | 可用 |
| 瑜伽室 | yoga | 25元/次 | E栋2楼 | 可用 |
| 足球场（维护中） | football | 500元/场 | G区户外 | 维护中 |

### 用户数据（3个）

| 昵称 | OpenID | 手机号 | 角色 |
|------|--------|--------|------|
| 管理员张三 | test_admin_openid_001 | 13800138001 | 管理员 |
| 用户李四 | test_user_openid_001 | 13800138002 | 普通用户 |
| 用户王五 | test_user_openid_002 | 13800138003 | 普通用户 |

### 停车记录（7条）

| 车牌号 | 类型 | 状态 | 说明 |
|--------|------|------|------|
| 粤A12345 | 日常登记 | 在场 | 李四的车 |
| 粤B67890 | 日常登记 | 在场 | 王五的车 |
| 粤C11111 | 访客登记 | 待确认 | 张先生来访 |
| 粤D22222 | 车位预约 | 已预约 | 明天的预约 |
| 粤A12345 | 日常登记 | 已出场 | 历史记录x3 |

### 预约记录（8条）

| 场馆 | 日期 | 时段 | 状态 | 用户 |
|------|------|------|------|------|
| 篮球场A | 1月15日 | 10:00-11:00 | 已完成 | 李四 |
| 篮球场B | 1月14日 | 11:00-12:00 | 已完成 | 王五 |
| 羽毛球馆1号场 | 1月13日 | 12:00-13:00 | 已完成 | 李四 |
| 羽毛球馆2号场 | 1月12日 | 13:00-14:00 | 已完成 | 王五 |
| 游泳馆 | 1月11日 | 14:00-15:00 | 已完成 | 李四 |
| 篮球场A | 1月17日 | 14:00-15:00 | 待审核 | 李四 |
| 羽毛球馆1号场 | 1月17日 | 18:00-19:00 | 已通过 | 王五 |
| 乒乓球室 | 1月18日 | 15:00-16:00 | 待审核 | 李四 |

---

## 在云开发控制台创建集合

1. 登录微信开发者工具
2. 打开云开发控制台（点击工具栏"云开发"按钮）
3. 进入数据库管理
4. 点击"+"创建以下5个集合：
   - `users`
   - `venues`
   - `bookings`
   - `parking_records`
   - `parking_config`
5. 为每个集合设置相应的权限规则

---

## 设置管理员

真实环境中，设置管理员的方法：

```javascript
// 方法1：在云开发控制台手动修改
// 找到 users 集合中的用户记录，将 isAdmin 改为 true

// 方法2：通过云函数设置
// 在云函数中执行：
const db = cloud.database()
await db.collection('users').where({
  openid: '目标用户的openid'
}).update({
  data: {
    isAdmin: true,
    updateTime: db.serverDate()
  }
})
```

---

## 数据库权限配置示例

在云开发控制台，每个集合的"权限设置"中配置：

**users 集合**:
```json
{
  "read": "doc.openid == auth.openid || doc.isAdmin == true",
  "write": "doc.openid == auth.openid"
}
```

**venues 集合**:
```json
{
  "read": true,
  "write": false
}
```

**bookings 集合**:
```json
{
  "read": "doc.openid == auth.openid",
  "write": "doc.openid == auth.openid"
}
```

**parking_records 集合**:
```json
{
  "read": "doc.openid == auth.openid",
  "write": "doc.openid == auth.openid"
}
```

**parking_config 集合**:
```json
{
  "read": true,
  "write": false
}
```
