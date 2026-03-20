/**
 * Mères Form System - Advanced 3-Column Editor logic
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENTS ---
    
    // Sidebars
    const settingsContainer = document.getElementById('settingsContainer');
    
    // Header & Main Inputs
    const formHeaderCard = document.getElementById('formHeaderCard');
    const formTitleInput = document.getElementById('formTitleInput');
    const formSubtitleInput = document.getElementById('formSubtitleInput');
    const formInfoInput = document.getElementById('formInfoInput');
    const formSelector = document.getElementById('formSelector');
    const topFormTitle = document.getElementById('topFormTitle');
    const fieldsContainer = document.getElementById('fieldsContainer');
    const previewFrame = document.getElementById('previewFrame');
    const previewOverlay = document.getElementById('previewOverlay');
    const formIcon = document.getElementById('formIcon');
    const responsesView = document.getElementById('responsesView');
    const responsesList = document.getElementById('responsesList');
    const responseCounter = document.getElementById('responseCounter');
    const addQuestionContainer = document.querySelector('.add-question-container');
    const footerPreviewCard = document.querySelector('.footer-preview-card');
    const settingsView = document.getElementById('settingsView');
    const successMessageInput = document.getElementById('successMessageInput');
    const webhookInput = document.getElementById('webhookInput');
    const collectEmailToggle = document.getElementById('collectEmailToggle');
    const limitOneToggle = document.getElementById('limitOneToggle');
    const bannerPreview = document.getElementById('bannerPreview');
    const changeCoverBtn = document.getElementById('changeCoverBtn');

    // Left Sidebar Elements
    const colorSwatches = document.querySelectorAll('.color-swatch');
    const fontSelector = document.getElementById('fontSelector');
    const elementBtns = document.querySelectorAll('.element-btn');
    
    // --- STATE ---
    let currentConfig = JSON.parse(localStorage.getItem('meres_forms_config')) || JSON.parse(JSON.stringify(FORMS_CONFIG));
    let currentTheme = JSON.parse(localStorage.getItem('meres_theme_overrides') || '{}');
    let activeFieldId = null;

    // --- INITIALIZATION ---
    function init() {
        checkEmbeddedMode();
        populateFormSelector();
        applyThemeToEditor();
        updateEditorUI();
        updateHeaderSettings(); // Ensure sidebar is initialized
        setupEventListeners();
    }

    function checkEmbeddedMode() {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('embedded') === 'true') {
            const topNav = document.querySelector('.top-nav');
            const editorLayout = document.querySelector('.editor-layout');
            const embeddedHeader = document.getElementById('embeddedHeader');
            
            if (topNav) topNav.style.display = 'none';
            if (embeddedHeader) embeddedHeader.classList.remove('hidden');
            
            if (editorLayout) {
                editorLayout.style.marginTop = '0';
                editorLayout.style.height = '100vh';
            }
        }
    }

    function setupEventListeners() {
        // Tab Switching
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const mode = tab.dataset.mainTab;
                document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
                
                // Sync all tabs with the same mode
                document.querySelectorAll(`.nav-tab[data-main-tab="${mode}"]`).forEach(t => t.classList.add('active'));

                if (mode === 'preview') showPreview();
                if (mode === 'questions') {
                    previewOverlay.classList.add('hidden');
                    responsesView.classList.add('hidden');
                    fieldsContainer.classList.remove('hidden');
                    formHeaderCard.classList.remove('hidden');
                    settingsView.classList.add('hidden'); // Fix: ensure settings hidden
                    if (addQuestionContainer) addQuestionContainer.classList.remove('hidden');
                    if (footerPreviewCard) footerPreviewCard.classList.remove('hidden');
                    renderQuestions();
                }
                if (mode === 'responses') {
                    previewOverlay.classList.add('hidden');
                    responsesView.classList.remove('hidden');
                    fieldsContainer.classList.add('hidden');
                    formHeaderCard.classList.add('hidden');
                    settingsView.classList.add('hidden');
                    if (addQuestionContainer) addQuestionContainer.classList.add('hidden');
                    if (footerPreviewCard) footerPreviewCard.classList.add('hidden');
                    renderResponses();
                }
                if (mode === 'settings') {
                    previewOverlay.classList.add('hidden');
                    responsesView.classList.add('hidden');
                    fieldsContainer.classList.add('hidden');
                    formHeaderCard.classList.add('hidden');
                    if (addQuestionContainer) addQuestionContainer.classList.add('hidden');
                    if (footerPreviewCard) footerPreviewCard.classList.add('hidden');
                    // Show settings panel in the canvas
                    settingsView.classList.remove('hidden');
                    renderSettings();
                    // Also show general settings in the sidebar
                    updateHeaderSettings();
                }
            });
        });

        // Form Selection Sync
        const allSelectors = document.querySelectorAll('#formSelector, #formSelectorSidebar');
        allSelectors.forEach(select => {
            select.addEventListener('change', (e) => {
                const val = e.target.value;
                allSelectors.forEach(s => s.value = val);
                updateEditorUI();
                updatePreview();
            });
        });

        // Header Card Sync & Selection
        [formTitleInput, formSubtitleInput, formInfoInput].forEach(input => {
            input.addEventListener('input', () => {
                const slug = formSelector.value || (document.getElementById('formSelectorSidebar') ? document.getElementById('formSelectorSidebar').value : '');
                if (!currentConfig[slug]) return;
                currentConfig[slug].title = formTitleInput.value;
                currentConfig[slug].subtitle = formSubtitleInput.value;
                currentConfig[slug].infoText = formInfoInput.value;
                if (topFormTitle) topFormTitle.value = formTitleInput.value;
                
                // Update names in selectors
                allSelectors.forEach(select => {
                    const opt = select.querySelector(`option[value="${slug}"]`);
                    if (opt) opt.textContent = formTitleInput.value;
                });
            });
        });

        formHeaderCard.addEventListener('click', () => {
            document.querySelectorAll('.question-card').forEach(c => c.classList.remove('active'));
            formHeaderCard.classList.add('active');
            activeFieldId = null;
            updateHeaderSettings();
        });

        // Left Sidebar: Elements
        elementBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.dataset.type;
                addNewField(type);
            });
        });

        // Left Sidebar: Styles
        colorSwatches.forEach(swatch => {
            swatch.addEventListener('click', () => {
                colorSwatches.forEach(s => s.classList.remove('active'));
                swatch.classList.add('active');
                const color = swatch.dataset.color;
                document.documentElement.style.setProperty('--primary-color', color);
                currentTheme['--primary-color'] = color;
                updatePreview();
            });
        });

        fontSelector.addEventListener('change', () => {
            const font = fontSelector.value;
            document.documentElement.style.setProperty('--font-family', font);
            currentTheme['--font-family'] = font;
            updatePreview();
        });

        // Add Question Button in Canvas
        document.getElementById('addFieldBtn').addEventListener('click', () => addNewField());

        // Global Actions
        document.querySelectorAll('#saveAllBtn, #saveAllBtnSidebar').forEach(btn => {
            btn.addEventListener('click', saveConfig);
        });
        
        document.querySelectorAll('#createNewFormBtnTop, #createNewFormBtnSidebar').forEach(btn => {
            btn.addEventListener('click', createForm);
        });

        document.getElementById('clearResponsesBtn').addEventListener('click', clearResponses);
        
        // Preview Action
        const previewBtn = document.getElementById('previewBtnTop');
        if (previewBtn) previewBtn.addEventListener('click', showPreview);
        
        const closePreviewBtn = document.getElementById('closePreviewBtn');
        if (closePreviewBtn) closePreviewBtn.addEventListener('click', () => {
            previewOverlay.classList.add('hidden');
        });
    }

    // --- UI RENDERING ---
    function populateFormSelector() {
        const allSelectors = document.querySelectorAll('#formSelector, #formSelectorSidebar');
        allSelectors.forEach(select => {
            const currentVal = select.value;
            select.innerHTML = '';
            // select.className = 'modern-selector-flat'; // Already set in HTML for sidebar
            Object.keys(currentConfig).forEach(slug => {
                const opt = document.createElement('option');
                opt.value = slug;
                opt.textContent = currentConfig[slug].title;
                select.appendChild(opt);
            });
            if (currentVal && currentConfig[currentVal]) select.value = currentVal;
            else if (currentConfig['partner']) select.value = 'partner'; // Default
        });
    }

    function updateEditorUI() {
        const allSelectors = document.querySelectorAll('#formSelector, #formSelectorSidebar');
        const slug = allSelectors[0].value;
        const form = currentConfig[slug];
        if (!form) return;

        formTitleInput.value = form.title;
        topFormTitle.value = form.title;
        formSubtitleInput.value = form.subtitle || '';
        formInfoInput.value = form.infoText || '';
        if (formIcon) formIcon.textContent = form.icon || '📝';

        // Update Banner Preview
        if (bannerPreview) {
            const url = form.bannerUrl || 'https://images.unsplash.com/photo-1454165833741-979f244a1e7d?q=80&amp;w=2070&amp;auto=format&amp;fit=crop';
            bannerPreview.style.backgroundImage = `url('${url}')`;
        }

        renderQuestions();
    }


    function renderSettings() {
        const slug = formSelector.value;
        const form = currentConfig[slug];
        if (!form) return;

        // Initialize settings if missing
        if (!form.settings) {
            form.settings = {
                successMessage: "Sua resposta foi registrada.",
                collectEmail: false,
                limitOne: false,
                webhook: ""
            };
        }

        const settings = form.settings;

        // Populate fields
        successMessageInput.value = settings.successMessage || "";
        webhookInput.value = settings.webhook || "";
        
        collectEmailToggle.className = `toggle-switch ${settings.collectEmail ? 'active' : ''}`;
        limitOneToggle.className = `toggle-switch ${settings.limitOne ? 'active' : ''}`;

        // Event Listeners for settings (using input/click directly for persistence)
        successMessageInput.oninput = (e) => {
            settings.successMessage = e.target.value;
            saveConfigToLocalStorage();
        };

        webhookInput.oninput = (e) => {
            settings.webhook = e.target.value;
            saveConfigToLocalStorage();
        };

        collectEmailToggle.onclick = () => {
            settings.collectEmail = !settings.collectEmail;
            collectEmailToggle.classList.toggle('active');
            saveConfigToLocalStorage();
        };

        limitOneToggle.onclick = () => {
            settings.limitOne = !settings.limitOne;
            limitOneToggle.classList.toggle('active');
            saveConfigToLocalStorage();
        };
    }

    function saveConfigToLocalStorage() {
        localStorage.setItem('meres_forms_config', JSON.stringify(currentConfig));
    }

    function renderQuestions() {
        const slug = formSelector.value;
        const fields = currentConfig[slug].fields;
        fieldsContainer.innerHTML = '';

        let currentRow = null;

        fields.forEach((field, index) => {
            const card = document.createElement('div');
            card.className = `form-card question-card ${activeFieldId === field.id ? 'active' : ''} ${field.halfWidth ? 'half-width' : ''}`;
            card.dataset.id = field.id;
            
            card.innerHTML = `
                <div class="question-header" style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div class="drag-handle">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="color: #CBD5E1;"><circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/></svg>
                        </div>
                        <span class="q-label-display">${field.label || 'Pergunta sem título'}</span>
                    </div>
                    <div class="reorder-controls-mini" style="display: flex; gap: 4px; opacity: 0; transition: opacity 0.2s;">
                        <button class="btn-width-toggle" onclick="event.stopPropagation(); toggleFieldWidth(${index})" title="Alternar largura (50%/100%)">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="3" width="18" height="18" rx="2" stroke-dasharray="${field.halfWidth ? '4 2' : '0'}"/><line x1="12" y1="3" x2="12" y2="21" style="display:${field.halfWidth ? 'none' : 'block'}"/></svg>
                        </button>
                        <button class="btn-reorder-mini" onclick="event.stopPropagation(); moveField(${index}, -1)" ${index === 0 ? 'disabled' : ''}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="m18 15-6-6-6 6"/></svg>
                        </button>
                        <button class="btn-reorder-mini" onclick="event.stopPropagation(); moveField(${index}, 1)" ${index === fields.length - 1 ? 'disabled' : ''}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="m6 9 6 6 6-6"/></svg>
                        </button>
                    </div>
                </div>
                ${field.hint ? `<div class="q-hint-display" style="font-size: 13px; color: #64748B; margin-top: 4px;">${field.hint}</div>` : ''}
                <div class="question-body" style="margin-top: 20px;">
                    ${renderQuestionBody(field, index)}
                </div>
            `;

            card.addEventListener('click', (e) => {
                e.stopPropagation();
                document.querySelectorAll('.question-card, .header-card').forEach(c => c.classList.remove('active'));
                card.classList.add('active');
                activeFieldId = field.id;
                updateSettingsSidebar(field, index);
            });

            // Layout logic: group half-width fields into rows (MAX 2 items per row)
            if (field.halfWidth) {
                if (!currentRow || currentRow.children.length >= 2) {
                    currentRow = document.createElement('div');
                    currentRow.className = 'form-row editor-row';
                    fieldsContainer.appendChild(currentRow);
                }
                currentRow.appendChild(card);
                
                const nextField = fields[index + 1];
                // Reset row if next is full-width or if we just reached 2 items
                if (!nextField || !nextField.halfWidth || currentRow.children.length >= 2) {
                    currentRow = null;
                }
            } else {
                fieldsContainer.appendChild(card);
                currentRow = null;
            }
        });

        // If no active field, select the header by default
        if (!activeFieldId) {
            formHeaderCard.classList.add('active');
            updateHeaderSettings();
        } else {
             const activeIdx = fields.findIndex(f => f.id === activeFieldId);
             if (activeIdx !== -1) updateSettingsSidebar(fields[activeIdx], activeIdx);
        }
    }

    function renderQuestionBody(field, index) {
        if (field.type === 'radio' || field.type === 'checkbox' || field.type === 'select') {
            const options = field.options || ['Opção 1'];
            if (!field.options) field.options = options;
            
            if (field.type === 'select') {
                return `
                    <div class="select-preview" style="padding: 10px 14px; border: 1.5px solid #E2E8F0; border-radius: 8px; color: #64748B; font-size: 14px; display: flex; justify-content: space-between; align-items: center; background: white;">
                        <span>Escolha uma opção...</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m6 9 6 6 6-6"/></svg>
                    </div>
                `;
            }

            let html = '<div class="options-preview" style="display: flex; flex-direction: column; gap: 12px;">';
            options.forEach((opt, oIdx) => {
                html += `
                    <div class="option-item-preview" style="display: flex; align-items: center; gap: 10px;">
                        <input type="${field.type}" disabled>
                        <span class="opt-label-preview" style="font-size: 14px; color: #1E293B;">${opt}</span>
                    </div>
                `;
            });
            html += '</div>';
            return html;
        } else if (field.type === 'paragraph') {
            return `<div class="text-placeholder-preview multiline" style="padding: 12px; border: 1.5px dashed #CBD5E1; border-radius: 8px; color: #94A3B8; font-size: 14px; min-height: 80px;">Resposta longa do usuário aparecerá aqui...</div>`;
        } else {
            return `<div class="text-placeholder-preview" style="padding: 8px 0; border-bottom: 1.5px dotted #CBD5E1; color: #94A3B8; font-size: 14px; width: 60%;">Resposta do usuário aparecerá aqui...</div>`;
        }
    }

    function updateSettingsSidebar(field, index) {
        const slug = formSelector.value;
        const fields = currentConfig[slug].fields; // Get fields to determine disabled state for reorder buttons

        settingsContainer.innerHTML = `
            <div class="settings-panel">
                <h4 class="section-title">Configurações da Pergunta</h4>
                
                <div class="field-actions" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <div class="reorder-controls" style="display: flex; gap: 8px;">
                        <button class="btn-reorder up" onclick="event.stopPropagation(); moveField(${index}, -1)" title="Mover para cima" ${index === 0 ? 'disabled' : ''}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m18 15-6-6-6 6"/></svg>
                        </button>
                        <button class="btn-reorder down" onclick="event.stopPropagation(); moveField(${index}, 1)" title="Mover para baixo" ${index === fields.length - 1 ? 'disabled' : ''}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m6 9 6 6 6-6"/></svg>
                        </button>
                    </div>
                    <button class="btn-delete-field btn-ghost text-danger" onclick="event.stopPropagation(); deleteField(${index})" title="Excluir">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    </button>
                </div>

                <div class="settings-group">
                    <label>Título da Pergunta</label>
                    <input type="text" class="style-select" id="settLabel" value="${field.label}">
                </div>

                <div class="settings-group">
                    <label>Tipo de Pergunta</label>
                    <select class="style-select" id="settType">
                        <option value="text" ${field.type === 'text' ? 'selected' : ''}>Resposta Curta</option>
                        <option value="paragraph" ${field.type === 'paragraph' ? 'selected' : ''}>Parágrafo</option>
                        <option value="radio" ${field.type === 'radio' ? 'selected' : ''}>Múltipla Escolha</option>
                        <option value="checkbox" ${field.type === 'checkbox' ? 'selected' : ''}>Caixas de Seleção</option>
                        <option value="tel" ${field.type === 'tel' ? 'selected' : ''}>Telefone</option>
                        <option value="email" ${field.type === 'email' ? 'selected' : ''}>E-mail</option>
                        <option value="cpf" ${field.type === 'cpf' ? 'selected' : ''}>CPF</option>
                        <option value="cnpj" ${field.type === 'cnpj' ? 'selected' : ''}>CNPJ</option>
                        <option value="select" ${field.type === 'select' ? 'selected' : ''}>Seleção (Dropdown)</option>
                    </select>
                </div>

                <div class="settings-group">
                    <div class="settings-row">
                        <span>Campo Obrigatório</span>
                        <div class="toggle-switch ${field.required ? 'active' : ''}" id="settRequired"></div>
                    </div>
                </div>

                ${(field.type === 'radio' || field.type === 'checkbox' || field.type === 'select') ? `
                    <div class="settings-group">
                        <label>Opções</label>
                        <div id="optionsEditor" class="options-editor">
                            ${(field.options || []).map((opt, i) => `
                                <div class="option-edit-item" style="display: flex; gap: 8px; margin-bottom: 8px;">
                                    <input type="text" class="style-select" value="${opt}" oninput="updateOption(${index}, ${i}, this.value)">
                                    <button class="btn-ghost text-danger" onclick="removeOption(${index}, ${i})">×</button>
                                </div>
                            `).join('')}
                            <button class="btn-ghost" style="width: 100%; border: 1.5px dashed #CBD5E1; margin-top: 8px;" onclick="addOption(${index})">+ Adicionar Opção</button>
                        </div>
                    </div>
                ` : ''}

                <div class="settings-group">
                    <label>Dica / Instruções</label>
                    <textarea class="settings-textarea" id="settHint" placeholder="Adicione um contexto útil...">${field.hint || ''}</textarea>
                </div>

                <div class="sidebar-divider"></div>

                <div class="settings-group">
                    <label>Largura do Layout</label>
                    <select class="style-select" id="settWidth">
                        <option value="false" ${!field.halfWidth ? 'selected' : ''}>Largura Total (100%)</option>
                        <option value="true" ${field.halfWidth ? 'selected' : ''}>Meia Largura (50%)</option>
                    </select>
                </div>

                <div class="settings-group">
                    <div class="settings-row" style="gap: 8px;">
                        <button class="btn-ghost text-danger" id="settDelete" style="flex:1">Excluir</button>
                        <button class="btn-ghost" id="settDuplicate" style="flex:1">Duplicar</button>
                    </div>
                </div>
            </div>
        `;

        // Settings Listeners
        const configField = currentConfig[slug].fields[index];

        document.getElementById('settLabel').addEventListener('input', (e) => {
            configField.label = e.target.value;
            renderQuestions();
        });

        document.getElementById('settType').addEventListener('change', (e) => {
            configField.type = e.target.value;
            renderQuestions();
        });

        document.getElementById('settRequired').addEventListener('click', (e) => {
            configField.required = !configField.required;
            e.target.classList.toggle('active');
            updatePreview();
        });

        document.getElementById('settHint').addEventListener('input', (e) => {
            configField.hint = e.target.value;
            renderQuestions();
        });

        document.getElementById('settWidth').addEventListener('change', (e) => {
            configField.halfWidth = e.target.value === 'true';
            updatePreview();
        });

        document.getElementById('settDelete').addEventListener('click', () => {
            deleteField(index);
        });

        document.getElementById('settDuplicate').addEventListener('click', () => {
            const copy = JSON.parse(JSON.stringify(configField));
            copy.id = Date.now().toString();
            currentConfig[slug].fields.splice(index + 1, 0, copy);
            renderQuestions();
        });
    }

    function updateHeaderSettings() {
        const slug = formSelector.value;
        settingsContainer.innerHTML = `
            <div class="settings-panel">
                <h4 class="section-title">Configurações Gerais</h4>
                <p style="font-size: 13px; color: #64748B; margin-bottom: 20px;">Personalize a identidade do seu formulário no Notion-style.</p>
                
                <div class="settings-group">
                    <label>Link Público de Compartilhamento</label>
                    <div style="display: flex; gap: 8px; align-items: stretch;">
                        <input type="text" class="style-select" id="publicLinkInput" readonly style="background: #F8FAFC; cursor: pointer; flex: 1; font-size: 13px; border-color: #E2E8F0;" onclick="this.select(); document.execCommand('copy'); alert('Link copiado!')">
                        <button class="btn-ghost" style="padding: 0 12px; border: 1.5px solid #E2E8F0; border-radius: 8px;" onclick="const input = document.getElementById('publicLinkInput'); input.select(); document.execCommand('copy'); alert('Link copiado!')" title="Copiar Link">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                        </button>
                    </div>
                    <p style="font-size: 11px; color: #64748B; margin-top: 6px; line-height: 1.4;">Este é o link profissional para enviar aos seus clientes e parceiros.</p>
                </div>

                <div class="settings-group">
                    <label>Ícone da Página (Emoji)</label>
                    <input type="text" class="style-select" id="settIcon" value="${currentConfig[slug]?.icon || '📝'}" placeholder="Cole um emoji aqui...">
                </div>

                <div class="settings-group">
                    <label>URL da Imagem de Capa</label>
                    <input type="text" class="style-select" id="bannerUrlInput" placeholder="URL da imagem de capa">
                </div>

                <div class="sidebar-divider"></div>

                <div class="settings-group">
                    <label>Ações do Formulário</label>
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        <button class="btn-ghost text-danger" id="resetToDefaultBtn" style="text-align: left; padding: 10px;">Resetar para Padrões</button>
                        <button class="btn-ghost text-danger" id="deleteCurrentFormBtn" style="text-align: left; padding: 10px;">Excluir Formulário Atual</button>
                    </div>
                </div>
                
                <div class="sidebar-divider"></div>
                
                <div class="pro-tip-box" style="margin-top: 0;">
                    <h5 class="pro-tip-title">Dica de Tema</h5>
                    <p>Use a barra lateral esquerda para alterar cores e fontes de todo o sistema de formulários.</p>
                </div>
            </div>
        `;

        // Update Public Link
        const publicLinkInput = document.getElementById('publicLinkInput');
        if (publicLinkInput) {
            let baseUrl = window.location.origin + window.location.pathname.replace('editor.html', '');
            if (window.location.protocol === 'file:') {
                baseUrl = 'https://parceiros.meres.com.br/';
            }
            const formSlug = slug === 'partner' ? '' : slug;
            publicLinkInput.value = baseUrl + formSlug;
        }

        document.getElementById('settIcon').addEventListener('input', (e) => {
            currentConfig[slug].icon = e.target.value;
            formIcon.textContent = e.target.value;
            updatePreview();
        });

        // Banner URL Sidebar sync
        const sidebarBannerInput = document.getElementById('bannerUrlInput');
        if (sidebarBannerInput) {
            sidebarBannerInput.value = currentConfig[slug].bannerUrl || '';
            sidebarBannerInput.addEventListener('input', (e) => {
                const url = e.target.value;
                currentConfig[slug].bannerUrl = url;
                if (bannerPreview) bannerPreview.style.backgroundImage = url ? `url('${url}')` : '';
                updatePreview();
            });
        }

        // Change Cover Button Logic
        if (changeCoverBtn) {
            changeCoverBtn.onclick = (e) => {
                e.stopPropagation();
                const newUrl = prompt("Insira a URL da nova imagem de capa:", currentConfig[slug].bannerUrl || "");
                if (newUrl !== null) {
                    currentConfig[slug].bannerUrl = newUrl;
                    if (bannerPreview) bannerPreview.style.backgroundImage = `url('${newUrl}')`;
                    if (sidebarBannerInput) sidebarBannerInput.value = newUrl;
                    updatePreview();
                }
            };
        }

        document.getElementById('resetToDefaultBtn').addEventListener('click', resetToDefault);
        document.getElementById('deleteCurrentFormBtn').addEventListener('click', deleteForm);
    }

    function renderResponses() {
        const slug = formSelector.value;
        const allResponses = JSON.parse(localStorage.getItem('meres_responses') || '{}');
        const responses = allResponses[slug] || [];
        
        responseCounter.textContent = `${responses.length} ${responses.length === 1 ? 'resposta' : 'respostas'}`;
        responsesList.innerHTML = '';

        if (responses.length === 0) {
            responsesList.innerHTML = `
                <div class="empty-state">
                    <p>Ainda não há respostas para este formulário.</p>
                </div>
            `;
            return;
        }

        // Sort by newest
        const sortedResponses = [...responses].reverse();

        sortedResponses.forEach(resp => {
            const card = document.createElement('div');
            card.className = 'response-card';
            
            const date = new Date(resp.timestamp).toLocaleString('pt-BR');
            
            let dataHtml = '';
            Object.entries(resp.data).forEach(([key, val]) => {
                // Find label from config if possible
                const field = currentConfig[slug].fields.find(f => f.id === key);
                const label = field ? field.label : key;
                dataHtml += `
                    <div class="response-field">
                        <span class="resp-label">${label}:</span>
                        <span class="resp-value">${val}</span>
                    </div>
                `;
            });

            card.innerHTML = `
                <div class="response-card-header">
                    <span class="resp-id">ID: ${resp.id}</span>
                    <span class="resp-date">${date}</span>
                </div>
                <div class="response-card-body">
                    ${dataHtml}
                </div>
            `;
            responsesList.appendChild(card);
        });
    }

    function clearResponses() {
        const slug = formSelector.value;
        if (confirm(`Deseja limpar todas as respostas do formulário "${currentConfig[slug].title}"?`)) {
            const allResponses = JSON.parse(localStorage.getItem('meres_responses') || '{}');
            delete allResponses[slug];
            localStorage.setItem('meres_responses', JSON.stringify(allResponses));
            renderResponses();
        }
    }

    // --- LOGIC ---
    function addNewField(type = 'text') {
        const slug = formSelector.value;
        const newField = {
            id: Date.now().toString(),
            label: "Pergunta sem título",
            type: type,
            placeholder: type === 'cpf' ? '000.000.000-00' : (type === 'cnpj' ? '00.000.000/0000-00' : (type === 'select' ? "Escolha uma opção..." : "Sua resposta")),
            options: (type === 'radio' || type === 'checkbox' || type === 'select') ? ['Opção 1', 'Opção 2'] : undefined,
            required: false,
            hint: ""
        };
        currentConfig[slug].fields.push(newField);
        activeFieldId = newField.id;
        renderQuestions();
        
        // Scroll to the new field
        setTimeout(() => {
            const newCard = document.querySelector(`[data-id="${activeFieldId}"]`);
            if (newCard) newCard.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    }

    function showPreview() {
        previewOverlay.classList.remove('hidden');
        updatePreview();
    }

    function updatePreview() {
        const slug = formSelector.value;
        const query = slug === 'partner' ? '?t=' : `?form=${slug}&t=`;
        localStorage.setItem('meres_forms_config', JSON.stringify(currentConfig));
        localStorage.setItem('meres_theme_overrides', JSON.stringify(currentTheme));
        previewFrame.src = 'index.html' + query + Date.now();
    }

    function saveConfig() {
        localStorage.setItem('meres_forms_config', JSON.stringify(currentConfig));
        localStorage.setItem('meres_theme_overrides', JSON.stringify(currentTheme));
        alert("Configurações salvas com sucesso!");
    }

    function resetToDefault() {
        if (confirm("Deseja resetar para os padrões originais?")) {
            localStorage.removeItem('meres_forms_config');
            localStorage.removeItem('meres_theme_overrides');
            window.location.reload();
        }
    }

    function deleteForm() {
        const slug = formSelector.value;
        if (slug === 'partner' || slug === 'indicacao') {
            alert("Não é possível excluir formulários padrão.");
            return;
        }
        if (confirm(`Excluir o formulário "${currentConfig[slug].title}"?`)) {
            delete currentConfig[slug];
            populateFormSelector();
            updateEditorUI();
        }
    }

    function createForm() {
        const name = prompt("Nome do novo formulário:");
        if (!name) return;
        const slug = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        if (currentConfig[slug]) {
            alert("Já existe um formulário com este nome.");
            return;
        }
        currentConfig[slug] = {
            title: name,
            subtitle: "Descrição do formulário",
            fields: [{ id: Date.now().toString(), label: "Pergunta 1", type: "text", required: false }]
        };
        populateFormSelector();
        formSelector.value = slug;
        updateEditorUI();
    }

    function applyThemeToEditor() {
        Object.entries(currentTheme).forEach(([varName, val]) => {
            document.documentElement.style.setProperty(varName, val);
        });
    }

    function deleteField(index) {
        const slug = formSelector.value;
        if (confirm("Excluir esta pergunta?")) {
            currentConfig[slug].fields.splice(index, 1);
            activeFieldId = null;
            renderQuestions();
            updatePreview();
        }
    }

    window.toggleFieldWidth = function(index) {
        const slug = formSelector.value;
        const field = currentConfig[slug].fields[index];
        field.halfWidth = !field.halfWidth;
        renderQuestions();
        updatePreview();
    };

    window.addOption = function(fieldIndex) {
        const slug = formSelector.value;
        const field = currentConfig[slug].fields[fieldIndex];
        if (!field.options) field.options = ['Opção 1'];
        field.options.push(`Opção ${field.options.length + 1}`);
        renderQuestions();
        updateSettingsSidebar(field, fieldIndex);
        updatePreview();
    };

    window.removeOption = function(fieldIndex, optIndex) {
        const slug = formSelector.value;
        const field = currentConfig[slug].fields[fieldIndex];
        if (field.options.length <= 1) return alert("Pelo menos uma opção é necessária.");
        field.options.splice(optIndex, 1);
        renderQuestions();
        updateSettingsSidebar(field, fieldIndex);
        updatePreview();
    };

    window.updateOption = function(fieldIndex, optIndex, value) {
        const slug = formSelector.value;
        const field = currentConfig[slug].fields[fieldIndex];
        field.options[optIndex] = value;
        renderQuestions();
        updatePreview();
    };

    window.moveField = function(index, direction) {
        const slug = formSelector.value;
        const fields = currentConfig[slug].fields;
        const newIndex = index + direction;
        
        if (newIndex < 0 || newIndex >= fields.length) return;
        
        const temp = fields[index];
        fields[index] = fields[newIndex];
        fields[newIndex] = temp;
        
        renderQuestions();
        updatePreview();
    };

    window.deleteField = deleteField;

    init();
});
