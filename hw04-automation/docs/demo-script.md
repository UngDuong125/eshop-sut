# Kịch bản video demo HW04 (≈ 10 phút, yêu cầu tối thiểu 5 phút)

**Viết cho:** bạn (MSSV 23120034) đọc theo khi quay. Đề yêu cầu **giọng của chính bạn** và **face-cam hoặc terminal chạy `whoami` + `hostname`** – nên đọc bằng lời của mình, đừng đọc nguyên văn nếu thấy gượng; chỉ cần đủ ý.

Feature demo: **FR-17 – Quản lý mã giảm giá (Admin)**, chạy trên **3 browser** → ra **3 báo cáo HTML**.
Phần "sửa lỗi AI" kể trong video: **test đăng nhập admin bị treo 40 giây vì không xử lý hộp thoại alert** (commit `4025b3f`).

## 0. Chuẩn bị trước khi bấm quay (không nằm trong video)
1. Bật 3 server SUT (3 terminal riêng; `run_servers.sh` có đường dẫn cứng của máy khác nên không dùng được):
   `cd backend && node database.js && node server.js` · `cd frontend-web && npm run dev` · `cd frontend-admin && npm run dev`
   (`node database.js` để reset DB về dữ liệu gốc.)
2. Mở sẵn terminal tại thư mục `hw04-automation`, font to (≥ 16pt), nền sáng/tối đều được nhưng phải đọc rõ.
3. Xóa kết quả cũ để video là lần chạy thật: `Remove-Item -Recurse -Force reports\fr17-*, test-results` (PowerShell).
4. Mở sẵn trong VS Code: `data/fr17-coupon-admin.json`, `tests/fr17-coupon-admin.spec.js`, `docs/bug-report.md`.
5. Tắt thông báo, che thông tin cá nhân (email, token). Quay màn hình bằng OBS hoặc Win+G; bật micro; nếu dùng face-cam thì bật thêm webcam.
6. Chạy thử một lần trước khi quay để biết Firefox chạy chậm nhất (~1,5 phút).

## 1. Mở đầu & chứng minh tác giả (0:00 – 0:40)
**Màn hình:** terminal (và face-cam nếu có).
**Gõ:**
```
whoami
hostname
Get-Date -Format o
```
**Nói:** "Xin chào, em là … , MSSV 23120034, lớp … Đây là video demo HW04 môn Kiểm thử phần mềm. Em chạy `whoami` và `hostname` để xác nhận đây là máy của em, và ngày giờ hiện tại là …"

## 2. Giới thiệu hệ thống & phạm vi (0:40 – 1:40)
**Màn hình:** trình duyệt mở web admin `localhost:5174`, đăng nhập admin → tab "Mã Giảm Giá"; sau đó mở nhanh `README.md` của repo.
**Nói:**
- "SUT là EShop, hệ thống bán hàng demo. Em chọn 3 feature giống HW02: FR-04 hồ sơ cá nhân (Pool A), FR-09 mã giảm giá lúc thanh toán (Pool B), FR-17 quản lý mã giảm giá của admin (Pool C)."
- "Trong video này em demo FR-17: admin thêm, xem, xóa mã giảm giá. Spec yêu cầu `code` duy nhất, `discount_value` dương, `min_order_amount` ≥ 0, `max_uses_per_user` ≥ 1."
- "Repo gồm thư mục `tests` chứa 3 file spec, `data` chứa dữ liệu test dạng JSON, `reports` chứa 9 báo cáo HTML (3 feature × 3 browser), `docs` chứa bug report và phân tích."

## 3. Cách dùng AI & thiết kế data-driven (1:40 – 3:10)
**Màn hình:** `data/fr17-coupon-admin.json`, rồi `tests/fr17-coupon-admin.spec.js`.
**Nói:**
- "Em không bảo AI 'viết hết test' một lần. Em dẫn AI từng bước: đọc mã nguồn UI để lấy selector thật, suy ra test case từ SRS, đưa dữ liệu ra file JSON, rồi mới viết spec, chạy, và phân loại từng lỗi là lỗi của hệ thống hay lỗi của test."
- (Chỉ vào JSON) "Dữ liệu nằm ngoài code: 15 ca tạo coupon gồm ca hợp lệ, biên (min = 0, số lần = 1) và ca sai (giá trị 0, âm, phần trăm 150, trùng mã)."
- (Chỉ vào vòng `for (const c of cases)`) "Mỗi dòng dữ liệu sinh ra một test. Giá trị mong đợi lấy từ SRS chứ không lấy từ hành vi của hệ thống."
- (Chỉ vào các `expect`) "Em dùng nhiều kiểu assertion: kiểm tra hiển thị có tự chờ (`toBeVisible`), so sánh giá trị chính xác (`toBe`), khớp regex, kiểm tra dữ liệu thật ở backend qua API, mã trạng thái HTTP, và `expect.soft`."

## 4. Chỗ em đã sửa code do AI sinh (3:10 – 4:30)  ← bắt buộc phải có
**Màn hình:** terminal.
**Gõ:**
```
git show 4025b3f -- tests/fr17-coupon-admin.spec.js
```
**Nói:**
- "Bản AI viết đầu tiên cho test đăng nhập admin sai mật khẩu dùng `page.waitForEvent('dialog')` rồi bấm nút. Khi chạy, test treo 40 giây rồi timeout."
- "Nguyên nhân: hệ thống báo lỗi bằng `alert()`. Khi đã có listener cho sự kiện dialog thì Playwright không tự đóng hộp thoại nữa, nên lệnh `click()` bị chặn. AI không bắt được vì nhìn code thì thấy đúng, chỉ khi chạy mới lộ."
- "Em sửa bằng cách đăng ký `page.on('dialog', …)` để ghi lại nội dung rồi tự đóng, sau đó dùng `expect.poll` để chờ có thông báo. Hai test TC-17-18 và 19 đã chạy trong dưới 1 giây."
- (Tùy chọn, 20 giây) "Ngoài ra em còn phát hiện test FR-09 bị mất giỏ hàng vì `page.goto` tải lại trang, và AI ban đầu chưa kiểm tra biên ngày hết hạn – em đã bổ sung."

## 5. Chạy đa trình duyệt (4:30 – 8:00)
**Màn hình:** terminal.
**Gõ (chạy thấy trực quan một lượt trước, ~30 giây):**
```
npx playwright test tests/fr17-coupon-admin.spec.js --project=chromium --headed
```
**Rồi chạy đầy đủ 3 browser:**
```
node scripts/run-matrix.js fr17
```
**Nói trong lúc chạy (Firefox mất ~1,5 phút – nói chậm, đừng cắt video):**
- "Script này chạy lần lượt Chromium, Firefox và WebKit, mỗi trình duyệt ra một báo cáo HTML riêng trong `reports`."
- "Các test dùng chung một cơ sở dữ liệu SQLite nên em cho chạy tuần tự, một worker. Mỗi test tự tạo mã coupon có hậu tố riêng và tự dọn sau khi chạy."
- "Kết quả mỗi trình duyệt là 17 test đạt và 6 test không đạt. Điều quan trọng là cả ba trình duyệt cho cùng kết quả, nên đây không phải lỗi chập chờn mà là lỗi thật của hệ thống."
**Gõ:** `ls reports` → "Có đủ 3 thư mục fr17-chromium, firefox, webkit."

## 6. Báo cáo HTML & bằng chứng "Run by" (8:00 – 9:20)
**Gõ:** `npx playwright show-report reports/fr17-chromium/html`
**Nói và chỉ trên màn hình:**
- "Ở đầu báo cáo có dòng **Run by: 23120034** và thời gian ISO của lần chạy này, đúng với giờ em vừa chạy."
- "17 đạt, 6 không đạt." Bấm bộ lọc **Failed**, mở **TC-17-05** (giá trị giảm = 0): "Mong đợi là bị từ chối, nhưng mã vẫn được lưu: `Received length: 1`." Bấm vào ảnh chụp màn hình và **View Trace**.
- Mở **TC-17-22**: "User thường mà tạo được coupon, trả về 200 thay vì 403 – lỗi phân quyền nghiêm trọng."
- Làm tương tự nhanh với báo cáo Firefox và WebKit (chỉ cần mở, chỉ vào dòng Run by).

## 7. Bug report, GitHub và nhật ký AI (9:20 – 10:00)
**Màn hình:** `docs/bug-report.md` → trang GitHub Issues → `git log --oneline`.
**Nói:**
- "Tổng cộng 3 feature có 11 lỗi, tất cả đã được ghi ở bug report và tạo thành GitHub Issues kèm ảnh chụp màn hình." (Chỉ vào 1–2 issue, ví dụ BUG-05 giảm giá −3.600.000 ₫ và BUG-11.)
- "Repo có 8 commit sửa file spec, thể hiện quá trình viết rồi sửa."
- "Em có dùng AI (Claude Code) để sinh script; mọi prompt và kết quả được ghi trong AI Audit Report, kèm phần review chỉ ra AI sai ở đâu. Em chịu trách nhiệm với bản script cuối cùng."
- "Cảm ơn thầy cô đã xem."

## Checklist kiểm tra trước khi tải lên YouTube
- [ ] Dài ≥ 5 phút, giọng nói của chính mình, tiếng Việt.
- [ ] Có `whoami` + `hostname` (hoặc face-cam).
- [ ] Thấy rõ chạy 3 browser và báo cáo HTML có "Run by: 23120034".
- [ ] Có kể ít nhất 1 chỗ đã sửa script do AI sinh.
- [ ] Không lộ token/mật khẩu cá nhân.
- [ ] Đăng ở chế độ **Không công khai (Unlisted)**, dán link vào README (`Demo video`).

## Nếu muốn lấy điểm Agent Skill (10 điểm)
Cần nộp thêm một Agent Skill và **một video demo riêng** (YouTube) quay cảnh dùng skill trên một feature hoàn chỉnh. Có thể làm sau.
