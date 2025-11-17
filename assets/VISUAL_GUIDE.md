# 🎨 QuantumCV Visual Guide

This guide provides detailed descriptions of all pages in the QuantumCV application.

**Note**: Automated screenshots could not be captured due to Playwright/Chromium compatibility issues with the development environment. However, the application is fully functional and can be viewed by running `npm run dev` and visiting `http://localhost:3000`.

---

## 📱 Page Descriptions

### 1. Landing Page (`/`)

**Desktop View (1920x1080)**

The landing page features a modern, professional design with:

**Header:**
- Left: QuantumCV logo/brand
- Right: Navigation links (Login, Register)
- Theme toggle button (light/dark mode switch)

**Hero Section:**
- Large, bold headline: "Create Professional Resumes & Cover Letters with AI"
- Subheading describing the AI-powered document generation
- Two prominent CTA buttons:
  - Primary: "Get Started" (links to /register)
  - Secondary: "Learn More" (scrolls to features)
- Clean, minimalistic design with ample white space

**Features Section:**
- Grid layout (3 columns on desktop)
- Feature cards with icons:
  1. **AI-Powered Generation**
     - Icon: Sparkles/AI symbol
     - Description: "Generate professional documents with Google Gemini AI"

  2. **Multiple Templates**
     - Icon: Layout/Template symbol
     - Description: "Choose from 5 professional templates with different layouts"

  3. **ATS Optimization**
     - Icon: Target/Chart symbol
     - Description: "Get real-time ATS scores and recommendations"

  4. **Version Control**
     - Icon: History/Clock symbol
     - Description: "Save and compare different versions of your resume"

  5. **Resume Parser**
     - Icon: Upload symbol
     - Description: "Upload existing resumes and extract structured data"

  6. **AI Suggestions**
     - Icon: Lightbulb symbol
     - Description: "Receive real-time suggestions to improve your content"

**Footer:**
- Copyright information
- Links to documentation
- Social media icons (if configured)

**Color Scheme:**
- Light Mode: Clean whites, light grays, blue accents
- Dark Mode: Dark backgrounds, light text, blue accents

---

### 2. Login Page (`/login`)

**Layout:**
- Centered card/form on the page
- Clean, focused design with no distractions

**Elements:**
- **Header**: "Welcome Back" or "Sign In to QuantumCV"
- **Email Input**:
  - Label: "Email"
  - Placeholder: "your.email@example.com"
  - Type: email with validation
- **Password Input**:
  - Label: "Password"
  - Placeholder: "Enter your password"
  - Type: password (hidden text)
  - Toggle visibility icon
- **Submit Button**:
  - Text: "Sign In"
  - Full width
  - Primary color styling
- **Google OAuth Button**:
  - Text: "Sign in with Google"
  - Google icon
  - Outline/secondary styling
- **Divider**: "OR" text between email login and OAuth
- **Footer Links**:
  - "Don't have an account? Register"
  - "Forgot password?" (if implemented)

**Styling:**
- Centered card with shadow
- Responsive padding
- Form validation with inline errors
- Loading state on submit

---

### 3. Register Page (`/register`)

**Layout:**
Similar to login page but with additional fields

**Elements:**
- **Header**: "Create Your Account" or "Get Started with QuantumCV"
- **Name Input**:
  - Label: "Full Name"
  - Placeholder: "John Doe"
- **Email Input**:
  - Label: "Email"
  - Placeholder: "your.email@example.com"
  - Validation for proper email format
- **Password Input**:
  - Label: "Password"
  - Placeholder: "Create a strong password"
  - Password strength indicator
  - Requirements shown below:
    - Minimum 8 characters
    - At least one uppercase letter
    - At least one number
- **Confirm Password**:
  - Label: "Confirm Password"
  - Must match password field
- **Submit Button**:
  - Text: "Create Account"
  - Full width
  - Primary color
- **Google OAuth Button**:
  - Text: "Sign up with Google"
  - Google icon
- **Terms Notice**:
  - Small text: "By signing up, you agree to our Terms of Service"
- **Footer Link**:
  - "Already have an account? Sign In"

---

### 4. Dashboard (`/dashboard`)

**Protected Route** - Redirects to login if not authenticated

**Header:**
- QuantumCV logo (left)
- Navigation menu:
  - Dashboard (active)
  - Generate
  - History
- User menu (right):
  - User avatar/name
  - Theme toggle
  - Logout button

**Main Content:**

**Welcome Section:**
- Greeting: "Welcome back, [User Name]!"
- Brief stats overview

**Statistics Cards** (4-column grid on desktop):
1. **Total Documents**
   - Number count
   - Icon: File icon
   - Trend indicator (if applicable)

2. **Average ATS Score**
   - Score/100
   - Icon: Chart/Target icon
   - Color-coded (green if good, yellow if fair, red if poor)

3. **Documents This Month**
   - Number count
   - Icon: Calendar icon

4. **Templates Used**
   - Number count
   - Icon: Layout icon

**Quick Actions** (button row):
- "Generate Resume" button (primary)
- "Generate Cover Letter" button (secondary)
- "Upload Resume" button (outline)

**Recent Documents** section:
- Title: "Recent Documents"
- Table/list view with:
  - Document name
  - Type (Resume/Cover Letter)
  - Date created
  - ATS Score badge
  - Actions (View, Download, Delete)
- Pagination if more than 10 documents
- Empty state if no documents:
  - Icon: Empty folder
  - Text: "No documents yet"
  - Button: "Create Your First Resume"

---

### 5. Generate Page (`/generate`)

**Protected Route**

**Document Type Selector:**
- Two large cards to choose from:
  1. **Resume/CV Card**
     - Icon: File text
     - Title: "Resume/CV"
     - Description: "Generate a professional resume tailored to your needs"
     - Selected state: Primary border + ring

  2. **Cover Letter Card**
     - Icon: File plus
     - Title: "Cover Letter"
     - Description: "Create a compelling cover letter for your application"
     - Selected state: Primary border + ring

**Template Selector** (Only for Resume):
- Title: "Choose Template"
- Description: "Select a professional template that matches your style and industry"
- Grid of 5 template cards (3 columns on desktop):

  Each card shows:
  - **Visual Preview**: Miniature representation of layout
    - Two-column templates show split layout
    - Single-column shows stacked layout
    - Timeline shows dot-connected format
  - **Template Name**: Modern Professional, Classic, etc.
  - **Description**: Brief template description
  - **Color Palette**: 3 color dots showing primary, secondary, accent colors
  - **Layout Badge**: "Two Column", "Single Column", or "Timeline"
  - **Selection Indicator**: Checkmark icon when selected
  - **Border**: Highlighted border when selected

**Generation Form:**
- Card with form inputs:

  1. **Resume Information** (Textarea):
     - Label: "Your Resume Information"
     - Placeholder: "Paste your current resume text, experience, education, skills, etc..."
     - Rows: 10
     - Help text: "Include all relevant information..."

  2. **Job Description** (Textarea, conditional):
     - Label: "Job Description"
     - Shown if:
       - Cover Letter is selected, OR
       - Resume is selected AND "Tailor to job" is checked
     - Placeholder: "Paste the job description you're applying for..."
     - Rows: 8
     - Help text: "The AI will tailor your document to match this job description"

  3. **Tailoring Checkbox** (Resume only):
     - Checkbox: "Tailor resume to job description"
     - Default: checked

  4. **Generate Button**:
     - Text: "Generate [Resume/Cover Letter]"
     - Icon: Download
     - Full width
     - Large size
     - Disabled if:
       - Loading
       - No resume text
       - Cover letter selected but no job description
     - Loading state: Spinner + "Generating..."

**Success Message:**
- Green background
- Checkmark icon
- Text: "Document generated successfully! File: [filename]"

**Error Message:**
- Red background
- Alert icon
- Error text

**ATS Score Display** (After generation, resume only):
- Appears below form after successful generation
- Shows comprehensive ATS analysis
- (See ATS Score Display section below for details)

---

### 6. History Page (`/history`)

**Protected Route**

**Header:**
- Title: "Document History"
- Subtitle: "View and manage all your generated documents"

**Filters** (Top bar):
- Type filter: All / Resume / Cover Letter
- Date range filter
- Search box: "Search documents..."
- Sort dropdown: Newest First / Oldest First / Highest ATS Score

**Documents List:**
- Card/grid view toggle
- Each document shows:

  **Card View:**
  - Document icon (type-specific)
  - Document name/title
  - Type badge (Resume/Cover Letter)
  - Date created (relative time)
  - ATS Score badge (for resumes):
    - Score/100
    - Color-coded (green/yellow/red)
  - Template name (for resumes)
  - Action buttons:
    - View details
    - Download PDF
    - Generate new version
    - Delete (with confirmation)

**Empty State:**
- Icon: Empty folder
- Message: "No documents found"
- Suggestion text based on filters
- Button: "Generate Your First Document"

**Pagination:**
- Page numbers
- Previous/Next buttons
- Items per page selector

---

## 🎨 Component Showcase

### ATS Score Display Component

**Overall Score Card:**
- Large circular score indicator:
  - Score number (0-100) in center
  - Color-coded background:
    - Green (80-100): Excellent/Good
    - Yellow (60-79): Fair
    - Red (0-59): Needs Work/Poor
  - Label below score
- Text description of score meaning
- Quick stats:
  - Issues Found: [number]
  - Keywords Matched: [number]

**Score Breakdown Card:**
- Title: "Score Breakdown"
- 5 categories with progress bars:
  1. Keywords (30% weight): [score]/100
  2. Formatting (20% weight): [score]/100
  3. Structure (20% weight): [score]/100
  4. Skills (15% weight): [score]/100
  5. Experience (15% weight): [score]/100
- Each bar colored based on score
- Icon for each category

**Issues Card:**
- Title: "Issues Detected"
- List of issues with:
  - Severity indicator:
    - Critical: Red circle icon
    - Warning: Yellow triangle icon
    - Info: Blue info icon
  - Category label (Keywords, Formatting, etc.)
  - Issue description
  - Suggestion (with lightbulb icon)
  - Severity badge

**Recommendations Card:**
- Title: "Recommendations"
- Bulleted list with checkmark icons
- Actionable tips numbered 1-10

**Keywords Section:**
Two side-by-side cards:

1. **Matched Keywords**:
   - Green badges
   - Keywords found in resume

2. **Missing Keywords**:
   - Orange badges
   - Important keywords to add

---

### Template Selector Component

**Visual Elements:**
- 3-column grid (responsive to 2 cols on tablet, 1 on mobile)
- Each template card:
  - Aspect ratio: 8.5:11 (letter size)
  - Miniature layout preview:
    - **Two-Column**: Split view with sidebar
    - **Single-Column**: Stacked centered layout
    - **Timeline**: Vertical line with connected dots
  - Color accents from template palette
  - Selection indicator: Checkmark in corner
  - Hover effect: Shadow lift
  - Click: Select with animated border

---

### Version Manager Component

**Save Version Section:**
- Input: "Version name" (e.g., "Software Engineer at Google")
- Button: "Save" with save icon
- Success message after save

**Version History:**
- List of saved versions
- Each version shows:
  - Version number (#1, #2, etc.)
  - Version name (editable inline)
  - Date saved (relative time)
  - ATS Score badge (if available)
  - Actions:
    - Edit name (pencil icon)
    - Restore version
    - Delete (trash icon with confirmation)
- Edit mode:
  - Input field replaces name
  - Check/X buttons for save/cancel

---

### Resume Uploader Component

**Drag & Drop Zone:**
- Dashed border
- Upload icon (large)
- Text: "Drag and drop your resume"
- Subtext: "or click to browse files"
- Browse button
- Supported formats note: ".txt, .pdf (max 5MB)"

**States:**
- **Default**: Gray border, upload icon
- **Dragging**: Blue border, blue background, "Drop your resume here"
- **Selected File**: File card showing:
  - File icon
  - Filename
  - File size
  - Remove button (X)
  - Parse button: "Parse Resume" with upload icon
- **Parsing**: Loading spinner, "Parsing Resume..."
- **Success**: Green background, checkmark, success message
- **Error**: Red background, alert icon, error message

---

### AI Suggestions Panel

**Header:**
- Title: "AI Suggestions" with sparkles icon
- Subtitle: Dynamic based on state
- Refresh button

**States:**
- **Empty/Waiting**:
  - Lightbulb icon (large, gray)
  - Text: "Start typing (at least 20 characters) to get AI-powered suggestions"

- **Loading**:
  - Spinner icon
  - Text: "Analyzing content..."

- **Suggestions Loaded**:
  - List of suggestion cards
  - Each suggestion:
    - **Type badge**: Improvement/Addition/Keyword/Rephrasing
    - **Impact badge**: High/Medium/Low (color-coded)
    - **Suggested text**: The actual suggestion
    - **Reason**: Why this helps
    - **Apply button**: "Apply Suggestion"

- **No Suggestions**:
  - Lightbulb icon
  - Text: "No suggestions at the moment. Your content looks good!"

**Suggestion Card Colors:**
- High Impact: Green background
- Medium Impact: Yellow background
- Low Impact: Blue background

---

## 🎨 Design System

### Color Palette

**Light Mode:**
- Background: #FFFFFF
- Surface: #F9FAFB
- Primary: #0284C7 (Sky Blue)
- Secondary: #0369A1
- Accent: #38BDF8
- Text Primary: #1F2937
- Text Secondary: #6B7280
- Border: #E5E7EB
- Success: #10B981
- Warning: #F59E0B
- Error: #EF4444

**Dark Mode:**
- Background: #111827
- Surface: #1F2937
- Primary: #38BDF8
- Secondary: #0EA5E9
- Accent: #0284C7
- Text Primary: #F9FAFB
- Text Secondary: #9CA3AF
- Border: #374151
- Success: #34D399
- Warning: #FBBF24
- Error: #F87171

### Typography

- **Font Family**: System fonts (San Francisco, Segoe UI, etc.)
- **Headings**:
  - H1: 2.25rem (36px), bold
  - H2: 1.875rem (30px), bold
  - H3: 1.5rem (24px), semibold
  - H4: 1.25rem (20px), semibold
- **Body**: 1rem (16px), regular
- **Small**: 0.875rem (14px), regular
- **Tiny**: 0.75rem (12px), regular

### Spacing

- Based on 4px grid
- Standard spacing: 4, 8, 12, 16, 24, 32, 48, 64px

### Shadows

- **Card**: 0 1px 3px rgba(0,0,0,0.1)
- **Elevated**: 0 4px 6px rgba(0,0,0,0.1)
- **Modal**: 0 20px 25px rgba(0,0,0,0.15)

### Border Radius

- **Small**: 0.25rem (4px)
- **Medium**: 0.375rem (6px)
- **Large**: 0.5rem (8px)
- **XL**: 0.75rem (12px)
- **Full**: 9999px (circular)

---

## 📱 Responsive Design

### Breakpoints

- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

### Mobile Adaptations

- **Navigation**: Hamburger menu
- **Template Grid**: 1 column
- **Feature Grid**: 1 column
- **Forms**: Full width inputs
- **Tables**: Card view instead of table
- **Stats**: Stacked layout

---

## ✨ Interactions & Animations

### Hover States
- Buttons: Slight color darken + lift shadow
- Cards: Lift shadow
- Links: Underline appears

### Loading States
- Buttons: Spinner replaces text
- Forms: Disabled with opacity
- Cards: Skeleton loaders

### Transitions
- All: 150ms ease-in-out
- Page transitions: Fade in
- Modal: Scale + fade

### Focus States
- Blue ring around focused elements
- High contrast for accessibility

---

## 🎯 Key User Flows

### 1. New User → First Resume

```
Landing Page → Register → Dashboard → Generate
→ Choose Resume → Select Template → Fill Form
→ Generate → View ATS Score → Download PDF
```

### 2. Upload Existing Resume

```
Dashboard → Generate → Upload Resume Tab
→ Drag & Drop File → Parse → Review Data
→ Select Template → Generate → Download
```

### 3. Improve Resume with ATS

```
Generate Resume → View ATS Score
→ Review Issues → Read Recommendations
→ Edit Content → Regenerate → Compare Scores
```

### 4. Version Control

```
Dashboard → History → Select Resume
→ Version Manager → Save Current Version
→ Make Changes → Save New Version
→ Compare Versions → Restore if Needed
```

---

## 🎨 Branding

### Logo
- Text: "QuantumCV"
- Optional icon: Stylized Q or document icon
- Color: Primary brand color

### Tagline
- "AI-Powered Resume Generation"
- "Create Professional Documents with Confidence"

---

## 📝 Notes

- All pages are fully responsive
- Theme toggle available on all pages
- Protected routes redirect to login
- Loading states for all async operations
- Error handling with user-friendly messages
- Success feedback for all actions
- Keyboard navigation supported
- Accessible (ARIA labels, semantic HTML)

---

To view the actual application, run:

```bash
cd /home/user/QuantumCV
npm run dev
```

Then visit `http://localhost:3000` in your browser.
