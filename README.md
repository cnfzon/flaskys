# 教學網站系統

基於 Next.js、TypeScript、Tailwind CSS 和 Firebase 開發的教學管理系統。

## 功能特性

### 身份驗證
- Firebase Authentication 集成
- Email 驗證（僅限 @*.org.tw 網域）
- 學生/教師角色區分
- 路由保護中介軟體

### 學生功能
- 個人成績儀表板
- 累積成績折線圖（使用 recharts）
- 匿名排行榜（Top 3 / Top 10 切換）
- PR 值計算
- 期末考權重顯示

### 教師功能
- 班級管理
- CSV 成績導入
- 成績分佈長條圖
- 學生成績編輯
- 高風險學生識別（期末權重過高）

### 教學模式說明
- 成績組成說明
- 期末考策略視覺化

## 技術堆疊

- **框架**: Next.js 16 (App Router)
- **語言**: TypeScript
- **樣式**: Tailwind CSS
- **後端**: Firebase (Auth + Firestore)
- **圖表**: Recharts
- **圖標**: Lucide React
- **CSV 解析**: PapaParse

## 安裝與設定

### 1. 安裝依賴

『`bash
cd my-teaching-app
pnpm install
```

### 2. 設定 Firebase

1. 在 Firebase Console 建立新項目
2. 啟用 Authentication（Email/Password）
3. 建立 Firestore 資料庫
4. 取得 Firebase 設定信息

### 3. 環境變數

建立 `.env.local` 檔案：

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 4. Firestore 資料結構

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

### 5. 運行開發伺服器

『`bash
pnpm dev
```
造訪 [http://localhost:3000](http://localhost:3000)
```

## 使用說明

### 註冊帳號
1. 造訪 `/login` 頁面
2. 點選 "Sign up" 切換到註冊模式
3. 選擇角色（學生/教師）
4. 輸入 @*.org.tw 信箱和密碼
5. 註冊成功後自動跳到對應儀表板

### 學生功能
- 查看個人累積成績
- 查看成績趨勢圖
- 看匿名排行榜
- 查看期末考權重

### 教師功能
- 上傳 CSV 檔案更新學生成績
- 查看班級成績分佈
- 編輯學生成績
- 識別高風險學生

### CSV 格式範例

```csv
studentId,week,points,totalPoints
840921,1,10,10
840921,2,15,25
841005,1,12,12
```

## 開發注意事項

1. **Email 驗證**: 系統僅接受 @*.org.tw 網域的信箱
2. **路由保護**: 未登入使用者只能存取 `/login` 頁面
3. **角色權限**: 學生和教師存取不同的儀表板
4. **資料匿名化**: 排行榜中的學號會被匿名化處理

## 許可證

MIT License