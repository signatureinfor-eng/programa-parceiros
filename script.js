/**
 * Mères Partners Landing Page - JavaScript Logic
 * Includes: Masks, Validation, Form Submission
 */

document.addEventListener('DOMContentLoaded', () => {
    // Determine which form is present on the page
    const partnerForm = document.getElementById('partnerForm');
    const referralForm = document.getElementById('referralForm');
    const form = partnerForm || referralForm;

    if (!form) return;

    const submitBtn = document.getElementById('submitBtn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoader = submitBtn.querySelector('.btn-loader');
    const successMessage = document.getElementById('successMessage');

    // --- CONFIGURATION ---
    const SUBMIT_ENDPOINT = 'https://your-webhook-endpoint.com/api/partners';

    // --- INPUT MASKS ---
    
    // Mask for CPF (reusable function)
    const applyCPFMask = (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 11) value = value.slice(0, 11);
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        e.target.value = value;
    };

    const cpfInput = document.getElementById('cpf');
    if (cpfInput) cpfInput.addEventListener('input', applyCPFMask);

    const cpfClienteInput = document.getElementById('cpfCliente');
    if (cpfClienteInput) cpfClienteInput.addEventListener('input', applyCPFMask);

    // Mask for CNPJ
    const cnpjInput = document.getElementById('cnpj');
    if (cnpjInput) {
        cnpjInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 14) value = value.slice(0, 14);
            value = value.replace(/^(\d{2})(\d)/, '$1.$2');
            value = value.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
            value = value.replace(/\.(\d{3})(\d)/, '.$1/$2');
            value = value.replace(/(\d{4})(\d)/, '$1-$2');
            e.target.value = value;
        });
    }

    // Mask for Phone
    const phoneInput = document.getElementById('numero');
    if (phoneInput) {
        phoneInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 11) value = value.slice(0, 11);
            if (value.length > 10) {
                value = value.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
            } else if (value.length > 5) {
                value = value.replace(/^(\d{2})(\d{4})(\d{0,4})$/, '($1) $2-$3');
            } else if (value.length > 2) {
                value = value.replace(/^(\d{2})(\d{0,5})$/, '($1) $2');
            } else if (value.length > 0) {
                value = value.replace(/^(\d*)$/, '($1');
            }
            e.target.value = value;
        });
    }

    // --- FORM SUBMISSION ---

    async function submitFormData(data, isReferral) {
        console.log(`Sending ${isReferral ? 'Referral' : 'Partner'} data to:`, SUBMIT_ENDPOINT, data);
        return new Promise((resolve) => {
            setTimeout(() => resolve({ success: true }), 1500);
        });
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        submitBtn.disabled = true;
        btnText.classList.add('hidden');
        btnLoader.classList.remove('hidden');

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        const isReferral = !!referralForm;

        try {
            const result = await submitFormData(data, isReferral);

            if (result.success) {
                form.classList.add('hidden');
                document.querySelector('.subtitle').classList.add('hidden');
                document.querySelector('h1').classList.add('hidden');
                document.querySelector('.info-box').classList.add('hidden');
                successMessage.classList.remove('hidden');
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                alert('Ocorreu um erro. Por favor, tente novamente.');
            }
        } catch (error) {
            console.error('Submission error:', error);
            alert('Erro de conexão.');
        } finally {
            if (!successMessage.classList.contains('hidden')) return;
            submitBtn.disabled = false;
            btnText.classList.remove('hidden');
            btnLoader.classList.add('hidden');
        }
    });
});

