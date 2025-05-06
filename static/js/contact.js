// /static/js/contact.js (デバッグログ追加版)

document.addEventListener('DOMContentLoaded', function() {
    console.log('[contact.js] DOMContentLoaded event fired.'); // ★追加

    const placeholder = document.getElementById('contact-addr');
    console.log('[contact.js] Found element with id="contact-addr":', placeholder); // ★追加

    if (placeholder) {
        console.log('[contact.js] contactElement exists, proceeding to create link.'); // ★追加
        // --- メールアドレスの部品 ---
        const user = 'contact_chibiquest-Data-Tool';
        const domain = 'alt4l.dev';
        // -------------------------

        const email = user + '@' + domain;
        console.log('[contact.js] Generated email:', email); // ★追加

        const link = document.createElement('a');
        link.href = 'mailto:' + email;
        link.textContent = email;
        console.log('[contact.js] Created link element:', link); // ★追加

        try {
             placeholder.replaceWith(link); // span要素を生成したリンク要素に置き換える
             console.log('[contact.js] Successfully replaced span with link.'); // ★追加
        } catch (e) {
             console.error('[contact.js] Error during replaceWith:', e); // ★追加
        }

    } else {
        console.error('[contact.js] Element with ID "contact-addr" was NOT found!'); // ★変更
    }
});