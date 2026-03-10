# Tài liệu Đặc tả Yêu cầu Sản phẩm (PRD): Đánh giá Hiệu suất Thành viên Nhóm

## 1. Tổng quan Sản phẩm
Tính năng Đánh giá Hiệu suất Thành viên Nhóm là một phần mở rộng của AI Jira Dashboard hiện tại. Tính năng này nhằm mục đích cung cấp cho cấp quản lý những thông tin chi tiết có thể hành động và các chỉ số khách quan để đánh giá hiệu suất, hiệu quả và chất lượng công việc cho các vị trí (vai trò) khác nhau (Developer, Tech Lead, QC) dựa trên lịch sử chuyển đổi trạng thái (workflow tracking) trên Jira.

## 2. Mục tiêu & Kỳ vọng
- **Mục tiêu chính**: Tự động tính toán và trực quan hóa các chỉ số hiệu suất cho từng thành viên trong nhóm bằng cách sử dụng lịch sử chuyển đổi trạng thái issue trên Jira (issue transition history).
- **Tiêu chí thành công**: Cấp quản lý có thể xem được thời gian hoàn thành (cycle times), các chỉ số chất lượng và tốc độ phản hồi cho từng vai trò mà không cần thao tác tính toán thủ công.
- **Điểm khác biệt cốt lõi**: Đánh giá hiệu suất bằng văn bản do AI tạo ra, tổng hợp từ dữ liệu định lượng thành các phản hồi định tính.

## 3. Người dùng Mục tiêu
- **Project Managers / Scrum Masters**: Để theo dõi sức khỏe của sprint và xác định các điểm nghẽn (bottleneck).
- **Engineering Managers / QA Leads**: Để đánh giá hiệu suất cá nhân, thực hiện đánh giá năng lực và đưa ra các phản hồi mang tính xây dựng.

## 4. Tính năng & Yêu cầu

### Tính năng Cốt lõi (MVP)
- [ ] **Công cụ Tổng hợp Dữ liệu**: Gọi API và xử lý dữ liệu changelog của issue trên Jira để xác định thời gian gửi/nhận chính xác của các lần chuyển đổi trạng thái.
- [ ] **Theo dõi Cycle Time theo Vai trò**:
  - **Developer**: Tính thời gian từ `TODO` -> `IN PROGRESS` -> `CODE REVIEW` (Thời gian Lập trình / Development Time).
  - **Tech Lead**: Tính thời gian từ `CODE REVIEW` -> `DONE CODE REVIEW` -> `MERGED TO QC` (Thời gian Review).
  - **QC**: Tính thời gian từ `TASK DONE / BUG FIXED` -> `TVT INTERNAL REVIEW` -> `REOPEN` hoặc `CLOSED` (Thời gian Testing).
- [ ] **Chỉ số Chất lượng & Độ chính xác**:
  - **Dev**: Tỉ lệ Pass lần đầu (First Time Pass Rate - Tỉ lệ task pass qua QC mà không bị reopen).
  - **Dev**: Tỉ lệ Reopen khi fix bug.
  - **Tech Lead**: Hiệu quả Review (Số lượng bug bị QC phát hiện sau khi Tech Lead đã approve).
  - **QC**: Tỉ lệ Bug Hợp lệ (Bug hợp lệ so với Invalid/Won't Fix).
- [ ] **Tốc độ phản hồi & Khối lượng công việc (Throughput)**:
  - **Dev / QC / TL**: Tổng số story points hoặc số lượng issue hoàn thành trong mỗi sprint.
  - **TL**: Thời gian tính đến lần Review đầu tiên (Time to First Review).
- [ ] **Dashboard Đánh giá Hiệu suất**: Các biểu đồ trực quan (Biểu đồ cột, Biểu đồ đường) cho các chỉ số trên của từng user theo thời gian.

### Tính năng Bổ sung (Nice-to-have / Post-MVP)
- [ ] **Đánh giá Hiệu suất Tổng hợp bằng AI**: Tạo ra một đoạn văn bản tóm tắt đánh giá hiệu suất của một thành viên trong một khoảng thời gian nhất định dựa trên các chỉ số tính toán được.
- [ ] **So sánh chung với Nhóm (Peer Comparison)**: So sánh ẩn danh các chỉ số của một cá nhân với mức trung bình của toàn nhóm.

## 5. Luồng Người dùng (User Flows)

### Luồng Chính
```
[Chọn User & Khoảng thời gian] → [Lấy Dữ liệu Changelog từ Jira] → [Tính toán Chỉ số] → [Hiển thị Biểu đồ lên Dashboard] → [Tạo Tóm tắt bằng AI (Tùy chọn)]
```

## 6. Kiến trúc Kỹ thuật

### Sơ đồ Hệ thống
```
[Next.js Client] ←→ [Next.js API Routes] ←→ [Jira API (Changelog endpoint)]
                           ↓
                   [Supabase / Postgres (Cache)]
                           ↓
                     [OpenAI API (Summary)]
```

### Logic Trích xuất Dữ liệu
- Gọi Jira API `/rest/api/3/issue/{issueIdOrKey}/changelog` để lấy lịch sử chuyển đổi trạng thái (transition history).
- Map các transition này với tài khoản người dùng và vai trò tùy thuộc vào người được assign (assignee) tại thời điểm diễn ra transition.

## 7. Hướng dẫn UI/UX
- **Sử dụng UI/UX Pro Max Skill (`.claude/skills/ui-ux-pro-max/SKILL.md`)** để tạo ra thiết kế chuyên nghiệp (professional), hiển thị thông tin trực quan. Tận dụng lệnh `--design-system` của skill này để sinh ra các chuẩn UI/UX phù hợp với Dashboard chuyên nghiệp.
- Giao diện cần tuân thủ các nguyên tắc thiết kế tối giản nhưng cao cấp (minimalism & professional), hỗ trợ tốt Light/Dark Mode.
- Sử dụng `recharts` hoặc thư viện biểu đồ tốt nhất được ui-ux-pro-max gợi ý để trực quan hóa Cycle Times và Khối lượng công việc.
- Có các tab hoặc bộ lọc riêng biệt cho "Developer", "Tech Lead", và "QC".
- **Đặc biệt làm nổi bật các điểm bất thường** (ví dụ: thời gian code review quá lâu, tỉ lệ reopen cao chót vót). Các điểm bất thường này phải được thu hút sự chú ý bằng màu sắc (ví dụ: đỏ/cam báo động), các biểu tượng cảnh báo hoặc animation (nhưng phải tuân thủ chuẩn animation của ui-ux-pro-max).
