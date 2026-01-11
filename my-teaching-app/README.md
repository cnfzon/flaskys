# 教学网站系统

基于 Next.js、TypeScript、Tailwind CSS 和 Firebase 开发的教学管理系统。

## 功能特性

### 身份验证
- Firebase Authentication 集成
- Email 验证（仅限 @*.org.tw 域名）
- 学生/教师角色区分
- 路由保护中间件

### 学生功能
- 个人成绩仪表板
- 累积成绩折线图（使用 recharts）
- 匿名排行榜（Top 3 / Top 10 切换）
- PR 值计算
- 期末考权重显示

### 教师功能
- 班级管理
- CSV 成绩导入
- 成绩分布长条图
- 学生成绩编辑
- 高风险学生识别（期末权重过高）

### 教学模式说明
- 成绩组成说明
- 期末考策略可视化

## 技术栈

- **框架**: Next.js 16 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **后端**: Firebase (Auth + Firestore)
- **图表**: Recharts
- **图标**: Lucide React
- **CSV 解析**: PapaParse

## 安装与设置

### 1. 安装依赖

```bash
cd my-teaching-app
pnpm install
```

### 2. 配置 Firebase

1. 在 Firebase Console 创建新项目
2. 启用 Authentication（Email/Password）
3. 创建 Firestore 数据库
4. 获取 Firebase 配置信息

### 3. 环境变量

创建 `.env.local` 文件：

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 4. Firestore 数据结构

#### users 集合
```typescript
{
  uid: string;
  email: string;
  role: 'student' | 'teacher';
  displayName?: string;
  createdAt: Timestamp;
}
```

#### students 集合
```typescript
{
  id: string;
  studentId: string;
  courseId: string;
  displayName?: string;
  email?: string;
  scores: ScoreRecord[];
  totalPoints: number;
  currentGrade?: string;
  finalExamWeight: number;
  prValue?: number;
  rank?: number;
}
```

#### courses 集合
```typescript
{
  id: string;
  name: string;
  code: string;
  semester: string;
  teacherId: string;
  students: string[];
  createdAt: Timestamp;
}
```

### 5. 运行开发服务器

```bash
pnpm dev
```

访问 [http://localhost:3000](http://localhost:3000)

## 项目结构

```
my-teaching-app/
├── app/
│   ├── dashboard/
│   │   ├── student/      # 学生仪表板
│   │   └── teacher/       # 教师仪表板
│   ├── login/            # 登录/注册页面
│   ├── methodology/      # 教学模式说明
│   ├── layout.tsx        # 根布局
│   └── page.tsx          # 首页（重定向到登录）
├── components/
│   ├── auth/
│   │   └── AuthForm.tsx  # 认证表单组件
│   └── Header.tsx        # 导航头部
├── lib/
│   ├── firebase/
│   │   ├── config.ts      # Firebase 配置
│   │   ├── auth.ts        # 认证相关函数
│   │   ├── students.ts    # 学生数据操作
│   │   └── courses.ts     # 课程数据操作
│   └── utils/
│       ├── csvParser.ts   # CSV 解析工具
│       └── calculations.ts # 计算工具函数
├── types/
│   └── index.ts          # TypeScript 类型定义
└── middleware.ts         # Next.js 中间件（路由保护）
```

## 使用说明

### 注册账号
1. 访问 `/login` 页面
2. 点击 "Sign up" 切换到注册模式
3. 选择角色（学生/教师）
4. 输入 @*.org.tw 邮箱和密码
5. 注册成功后自动跳转到对应仪表板

### 学生功能
- 查看个人累积成绩
- 查看成绩趋势图
- 查看匿名排行榜
- 查看期末考权重

### 教师功能
- 上传 CSV 文件更新学生成绩
- 查看班级成绩分布
- 编辑学生成绩
- 识别高风险学生

### CSV 格式示例

```csv
studentId,week,points,totalPoints
840921,1,10,10
840921,2,15,25
841005,1,12,12
```

## 开发注意事项

1. **Email 验证**: 系统仅接受 @*.org.tw 域名的邮箱
2. **路由保护**: 未登录用户只能访问 `/login` 页面
3. **角色权限**: 学生和教师访问不同的仪表板
4. **数据匿名化**: 排行榜中的学号会被匿名化处理

## 许可证

MIT License
