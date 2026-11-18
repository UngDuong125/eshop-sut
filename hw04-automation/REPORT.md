# HW04 – Automation Testing: Báo cáo chính

| | |
|---|---|
| Sinh viên | Ứng Thị Thùy Dương – MSSV **23120034** |
| Môn | CSC13003 – Kiểm thử phần mềm (FIT@HCMUS) |
| SUT | EShop (https://github.com/ttbhanh/eshop-sut), bản chạy local |
| Công cụ | Playwright 1.65.1, Node.js v24.20.0, Playwright HTML reporter |
| Công cụ AI | Claude Code (VS Code), model Claude Sonnet 5.5 – chi tiết ở `docs/ai-audit-log.md` |
| Repo công khai | https://github.com/UngDuong125/eshop-sut (thư mục `hw04-automation/`) |
| Video demo (unlisted) | **TODO (sinh viên): dán link YouTube** |
| Video demo Agent Skill | **TODO (sinh viên): dán link YouTube** |

## 1. Chọn feature

Ba feature giống HW02, mỗi pool một feature:

| Pool | Feature | Lý do chọn | File test | File dữ liệu |
|------|---------|-----------|-----------|--------------|
| A | FR-04 Quản lý hồ sơ cá nhân | Có nhiều biên (độ dài số điện thoại) và có điểm bảo mật (API) | `tests/fr04-profile.spec.js` | `data/fr04-profile.json` |
| B | FR-09 Mã giảm giá khi thanh toán | Có công thức, ngưỡng, ngày hết hạn, giới hạn lượt dùng | `tests/fr09-coupon-checkout.spec.js` | `data/fr09-coupon.json` |
| C | FR-17 Quản lý mã giảm giá (admin) | CRUD, kiểm tra dữ liệu đầu vào, phân quyền | `tests/fr17-coupon-admin.spec.js` | `data/fr17-coupon-admin.json` |

> **TODO (sinh viên):** xác nhận ba feature này trùng với bài HW02 đã nộp (nếu không, nêu lý do ở đây theo §5 của đề).
> Đã kiểm tra không trùng với thành viên khác trong nhóm: **TODO xác nhận**.

FR-09 (checkout, giỏ hàng) và FR-17 (coupon admin) cùng dùng bảng `coupons`; hai bộ test dùng mã có hậu tố riêng theo từng lần chạy nên không đụng nhau.

## 2. Quy trình làm việc với AI (AI-first, từng bước)

Không dùng một prompt chung "viết hết test". Mỗi feature đi qua cùng chuỗi bước, mỗi bước có kiểm tra của tôi:

1. **Đọc SUT:** AI đọc mã giao diện và `server.js` để lấy selector, endpoint, cách đăng nhập (token trong `localStorage`).
2. **Suy ra test case từ SRS**, không từ mã nguồn. Giá trị kỳ vọng ghi cứng theo SRS (ví dụ giảm 10% của 400.000 = 40.000).
3. **Tách dữ liệu ra JSON** (`data/`), spec đọc bằng `loadData()` và sinh mỗi dòng thành một test.
4. **Viết spec**, chạy trên Chromium trước.
5. **Phân loại từng test đỏ:** lỗi của script (sửa) hay lỗi của hệ thống (giữ đỏ, ghi bug). Mỗi lỗi hệ thống được đối chiếu với dòng mã nguồn.
6. **Chạy ma trận 3 feature × 3 trình duyệt** bằng `scripts/run-matrix.js`.
7. **Viết bug report, gap analysis**; mọi prompt ghi vào AI Audit Report.

## 3. Kết quả tự động hóa

### 3.1 Tổng hợp

| Chỉ số | Giá trị |
|--------|---------|
| Số feature | 3 |
| Test case đã tự động hóa | **66** (FR-04: 19, FR-09: 24, FR-17: 23); mỗi feature ≥ 12 |
| Lần chạy trình duyệt | **9** (3 feature × Chromium / Firefox / WebKit) = 9 báo cáo HTML |
| Lượt thực thi test | 198 (66 × 3) |
| Đạt / Không đạt | 129 / 69 (mỗi trình duyệt 43 đạt, 23 không đạt) |
| Flaky / bỏ qua | 0 / 0 – kết quả giống hệt nhau trên cả 3 trình duyệt |
| Số lỗi (bug) khác nhau | **11** |
| Dữ liệu test | 3 file JSON, không có mảng dữ liệu viết cứng trong spec |

"Không đạt" nghĩa là **hệ thống vi phạm SRS**, không phải script hỏng: mọi test đỏ đều truy được đến một dòng mã nguồn của SUT (xem `docs/bug-report.md`).

| Feature | Đạt / Không đạt (mỗi trình duyệt) | Test case không đạt |
|---------|----------------------------------|---------------------|
| FR-04 | 9 / 10 | TC-04-01, 02, 05, 06, 09, 11, 12, 13, 15, 16 |
| FR-09 | 17 / 7 | TC-09-01, 02, 04, 05, 07, 11, 14 |
| FR-17 | 17 / 6 | TC-17-05, 06, 07, 10, 22, 23 |

Báo cáo HTML: `reports/<feature>-<trình duyệt>/html` (9 thư mục). Tiêu đề và header của mỗi báo cáo hiển thị **"Run by: 23120034 | <thời điểm ISO>"**; thông tin này cũng nằm trong `metadata` của cấu hình.

> **TODO (sinh viên):** chạy lại `node scripts/run-matrix.js` trên máy của bạn trước khi nộp để báo cáo mang đúng thời điểm chạy của bạn (đề §11), rồi cập nhật số liệu ở trên nếu khác.

### 3.2 Danh sách test case

**FR-04 – Hồ sơ cá nhân (19)**

| ID | Loại | Nội dung |
|----|------|----------|
| TC-04-01 | positive | SĐT hợp lệ 10 số bắt đầu bằng 0 |
| TC-04-02 | edge | Biên trên: SĐT 11 số |
| TC-04-03 | negative | Biên dưới: SĐT 9 số |
| TC-04-04 | negative | Vượt biên trên: SĐT 12 số |
| TC-04-05 | negative | SĐT 10 số không bắt đầu bằng 0 |
| TC-04-06 | negative | SĐT 9 số không bắt đầu bằng 0 |
| TC-04-07 | negative | SĐT chứa chữ |
| TC-04-08 | negative | SĐT chứa khoảng trắng |
| TC-04-09 | positive | Tên có dấu tiếng Việt |
| TC-04-10 | negative | Tên rỗng (HTML5 required) |
| TC-04-11 | edge | Địa chỉ rất dài (500 ký tự) |
| TC-04-12 | edge | HTML/script trong địa chỉ được lưu dạng văn bản |
| TC-04-13 | edge | Địa chỉ rỗng (không bắt buộc) |
| TC-04-14 | positive | Trường email bị khóa và hiện đúng email tài khoản |
| TC-04-15 | negative/security | User không tự nâng quyền qua `PUT /users/me` |
| TC-04-16 | negative/security | Backend từ chối SĐT sai gửi thẳng vào API |
| TC-04-17 | negative | API hồ sơ yêu cầu xác thực |
| TC-04-18 | negative | Trang hồ sơ khi chưa đăng nhập |
| TC-04-20 | positive | Đăng nhập thật bằng giao diện rồi vào hồ sơ |

**FR-09 – Mã giảm giá khi thanh toán (24)**

| ID | Loại | Nội dung |
|----|------|----------|
| TC-09-01 | positive | SAVE10 (10%) cho đơn 400.000 |
| TC-09-02 | edge | Tổng đơn **bằng** mức tối thiểu phải được áp dụng |
| TC-09-03 | edge | Thấp hơn mức tối thiểu 1 đồng |
| TC-09-04 | edge | Vừa trên mức tối thiểu |
| TC-09-05 | positive | BIGBUY giảm cố định 50.000 tại đúng 500.000 |
| TC-09-06 | edge | BIGBUY ở 499.999 |
| TC-09-07 | positive | VIP100 giảm 100.000 tại ngưỡng 300.000 |
| TC-09-08 | positive | VIP100 trên đơn lớn 1.000.000 |
| TC-09-09 | negative | Mã hết hạn (EXPIRED) |
| TC-09-10 | negative | Mã không tồn tại |
| TC-09-11 | edge | Mã viết thường vẫn được nhận |
| TC-09-12 | edge | Mã có khoảng trắng đầu/cuối được cắt |
| TC-09-13 | edge | Đơn 0 đồng nhỏ hơn mọi ngưỡng |
| TC-09-14 | negative | Khách chưa đăng nhập không được dùng mã |
| TC-09-15 | negative | Hết lượt dùng của user (VIP100 2/2) |
| TC-09-16 | edge | Còn lượt dùng (VIP100 1/2) vẫn áp dụng |
| TC-09-17 | negative | Hết lượt dùng (SAVE10 1/1) |
| TC-09-18 | edge | Ô mã rỗng thì nút "Áp dụng" bị khóa |
| TC-09-19 | edge | Ô mã chỉ có khoảng trắng thì nút bị khóa |
| TC-09-20 | positive | Luồng e2e: thêm hàng, vào giỏ, thanh toán, áp mã |
| TC-09-21 | negative/security | API từ chối yêu cầu không có mã |
| TC-09-22 | edge | Biên ngày: mã hết hạn **hôm qua** bị từ chối |
| TC-09-23 | edge | Biên ngày: mã hết hạn **hôm nay** bị từ chối |
| TC-09-24 | edge | Biên ngày: mã hết hạn **ngày mai** vẫn hợp lệ |

**FR-17 – Quản lý mã giảm giá của admin (23)**

| ID | Loại | Nội dung |
|----|------|----------|
| TC-17-01 | positive | Tạo mã phần trăm hợp lệ |
| TC-17-02 | positive | Tạo mã giảm cố định hợp lệ |
| TC-17-03 | edge | Biên: `min_order_amount` = 0 |
| TC-17-04 | edge | Biên: `max_uses_per_user` = 1 |
| TC-17-05 | negative | `discount_value` = 0 bị từ chối |
| TC-17-06 | negative | `discount_value` âm bị từ chối |
| TC-17-07 | negative | `min_order_amount` = -1 bị từ chối |
| TC-17-08 | negative | `max_uses_per_user` = 0 bị từ chối |
| TC-17-09 | negative | `max_uses_per_user` âm bị từ chối |
| TC-17-10 | negative | Phần trăm trên 100% bị từ chối |
| TC-17-11 | negative | Thiếu `discount_value` (HTML5 required) |
| TC-17-12 | negative | Thiếu ngày hết hạn (HTML5 required) |
| TC-17-13 | negative | Trùng mã SAVE10 bị từ chối |
| TC-17-14 | edge | Mã nhập chữ thường được lưu chữ hoa |
| TC-17-15 | edge | Ngày hết hạn trong quá khứ được nhận và gắn nhãn "Hết hạn" |
| TC-17-16 | positive | Danh sách hiển thị đúng định dạng các mã có sẵn |
| TC-17-17 | positive | Admin xóa được mã |
| TC-17-18 | negative | Admin đăng nhập sai mật khẩu bị từ chối |
| TC-17-19 | negative | User thường không đăng nhập được vào trang admin |
| TC-17-20 | positive | Đăng nhập admin thật và tới tab mã giảm giá |
| TC-17-21 | negative/security | Tạo mã không có token bị từ chối (401/403) |
| TC-17-22 | negative/security | Token user thường không được tạo mã (phân quyền) |
| TC-17-23 | negative/security | Token user thường không được xóa mã |

### 3.3 Dữ liệu và kiểu assertion

- Dữ liệu nằm trong `data/*.json`; spec chỉ có vòng `for (const c of cases) test(...)`.
- Kiểu assertion đã dùng (yêu cầu ≥ 3): (1) kiểm tra hiển thị có tự chờ (`toBeVisible`, `toHaveValue`, `toContainText`…); (2) so sánh giá trị chính xác (`toBe`); (3) khớp regex (`toMatch`); (4) trạng thái backend qua API làm oracle; (5) `expect.soft`; (6) mã trạng thái HTTP (401/403); (7) `validity.valueMissing` của HTML5.

## 4. Review và gap analysis các script do AI sinh

Chi tiết đầy đủ ở `docs/review-gap-analysis.md`. Tóm tắt những chỗ AI sai hoặc thiếu **đã thực sự xảy ra**, nguyên nhân và cách sửa:

| # | Vị trí | AI sai/thiếu gì | Sửa thế nào | Vì sao AI bỏ sót |
|---|--------|-----------------|-------------|------------------|
| 1 | FR-17 TC-17-18/19 | Dùng `waitForEvent('dialog')` rồi bấm nút, test treo 40 giây | Đăng ký `page.on('dialog')` ghi nhận và đóng hộp thoại, dùng `expect.poll` (commit `4025b3f`) | Chi tiết của Playwright; đọc code thấy đúng, chỉ khi chạy mới lộ (bản nháp đầu chưa có phản hồi thực thi) |
| 2 | FR-09 TC-09-20 | `page.goto('/cart')` làm mất giỏ hàng vì giỏ chỉ nằm trong state React | Điều hướng bằng liên kết "Giỏ hàng" trong ứng dụng | Đặc điểm của hệ thống, không có trong spec |
| 3 | FR-09 TC-09-20 | Giả định một lần bấm "Thêm vào giỏ hàng" là đủ; lần bấm đầu bị bỏ qua (lỗi SUT) | Bấm lần hai khi cần, gắn chú thích `known-defect` | Tin spec hơn mã đã đọc |
| 4 | FR-09 ngày hết hạn | Bản đầu chỉ test ngày quá khứ xa (2020) và tương lai xa (2099), **thiếu biên ngày**; do tôi phát hiện và hỏi lại | Thêm TC-09-22/23/24, tính ngày theo UTC vì server so sánh với 00:00 UTC | Prompt không yêu cầu rõ phân tích biên cho ngày |
| 5 | FR-09 ngày hết hạn | Bản đầu tính ngày theo giờ máy (UTC+7) nên test lệch ngày | Chuyển sang tính UTC | SRS không nêu múi giờ |
| 6 | FR-17 TC-17-08/09 | Chỉ khẳng định "không lưu gì"; test đạt vì trình duyệt chặn bằng `min="1"`, còn backend có thể vẫn nhận | Ghi lại như hạn chế, đề xuất test ở tầng API | Oracle yếu, đúng cho cả hai cơ chế |

**Rủi ro chấp nhận (chưa gây lỗi):** selector theo vị trí (`form input`.nth(n)) vì nhãn `<label>` của SUT không gắn với `<input>`; `waitForTimeout` sau khi gửi form vì SUT báo lỗi bằng `alert()` và không đổi DOM.

**Rủi ro đã tránh nhờ prompt:** yêu cầu giá trị kỳ vọng suy ra từ SRS thay vì từ mã nguồn, nếu lấy theo mã thì lỗi BUG-05 (công thức giảm giá) đã bị đưa vào oracle.

### Test case chưa tự động hóa
| Nội dung | Lý do |
|----------|-------|
| FR-04: khóa tài khoản, hết phiên đăng nhập | Thuộc FR-02/phiên, ngoài phạm vi |
| FR-09: đơn hàng ghi đúng tổng sau giảm | Cần API chi tiết đơn (FR-11), ngoài phạm vi |
| FR-17: sửa mã giảm giá | Spec chỉ có Thêm/Xem/Xóa, giao diện không có chức năng sửa |
| FR-17: kiểm tra phía API cho `max_uses_per_user` 0/-3 và `type` ngoài percent/fixed | Chưa viết; ghi nhận là hạn chế |
| Khác biệt hiển thị giữa trình duyệt | Không thấy khác biệt: kết quả giống nhau trên 3 trình duyệt |

## 5. Lỗi phát hiện (11)

Chi tiết, các bước tái hiện, nguyên nhân (file:dòng) ở `docs/bug-report.md`; ảnh minh chứng ở `docs/screenshots/`.

| ID | FR | Mức độ | Tiêu đề | Test case | GitHub Issue |
|----|----|--------|---------|-----------|--------------|
| BUG-01 | FR-04 | High | SĐT hợp lệ (bắt đầu 0, 10–11 số) bị từ chối | TC-04-01, 02, 09, 11, 12, 13 | **TODO** |
| BUG-02 | FR-04 | Medium | SĐT không bắt đầu bằng 0 vẫn được lưu | TC-04-05, 06 | **TODO** |
| BUG-03 | FR-04 | Critical | User tự nâng quyền admin qua `PUT /api/users/me` | TC-04-15 | **TODO** |
| BUG-04 | FR-04 | Medium | Backend không kiểm tra SĐT | TC-04-16 | **TODO** |
| BUG-05 | FR-09 | Critical | Mã % tính sai ra số giảm âm (-3.600.000 ₫) | TC-09-01, 04, 11 | **TODO** |
| BUG-06 | FR-09 | High | Tổng đơn bằng mức tối thiểu bị từ chối (dùng `>`) | TC-09-02, 05, 07 | **TODO** |
| BUG-07 | FR-09 | High | Khách chưa đăng nhập vẫn dùng được mã | TC-09-14 | **TODO** |
| BUG-08 | FR-17 | High | Tạo được mã có giá trị giảm 0 hoặc âm | TC-17-05, 06 | **TODO** |
| BUG-09 | FR-17 | Medium | Tạo được mã có đơn tối thiểu âm | TC-17-07 | **TODO** |
| BUG-10 | FR-17 | Medium | Tạo được mã phần trăm 150% | TC-17-10 | **TODO** |
| BUG-11 | FR-17 | Critical | Không kiểm tra vai trò: user thường tạo/xóa được mã | TC-17-22, 23 | **TODO** |

> **TODO (sinh viên):** bật Issues cho repo, chạy `node scripts/create-issues.js`, dán URL vào cột trên và vào `docs/bug-report.md`, chụp trang Issues (có ảnh đính kèm từng issue) cho vào `docs/screenshots/`.

## 6. Git commit log

Repo có lịch sử commit công khai; `git-log.txt` là bản xuất dạng văn bản. Có 8 commit thay đổi file `.spec.js` (yêu cầu tối thiểu 8), mỗi commit là một bước làm hoặc một lần sửa lỗi của AI, ví dụ `fix(FR-17): handle alert dialogs…`.

**Lưu ý trung thực:** phần lớn commit ban đầu được tạo cùng một đợt từ thứ tự công việc thực tế, nên mốc thời gian cách nhau chỉ vài giây. Tôi không chỉnh sửa thời gian commit. Các commit về sau (skill, tài liệu) được tạo tại thời điểm làm.

## 7. Agent Skill

Skill `playwright-datadriven-automation` ở `.claude/skills/playwright-datadriven-automation/` (SKILL.md và thư mục `templates/`): quy trình 10 bước từ đọc SUT, suy ra test case từ SRS, tách dữ liệu, viết spec, phân loại lỗi, chạy đa trình duyệt, bug report/issue, gap analysis đến audit log; có điểm dừng để người học duyệt.

**TODO (sinh viên):** quay video riêng dùng skill trên một feature hoàn chỉnh, dán link ở đầu báo cáo.

## 8. Phụ lục

- `docs/ai-audit-log.md` – AI Audit Report (prompt nguyên văn).
- `docs/ai-critique.md` – AI Critique.
- `docs/review-gap-analysis.md`, `docs/bug-report.md`, `docs/demo-script.md`, `git-log.txt`, `README.md` (bảng tự đánh giá).

## 9. Các phần do tôi làm trực tiếp

Chạy các báo cáo HTML trên máy mình, quay video với giọng nói của mình, tạo GitHub Issues, viết AI Critique, và chịu trách nhiệm với toàn bộ script cuối cùng.
