# Product Requirements Document (PRD) - Jira Dashboard

## 1. Overview
Dashboard theo dõi hiệu suất và tiến độ dự án (Jira) cho Team Lead/PM. Tập trung vào tính minh bạch, chính xác và giao diện tối giản (Minimalist).

## 2. Tech Stack
- **Framework**: Next.js 16 (App Router), React 19.
- **UI/UX**: Tailwind CSS 4, shadcn/ui, Recharts.
- **Infrastructure**: Docker & Docker Compose.
- **API**: Jira REST API v3 (JQL & Worklog endpoints).
- **Auth**: NextAuth.js (Jira OAuth 2.0).
- **Animation**: Framer Motion.

## 3. Key Features

### 3.1 Dashboard Overview (`/`)
- **Stat Cards**: Active Projects, Open Tasks, Critical Bugs, Weekly Team Hours.
- **Charts**: Team Workload (Bar), Activity Stream (Live updates).
- **Filter**: Dropdown dự án (Default: `[TVT] PAYDAES`).

### 3.2 Member Report & Performance (`/resources/[userId]`)
**Chiến lược (Core Logic)**: Đánh giá dựa trên **Worklog** (những gì thực làm) thay vì chỉ **Assignee** (những gì được giao).

#### A. KPIs (Chỉ số chính)
| Metric | Description | Logic |
|:---|:---|:---|
| **Total Hours** | Tổng giờ làm thực tế | Sum(`worklog.timeSpent`) từ tập task đã tham gia. |
| **Avg Time/Task** | Tốc độ trung bình | `Total Hours` / `Total Completed Tasks`. |
| **Avg Bug Fix** | Tốc độ fix bug | Avg(`ResolutionDate` - `CreatedDate`) cho Bug. |
| **Punctuality** | Độ đúng hạn | % Task hoàn thành trước hoặc đúng Due Date. |
| **Completed** | Số lượng hoàn thành | Tổng số task có trạng thái "Done". |

*Lưu ý: Hiển thị công thức tính cụ thể trên UI để đảm bảo tính minh bạch.*

#### B. Charts (Biểu đồ)
1.  **Weekly Tasks (Bar)**: Số task hoàn thành theo tuần.
2.  **Weekly Hours (Area)**: Tổng giờ log theo tuần (thể hiện sự ổn định).
3.  **Efficiency Radar**: Đánh giá đa chiều (Volume, Speed, Quality, Punctuality, Consistency).

#### C. Detail Tables (Bảng dữ liệu)
1.  **Worklog History**: Lịch sử log work chi tiết (Ngày, Task, Giờ, Diễn giải).
2.  **Participated Tasks**: Danh sách task thành viên đó đã tham gia/đóng góp.

## 4. Technical Concepts
- **JQL Search**: Tìm kiếm task linh hoạt.
4.  **Dual-Query Strategy**: Kết hợp query theo Assignee và query theo Worklog Author để lấy dữ liệu toàn diện.
5.  **Performance**: Cache dữ liệu nặng, sử dụng Pagination khi fetch Jira API.

## 5. New Features (Phase 2)
### 5.1 User Permissions & Authentication
- **Login**: Đăng nhập bằng tài khoản Jira (OAuth 2.0) thay vì nhập Token thủ công.
- **Auto-Token**: Tự động lấy Access Token từ session đăng nhập để gọi API.

### 5.2 Role-based Access Control & Reporting
Phân quyền chi tiết về hiển thị dữ liệu:

#### A. Quyền User (Member)
Chỉ xem dữ liệu của chính mình:
1.  **My Worklogs**:
    - Danh sách Task/Bug đã log work.
    - Chi tiết số giờ + comment diễn giải.
    - Filter theo: Giờ / Ngày.
2.  **My Performance**:
    - Thống kê hiệu suất theo: Ngày / Tuần / Tháng.
    - Biểu đồ trực quan tương ứng.

#### B. Quyền Administrator / Team Leader
Quyền hạn rộng hơn, bao quát toàn team:
1.  **Member Inspection (Soi chi tiết)**:
    - Xem danh sách Task/Bug của *từng user*.
    - **Highlight**: Làm nổi bật phần log work (số giờ + comment) để dễ review.
2.  **Performance Analytics**:
    - Thống kê hiệu suất từng Member (Ngày/Tuần/Tháng).
    - Thống kê tổng thể Team (so sánh hiệu suất, tổng quan).
    - Biểu đồ trực quan đa chiều.

### 5.3 UX & Systems
- **Logout**: Tính năng đăng xuất.
- **Enhanced Loading**: Cải thiện animation loading (mượt mà, chuyên nghiệp hơn).


