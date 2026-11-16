# Product Story Site: AI Voice & Video Scam Checker

**Trạng thái:** brief và tài liệu nghiên cứu cho Empryo; chưa phải giao diện đã triển khai.  
**Ngày lập:** 16-11-2026  
**Mục đích:** chuyển trọng tâm giao diện kế tiếp sang một website giới thiệu sản phẩm dạng scrollytelling, dựa trên ứng dụng demo đang có.

## 1. Quyết định phạm vi

Đây là một website giới thiệu/giáo dục, không phải một lần viết lại backend, không phải tích hợp AI thật và không phải trang cấu hình/cài Linux. Empryo sẽ viết code sau khi nhận chỉ dẫn thực thi riêng; tài liệu này chỉ định nghĩa sản phẩm, nội dung, kiến trúc giao diện và cách nghiệm thu.

Website cần kể rõ dự án giúp người xem **chậm lại, nhận ra dấu hiệu gây áp lực và xác minh qua kênh độc lập**. Nó không được tuyên bố xác thực danh tính, chứng minh media là giả, kết luận một người phạm lừa đảo, hoặc đưa khuyến nghị tài chính tự động.

### Tách hai trải nghiệm trong cùng frontend

- `/`: website giới thiệu sản phẩm, một trang dài có điều hướng theo anchor và nội dung xuất hiện theo cuộn.
- `/app`: ứng dụng upload demo hiện có. Bảo toàn luồng và hành vi hiện tại; không giả lập kết quả phân tích thật.
- CTA từ trang giới thiệu có thể đưa người dùng đến `/app`, kèm lời báo rõ đây là bản demo local và backend phải đang chạy.
- Không tạo repository, project scaffold, backend, Workbench hoặc bản sao frontend thứ hai. Dùng workspace hiện tại `D:\Project_MMKNM` và kiểm tra cấu trúc trước khi sửa.
- Không thay đổi cấu hình Podman/WSL/Linux, không cài runtime, không bật parser trên host, không triển khai public, không commit/push.

**Lưu ý hiện trạng:** `frontend/src/App.tsx` đang render thẳng app upload làm trang gốc và hiện chưa thấy router trong `frontend/package.json`. Trước khi đổi route, Empryo phải lập inventory và chọn cách routing nhỏ nhất tương thích; không xóa hoặc làm hỏng app hiện tại. Nếu GitHub Pages được cân nhắc sau này, base path `/rosa` của trang tham khảo không phải base path của repo này; cần cấu hình Vite/route đúng với deployment target và kiểm thử deep-link riêng. Chưa có quyết định deploy.

## 2. Sự thật sản phẩm phải dùng khi viết nội dung

Nguồn sự thật là code và hồ sơ hiện hành trong `README.md`, `docs/research/PROJECT_BRIEF.md`, `TECHNICAL_BASELINE.md`, `SECURITY_AND_PRIVACY.md`, `ROADMAP.md` và `FIRST_WEB_HANDOFF.md`.

- Web hiện tại là `mode=demo`; hiện **không phát hiện deepfake** và không có model thật.
- Cues hiển thị là nội dung minh họa, không được suy ra từ media người dùng.
- Metadata có thể được đo như byte size/SHA-256; MIME là thông tin do trình duyệt khai báo, chưa được xác minh theo bytes.
- Thời lượng đang là `null` vì parser media đã tắt để chờ sandbox cô lập. Không được hứa rằng hệ thống hiện đã kiểm tra giới hạn thời lượng 60 giây.
- Upload demo hiện được giới hạn ở local theo backend; không nói file được xử lý bởi model, phân tích âm thanh/video hay bảo vệ tuyệt đối.
- Ranh giới an toàn Bước 3 vẫn PARTIAL theo hồ sơ gần nhất. Website giới thiệu không được ngầm biến trạng thái này thành PASS.
- Không thêm số liệu hiệu quả, độ chính xác, số người dùng, benchmark, chứng nhận hoặc trích dẫn nếu chưa có bằng chứng và nguồn kiểm chứng.

## 3. Người xem, mục tiêu và giọng điệu

**Người xem chính:** người dùng phổ thông muốn biết nên làm gì khi nhận cuộc gọi/voice/video đáng ngờ; sinh viên/giảng viên cần hiểu phạm vi demo và tư duy ATTT.

**Mục tiêu trang:** trong một lần cuộn, người xem hiểu được vấn đề, cách công cụ hỗ trợ, các bước tự xác minh, giới hạn của bản demo và cách mở demo local.

**Giọng điệu:** bình tĩnh, dễ hiểu, tôn trọng người bị nhắm tới; không giật gân, không gieo sợ hãi, không đổ lỗi nạn nhân, không gọi người trong media là kẻ lừa đảo.

## 4. Hướng thiết kế

### Ý tưởng

**“Dừng một nhịp trước khi tin.”** Dùng nhịp cuộn để đưa người xem từ một yêu cầu khẩn cấp sang một quy trình xác minh bình tĩnh. Hình ảnh chủ đạo là một đường tín hiệu/đường đi xác minh có thể mở từng lớp theo scroll. Đây là minh họa thiết kế, không phải waveform hoặc bằng chứng phân tích thật.

### Hệ thống thị giác đề xuất

- Nền giấy sáng hoặc xám ấm rất nhạt, chữ mực xanh đen; màu teal/xanh lam dùng cho thao tác bình tĩnh; vàng hổ phách dùng cho “cần kiểm tra”; đỏ chỉ dành cho lỗi hoặc cảnh báo cần chú ý. Tránh giao diện toàn đen neon kiểu cybersecurity dashboard.
- Typography: một sans-serif tiếng Việt dễ đọc cho giao diện và nội dung; một display face có cá tính cho tiêu đề lớn nếu bộ font được host/giấy phép phù hợp. Không tải font ngoài từ CDN khi chưa cần; ưu tiên font hệ thống/local.
- Layout dạng editorial: tiêu đề lớn, đoạn ngắn, khoảng trống có chủ đích, ảnh/illustration tự tạo bằng SVG/CSS. Không chia mọi nội dung thành cùng một loạt card bo tròn.
- Chỉ chọn **một khoảnh khắc chuyển động đặc trưng**: khi cuộn qua phần “dừng lại”, luồng yêu cầu khẩn cấp phân tách thành ba bước “dừng – gọi lại số đã lưu – xác nhận qua kênh thứ hai”. Các phần còn lại chuyển động nhẹ.
- Nội dung/illustration phải tự thiết kế cho dự án; không tải ảnh, video, icon pack hoặc asset của Rosa/các repo khác để đưa vào sản phẩm.

### Sơ đồ nội dung và nhịp cuộn

```text
Header cố định, điều hướng anchor + nút mở demo
  ↓
Hero: “Trước khi tin một cuộc gọi, hãy dừng một nhịp.”
  ↓
Tình huống: yêu cầu khẩn cấp / bí mật / chuyển tiền (minh họa hư cấu, có nhãn)
  ↓
Scroll scene: DỪNG → GỌI LẠI KÊNH ĐÃ BIẾT → XÁC NHẬN ĐỘC LẬP
  ↓
Công cụ hỗ trợ gì: upload local → thông số tệp đo được → demo cues → checklist
  ↓
Ranh giới trung thực: bản hiện tại là DEMO, chưa phát hiện deepfake
  ↓
Checklist mang theo: 4 việc làm trước khi chuyển tiền/chia sẻ dữ liệu
  ↓
Quyền riêng tư và thiết kế an toàn: local demo, giới hạn, xóa phiên
  ↓
CTA: “Mở bản demo local” → /app + footer, nguồn tham khảo
```

Các phần phải có anchor dễ đọc: `Cách hoạt động`, `Giới hạn`, `Checklist`, `Demo`. Có thể đổi tên cho tự nhiên nhưng không được bỏ disclaimer.

## 5. Hành vi và animation

- Dùng native scrolling; không hijack wheel/touch, không ép auto-scroll, không khóa người dùng trong section, không dùng custom scrollbar làm điều hướng chính.
- Ưu tiên CSS transitions/scroll-driven animation có fallback, hoặc IntersectionObserver cho reveal một lần. Chọn thư viện chỉ khi inventory chứng minh cần thiết; tra tài liệu chính thức, phiên bản hiện hành, license, bundle và cleanup trước khi thêm.
- Tiến độ cuộn/section hiện tại phải có biểu diễn không chỉ dựa vào màu; điều hướng anchor hoạt động bằng keyboard và URL fragment.
- Tôn trọng `prefers-reduced-motion: reduce`: bỏ parallax, pinning và scrub theo scroll; hiển thị nội dung ở trạng thái tĩnh, đầy đủ.
- Mobile: chuyển pinned scene thành các bước xếp dọc, không dùng hiệu ứng horizontal scroll bắt buộc; nội dung không bị cắt ở viewport hẹp.
- Hỗ trợ keyboard focus rõ, skip link, semantic headings/landmarks, button/link đúng ngữ nghĩa, contrast, alt text. Animation không làm mất nội dung với screen reader.
- Không autoplay âm thanh/video, không tải asset lớn trước khi cần, không phụ thuộc WebGL/Three.js cho khả năng đọc nội dung.

## 6. Kiến trúc frontend dự kiến

Giữ React/Vite hiện có và giữ `/app` độc lập. Empryo phải đọc code trước, rồi thiết kế các phần theo component gần với nội dung, không tạo một component khổng lồ. Gợi ý cấu trúc (được điều chỉnh theo code thật):

```text
frontend/src/
  app/                 # router hoặc route shell tối thiểu
  pages/
    ProductStoryPage   # route /
    AnalysisAppPage    # route /app, bọc luồng hiện có
  components/story/
    StoryHeader
    HeroScene
    PressureScenario
    VerifySequence
    ProductFlow
    DemoLimitations
    SafetyChecklist
    PrivacySection
    StoryFooter
  styles/
    story-tokens.css   # chỉ token và style riêng của story page
  utils/
    motion-preference # nếu có logic JS cần thiết
```

Đây là đề xuất, không phải yêu cầu tạo tất cả file. Không sửa backend để làm landing page. Không để CSS landing page làm đổi màu/layout của `/app`; scope CSS theo page/layout. Không đổi hành vi upload hiện tại ngoài phần routing bắt buộc.

## 7. Nguồn tham khảo GitHub đã khảo sát

Khảo sát ngày 16-11-2026. Tham khảo **cấu trúc kể chuyện và kỹ thuật công khai**, không sao chép code/assets. License ở repo không tự động cấp quyền dùng các asset bên ngoài hoặc nội dung của tác giả.

| Nguồn | Quan sát hữu ích cho dự án | License kiểm tra được | Cách dùng |
|---|---|---|---|
| [Rosa live page](https://fedyaqq34356.github.io/rosa/) · [repo](https://github.com/fedyaqq34356/rosa) | Trang dài có anchor `Chapters / Install / GitHub`, 12 chương kể theo tính năng, hero có một vật thể tương tác; nội dung đi từ ý tưởng → chương → số liệu → quy tắc → CTA. Bundle có `IntersectionObserver` và kiểm tra `prefers-reduced-motion`; điều đó không thay cho QA độc lập của trang mới. Repo là desktop Hyprland, không phải template cho scam checker. | GPL-3.0 ở repo | Chỉ học nhịp kể chuyện/anchor/điểm nhấn. Không dùng script `curl | bash`, installer, config Linux, code, asset hoặc tuyên bố sản phẩm Rosa. Nếu có ý định tái sử dụng code GPL, phải dừng và review nghĩa vụ license; brief này không cho phép việc đó. |
| [basementstudio/scrollytelling](https://github.com/basementstudio/scrollytelling) · [demo](https://scrollytelling.basement.studio/) | Khái niệm timeline/waypoint và pinning cho React; hữu ích để hiểu scroll choreography và cleanup. | GitHub API không gán SPDX license (`NOASSERTION`) | Chỉ đọc ý tưởng/docs; không copy package/source vào dự án. Không thêm GSAP chỉ vì repo dùng nó. |
| [decriptcypher/scroll-storytelling](https://github.com/decriptcypher/scroll-storytelling) · [demo](https://scroll-storytelling-bay.vercel.app/) | So sánh 5 kiểu: CSS scroll reveal, canvas frame sequence, mask reveal, SVG layers, 3D scene. Giúp chọn một hiệu ứng phù hợp thay vì gom mọi kỹ thuật. | Không thấy license khai báo | Chỉ tham khảo khái niệm; không copy code/asset. Với trang này ưu tiên CSS/IntersectionObserver, không cần 3D/canvas video sequence. |
| [jzmn-crft/sea-of-stars-template](https://github.com/jzmn-crft/sea-of-stars-template) | One-page narrative có mở đầu, các chương nội dung, timeline và CTA; repo ghi rõ scroll-driven, static/no framework. Có thể học cách nhóm nội dung dài. | MIT theo GitHub repository metadata | Tham khảo cấu trúc. Không dùng nguyên template hay assets nếu không cần; nếu copy code sau này thì phải đọc LICENSE và giữ attribution/notice theo yêu cầu. |
| [LilProff/crafex-portfolio](https://github.com/LilProff/crafex-portfolio) | React showcase với GSAP ScrollTrigger, pinning, mobile overrides; có ích để học cách phân đoạn motion. | MIT theo GitHub repository metadata | Chỉ tham khảo cấu trúc/ý tưởng; không bê custom cursor, loader, grain hay phong cách agency vào sản phẩm. Kiểm tra license file trước mọi tái sử dụng code. |
| [codebucks27/Agency-website](https://github.com/codebucks27/Agency-website) | Ví dụ React landing/agency và GSAP scroll animation đơn giản hơn; có thể đối chiếu tổ chức component. | Không thấy license khai báo | Chỉ tham khảo mô tả và kiến trúc; không copy source. |

### Tổng hợp có chọn lọc

1. Rosa là tham khảo tốt nhất về **một trang dài, các chương có chủ đích và anchor điều hướng**, không phải vì sản phẩm/config Linux của repo liên quan đến dự án này.
2. Dùng một narrative scene liên kết trực tiếp với hành vi an toàn (dừng, gọi lại, xác minh), thay vì nhiều parallax/loader/custom cursor.
3. Tham khảo `scroll-storytelling` để đánh giá kỹ thuật nhưng chọn phương án nhẹ; không cần 3D hoặc sequence ảnh cho website nội dung này.
4. Chỉ xem xét code reuse ở repo có license rõ, sau review file LICENSE, dependency license và attribution. Repo `NOASSERTION`/không có license được coi là **không có quyền mặc định để sao chép**.

## 8. Kế hoạch thực hiện cho Empryo

Thực hiện một lần trong workspace/Workbench Empryo đang dùng. Không gửi từng node thành các chat/run mới và không dựng project thứ hai.

### Graph đề xuất

```text
inventory-and-plan
        ↓
story-site-implementation
        ↓
qa-visual-and-functional
        ↓
review-parallel
   ↙              ↘
product-truth    accessibility-performance
   ↘              ↙
        judge
     ↙       ↘
  PASS      FAIL (tối đa 2 vòng: fix → QA → reviews → judge)
   ↓         ↓
handoff    final-partial nếu vẫn chưa đạt/thiếu môi trường
   ↓
final-pass
```

**Routing:** `inventory-and-plan → implementation` khi đã xác nhận route `/` và `/app`, nội dung thật, scope. QA phải chờ implementation. Hai review chạy song song và độc lập. Judge chỉ dùng artifacts/event evidence; `PARTIAL` không được báo thành PASS. Không có runtime/công cụ browser thì vẫn chạy build/kiểm tra phù hợp và ghi thiếu bằng chứng, không giả vờ đã kiểm tra visual.

### Phân công và đầu ra

1. `inventory-and-plan` (read/explore): xác nhận trạng thái code thật, entry point, CSS, dependencies, route hiện có; lập danh sách file sở hữu và plan ngắn; không sửa code.
2. `story-site-implementation` (code): triển khai `/` story page và giữ app ở `/app`; dùng brief này làm product source of truth; không chạm backend/sandbox.
3. `qa-visual-and-functional` (code/QA): build frontend bằng lockfile; kiểm tra route root, CTA tới `/app`, direct load/refresh, anchor, desktop + mobile, reduced motion, keyboard. Dùng browser thật/screenshots nếu công cụ có sẵn. Ghi lệnh, exit code, output, viewport, artifact ảnh; không thêm test suite mới nếu không được yêu cầu.
4. `product-truth` (independent review): kiểm tra toàn bộ copy, disclaimer, demo vs model, provenance và không có claim sai.
5. `accessibility-performance` (independent review): kiểm tra keyboard, reduced-motion, responsive, load/performance, không có scroll hijack/autoplay/external calls.
6. `judge`: PASS chỉ khi các tiêu chí bên dưới có bằng chứng. FAIL cho lỗi có thể sửa; tối đa 2 vòng sửa. PARTIAL nếu môi trường không cho kiểm tra visual thật. Trình bày riêng trạng thái run top-level và verdict nghiệp vụ.
7. `handoff`: ghi file thay đổi, kết quả lệnh thật, review, verdict, screenshot và hạn chế vào tài liệu handoff dự án. Không commit/push/deploy.

## 9. Tiêu chí nghiệm thu website giới thiệu

- `/` là trang giới thiệu story; `/app` còn truy cập được và luồng upload demo hiện tại không bị hỏng.
- Trang có nội dung tiếng Việt hoàn chỉnh theo sequence ở mục 4, anchor điều hướng, CTA rõ ràng và disclaimer dễ nhìn.
- Từng claim khớp với code/docs; luôn ghi đây là demo và hiện chưa phát hiện deepfake.
- Scroll animation có mục đích, tôn trọng reduced motion, không khóa/chiếm quyền cuộn, và nội dung vẫn đọc được khi JS/motion bị tắt.
- Responsive trên desktop và mobile; keyboard navigation/focus/skip-link có thể sử dụng.
- Không có API ngoài, analytics, tracking, remote font/media, URL ingestion, upload media trên landing page hay tải file Rosa.
- Không thêm dependency nặng hoặc code bên thứ ba không rõ license khi chưa có lý do được ghi nhận.
- `npm run build` đạt. Các kiểm tra khác chỉ ghi PASS khi thực sự chạy. Visual QA phải có ảnh hoặc được đánh dấu chưa xác minh.
- Không đổi backend, trạng thái security gate, model/dataset, Podman/WSL/Linux, secrets, hoặc deploy/commit/push.

## 10. Prompt thực thi để dán vào Empryo

```text
Hãy triển khai website giới thiệu sản phẩm dạng scroll-story cho AI Voice & Video Scam Checker theo brief tại docs/product/PRODUCT_STORY_SITE_BRIEF.md. Đây là đổi trọng tâm frontend sang product-story website dựa trên sản phẩm hiện có, KHÔNG phải xây lại ứng dụng/backend và KHÔNG phải làm cấu hình Linux.

Quy tắc trước khi chạy:
1. Dùng đúng workspace/project hiện tại. Không tạo repository, thư mục project thứ hai, Workbench/chat/run thứ hai; không chia yêu cầu thành nhiều lần chạy. Chỉ tạo một graph/run cho nhiệm vụ này nếu Orchestrator cần.
2. Trước khi thực thi, hiển thị graph, danh sách node/agent thực sự có trong workspace, prompt từng node và routing PASS/FAIL/PARTIAL. Validate graph theo schema Empryo trước khi start. Không tự sửa run-state JSON.
3. Đọc AGENTS.md, docs/research/README.md, docs/research/PROJECT_BRIEF.md, TECHNICAL_BASELINE.md, SECURITY_AND_PRIVACY.md, ROADMAP.md, FIRST_WEB_HANDOFF.md và brief sản phẩm. Đọc source frontend hiện có trước khi sửa. `frontend/src/App.tsx` hiện là app upload ở root; hãy xác minh điều này từ code.

Kết quả cần xây trong code:
- Trang `/` là một trang giới thiệu tiếng Việt dài, kể chuyện qua cuộn, có anchor navigation và một narrative motion scene “dừng → gọi lại kênh đã biết → xác nhận độc lập”.
- Giữ ứng dụng upload demo hiện có hoạt động tại `/app`, không xóa hoặc làm suy giảm chức năng. CTA trên landing mở `/app` và nói rõ đây là demo local, cần backend local.
- Nội dung theo đúng các phần, design direction, giới hạn sản phẩm, accessibility và motion trong brief. Rosa chỉ là tham khảo về nhịp scrollytelling/anchor/interactions; tuyệt đối không lấy config Linux, shell installer, code, logo, hình ảnh hoặc nội dung của Rosa. Không copy code/assets từ repo không có license khai báo. Không thêm code GSAP/template trừ khi license và nhu cầu đã được xác minh; ưu tiên giải pháp nhẹ phù hợp React/Vite đang có.
- Bảo toàn sự thật: demo không phát hiện deepfake; mock cues không được suy ra từ file; MIME do browser khai báo; duration hiện null vì parser tắt; security gate Bước 3 đang PARTIAL. Không phát minh accuracy, scores, benchmark, chứng nhận hay testimonials.
- Không sửa backend, parser, sandbox, model, dataset, Podman/WSL/Linux config. Không thêm outbound API, analytics, tracking, remote fonts/assets, upload trên landing, public deployment, commit hoặc push.

Graph/nodes nên dùng sẵn agents/profile có trong project, không bịa tên agent:
1. inventory-and-plan (read-only): inventory code/route/dependencies; xác định file ownership và plan ngắn. Không sửa.
2. story-site-implementation (code): implement `/` + `/app`, isolation CSS, responsive và motion. Chỉ node này sửa code frontend.
3. qa-visual-and-functional (QA): chạy `npm ci` nếu cần xác minh cài mới, `npm run build`; kiểm tra route root/app, CTA, anchor, refresh/direct URL, desktop/mobile, keyboard, reduced-motion. Dùng browser thật và chụp ảnh nếu môi trường hỗ trợ; ghi lệnh, exit code, output, viewport và ảnh. Không tuyên bố visual pass nếu chưa nhìn trang trong browser.
4. review-parallel: hai reviewer độc lập, ngữ cảnh sạch, chạy đồng thời. `product-truth` rà soát copy/claims theo brief và code. `accessibility-performance` rà soát a11y, reduced-motion, responsive, scroll behavior, hiệu năng, external requests/license. Reviewer chỉ đọc và nêu file/dòng.
5. judge: đối chiếu artifacts của QA và hai review với acceptance criteria trong brief. PASS chỉ có bằng chứng; FAIL nếu có lỗi sửa được; PARTIAL nếu browser/visual evidence không khả dụng. Không đồng nhất node terminal thành run PASS.
6. fix-issues: chỉ chạy khi judge FAIL do lỗi có thể sửa; sửa đúng lỗi, tối đa 2 vòng, rồi chạy lại QA + cả hai review + judge. Nếu PARTIAL thì handoff với limitation, không loop vô hạn.
7. handoff + final-pass/final-partial: ghi kết quả thực tế vào docs/research/EMPRYO_RUN_LOG.md và tạo/cập nhật handoff riêng cho story site; ghi run ID, graph, top-level status, node event results, files changed, commands/exit codes, reviewer outcomes, judge verdict, screenshot paths và phần chưa xác minh. Không commit/push/deploy.

Nếu Orchestrator không thể validate graph vì schema/tool incompatibility, dừng trước khi tạo run/workbench thứ hai; báo chính xác lỗi validate và đưa ra phương án chạy cùng nhiệm vụ trong Workbench hiện tại theo đúng quyền mode. Không báo thành công chỉ vì đã trả lời hoặc terminal node đã chạy.
```

**Cách dùng:** mở Workbench Empryo hiện tại của đúng project, chuyển sang Orchestrate nếu muốn workflow trên, dán prompt này một lần. Xem graph trước khi Empryo chạy theo đúng yêu cầu. Brief này không tự cho phép publish/deploy.

## 11. Ghi chú kiểm chứng nguồn

- Trang Rosa được truy cập trực tiếp ngày 16-11-2026, HTTP 200, title `Rosa · Quiet by design`; markup hiển thị hero, 12 chương, phần nguyên tắc/chi phí/cài đặt, nav anchors và nút island. JavaScript bundle có `IntersectionObserver` và kiểm tra `prefers-reduced-motion`. Đây là quan sát kỹ thuật của trang tham khảo, không phải yêu cầu sao chép triển khai.
- Repo metadata được kiểm tra bằng GitHub API ngày 16-11-2026: Rosa `GPL-3.0`; `sea-of-stars-template` và `crafex-portfolio` `MIT`; `scroll-storytelling`, `Agency-website` không khai báo license; `basementstudio/scrollytelling` trả `NOASSERTION`.
- Không tải/cloning repository vào workspace và không sử dụng source/assets trong codebase sản phẩm.
