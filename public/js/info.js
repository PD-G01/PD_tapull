document.addEventListener('DOMContentLoaded', () => {
    const btnMessage = document.getElementById('btn-message');
    const btnShare = document.getElementById('btn-share');
    const reportForm = document.getElementById('report-form');
    const reportClear = document.getElementById('report-clear');

    if (btnMessage) {
        btnMessage.addEventListener('click', () => {
            location.href = 'mailto:info@example.org';
        });
    }

    if (btnShare) {
        btnShare.addEventListener('click', async () => {
            const shareData = {
                title: 'フードバンク みらい',
                text: 'この団体を共有します',
                url: location.href
            };
            if (navigator.share) {
                try { await navigator.share(shareData); } catch (e) { /* ユーザーがキャンセルした等 */ }
            } else if (navigator.clipboard) {
                try {
                    await navigator.clipboard.writeText(location.href);
                    alert('ページURLをクリップボードにコピーしました');
                } catch (e) {
                    prompt('このページのURL（コピーしてください）', location.href);
                }
            } else {
                prompt('このページのURL', location.href);
            }
        });
    }

    if (reportForm) {
        reportForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const text = document.getElementById('report-text')?.value.trim() || '';
            if (!text) {
                alert('報告内容を入力してください。');
                return;
            }
            // TODO: サーバー送信 (fetch) の実装
            alert('報告を受け付けました。ご協力ありがとうございます。');
            reportForm.reset();
        });
    }

    if (reportClear) {
        reportClear.addEventListener('click', () => {
            reportForm?.reset();
        });
    }
});