// App State
let currentTab = 'generator';
let currentInputMode = 'text';
let uploadedFile = null;

// DOM Elements
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');
const inputTabs = document.querySelectorAll('.input-tab');
const inputContents = document.querySelectorAll('.input-content');
const generationForm = document.getElementById('generation-form');
const docTypeSelect = document.getElementById('doc-type');
const resumeOptions = document.getElementById('resume-options');
const jobDescriptionGroup = document.getElementById('job-description-group');
const fileUploadArea = document.getElementById('file-upload');
const fileInput = document.getElementById('resume-file');
const fileInfo = document.getElementById('file-info');
const progressSection = document.getElementById('progress-section');
const resultsSection = document.getElementById('results-section');
const toast = document.getElementById('toast');

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    initializeTabs();
    initializeInputTabs();
    initializeFileUpload();
    initializeForm();
    loadGeneratedFiles();
});

// Tab Management
function initializeTabs() {
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.dataset.tab;
            switchTab(tabName);
        });
    });
}

function switchTab(tabName) {
    // Update buttons
    tabButtons.forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Update content
    tabContents.forEach(content => content.classList.remove('active'));
    document.getElementById(tabName).classList.add('active');
    
    currentTab = tabName;
    
    // Load files when switching to files tab
    if (tabName === 'files') {
        loadGeneratedFiles();
    }
}

// Input Tab Management
function initializeInputTabs() {
    inputTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const inputMode = tab.dataset.input;
            switchInputMode(inputMode);
        });
    });
}

function switchInputMode(mode) {
    // Update tabs
    inputTabs.forEach(tab => tab.classList.remove('active'));
    document.querySelector(`[data-input="${mode}"]`).classList.add('active');
    
    // Update content
    inputContents.forEach(content => content.classList.remove('active'));
    document.getElementById(`${mode}-input`).classList.add('active');
    
    currentInputMode = mode;
    
    // Clear other input when switching
    if (mode === 'text') {
        clearFileUpload();
    } else {
        document.getElementById('resume-text').value = '';
    }
}

// File Upload Management
function initializeFileUpload() {
    fileUploadArea.addEventListener('click', () => {
        fileInput.click();
    });
    
    fileInput.addEventListener('change', handleFileSelect);
    
    // Drag and drop
    fileUploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        fileUploadArea.classList.add('dragover');
    });
    
    fileUploadArea.addEventListener('dragleave', () => {
        fileUploadArea.classList.remove('dragover');
    });
    
    fileUploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        fileUploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
                fileInput.files = files;
                handleFileSelect();
            } else {
                showToast('Only .txt files are allowed', 'error');
            }
        }
    });
    
    // Remove file button
    document.querySelector('.remove-file').addEventListener('click', clearFileUpload);
}

function handleFileSelect() {
    const file = fileInput.files[0];
    if (file) {
        uploadedFile = file;
        document.querySelector('.file-name').textContent = file.name;
        fileUploadArea.style.display = 'none';
        fileInfo.style.display = 'flex';
        showToast(`File "${file.name}" selected`, 'success');
    }
}

function clearFileUpload() {
    fileInput.value = '';
    uploadedFile = null;
    fileUploadArea.style.display = 'block';
    fileInfo.style.display = 'none';
}

// Form Management
function initializeForm() {
    docTypeSelect.addEventListener('change', handleDocumentTypeChange);
    generationForm.addEventListener('submit', handleFormSubmit);
}

function handleDocumentTypeChange() {
    const docType = docTypeSelect.value;
    
    // Show/hide relevant options
    if (docType === 'resume') {
        resumeOptions.style.display = 'block';
        jobDescriptionGroup.querySelector('label').textContent = 'Job Description (Optional)';
        jobDescriptionGroup.querySelector('textarea').placeholder = 'Paste job description for tailored optimization (optional)...';
        jobDescriptionGroup.querySelector('textarea').required = false;
    } else if (docType === 'cover_letter') {
        resumeOptions.style.display = 'none';
        jobDescriptionGroup.querySelector('label').textContent = 'Job Description *';
        jobDescriptionGroup.querySelector('textarea').placeholder = 'Paste the job description here (required for cover letter)...';
        jobDescriptionGroup.querySelector('textarea').required = true;
    } else if (docType === 'suite') {
        resumeOptions.style.display = 'none';
        jobDescriptionGroup.querySelector('label').textContent = 'Job Description *';
        jobDescriptionGroup.querySelector('textarea').placeholder = 'Paste the job description here (required for document suite)...';
        jobDescriptionGroup.querySelector('textarea').required = true;
    } else {
        resumeOptions.style.display = 'none';
        jobDescriptionGroup.querySelector('label').textContent = 'Job Description';
        jobDescriptionGroup.querySelector('textarea').placeholder = 'Paste job description here...';
        jobDescriptionGroup.querySelector('textarea').required = false;
    }
}

async function handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(generationForm);
    const docType = formData.get('documentType');
    const templateId = formData.get('templateId');
    
    if (!docType) {
        showToast('Please select a document type', 'error');
        return;
    }
    
    // Validate inputs
    const resumeText = formData.get('resumeText');
    const hasFile = uploadedFile !== null;
    
    if (!resumeText && !hasFile) {
        showToast('Please provide resume text or upload a file', 'error');
        return;
    }
    
    if (currentInputMode === 'file' && hasFile) {
        formData.append('resumeFile', uploadedFile);
    }
    
    // Add custom template if selected
    if (customTemplate && templateId === 'custom') {
        formData.append('customTemplate', JSON.stringify(customTemplate));
    }
    
    // Show progress
    showProgress();
    
    try {
        let endpoint;
        const useTemplate = templateId && templateId !== '';
        
        if (docType === 'suite') {
            endpoint = '/api/generate-suite';
        } else if (useTemplate) {
            endpoint = '/api/generate/template';
        } else {
            endpoint = '/api/generate';
        }
        
        const response = await fetch(endpoint, {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            showResults(result);
            showToast(result.message, 'success');
        } else {
            throw new Error(result.message || 'Generation failed');
        }
    } catch (error) {
        console.error('Generation error:', error);
        showToast(`Error: ${error.message}`, 'error');
        hideProgress();
    }
}

// Progress Management
function showProgress() {
    progressSection.style.display = 'block';
    resultsSection.style.display = 'none';
    
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    
    // Simulate progress
    let progress = 0;
    const progressMessages = [
        'Initializing quantum processing...',
        'Analyzing resume data...',
        'Applying AI optimization...',
        'Generating document structure...',
        'Finalizing PDF output...'
    ];
    
    const interval = setInterval(() => {
        progress += 20;
        progressFill.style.width = progress + '%';
        
        const messageIndex = Math.floor((progress - 1) / 20);
        if (messageIndex < progressMessages.length) {
            progressText.textContent = progressMessages[messageIndex];
        }
        
        if (progress >= 100) {
            clearInterval(interval);
            progressText.textContent = 'Processing complete!';
        }
    }, 1000);
}

function hideProgress() {
    progressSection.style.display = 'none';
}

// Results Management
function showResults(result) {
    hideProgress();
    resultsSection.style.display = 'block';
    
    const resultFiles = document.getElementById('result-files');
    resultFiles.innerHTML = '';
    
    if (result.documents) {
        // Multiple documents (suite)
        result.documents.forEach(doc => {
            const fileElement = createResultFileElement(doc.fileName, doc.type, doc.downloadUrl);
            resultFiles.appendChild(fileElement);
        });
    } else {
        // Single document
        const fileElement = createResultFileElement(result.fileName, getDocumentTypeFromFileName(result.fileName), result.downloadUrl);
        resultFiles.appendChild(fileElement);
    }
    
    // Scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth' });
}

function createResultFileElement(fileName, type, downloadUrl) {
    const div = document.createElement('div');
    div.className = 'result-file';
    
    const typeIcons = {
        resume: '📄',
        cover_letter: '📝',
        suite: '📚'
    };
    
    div.innerHTML = `
        <div class="file-details">
            <span class="file-icon">${typeIcons[type] || '📄'}</span>
            <div class="file-meta">
                <h4>${fileName}</h4>
                <p>${type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
            </div>
        </div>
        <button class="download-btn" onclick="downloadFile('${downloadUrl}', '${fileName}')">
            Download
        </button>
    `;
    
    return div;
}

function getDocumentTypeFromFileName(fileName) {
    if (fileName.includes('cover_letter')) return 'cover_letter';
    if (fileName.includes('resume')) return 'resume';
    return 'document';
}

// File Management
async function loadGeneratedFiles() {
    const filesList = document.getElementById('files-list');
    const filesLoading = document.getElementById('files-loading');
    
    try {
        const response = await fetch('/api/files');
        const data = await response.json();
        
        if (filesLoading) {
            filesLoading.style.display = 'none';
        }
        
        if (data.files.length === 0) {
            filesList.innerHTML = '<div class="loading">No generated documents found. Create your first document in the Generator tab!</div>';
            return;
        }
        
        filesList.innerHTML = '';
        data.files.forEach(file => {
            const fileElement = createFileListElement(file);
            filesList.appendChild(fileElement);
        });
    } catch (error) {
        console.error('Error loading files:', error);
        if (filesLoading) {
            filesLoading.textContent = 'Failed to load files';
        } else {
            filesList.innerHTML = '<div class="loading">Failed to load files</div>';
        }
        showToast('Failed to load files', 'error');
    }
}

function createFileListElement(file) {
    const div = document.createElement('div');
    div.className = 'file-item';
    
    const fileType = getDocumentTypeFromFileName(file.name);
    const typeIcons = {
        resume: '📄',
        cover_letter: '📝'
    };
    
    const fileSize = formatFileSize(file.size);
    const createdDate = new Date(file.created).toLocaleDateString();
    
    div.innerHTML = `
        <div class="file-item-info">
            <span class="file-item-icon">${typeIcons[fileType] || '📄'}</span>
            <div class="file-item-details">
                <h4>${file.name}</h4>
                <p>${fileSize} • Created ${createdDate}</p>
            </div>
        </div>
        <button class="download-btn" onclick="downloadFile('${file.downloadUrl}', '${file.name}')">
            Download
        </button>
    `;
    
    return div;
}

// Utility Functions
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function downloadFile(url, fileName) {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Downloading ${fileName}`, 'info');
}

// Toast Notifications
function showToast(message, type = 'info') {
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
}

// Form Validation and Enhancement
function validateForm() {
    const docType = docTypeSelect.value;
    const resumeText = document.getElementById('resume-text').value;
    const jobDescription = document.getElementById('job-description').value;
    
    let isValid = true;
    let errors = [];
    
    if (!docType) {
        errors.push('Please select a document type');
        isValid = false;
    }
    
    if (currentInputMode === 'text' && !resumeText.trim()) {
        errors.push('Please provide resume text');
        isValid = false;
    }
    
    if (currentInputMode === 'file' && !uploadedFile) {
        errors.push('Please upload a resume file');
        isValid = false;
    }
    
    if ((docType === 'cover_letter' || docType === 'suite') && !jobDescription.trim()) {
        errors.push('Job description is required for this document type');
        isValid = false;
    }
    
    if (!isValid) {
        showToast(errors.join('. '), 'error');
    }
    
    return isValid;
}

// Enhanced UI Interactions
function addInteractiveEffects() {
    // Add hover effects to cards
    const cards = document.querySelectorAll('.feature-card, .file-item, .result-file');
    cards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-5px)';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0)';
        });
    });
    
    // Add quantum glow effect to generate button on hover
    const generateBtn = document.getElementById('generate-btn');
    generateBtn.addEventListener('mouseenter', () => {
        generateBtn.classList.add('quantum-glow');
    });
    
    generateBtn.addEventListener('mouseleave', () => {
        generateBtn.classList.remove('quantum-glow');
    });
}

// Auto-save functionality for form data
function initializeAutoSave() {
    const formInputs = document.querySelectorAll('#generation-form input, #generation-form textarea, #generation-form select');
    
    formInputs.forEach(input => {
        input.addEventListener('input', () => {
            const formData = {};
            formInputs.forEach(field => {
                if (field.type === 'checkbox') {
                    formData[field.name] = field.checked;
                } else {
                    formData[field.name] = field.value;
                }
            });
            localStorage.setItem('quantumcv_form_data', JSON.stringify(formData));
        });
    });
    
    // Restore form data on load
    const savedData = localStorage.getItem('quantumcv_form_data');
    if (savedData) {
        try {
            const formData = JSON.parse(savedData);
            formInputs.forEach(input => {
                if (formData[input.name] !== undefined) {
                    if (input.type === 'checkbox') {
                        input.checked = formData[input.name];
                    } else {
                        input.value = formData[input.name];
                    }
                }
            });
            // Trigger change event for document type to show/hide relevant fields
            if (formData.documentType) {
                handleDocumentTypeChange();
            }
        } catch (error) {
            console.error('Error restoring form data:', error);
        }
    }
}

// Enhanced error handling
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    showToast('An unexpected error occurred. Please refresh the page.', 'error');
});

// Initialize enhanced features
document.addEventListener('DOMContentLoaded', () => {
    addInteractiveEffects();
    initializeAutoSave();
});

// API Health Check
async function checkAPIHealth() {
    try {
        const response = await fetch('/api/health');
        const data = await response.json();
        console.log('API Status:', data.message);
        
        // Show API configuration status in UI
        if (!data.apiConfigured) {
            showAPIConfigurationWarning();
        }
        
        return data;
    } catch (error) {
        console.error('API health check failed:', error);
        showToast('API connection failed. Please check server status.', 'error');
        return null;
    }
}

function showAPIConfigurationWarning() {
    const warningDiv = document.createElement('div');
    warningDiv.className = 'api-warning';
    warningDiv.innerHTML = `
        <div class="warning-content">
            <h3>⚠️ API Configuration Required</h3>
            <p>Please configure your Google API key to enable document generation:</p>
            <ol>
                <li>Copy <code>.env.example</code> to <code>.env</code></li>
                <li>Add your Google API key: <code>GOOGLE_API_KEY=your_key_here</code></li>
                <li>Restart the server</li>
            </ol>
            <p><a href="https://ai.google.dev/" target="_blank">Get your API key here</a></p>
        </div>
    `;
    
    // Insert after header
    const header = document.querySelector('.header');
    header.insertAdjacentElement('afterend', warningDiv);
}

// Check API health on load
checkAPIHealth();

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Enter to submit form
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (currentTab === 'generator') {
            generationForm.dispatchEvent(new Event('submit'));
        }
    }
    
    // Escape to clear results/progress
    if (e.key === 'Escape') {
        hideProgress();
        resultsSection.style.display = 'none';
    }
});

// Template Management
let availableTemplates = {};
let customTemplate = null;

async function initializeTemplates() {
    try {
        const response = await fetch('/api/templates');
        const data = await response.json();
        availableTemplates = data.templates;
        populateTemplateSelect();
    } catch (error) {
        console.error('Failed to load templates:', error);
    }
}

function populateTemplateSelect() {
    const templateSelect = document.getElementById('template-select');
    if (!templateSelect) return;
    
    // Clear existing options except default
    templateSelect.innerHTML = '<option value="">Default Template</option>';
    
    // Group templates by category
    const categories = {};
    Object.entries(availableTemplates).forEach(([id, template]) => {
        if (!categories[template.category]) {
            categories[template.category] = [];
        }
        categories[template.category].push({ id, ...template });
    });
    
    // Add options by category
    Object.entries(categories).forEach(([category, templates]) => {
        const optgroup = document.createElement('optgroup');
        optgroup.label = category.charAt(0).toUpperCase() + category.slice(1);
        
        templates.forEach(template => {
            const option = document.createElement('option');
            option.value = template.id;
            option.textContent = template.name;
            option.title = template.description;
            optgroup.appendChild(option);
        });
        
        templateSelect.appendChild(optgroup);
    });
}

// Custom Template Generation
function initializeCustomTemplates() {
    const customTemplateBtn = document.getElementById('custom-template-btn');
    const customTemplateGroup = document.getElementById('custom-template-group');
    const generateTemplateBtn = document.getElementById('generate-template');
    const cancelCustomTemplateBtn = document.getElementById('cancel-custom-template');
    
    if (customTemplateBtn) {
        customTemplateBtn.addEventListener('click', () => {
            customTemplateGroup.style.display = 'block';
            customTemplateBtn.style.display = 'none';
        });
    }
    
    if (cancelCustomTemplateBtn) {
        cancelCustomTemplateBtn.addEventListener('click', () => {
            customTemplateGroup.style.display = 'none';
            customTemplateBtn.style.display = 'inline-block';
            document.getElementById('template-prompt').value = '';
        });
    }
    
    if (generateTemplateBtn) {
        generateTemplateBtn.addEventListener('click', generateCustomTemplate);
    }
}

async function generateCustomTemplate() {
    const promptInput = document.getElementById('template-prompt');
    const generateBtn = document.getElementById('generate-template');
    const docType = document.getElementById('doc-type').value;
    
    if (!promptInput.value.trim()) {
        showToast('Please describe your ideal template', 'error');
        return;
    }
    
    try {
        generateBtn.disabled = true;
        generateBtn.textContent = 'Generating...';
        
        const response = await fetch('/api/templates/custom', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: promptInput.value.trim(),
                documentType: docType
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            customTemplate = data.template;
            showCustomTemplatePreview(customTemplate);
            showToast('Custom template generated successfully!', 'success');
            
            // Hide custom template form
            document.getElementById('custom-template-group').style.display = 'none';
            document.getElementById('custom-template-btn').style.display = 'inline-block';
            promptInput.value = '';
        } else {
            throw new Error(data.message || 'Failed to generate template');
        }
    } catch (error) {
        console.error('Template generation error:', error);
        showToast(error.message || 'Failed to generate custom template', 'error');
    } finally {
        generateBtn.disabled = false;
        generateBtn.textContent = 'Generate Template';
    }
}

function showCustomTemplatePreview(template) {
    const templatePreview = document.getElementById('template-preview');
    const previewContent = templatePreview.querySelector('.preview-content');
    
    previewContent.innerHTML = `
        <h5 style="color: #60a5fa; margin-top: 0;">${template.name}</h5>
        <p style="color: #94a3b8; margin-bottom: 20px;">${template.description}</p>
        <div style="background: #1e293b; padding: 15px; border-radius: 8px; border-left: 3px solid #60a5fa;">
            <strong>Category:</strong> ${template.category}<br>
            <strong>Target Audience:</strong> ${template.targetAudience}<br>
            <strong>Key Features:</strong> ${template.keyFeatures.join(', ')}
        </div>
        <div style="margin-top: 15px; font-size: 0.9rem; color: #cbd5e1;">
            <strong>Template Guidelines:</strong>
            <div style="background: #0f172a; padding: 15px; border-radius: 8px; margin-top: 8px; max-height: 200px; overflow-y: auto;">
                ${template.prompt.substring(0, 500)}${template.prompt.length > 500 ? '...' : ''}
            </div>
        </div>
    `;
    
    templatePreview.style.display = 'block';
    
    // Update template select to show custom template
    const templateSelect = document.getElementById('template-select');
    templateSelect.innerHTML = `
        <option value="">Default Template</option>
        <option value="custom" selected>✨ ${template.name} (Custom)</option>
    ` + templateSelect.innerHTML.split('</option>').slice(1).join('</option>');
    templateSelect.value = 'custom';
}

// Document Preview
function initializePreview() {
    const previewBtn = document.getElementById('preview-btn');
    const closePreviewBtn = document.getElementById('close-preview');
    const generateFromPreviewBtn = document.getElementById('generate-from-preview');
    const editAndPreviewBtn = document.getElementById('edit-and-preview');
    
    if (previewBtn) {
        previewBtn.addEventListener('click', generatePreview);
    }
    
    if (closePreviewBtn) {
        closePreviewBtn.addEventListener('click', () => {
            document.getElementById('document-preview').style.display = 'none';
        });
    }
    
    if (generateFromPreviewBtn) {
        generateFromPreviewBtn.addEventListener('click', generateFromPreview);
    }
    
    if (editAndPreviewBtn) {
        editAndPreviewBtn.addEventListener('click', () => {
            document.getElementById('document-preview').style.display = 'none';
        });
    }
}

async function generatePreview() {
    const form = document.getElementById('generation-form');
    const formData = new FormData(form);
    const docType = formData.get('documentType');
    const resumeText = formData.get('resumeText');
    const resumeFile = formData.get('resumeFile');
    const jobDescription = formData.get('jobDescription');
    const templateId = formData.get('templateId');
    
    if (!docType) {
        showToast('Please select a document type', 'error');
        return;
    }
    
    if (!resumeText && !resumeFile) {
        showToast('Please provide resume data', 'error');
        return;
    }
    
    try {
        showPreviewLoading(true);
        
        const previewFormData = new FormData();
        previewFormData.append('documentType', docType);
        previewFormData.append('resumeText', resumeText);
        previewFormData.append('jobDescription', jobDescription || '');
        previewFormData.append('templateId', templateId || '');
        
        if (customTemplate && templateId === 'custom') {
            previewFormData.append('customTemplate', JSON.stringify(customTemplate));
        }
        
        if (resumeFile && resumeFile.size > 0) {
            previewFormData.append('resumeFile', resumeFile);
        }
        
        const response = await fetch('/api/generate/preview', {
            method: 'POST',
            body: previewFormData
        });
        
        const data = await response.json();
        
        if (data.success) {
            showDocumentPreview(data.preview, data.documentType);
        } else {
            throw new Error(data.message || 'Failed to generate preview');
        }
    } catch (error) {
        console.error('Preview generation error:', error);
        showToast(error.message || 'Failed to generate preview', 'error');
    } finally {
        showPreviewLoading(false);
    }
}

function showPreviewLoading(show) {
    const loading = document.getElementById('preview-loading');
    const btn = document.getElementById('preview-btn');
    
    if (show) {
        loading.style.display = 'flex';
        btn.style.display = 'none';
    } else {
        loading.style.display = 'none';
        btn.style.display = 'inline-block';
    }
}

function showDocumentPreview(preview, docType) {
    const previewContainer = document.getElementById('document-preview');
    const previewContent = document.getElementById('preview-content');
    
    previewContent.innerHTML = `
        <div style="margin-bottom: 15px;">
            <span style="background: #1e293b; padding: 4px 12px; border-radius: 12px; font-size: 0.85rem; color: #60a5fa; border: 1px solid #334155;">
                ${docType === 'cover_letter' ? 'Cover Letter' : 'Resume'} Preview
            </span>
        </div>
        <div style="white-space: pre-wrap; line-height: 1.7;">
            ${preview}
        </div>
    `;
    
    previewContainer.style.display = 'block';
    previewContainer.scrollIntoView({ behavior: 'smooth' });
}

async function generateFromPreview() {
    const form = document.getElementById('generation-form');
    const generateBtn = document.getElementById('generate-from-preview');
    const originalText = generateBtn.textContent;
    
    try {
        generateBtn.disabled = true;
        generateBtn.textContent = 'Generating...';
        
        await submitForm(form, true); // Use template-aware submission
        
        // Close preview after successful generation
        document.getElementById('document-preview').style.display = 'none';
    } catch (error) {
        console.error('Generation from preview error:', error);
    } finally {
        generateBtn.disabled = false;
        generateBtn.textContent = originalText;
    }
}

// Update form submission to handle templates
async function submitForm(form, useTemplate = false) {
    const formData = new FormData(form);
    const docType = formData.get('documentType');
    const templateId = formData.get('templateId');
    
    // Choose endpoint based on whether we're using templates
    const endpoint = useTemplate ? '/api/generate/template' : '/api/generate';
    
    if (customTemplate && templateId === 'custom') {
        formData.append('customTemplate', JSON.stringify(customTemplate));
    }
    
    const response = await fetch(endpoint, {
        method: 'POST',
        body: formData
    });
    
    const data = await response.json();
    
    if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }
    
    return data;
}

// Initialize new features
document.addEventListener('DOMContentLoaded', () => {
    initializeTemplates();
    initializeCustomTemplates();
    initializePreview();
    initializePreviewCloseButtons();
    
    // Handle template selection changes
    const templateSelect = document.getElementById('template-select');
    if (templateSelect) {
        templateSelect.addEventListener('change', (e) => {
            const selectedTemplate = availableTemplates[e.target.value];
            if (selectedTemplate) {
                showTemplateInfo(selectedTemplate);
            } else {
                hideTemplateInfo();
            }
        });
    }
    
    // Update document type change handler to reload templates
    const docTypeSelect = document.getElementById('doc-type');
    if (docTypeSelect) {
        docTypeSelect.addEventListener('change', () => {
            initializeTemplates();
            customTemplate = null;
            hideTemplateInfo();
        });
    }
});

function showTemplateInfo(template) {
    // You can add a tooltip or info display here if needed
    console.log('Selected template:', template.name);
}

function hideTemplateInfo() {
    const templatePreview = document.getElementById('template-preview');
    if (templatePreview) {
        templatePreview.style.display = 'none';
    }
}

// Add close preview event handlers
function initializePreviewCloseButtons() {
    // Template preview close button
    const templatePreviewCloseBtn = document.querySelector('#template-preview .close-preview');
    if (templatePreviewCloseBtn) {
        templatePreviewCloseBtn.addEventListener('click', () => {
            document.getElementById('template-preview').style.display = 'none';
        });
    }
}

// Real-time character count for textareas
function addCharacterCounters() {
    const textareas = document.querySelectorAll('textarea');
    textareas.forEach(textarea => {
        const counter = document.createElement('div');
        counter.className = 'char-counter';
        counter.style.cssText = 'text-align: right; font-size: 0.85rem; color: #64748b; margin-top: 8px; font-weight: 500;';
        textarea.parentNode.appendChild(counter);
        
        function updateCounter() {
            const length = textarea.value.length;
            counter.textContent = `${length} characters`;
            if (length > 5000) {
                counter.style.color = '#f87171';
            } else if (length > 3000) {
                counter.style.color = '#fbbf24';
            } else {
                counter.style.color = '#64748b';
            }
        }
        
        textarea.addEventListener('input', updateCounter);
        updateCounter();
    });
}

// Initialize character counters
document.addEventListener('DOMContentLoaded', () => {
    addCharacterCounters();
});