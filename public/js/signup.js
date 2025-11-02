// signup.js
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('signupForm');
    const togglePasswordButtons = document.querySelectorAll('.toggle-password');
    const avatarInput = document.getElementById('avatarInput');
    const avatarPreview = document.querySelector('.avatar-preview');

    // パスワード表示/非表示の切り替え
    togglePasswordButtons.forEach(button => {
        button.addEventListener('click', function() {
            const input = this.previousElementSibling;
            const icon = this.querySelector('.material-icons');
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.textContent = 'visibility';
            } else {
                input.type = 'password';
                icon.textContent = 'visibility_off';
            }
        });
    });

    // プロフィール画像のプレビュー
    avatarInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    avatarPreview.innerHTML = `
                        <img src="${e.target.result}" alt="プロフィール画像" 
                             style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">
                    `;
                };
                reader.readAsDataURL(file);
            } else {
                showError('画像ファイルを選択してください');
            }
        }
    });

    // エラー表示
    function showError(elementId, message) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.textContent = message;
        }
    }

    // フォームバリデーション
    function validateForm() {
        let isValid = true;
        
        // 名前のバリデーション
        const name = document.getElementById('name').value.trim();
        if (!name) {
            showError('nameError', '名前を入力してください');
            isValid = false;
        } else {
            showError('nameError', '');
        }

        // メールアドレスのバリデーション
        const email = document.getElementById('email').value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email) {
            showError('emailError', 'メールアドレスを入力してください');
            isValid = false;
        } else if (!emailRegex.test(email)) {
            showError('emailError', '有効なメールアドレスを入力してください');
            isValid = false;
        } else {
            showError('emailError', '');
        }

        // パスワードのバリデーション
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (!password) {
            showError('passwordError', 'パスワードを入力してください');
            isValid = false;
        } else if (password.length < 8) {
            showError('passwordError', 'パスワードは8文字以上で入力してください');
            isValid = false;
        } else {
            showError('passwordError', '');
        }

        if (!confirmPassword) {
            showError('confirmPasswordError', '確認用パスワードを入力してください');
            isValid = false;
        } else if (password !== confirmPassword) {
            showError('confirmPasswordError', 'パスワードが一致しません');
            isValid = false;
        } else {
            showError('confirmPasswordError', '');
        }

        // 利用規約の同意確認
        const termsAgreement = document.getElementById('termsAgreement');
        if (!termsAgreement.checked) {
            showError('termsError', '利用規約に同意してください');
            isValid = false;
        } else {
            showError('termsError', '');
        }

        return isValid;
    }

    // フォーム送信
    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        // フォームデータの収集
        const formData = {
            name: document.getElementById('name').value.trim(),
            email: document.getElementById('email').value.trim(),
            accountType: document.querySelector('input[name="accountType"]:checked').value,
            createdAt: new Date().toISOString()
        };

        try {
            // ここに実際のAPI通信処理を実装
            // 現在はモックとしてlocalStorageに保存
            localStorage.setItem('userData', JSON.stringify(formData));
            
            // 成功時の処理
            window.location.href = '../index.html';
        } catch (error) {
            console.error('登録エラー:', error);
            alert('アカウントの作成に失敗しました。もう一度お試しください。');
        }
    });

    // 入力フィールドのリアルタイムバリデーション
    const inputs = form.querySelectorAll('input[required]');
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            if (!this.value) {
                this.classList.add('invalid');
                showError(`${this.id}Error`, 'この項目は必須です');
            } else {
                this.classList.remove('invalid');
                showError(`${this.id}Error`, '');
            }
        });
    });
});