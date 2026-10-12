const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const nodeModules = path.join(rootDir, 'node_modules');
const vendorDir = path.join(rootDir, 'src', 'main', 'resources', 'static', 'vendor');

function ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

function copyFile(src, dest) {
    ensureDir(path.dirname(dest));
    fs.copyFileSync(src, dest);
    console.log(`Copied: ${path.relative(rootDir, dest)}`);
}

console.log('Copying vendor libraries to static/vendor...');

// 1. FilePond JS & CSS
copyFile(path.join(nodeModules, 'filepond', 'dist', 'filepond.min.css'), path.join(vendorDir, 'filepond', 'filepond.min.css'));
copyFile(path.join(nodeModules, 'filepond', 'dist', 'filepond.min.js'), path.join(vendorDir, 'filepond', 'filepond.min.js'));

// FilePond Plugins
copyFile(path.join(nodeModules, 'filepond-plugin-image-preview', 'dist', 'filepond-plugin-image-preview.min.css'), path.join(vendorDir, 'filepond', 'filepond-plugin-image-preview.min.css'));
copyFile(path.join(nodeModules, 'filepond-plugin-image-preview', 'dist', 'filepond-plugin-image-preview.min.js'), path.join(vendorDir, 'filepond', 'filepond-plugin-image-preview.min.js'));
copyFile(path.join(nodeModules, 'filepond-plugin-file-validate-type', 'dist', 'filepond-plugin-file-validate-type.min.js'), path.join(vendorDir, 'filepond', 'filepond-plugin-file-validate-type.min.js'));
copyFile(path.join(nodeModules, 'filepond-plugin-file-validate-size', 'dist', 'filepond-plugin-file-validate-size.min.js'), path.join(vendorDir, 'filepond', 'filepond-plugin-file-validate-size.min.js'));

// 2. SortableJS
copyFile(path.join(nodeModules, 'sortablejs', 'Sortable.min.js'), path.join(vendorDir, 'sortablejs', 'Sortable.min.js'));

// 3. Lucide Vanilla JS
copyFile(path.join(nodeModules, 'lucide', 'dist', 'umd', 'lucide.min.js'), path.join(vendorDir, 'lucide', 'lucide.min.js'));

// 4. Scrawl UI
copyFile(path.join(nodeModules, 'scrawl-ui', 'scrawl.css'), path.join(vendorDir, 'scrawl-ui', 'scrawl.css'));
copyFile(path.join(nodeModules, 'scrawl-ui', 'scrawl.js'), path.join(vendorDir, 'scrawl-ui', 'scrawl.js'));
copyFile(path.join(nodeModules, 'scrawl-ui', 'icons.js'), path.join(vendorDir, 'scrawl-ui', 'icons.js'));

console.log('Vendor libraries successfully copied to static/vendor!');
