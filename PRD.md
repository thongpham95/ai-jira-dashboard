# Product Requirements Document (PRD) - Jira Dashboard

## 1. Giới thiệu
Tài liệu này mô tả các yêu cầu cho tính năng "Chi tiết Nhân viên & Phân tích Hiệu suất" (Employee Detail & Performance Analysis) trên Jira Dashboard.
Mục tiêu là cung cấp cho Team Lead / Project Manager cái nhìn sâu sắc về năng suất làm việc của từng thành viên.

## 2. Người dùng mục tiêu
- **User Persona**: Team Lead, Project Manager.
- **Goal**: Đánh giá hiệu suất, theo dõi tiến độ công việc, đảm bảo nhân viên log work đầy đủ và đúng hạn.

## 3. Tính năng chi tiết

### 3.1. Dashbroad chi tiết nhân viên (Member Report Page)

#### A. Các chỉ số KPI (Key Performance Indicators)
Hiển thị 5 thẻ thống kê chính (Stat Cards) ở đầu trang:
1.  **Total Hours Logged (Tổng giờ log)**:
    -   Tổng thời gian đã log (Time Spent) trong khoảng thời gian đã chọn (mặc định 30 ngày).
    -   *Logic*: Sum(`worklog.timeSpent`) từ Jira API.
2.  **Avg Time / Task (Trung bình thời gian / Task)**:
    -   Thời gian trung bình để hoàn thành một task.
    -   *Logic*: `Total Hours Logged` / `Total Completed Tasks`.
3.  **Avg Bug Fix Time (Trung bình thời gian fix bug)**:
    -   Thời gian trung bình từ khi Bug được tạo đến khi Resolved.
    -   *Logic*: Average(`ResolutionDate` - `CreatedDate`) cho IssueType = Bug.
4.  **Punctuality (Độ đúng hạn)**:
    -   Tỷ lệ phần trăm các task hoàn thành đúng hoặc trước Due Date.
    -   *Logic*: `(Số task có ResolutionDate <= DueDate) / (Tổng số task có DueDate đã hoàn thành) * 100`.
5.  **Tasks Completed (Số task hoàn thành)**:
    -   Tổng số task đã hoàn thành trong giai đoạn.

#### B. Biểu đồ phân tích (Analytical Charts)
#### B. Biểu đồ phân tích (Analytical Charts)
1.  **Tasks Completed per Week (Số task hoàn thành theo tuần)**:
    -   Loại biểu đồ: Bar Chart (Cột).
    -   Dữ liệu: Số lượng task có trạng thái "Done" gom nhóm theo tuần (Last 4-8 weeks).
2.  **Hours Logged per Week (Số giờ log theo tuần)**:
    -   Loại biểu đồ: Area Chart (Miền) hoặc Line Chart.
    -   **Logic Mới (Dual-Query)**: Tổng `timeSpentSeconds` từ các **worklog entry riêng biệt** của user (`author = user`) gom nhóm theo tuần. Không dùng tổng `timespent` của issue.
    -   Mục đích: Theo dõi khối lượng công việc thực tế chính xác từng giờ.
3.  **Performance Radar (Biểu đồ Radar đa năng)**:
    -   Loại biểu đồ: Radar / Spider Chart.
    -   Các trục (Axes):
        -   **Punctuality (Đúng hạn)**: Dựa trên Due Date vs Resolution Date của task (Query Delivery).
        -   **Volume (Khối lượng)**: Dựa trên số lượng task hoàn thành (Query Delivery).
        -   **Speed (Tốc độ)**: Dựa trên Cycle Time (Query Delivery).
        -   **Fix Bug**: Hiệu quả fix bug (Query Delivery).
        -   **Consistency (Ổn định)**: Dựa trên độ lệch chuẩn của **Weekly Hours Logged** (Query Worklog).

### 3.4 Báo cáo thành viên (Member Report Detail)
### 3.4 Báo cáo thành viên (Member Report Detail)
- **Worklog-Centric Metrics (Chiến lược mới)**:
    - **Triết lý**: "Performance dựa trên những gì bạn làm (Log Work), không chỉ những gì bạn được giao (Assignee)."
    - **Query duy nhất (Participated Tasks)**: `worklogAuthor = user AND worklogDate >= start`
        - Dùng danh sách issue này để tính TOÀN BỘ chỉ số:
            - **Total Hours**: Tổng giờ log chính xác từ history.
            - **Tasks Worked On**: Tổng số đầu việc đã tham gia.
            - **Tasks Completed**: Số task "Done" trong danh sách đã tham gia.
            - **Punctuality**: Độ đúng hạn của các task đã tham gia.
            - **Consistency**: Độ ổn định của việc log work.
    - **Loại bỏ**: Không dùng `assignee = user` để tính KPI nữa (tránh trường hợp được giao nhưng không làm, hoặc làm giúp người khác mà không được tính).

#### C. Detailed Tables (Bảng chi tiết)
1.  **Worklog History Table (Lịch sử Log Work)**:
    -   **Mục đích**: Liệt kê chi tiết từng lần log work để đối chiếu với tổng số giờ.
    -   **Dữ liệu**: Lấy từ Query A (Worklog Data).
    -   **Cột hiển thị**:
        -   Ngày Log (Started Date).
        -   Task (Key + Summary).
        -   Thời gian (Hours).
        -   Diễn giải (Comment - nếu có).
    -   **Vị trí**: Tab riêng hoặc section bên dưới biểu đồ.

2.  **Participated Tasks Table (Danh sách task đã tham gia)**:
    -   Danh sách các task mà user đã log work vào (Query Worklog).
    -   Thay thế cho bảng "Assigned Tasks".
    -   Cột hiển thị:
        -   ID, Summary, Status.
        -   My Logged Hours (Giờ mình làm).
        -   Total Task Hours (Tổng giờ task).
        -   Due/Done Date.

#### D. Giáo dục người dùng (User Education)
-   **Hiển thị công thức (Metric Formulas)**:
    -   Tại mỗi Stat Card hoặc Section, hiển thị dòng nhỏ (caption) hoặc tooltip mở rộng giải thích cách tính.
    -   Ví dụ: *"Punctuality = (Tasks Resolved ≤ Due Date) / Total Tasks with Due Date"*.
    -   Mục đích: Giúp PM/Member hiểu rõ con số đến từ đâu.

## 4. Yêu cầu kỹ thuật (Non-Functional Requirements)
-   **Tốc độ**: API cần xử lý nhanh, có thể cần cache dữ liệu nếu tính toán KPI tốn nhiều thời gian.
-   **Chính xác**: Dữ liệu lấy trực tiếp từ Jira API (Worklogs, Issue History).
-   **UI/UX**: Giao diện Clean, Minimalist, giống thiết kế tham khảo. Hỗ trợ Dark/Light mode.

## 5. Dữ liệu & Logic tính toán (Data Structures)
-   **Worklogs**: Cần fetch `worklog` từ từng issue hoặc endpoint `/timesheet` (nếu có plugin) hoặc loop qua các issue của user.
    -   *Lưu ý*: Jira API restric số lượng worklog trả về, cần xử lý pagination cẩn thận.
-   **Cycle Time**: Tính từ Log work đầu tiên hoặc Status transition sang "In Progress" đến Status transition sang "Done".

---
*Document created by AI Assistant based on user requirements.*
