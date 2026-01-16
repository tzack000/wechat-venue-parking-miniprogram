# Capability: 用户认证 (user-auth)

## ADDED Requirements

### Requirement: 微信授权登录
系统 SHALL 支持用户通过微信授权方式登录小程序。

#### Scenario: 首次登录授权
- **GIVEN** 用户首次使用小程序
- **WHEN** 用户点击"微信登录"按钮
- **THEN** 系统请求微信授权获取用户信息
- **AND** 用户同意后获取昵称、头像等信息
- **AND** 系统创建用户记录
- **AND** 用户进入登录状态

#### Scenario: 静默登录
- **GIVEN** 用户之前已授权登录过
- **WHEN** 用户再次打开小程序
- **THEN** 系统自动获取用户登录态
- **AND** 用户无需再次授权

#### Scenario: 用户拒绝授权
- **WHEN** 用户拒绝微信授权
- **THEN** 系统提示授权必要性
- **AND** 用户可以浏览公开页面但无法使用需登录的功能

### Requirement: 用户信息管理
系统 SHALL 存储和管理用户基本信息。

#### Scenario: 获取用户信息
- **GIVEN** 用户已登录
- **WHEN** 系统需要展示用户信息
- **THEN** 从数据库获取用户的昵称、头像、openid
- **AND** 同时获取用户角色信息（普通用户/管理员）

#### Scenario: 更新用户信息
- **GIVEN** 用户已登录
- **WHEN** 用户更新微信头像或昵称
- **AND** 重新授权
- **THEN** 系统同步更新用户信息

### Requirement: 用户角色区分
系统 SHALL 区分普通用户和管理员角色。

#### Scenario: 普通用户访问
- **GIVEN** 用户为普通用户（isAdmin = false）
- **WHEN** 用户尝试访问管理功能
- **THEN** 系统提示"无权限访问"
- **AND** 拒绝访问

#### Scenario: 管理员访问
- **GIVEN** 用户为管理员（isAdmin = true）
- **WHEN** 用户进入个人中心
- **THEN** 显示"管理入口"菜单
- **AND** 可以访问管理功能

#### Scenario: 设置管理员
- **GIVEN** 需要设置新管理员
- **WHEN** 通过云数据库直接修改用户的 isAdmin 字段
- **THEN** 该用户获得管理员权限

### Requirement: 登录状态维护
系统 SHALL 维护用户的登录状态。

#### Scenario: 登录态有效
- **GIVEN** 用户已登录
- **AND** 登录态未过期
- **WHEN** 用户进行需要登录的操作
- **THEN** 操作正常执行

#### Scenario: 登录态过期
- **GIVEN** 用户的登录态已过期
- **WHEN** 用户进行需要登录的操作
- **THEN** 系统自动尝试静默续期
- **AND** 续期失败则提示用户重新授权

### Requirement: 个人中心
系统 SHALL 提供个人中心页面展示用户信息和功能入口。

#### Scenario: 未登录状态
- **GIVEN** 用户未登录
- **WHEN** 用户进入个人中心
- **THEN** 显示"点击登录"提示
- **AND** 展示登录按钮

#### Scenario: 已登录状态
- **GIVEN** 用户已登录
- **WHEN** 用户进入个人中心
- **THEN** 显示用户头像、昵称
- **AND** 展示功能菜单：我的预约、我的停车记录
- **AND** 管理员额外显示"管理入口"

#### Scenario: 退出登录
- **GIVEN** 用户已登录
- **WHEN** 用户点击"退出登录"
- **THEN** 清除本地登录态
- **AND** 返回未登录状态
