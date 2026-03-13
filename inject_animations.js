const fs = require('fs');
const path = require('path');

function processDir(dir) {
    fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.component.ts')) {
            processComponent(fullPath);
        }
    });
}

function processComponent(filePath) {
    let content = fs.readFileSync(filePath, 'utf-8');
    let changed = false;

    // Add import if missing
    if (!content.includes('shared/animations')) {
        const animDir = path.resolve('src/app/shared/animations');
        const fileDir = path.dirname(path.resolve(filePath));
        let relPath = path.relative(fileDir, animDir).replace(/\\/g, '/');
        if (!relPath.startsWith('.')) relPath = './' + relPath;

        const importStatement = `import { fadeIn, slideUp, slideInRight, popIn, staggerFade, buttonState } from '${relPath}';\n`;
        content = importStatement + content;
        changed = true;
    }

    // Add animations array if missing
    if (!content.includes('animations: [')) {
        if (content.includes('@Component({')) {
            content = content.replace(/changeDetection:\s*ChangeDetectionStrategy\.OnPush/g, `animations: [fadeIn, slideUp, slideInRight, popIn, staggerFade, buttonState],\n  changeDetection: ChangeDetectionStrategy.OnPush`);
            changed = true;
        }
    } else if (!content.includes('fadeIn, slideUp')) {
        // has animations: [] but missing our new ones
        content = content.replace(/animations:\s*\[([^\]]*)\]/g, (match, p1) => {
            const existing = p1.trim();
            if (existing) {
                return `animations: [fadeIn, slideUp, slideInRight, popIn, staggerFade, buttonState, ${existing}]`;
            } else {
                return `animations: [fadeIn, slideUp, slideInRight, popIn, staggerFade, buttonState]`;
            }
        });
        changed = true;
    }

    // Add [@fadeIn] to first wrapper div if not present
    if (content.includes('template: `')) {
        // Extract template area
        const templateRegex = /template:\s*`([\s\S]*?)`/g;
        content = content.replace(templateRegex, (match, templateContent) => {
            if (!templateContent.includes('[@fadeIn]')) {
                // Find first tag that looks like a wrapper (e.g., <div class="...)
                const firstDivRegex = /(<div[^>]*class="[^"]*h-full[^"]*"[^>]*>|<div[^>]*class="[^"]*group[^"]*"[^>]*>|<div[^>]*class="[^"]*[^"]*"[^>]*>)/i;
                return `template: \`${templateContent.replace(firstDivRegex, (tag) => {
                    return tag.replace('>', ' [@fadeIn]>');
                })}\``;
            }
            return match;
        });
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log('Updated: ' + filePath);
    }
}

processDir('src/app/modules');
console.log('Done mapping animations.');
