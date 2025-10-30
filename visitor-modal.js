(() => {
  const STORAGE_KEY = 'tiktokseazen_profile_v1';
  const RENEW_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
  const FORM_ACTION = 'https://docs.google.com/forms/d/e/1FAIpQLSe-mp-lO06sjoKRxKQ4PSyI0Igc0l87EwZDH1jkgFiU2nNfMQ/formResponse';
  const ENTRY_NAME = 'entry.1976640361';
  const ENTRY_ID = 'entry.38771333';

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

  function ensureModal() {
    if (document.getElementById('visitorProfileModal')) return;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
      <div class="modal fade" id="visitorProfileModal" tabindex="-1" aria-labelledby="visitorProfileModalLabel" aria-hidden="true" data-bs-backdrop="static" data-bs-keyboard="false">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="visitorProfileModalLabel"><i class="bi bi-person-badge-fill text-warning me-2"></i>Chào mừng đến TikTok SeaZen</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Đóng"></button>
            </div>
            <div class="modal-body">
              <p class="text-muted small mb-3">Điền thông tin để SeaZen ghi nhận quá trình học tập của bạn. Biểu mẫu này sẽ nhắc lại sau 7 ngày.</p>
              <div class="mb-3">
                <label for="visitorEmployeeName" class="form-label">Tên nhân viên</label>
                <input type="text" class="form-control" id="visitorEmployeeName" placeholder="Nguyễn Văn A" required>
              </div>
              <div class="mb-3">
                <label for="visitorEmployeeId" class="form-label">Mã số nhân viên</label>
                <input type="text" class="form-control" id="visitorEmployeeId" placeholder="NV-001" required>
              </div>
              <div id="visitorProfileFeedback" class="text-danger small d-none"></div>
            </div>
            <div class="modal-footer d-flex justify-content-between">
              <a class="btn btn-outline-dark" href="https://seazen.vn/submitnoidung" target="_blank" rel="noopener">
                <i class="bi bi-pencil-square me-1"></i>Gửi nội dung
              </a>
              <div class="d-flex gap-2">
                <button type="button" class="btn btn-light" data-bs-dismiss="modal">Để sau</button>
                <button type="button" class="btn btn-dark" id="visitorProfileSubmit">
                  <span class="default-text"><i class="bi bi-send-check-fill me-1"></i>Gửi xác nhận</span>
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

  async function submitProfile({ name, employeeId }) {
    const formData = new FormData();
    formData.append(ENTRY_NAME, name);
    formData.append(ENTRY_ID, employeeId);

    try {
      await fetch(FORM_ACTION, {
        method: 'POST',
        mode: 'no-cors',
        body: formData
      });
    } catch (error) {
      console.warn('Không gửi được form', error);
    }
  }

  function setupModalIfNeeded() {
    const stored = getStoredProfile();
    if (!needsRefresh(stored)) return;

    ensureModal();
    const modalElement = document.getElementById('visitorProfileModal');
    if (!modalElement) return;

    const nameInput = modalElement.querySelector('#visitorEmployeeName');
    const idInput = modalElement.querySelector('#visitorEmployeeId');
    const feedback = modalElement.querySelector('#visitorProfileFeedback');
    const submitBtn = modalElement.querySelector('#visitorProfileSubmit');
    const spinner = submitBtn.querySelector('.spinner-border');
    const defaultText = submitBtn.querySelector('.default-text');

    if (stored) {
      if (stored.name) nameInput.value = stored.name;
      if (stored.employeeId) idInput.value = stored.employeeId;
    }

    submitBtn.addEventListener('click', async () => {
      const name = nameInput.value.trim();
      const employeeId = idInput.value.trim();

      if (!name || !employeeId) {
        feedback.textContent = 'Vui lòng nhập đầy đủ tên và mã số nhân viên.';
        feedback.classList.remove('d-none');
        return;
      }

      feedback.classList.add('d-none');
      submitBtn.disabled = true;
      spinner.classList.remove('d-none');
      defaultText.classList.add('d-none');

      await submitProfile({ name, employeeId });
      saveProfile({ name, employeeId, timestamp: Date.now() });

      setTimeout(() => {
        spinner.classList.add('d-none');
        defaultText.classList.remove('d-none');
        submitBtn.disabled = false;
        const modalInstance = bootstrap.Modal.getInstance(modalElement);
        if (modalInstance) modalInstance.hide();
      }, 400);
    }, { once: true });

    const modalInstance = new bootstrap.Modal(modalElement);
    modalInstance.show();
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (typeof bootstrap === 'undefined') return;
    setupModalIfNeeded();
  });
})();
