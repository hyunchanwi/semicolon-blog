
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// 백업할 주요 파일 및 디렉토리 패턴
const includePatterns = [
    'src/app/api/cron/youtube/route.ts',
    'src/app/api/cron/generate/route.ts',
    'src/app/api/cron/howto/route.ts',
    'src/app/api/admin/posts/route.ts',
    'src/app/api/admin/posts/[id]/route.ts',
    'scripts/manual-trigger-single.ts',
    'scripts/manual-trigger-multichannel.ts',
    'src/lib/wp-server.ts',
    'src/lib/google-indexing.ts',
    'src/lib/wp-api.ts',
    'scripts/reindex-all-posts.ts'
];

function getFormattedDate() {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}_${hh}${min}`;
}

async function backupFiles() {
    const timestamp = getFormattedDate();
    const backupDir = path.join(projectRoot, 'backups', `backup_${timestamp}`);

    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    console.log(`📦 Creating backup at: ${backupDir}`);

    let count = 0;
    for (const relativePath of includePatterns) {
        const sourcePath = path.join(projectRoot, relativePath);

        if (fs.existsSync(sourcePath)) {
            const destPath = path.join(backupDir, relativePath);
            const destDir = path.dirname(destPath);

            if (!fs.existsSync(destDir)) {
                fs.mkdirSync(destDir, { recursive: true });
            }

            fs.copyFileSync(sourcePath, destPath);
            console.log(`  Included: ${relativePath}`);
            count++;
        } else {
            console.warn(`  Instance Warning: File not found - ${relativePath}`);
        }
    }

    console.log(`\n✅ Backup completed! (${count} files processed)`);
    console.log(`📁 Location: ${backupDir}`);
}

backupFiles();
