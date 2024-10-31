<div align="center">

<img src="assets/Dash.png" width="100%" alt="Dash Banner"/>

# 🌟 QuantumCV

<img src="https://img.shields.io/badge/node-%3E%3D%2014.0.0-brightgreen?style=for-the-badge&logo=node.js&logoColor=white"/>
<img src="https://img.shields.io/badge/powered%20by-Gemini%20Pro-blue?style=for-the-badge&logo=google&logoColor=white"/>
<img src="https://img.shields.io/badge/License-ISC-purple?style=for-the-badge"/>

### Next-Gen Document Generator 3000 - Creating tomorrow's documents, today.

<img width="800" src="https://raw.githubusercontent.com/yourusername/quantumcv/main/assets/demo.gif"/>

</div>

---

## ✨ Features

- 🎯 **AI-Powered Resume Generation** - Create tailored resumes using Google's Gemini Pro
- 📝 **Neural Cover Letter Creation** - Generate compelling cover letters that match job descriptions
- 🎨 **Professional PDF Styling** - Beautiful, ATS-friendly document formatting
- ⚡ **Job-Specific Optimization** - Smart content tailoring based on job requirements
- 🌈 **Interactive CLI** - Beautiful command-line interface with animations

## 🚀 Quick Start

1. **Clone & Install**

```bash
git clone https://github.com/yourusername/quantumcv.git
cd quantumcv
npm install
```

2. **Set Up Environment**
```bash
cp .env.example .env
# Add your Google AI API key to .env file
```

3. **Run the Application**
```bash
node CVandCLbuilder.jsx
```

## 🛠️ Prerequisites

- Node.js (v14.0.0 or higher)
- Google AI API Key (Gemini Pro)
- Text file containing your resume content

## 📖 Usage Guide

### 1. Launch the Application
The application will display a beautiful welcome banner and interactive menu.

### 2. Choose Your Operation
Select from four main options:
- 🌟 Generate Quantum Resume/CV
- ⚡ Generate Neural Cover Letter
- 🔮 Generate Full Document Suite
- ❌ Exit System

### 3. Input Methods
- Upload a text file containing your resume
- Manual data entry through the CLI
- Provide job description for tailoring

## 📄 Document Types

### Resumes
- Two-column professional layout
- ATS-friendly formatting
- Smart content organization
- Clickable links and contact info

### Cover Letters
- Clean, professional formatting
- Job-specific content tailoring
- Compelling narrative structure
- Proper business letter format

## 🎨 Styling Features

- Modern, clean typography
- Professional spacing and margins
- Consistent visual hierarchy
- Color accents for emphasis
- Responsive layouts

## 🗂️ Project Structure

```
quantumcv/
├── CVandCLbuilder.jsx    # Main application file
├── Generated cvs/        # Output directory
├── .env                  # Environment variables
└── package.json         # Dependencies
```

## ⚙️ Configuration

### Environment Variables
Create a `.env` file with:
```env
GOOGLE_API_KEY=your_google_ai_api_key_here
```

### Key Dependencies
- @google/generative-ai: AI text generation
- pdfkit: PDF document creation
- chalk & chalk-animation: Terminal styling
- figlet: ASCII art text
- boxen: Terminal boxes
- ora: Terminal spinners

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🚨 Troubleshooting

### Common Issues

1. **API Key Error**
   - Verify `.env` file exists
   - Check API key is valid
   - Ensure proper environment variable name

2. **PDF Generation Error**
   - Check write permissions in output directory
   - Verify input data format
   - Ensure sufficient disk space

3. **Dependencies Issues**
   - Run `npm install` again
   - Clear npm cache
   - Check Node.js version

## 📝 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Google Gemini Pro AI for text generation
- PDFKit for document styling
- The open-source community for CLI tools

---

<div align="center">

**[Documentation](docs/index.md)** • **[Report Bug](issues)** • **[Request Feature](issues)**

Made with 🧠 by [Shalom-King](https://github.com/ShalomObongo)

</div>