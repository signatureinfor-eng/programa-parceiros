/**
 * Mères Form System - Renderer
 * Handles dynamic UI generation, masks, and submission.
 */

document.addEventListener('DOMContentLoaded', () => {
    // 0. Load Overrides from Editor
    const themeOverrides = JSON.parse(localStorage.getItem('meres_theme_overrides') || '{}');
    const configOverrides = JSON.parse(localStorage.getItem('meres_forms_config') || 'null');

    // Apply Theme Overrides
    Object.entries(themeOverrides).forEach(([name, value]) => {
        document.documentElement.style.setProperty(name, value);
    });

    // Use Overridden Config or Default
    const activeFormsConfig = configOverrides || FORMS_CONFIG;

    // 1. Get Form Type from URL (Pathname slug or ?form=indicacao)
    const urlParams = new URLSearchParams(window.location.search);
    let formType = urlParams.get('form');
    
    // If no query param, try to get from pathname
    if (!formType) {
        const path = window.location.pathname;
        // Clean path: remove leading / and any trailing slashes or extensions like .html
        const slug = path.split('/').pop().replace(/\.(html|php|htm)$/, '') || 'partner';
        // Only use slug if it's not index, editor, etc.
        const reservedNames = ['index', 'editor', 'indicacao', 'style', 'script', 'renderer', 'config'];
        if (slug && !reservedNames.includes(slug)) {
            formType = slug;
        } else {
            formType = 'partner';
        }
    }

    const config = activeFormsConfig[formType];

    if (!config) {
        document.body.innerHTML = '<h1>Formulário não encontrado</h1>';
        return;
    }

    // 2. Base Elements
    const formContainer = document.getElementById('dynamicForm');
    const titleEl = document.getElementById('formTitle');
    const subtitleEl = document.getElementById('formSubtitle');
    const infoTextEl = document.getElementById('formInfo');
    const formIconEl = document.getElementById('formIcon');
    const bannerEl = document.querySelector('.banner-preview');
    const submitBtn = document.getElementById('submitBtn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoader = submitBtn.querySelector('.btn-loader');
    const successMessage = document.getElementById('successMessage');

    // Update Header
    titleEl.textContent = config.title;
    subtitleEl.textContent = config.subtitle;
    infoTextEl.textContent = config.infoText;
    if (formIconEl) formIconEl.textContent = config.icon || '📝';

    if (config.bannerUrl && bannerEl) {
        bannerEl.style.backgroundImage = `url('${config.bannerUrl}')`;
    }

    if (config.settings && config.settings.successMessage) {
        const successTitle = successMessage.querySelector('h3');
        if (successTitle) successTitle.textContent = config.settings.successMessage;
    }

    // 3. Render Fields
    let currentRow = null;

    config.fields.forEach((field, index) => {
        const group = document.createElement('div');
        group.className = 'form-group';
        
        // Label & Hint
        const label = document.createElement('label');
        label.setAttribute('for', field.id);
        label.innerHTML = `<span class="label-bullet">✦</span> ${field.label}`;
        group.appendChild(label);

        if (field.hint) {
            const hint = document.createElement('p');
            hint.className = 'field-label-hint';
            hint.textContent = field.hint;
            group.appendChild(hint);
        }

        // Input
        if (field.type === 'radio' || field.type === 'checkbox') {
            const optionsGroup = document.createElement('div');
            optionsGroup.className = 'options-group';
            
            (field.options || []).forEach((opt, oIdx) => {
                const optDiv = document.createElement('div');
                optDiv.className = 'option-item';
                
                const optInput = document.createElement('input');
                optInput.type = field.type;
                optInput.id = `${field.id}_opt${oIdx}`;
                optInput.name = field.id;
                optInput.value = opt;
                if (field.required) optInput.required = true;
                
                const optLabel = document.createElement('label');
                optLabel.setAttribute('for', `${field.id}_opt${oIdx}`);
                optLabel.textContent = opt;
                optLabel.className = 'opt-label';
                
                optDiv.appendChild(optLabel);
                optionsGroup.appendChild(optDiv);
            });
            group.appendChild(optionsGroup);
        } else if (field.type === 'select') {
            const select = document.createElement('select');
            select.id = field.id;
            select.name = field.id;
            if (field.required) select.required = true;
            
            const defaultOpt = document.createElement('option');
            defaultOpt.value = "";
            defaultOpt.textContent = field.placeholder || "Escolha uma opção...";
            defaultOpt.disabled = true;
            defaultOpt.selected = true;
            select.appendChild(defaultOpt);

            (field.options || []).forEach(opt => {
                const o = document.createElement('option');
                o.value = opt;
                o.textContent = opt;
                select.appendChild(o);
            });
            group.appendChild(select);
        } else if (field.type === 'paragraph') {
            const textarea = document.createElement('textarea');
            textarea.id = field.id;
            textarea.name = field.id;
            textarea.placeholder = field.placeholder || 'Sua resposta...';
            if (field.required) textarea.required = true;
            group.appendChild(textarea);
        } else {
            const input = document.createElement('input');
            input.type = field.type;
            input.id = field.id;
            input.name = field.id;
            input.placeholder = field.placeholder || 'Sua resposta...';
            if (field.required) input.required = true;
            
            // Apply Mask if needed (only if value exists to avoid characters on empty fields)
            if (field.mask) applyMask(input, field.mask);
            if (field.type === 'tel' || field.type === 'phone') applyMask(input, 'phone');
            if (field.type === 'cpf') applyMask(input, 'cpf');
            if (field.type === 'cnpj') applyMask(input, 'cnpj');

            group.appendChild(input);
        }

        // Handle Layout (Rows - MAX 2 items)
        if (field.halfWidth) {
            if (!currentRow || currentRow.children.length >= 2) {
                currentRow = document.createElement('div');
                currentRow.className = 'form-row';
                formContainer.appendChild(currentRow);
            }
            currentRow.appendChild(group);
            
            // Close row if next isn't half or is last or we reached 2 items
            const nextField = config.fields[index + 1];
            if (!nextField || !nextField.halfWidth || currentRow.children.length >= 2) {
                currentRow = null;
            }
        } else {
            formContainer.appendChild(group);
            currentRow = null;
        }
    });

    // 4. Mask Logic
    function applyMask(input, type) {
        input.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            
            if (type === 'cpf') {
                if (value.length > 11) value = value.slice(0, 11);
                value = value.replace(/(\d{3})(\d)/, '$1.$2');
                value = value.replace(/(\d{3})(\d)/, '$1.$2');
                value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
            } 
            else if (type === 'cnpj') {
                if (value.length > 14) value = value.slice(0, 14);
                value = value.replace(/^(\d{2})(\d)/, '$1.$2');
                value = value.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
                value = value.replace(/\.(\d{3})(\d)/, '.$1/$2');
                value = value.replace(/(\d{4})(\d)/, '$1-$2');
            }
            else if (type === 'phone') {
                if (value.length > 11) value = value.slice(0, 11);
                if (value.length > 10) {
                    value = value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
                } else if (value.length > 6) {
                    value = value.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
                } else if (value.length > 2) {
                    value = value.replace(/(\d{2})(\d{0,5})/, '($1) $2');
                } else if (value.length > 0) {
                    value = value.replace(/(\d{0,2})/, '($1');
                }
            }
            
            e.target.value = value;
        });
    }

    // 5. Submission
    const form = document.getElementById('mainForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        submitBtn.disabled = true;
        btnText.classList.add('hidden');
        btnLoader.classList.remove('hidden');

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        console.log('Submitting:', formType, data);

        // Local Storage Persistence
        const responses = JSON.parse(localStorage.getItem('meres_responses') || '{}');
        if (!responses[formType]) responses[formType] = [];
        
        responses[formType].push({
            id: Date.now(),
            timestamp: new Date().toISOString(),
            data: data
        });
        
        localStorage.setItem('meres_responses', JSON.stringify(responses));

        // Mock Submission (Simulating API delay)
        setTimeout(() => {
            form.classList.add('hidden');
            const header = document.querySelector('header');
            if (header) header.classList.add('hidden');
            
            const infoBox = document.querySelector('.info-box');
            if (infoBox) infoBox.classList.add('hidden');
            
            successMessage.classList.remove('hidden');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 1200);
    });
});
