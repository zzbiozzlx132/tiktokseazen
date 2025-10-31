(() => {
  const STORAGE_KEY = 'tiktokseazen_profile_v1';
  const RENEW_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
  const FORM_ACTION = 'https://docs.google.com/forms/d/e/1FAIpQLSfK7hwiKNwIR2Drfvzwu1EcIm0YviqqlG5uyzcXrWGRQIxMtQ/formResponse';
  const ENTRY_NAME = 'entry.1701942776';
  const ENTRY_ID = 'entry.939022160';
  const ENTRY_TEAM = 'entry.2106718801';
  const ENTRY_URL = 'entry.1088947704';
  const CONTENT_FORM_URL = 'https://seazen.vn/submitnoidung';

  let postProfileCallback = null;

  function getStoredProfile() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      console.warn('Không thể đọc profile:', error);
      return null;
    }
  }

  function saveProfile(profile) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch (error) {
      console.warn('Không thể lưu profile:', error);
    }
  }

  function needsRefresh(profile) {
    if (!profile || !profile.timestamp) return true;
    return Date.now() - Number(profile.timestamp) > RENEW_MS;
  }

  function isValidUrl(url) {
    if (!url) return false;
    try {
      const candidate = new URL(url);
      return candidate.protocol.startsWith('http') && candidate.hostname.includes('tiktok.com');
    } catch (error) {
      return false;
    }
  }

  function ensureStyles() {
    if (document.getElementById('profileFlowStyles')) return;
    const style = document.createElement('style');
    style.id = 'profileFlowStyles';
    style.textContent = `
      .btn-profile-primary {
        background: var(--primary);
        color: #111318;
        border: none;
        font-weight: 600;
        box-shadow: 0 12px 28px rgba(17, 19, 24, 0.12);
        transition: background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
      }
      .btn-profile-primary:hover:not(:disabled) {
        background: var(--primary-dark);
        color: #111318;
        transform: translateY(-1px);
        box-shadow: 0 18px 36px rgba(17, 19, 24, 0.16);
      }
      .btn-profile-primary:disabled {
        opacity: 0.55;
        cursor: not-allowed;
        box-shadow: none;
      }
    `;
    document.head.appendChild(style);
  }

  function ensureProfileModal() {
    if (document.getElementById('visitorProfileModal')) return;
    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
      <div class="modal fade" id="visitorProfileModal" tabindex="-1" aria-labelledby="visitorProfileModalLabel" aria-hidden="true" data-bs-backdrop="static" data-bs-keyboard="false">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <form id="visitorProfileForm">
              <div class="modal-header">
                <h5 class="modal-title" id="visitorProfileModalLabel"><i class="bi bi-person-badge-fill text-warning me-2"></i>Chào mừng đến X10 SeaZen</h5>
              </div>
              <div class="modal-body">
                <p class="text-muted small mb-3">
                  Điền thông tin để SeaZen ghi nhận quá trình tham gia của bạn. Biểu mẫu này sẽ nhắc lại sau 7 ngày. Vui lòng nhập đúng mã số nhân viên.
                </p>
                <div class="mb-3">
                  <label for="visitorEmployeeName" class="form-label">Họ và tên</label>
                  <input type="text" class="form-control" id="visitorEmployeeName" placeholder="Nguyễn Văn A" required>
                </div>
                <div class="mb-3">
                  <label for="visitorEmployeeId" class="form-label">Mã số nhân viên</label>
                  <input type="text" class="form-control" id="visitorEmployeeId" placeholder="NV-001" required>
                </div>
                <div class="mb-3">
                  <label for="visitorEmployeeTeam" class="form-label">Phòng ban / Đội đang công tác</label>
                  <input type="text" class="form-control" id="visitorEmployeeTeam" placeholder="Ví dụ: VP, HCM03, Bảo vệ..." required>
                </div>
                <div class="mb-3">
                  <label for="visitorChannelUrl" class="form-label">URL kênh TikTok (nếu đã có)</label>
                  <input type="url" class="form-control" id="visitorChannelUrl" placeholder="https://www.tiktok.com/@tenkenh">
                  <div class="form-text">Để trống nếu bạn chưa có kênh.</div>
                </div>
                <div id="visitorProfileFeedback" class="text-danger small d-none"></div>
              </div>
              <div class="modal-footer">
                <button type="submit" class="btn btn-profile-primary w-100" id="visitorProfileSubmit">
                  <span class="default-text"><i class="bi bi-send-check-fill me-2"></i>Xác nhận</span>
                  <span class="spinner-border spinner-border-sm align-middle d-none" role="status" aria-hidden="true"></span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(wrapper.firstElementChild);
  }

  function ensureNextStepsModal() {
    if (document.getElementById('visitorNextStepsModal')) return;
    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
      <div class="modal fade" id="visitorNextStepsModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title"><i class="bi bi-lightning-charge-fill text-warning me-2"></i>Tiếp tục cùng X10 SeaZen</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Đóng"></button>
            </div>
            <div class="modal-body">
              <p class="mb-3">Bạn đã sẵn sàng! Đừng quên:</p>
              <ul class="small text-muted ps-3 mb-4">
                <li>Đặt tên kênh có từ khóa <strong>“SeaZen”</strong> và gửi đường dẫn để SeaZen ghi nhận.</li>
                <li>Báo cáo nội dung đã đăng tối thiểu 1 lần/tuần kèm hình ảnh minh chứng.</li>
              </ul>
              <div class="d-flex flex-column gap-2">
                <button type="button" class="btn btn-profile-primary" data-action="submit-channel">
                  <i class="bi bi-send-check-fill me-1"></i>Gửi URL kênh TikTok
                </button>
                <a class="btn btn-outline-dark" href="${CONTENT_FORM_URL}" target="_blank" rel="noopener">
                  <i class="bi bi-pencil-square me-1"></i>Gửi báo cáo nội dung
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(wrapper.firstElementChild);
  }

  function ensureChannelModal() {
    if (document.getElementById('channelSubmitModal')) return;
    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
      <div class="modal fade" id="channelSubmitModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title"><i class="bi bi-send-check-fill text-warning me-2"></i>Gửi URL kênh TikTok</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Đóng"></button>
            </div>
            <div class="modal-body">
              <div id="channelProfileSummary" class="alert alert-light d-none"></div>
              <div id="channelProfileEdit" class="d-none">
                <div class="mb-3">
                  <label for="channelName" class="form-label">Họ và tên</label>
                  <input type="text" class="form-control" id="channelName" placeholder="Nguyễn Văn A">
                </div>
                <div class="mb-3">
                  <label for="channelEmployeeId" class="form-label">Mã số nhân viên</label>
                  <input type="text" class="form-control" id="channelEmployeeId" placeholder="NV-001">
                </div>
                <div class="mb-3">
                  <label for="channelTeam" class="form-label">Phòng ban / Đội đang công tác</label>
                  <input type="text" class="form-control" id="channelTeam" placeholder="Ví dụ: VP, HCM03, Bảo vệ...">
                </div>
              </div>
              <div class="mb-3">
                <label for="channelUrl" class="form-label">URL kênh TikTok</label>
                <input type="url" class="form-control" id="channelUrl" placeholder="https://www.tiktok.com/@yourchannel" required>
                <div class="form-text">Yêu cầu URL bắt đầu bằng http(s) và chứa tiktok.com.</div>
              </div>
              <div id="channelFeedback" class="small d-none"></div>
            </div>
            <div class="modal-footer justify-content-end">
              <div class="d-flex gap-2">
                <button type="button" class="btn btn-profile-primary" id="channelSubmitBtn">
                  <span class="default-text"><i class="bi bi-send-check-fill me-1"></i>Gửi kênh</span>
                  <span class="spinner-border spinner-border-sm align-middle d-none" role="status" aria-hidden="true"></span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(wrapper.firstElementChild);
  }

  async function submitForm({ name, employeeId, team, url }) {
    const formData = new FormData();
    formData.append(ENTRY_NAME, name || '');
    formData.append(ENTRY_ID, employeeId || '');
    formData.append(ENTRY_TEAM, team || '');
    formData.append(ENTRY_URL, url || '');

    try {
      await fetch(FORM_ACTION, {
        method: 'POST',
        mode: 'no-cors',
        body: formData
      });
    } catch (error) {
      console.warn('Không gửi được biểu mẫu:', error);
    }
  }

  function openProfileModal(options = {}) {
    ensureProfileModal();
    const modalElement = document.getElementById('visitorProfileModal');
    const form = modalElement.querySelector('#visitorProfileForm');
    const nameInput = form.querySelector('#visitorEmployeeName');
    const idInput = form.querySelector('#visitorEmployeeId');
    const teamInput = form.querySelector('#visitorEmployeeTeam');
    const urlInput = form.querySelector('#visitorChannelUrl');
    const feedback = form.querySelector('#visitorProfileFeedback');
    const submitBtn = form.querySelector('#visitorProfileSubmit');
    const spinner = submitBtn.querySelector('.spinner-border');
    const defaultText = submitBtn.querySelector('.default-text');

    const stored = getStoredProfile();
    if (stored) {
      if (stored.name) nameInput.value = stored.name;
      if (stored.employeeId) idInput.value = stored.employeeId;
      if (stored.team) teamInput.value = stored.team;
      if (stored.url) urlInput.value = stored.url;
    }

    feedback.classList.add('d-none');
    submitBtn.disabled = false;

    if (!form.dataset.bound) {
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        feedback.classList.add('d-none');

        const name = nameInput.value.trim();
        const employeeId = idInput.value.trim();
        const team = teamInput.value.trim();
        const url = urlInput.value.trim();

        if (!name || !employeeId || !team) {
          feedback.textContent = 'Vui lòng nhập đầy đủ họ tên, mã số và phòng ban/đội.';
          feedback.classList.remove('d-none');
          return;
        }
        if (url && !isValidUrl(url)) {
          feedback.textContent = 'URL kênh không hợp lệ. Vui lòng nhập dạng https://www.tiktok.com/@tenkenh';
          feedback.classList.remove('d-none');
          return;
        }

        submitBtn.disabled = true;
        spinner.classList.remove('d-none');
        defaultText.classList.add('d-none');

        await submitForm({ name, employeeId, team, url });
        saveProfile({ name, employeeId, team, url, timestamp: Date.now() });

        setTimeout(() => {
          spinner.classList.add('d-none');
          defaultText.classList.remove('d-none');
          submitBtn.disabled = false;
          const instance = bootstrap.Modal.getInstance(modalElement);
          if (instance) instance.hide();
          setTimeout(() => {
            showNextStepsModal();
            if (typeof postProfileCallback === 'function') {
              postProfileCallback();
              postProfileCallback = null;
            }
          }, 250);
        }, 250);
      });
      form.dataset.bound = 'true';
    }

    postProfileCallback = options.onComplete || null;
    const modalInstance = new bootstrap.Modal(modalElement);
    modalInstance.show();
  }

  function showNextStepsModal() {
    ensureNextStepsModal();
    bindChannelTriggers();
    const modalElement = document.getElementById('visitorNextStepsModal');
    const instance = new bootstrap.Modal(modalElement);
    instance.show();
  }

  function openChannelModal(forceEdit = false) {
    ensureChannelModal();
    const modalElement = document.getElementById('channelSubmitModal');
    const summary = modalElement.querySelector('#channelProfileSummary');
    const editContainer = modalElement.querySelector('#channelProfileEdit');
    const nameInput = modalElement.querySelector('#channelName');
    const idInput = modalElement.querySelector('#channelEmployeeId');
    const teamInput = modalElement.querySelector('#channelTeam');
    const urlInput = modalElement.querySelector('#channelUrl');
    const feedback = modalElement.querySelector('#channelFeedback');
    const submitBtn = modalElement.querySelector('#channelSubmitBtn');
    const spinner = submitBtn.querySelector('.spinner-border');
    const defaultText = submitBtn.querySelector('.default-text');

    const stored = getStoredProfile();
    const hasCoreData = stored && stored.name && stored.employeeId && stored.team;

    const populateSummary = (profile) => {
      summary.innerHTML = `
        <div class="d-flex justify-content-between align-items-start gap-3">
          <div>
            <div><strong>Họ tên:</strong> ${profile.name || '—'}</div>
            <div><strong>Mã NV:</strong> ${profile.employeeId || '—'}</div>
            <div><strong>Phòng ban:</strong> ${profile.team || '—'}</div>
          </div>
          <button type="button" class="btn btn-sm btn-outline-dark" id="channelEditInfoBtn">
            <i class="bi bi-pencil-square me-1"></i>Chỉnh sửa
          </button>
        </div>
      `;
    };

    feedback.classList.add('d-none');
    feedback.classList.remove('text-success');
    feedback.classList.add('text-danger');
    submitBtn.disabled = false;
    spinner.classList.add('d-none');
    defaultText.classList.remove('d-none');

    if (hasCoreData && !forceEdit) {
      populateSummary(stored);
      summary.classList.remove('d-none');
      editContainer.classList.add('d-none');
      nameInput.value = stored.name;
      idInput.value = stored.employeeId;
      teamInput.value = stored.team;
    } else {
      summary.classList.add('d-none');
      editContainer.classList.remove('d-none');
      nameInput.value = stored?.name || '';
      idInput.value = stored?.employeeId || '';
      teamInput.value = stored?.team || '';
    }

    urlInput.value = stored?.url || '';

    const editButton = summary.querySelector('#channelEditInfoBtn');
    if (editButton) {
      editButton.addEventListener('click', () => {
        summary.classList.add('d-none');
        editContainer.classList.remove('d-none');
      }, { once: true });
    }

    if (!modalElement.dataset.bound) {
      submitBtn.addEventListener('click', async () => {
        feedback.classList.add('d-none');
        const profile = getStoredProfile() || {};
        let name = profile.name || '';
        let employeeId = profile.employeeId || '';
        let team = profile.team || '';

        if (summary.classList.contains('d-none')) {
          name = nameInput.value.trim();
          employeeId = idInput.value.trim();
          team = teamInput.value.trim();
        }

        const url = urlInput.value.trim();

        if (!name || !employeeId || !team) {
          feedback.textContent = 'Vui lòng nhập đầy đủ họ tên, mã số và phòng ban/đội.';
          feedback.classList.remove('d-none');
          return;
        }
        if (!isValidUrl(url)) {
          feedback.textContent = 'URL kênh không hợp lệ. Vui lòng nhập dạng https://www.tiktok.com/@tenkenh';
          feedback.classList.remove('d-none');
          return;
        }

        submitBtn.disabled = true;
        spinner.classList.remove('d-none');
        defaultText.classList.add('d-none');

        await submitForm({ name, employeeId, team, url });
        saveProfile({ name, employeeId, team, url, timestamp: Date.now() });

        feedback.textContent = 'Đã gửi đường dẫn kênh thành công!';
        feedback.classList.remove('text-danger');
        feedback.classList.add('text-success');
        feedback.classList.remove('d-none');

        setTimeout(() => {
          const instance = bootstrap.Modal.getInstance(modalElement);
          if (instance) instance.hide();
        }, 400);
      });
      modalElement.dataset.bound = 'true';
    }

    const instance = new bootstrap.Modal(modalElement);
    instance.show();
  }

  function bindChannelTriggers() {
    document.querySelectorAll('[data-action="submit-channel"]').forEach((btn) => {
      if (btn.dataset.bound === 'true') return;
      btn.addEventListener('click', (event) => {
        event.preventDefault();
        const profile = getStoredProfile();
        if (!profile || needsRefresh(profile)) {
          openProfileModal();
        } else if (!profile.name || !profile.employeeId || !profile.team) {
          openChannelModal(true);
        } else {
          openChannelModal(false);
        }
      });
      btn.dataset.bound = 'true';
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (typeof bootstrap === 'undefined') return;
    ensureStyles();
    bindChannelTriggers();

    const stored = getStoredProfile();
    if (needsRefresh(stored)) {
      openProfileModal();
    }
  });
})();
