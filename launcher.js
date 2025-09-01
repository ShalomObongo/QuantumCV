#!/usr/bin/env node

const readline = require('readline');
const chalk = require('chalk');
const figlet = require('figlet');
const { spawn } = require('child_process');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function askQuestion(question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer);
        });
    });
}

async function main() {
    console.clear();
    
    const banner = figlet.textSync('QUANTUM CV', {
        font: 'ANSI Shadow',
        horizontalLayout: 'fitted'
    });
    
    console.log(chalk.cyan(banner));
    console.log(chalk.cyan('\n╔══════════════════════════════════════════╗'));
    console.log(chalk.cyan('║     NEXT-GEN DOCUMENT GENERATOR 3000     ║'));
    console.log(chalk.cyan('║──────────────────────────────────────────║'));
    console.log(chalk.cyan('║  Creating tomorrow\'s documents, today.   ║'));
    console.log(chalk.cyan('╚══════════════════════════════════════════╝'));
    
    console.log(chalk.white('\n🚀 Choose your interface:\n'));
    console.log(chalk.cyan('1.') + chalk.white(' 💻 Command Line Interface (Traditional)'));
    console.log(chalk.cyan('2.') + chalk.white(' 🌐 Web Browser Interface (Modern)'));
    console.log(chalk.cyan('3.') + chalk.white(' ❌ Exit'));
    
    const choice = await askQuestion(chalk.yellow('\nSelect interface (1-3): '));
    
    switch(choice) {
        case '1':
            console.log(chalk.green('\n🚀 Launching CLI interface...'));
            rl.close();
            require('./CVandCLbuilder.jsx');
            break;
        case '2':
            console.log(chalk.green('\n🌐 Starting web server...'));
            rl.close();
            const webServer = spawn('node', ['src/web/server.js'], { 
                stdio: 'inherit',
                cwd: __dirname 
            });
            
            // Handle server shutdown
            process.on('SIGINT', () => {
                webServer.kill('SIGINT');
                process.exit(0);
            });
            break;
        case '3':
            console.log(chalk.cyan('\n👋 Goodbye!'));
            rl.close();
            break;
        default:
            console.log(chalk.red('\n❌ Invalid choice. Please try again.'));
            rl.close();
            main();
            break;
    }
}

main().catch(console.error);