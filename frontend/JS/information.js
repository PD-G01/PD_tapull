document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('report-form');
    const textarea = document.getElementById('report-text');
    const clearBtn = document.getElementById('report-clear');

    if (form) {
        form.addEventListener('submit', (event) => {
            event.preventDefault();
            const text = textarea?.value?.trim();
            if (!text) {
                alert('報告内容を入力してください。');
                return;
            }

            // ここでサーバ送信等の処理を行う（ダミー実装）
            alert('報告を受け付けました（ダミー）');
            form.reset();
        });
    }

    if (clearBtn && textarea) {
        clearBtn.addEventListener('click', () => {
            textarea.value = '';
        });
    }
});