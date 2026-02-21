# 项目设置指南

## 快速开始

### 1. 安装依赖

```bash
cd my-teaching-app
pnpm install
```

### 2. Firebase 配置

#### 步骤 1: 创建 Firebase 项目

1. 访问 [Firebase Console](https://console.firebase.google.com/)
2. 点击 "Add project" 创建新项目
3. 按照向导完成项目创建

#### 步骤 2: 启用 Authentication

1. 在 Firebase Console 中，进入 "Authentication"
2. 点击 "Get started"
3. 在 "Sign-in method" 标签页中，启用 "Email/Password"
4. 保存设置

#### 步骤 3: 创建 Firestore 数据库

1. 在 Firebase Console 中，进入 "Firestore Database"
2. 点击 "Create database"
3. 选择 "Start in test mode"（开发阶段）
4. 选择数据库位置（建议选择离您最近的区域）

#### 步骤 4: 获取配置信息

1. 在 Firebase Console 中，进入 "Project settings"（齿轮图标）
2. 滚动到 "Your apps" 部分
3. 点击 Web 图标（</>）添加 Web 应用
4. 注册应用并复制配置信息

#### 步骤 5: 设置环境变量

在项目根目录创建 `.env.local` 文件：

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 3. Firestore 安全规则（开发阶段）

在 Firestore 控制台中，设置以下规则（仅用于开发）：

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.time < timestamp.date(2025, 12, 31);
    }
  }
}
```

**注意**: 生产环境需要设置更严格的安全规则！

### 4. 运行项目

```bash
pnpm dev
```

访问 [http://localhost:3000](http://localhost:3000)

## 测试账号创建

### 创建测试学生账号

1. 访问 `/login` 页面
2. 点击 "Sign up"
3. 输入邮箱（必须以 @*.org.tw 结尾，例如：student@test.org.tw）
4. 输入密码（至少 6 个字符）
5. 选择角色：Student
6. 点击 "Sign Up"

### 创建测试教师账号

1. 访问 `/login` 页面
2. 点击 "Sign up"
3. 输入邮箱（必须以 @*.org.tw 结尾，例如：teacher@test.org.tw）
4. 输入密码（至少 6 个字符）
5. 选择角色：Teacher
6. 点击 "Sign Up"

## 初始化测试数据

### 在 Firestore 中创建测试学生数据

在 Firestore Console 中，创建以下文档：

#### 1. 创建课程 (courses 集合)

```json
{
  "name": "Circuit Theory",
  "code": "EE 201",
  "semester": "Fall Semester 2023",
  "teacherId": "your_teacher_uid",
  "students": [],
  "createdAt": "2023-09-01T00:00:00Z"
}
```

#### 2. 创建学生 (students 集合)

```json
{
  "studentId": "840921",
  "courseId": "your_course_id",
  "displayName": "John Doe",
  "email": "student@test.org.tw",
  "scores": [
    {
      "week": 1,
      "points": 10,
      "cumulativePoints": 10,
      "timestamp": "2023-09-01T00:00:00Z"
    },
    {
      "week": 3,
      "points": 15,
      "cumulativePoints": 25,
      "timestamp": "2023-09-15T00:00:00Z"
    }
  ],
  "totalPoints": 845,
  "currentGrade": "B+",
  "finalExamWeight": 15.5,
  "createdAt": "2023-09-01T00:00:00Z"
}
```

**注意**: 将 `your_teacher_uid` 和 `your_course_id` 替换为实际的值。

## CSV 导入格式

教师可以使用 CSV 文件批量更新学生成绩。CSV 格式如下：

```csv
studentId,week,points,totalPoints
840921,1,10,10
840921,2,15,25
840921,3,20,45
841005,1,12,12
841005,2,18,30
```

字段说明：
- `studentId`: 学生学号
- `week`: 周数（可选）
- `points`: 该周获得的分数（可选）
- `totalPoints`: 累积总分数（如果提供，将直接使用此值）

## 常见问题

### 1. 无法登录

- 检查 Firebase Authentication 是否已启用
- 确认邮箱格式为 @*.org.tw
- 检查浏览器控制台是否有错误

### 2. 数据无法加载

- 检查 Firestore 数据库是否已创建
- 确认安全规则允许读写
- 检查环境变量是否正确设置

### 3. 图表不显示

- 确认 recharts 已正确安装
- 检查数据格式是否正确
- 查看浏览器控制台错误信息

## 下一步

- 设置生产环境的安全规则
- 配置 Firebase Hosting 部署
- 添加更多功能（通知、文件上传等）
