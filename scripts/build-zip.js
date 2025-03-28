const AdmZip = require('adm-zip');
const path = require('path');
const fs = require('fs');

// 读取 manifest.json 获取版本号
const manifestPath = path.join(__dirname, '../src/manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const version = manifest.version;

// 创建 zip 实例
const zip = new AdmZip();

// 确保 zip 目录存在
const zipDir = path.join(__dirname, '../release');
if (!fs.existsSync(zipDir)) {
    fs.mkdirSync(zipDir, { recursive: true });
}

// 添加 dist 目录下的所有文件
const distDir = path.join(__dirname, '../dist');
const distFiles = fs.readdirSync(distDir);

distFiles.forEach(file => {
    // 跳过 zip 目录
    if (file === 'zip') return;
    
    const filePath = path.join(distDir, file);
    const stats = fs.statSync(filePath);
    
    if (stats.isFile()) {
        // 添加文件到 zip
        zip.addLocalFile(filePath);
    } else if (stats.isDirectory()) {
        // 添加目录到 zip
        zip.addLocalFolder(filePath, file);
    }
});

// get timestamp
const now = new Date();
const timestamp = now.getFullYear() + '-' +
    String(now.getMonth() + 1).padStart(2, '0') + '-' +
    String(now.getDate()).padStart(2, '0') + '_' +
    String(now.getHours()).padStart(2, '0') + '-' +
    String(now.getMinutes()).padStart(2, '0') + '-' +
    String(now.getSeconds()).padStart(2, '0');

// 生成带版本号的 zip 文件名
const zipFileName = `Friday_V${version}_${timestamp}.zip`;

// 生成 zip 文件
zip.writeZip(path.join(zipDir, zipFileName));

console.log(`Successfully created ${zipFileName} in release directory!`); 