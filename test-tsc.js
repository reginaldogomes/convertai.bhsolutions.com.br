const { execSync } = require('child_process');
try {
  const output = execSync('npx tsc --noEmit', { encoding: 'utf8', stdio: 'pipe' });
  console.log("No errors.");
} catch (e) {
  console.log(e.stdout.substring(0, 3000));
}
