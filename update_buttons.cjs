const fs = require('fs');
const path = require('path');
function replaceInDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceInDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Match <button ... className=... > and replace rounded-xl/lg/2xl with rounded-full
      let newContent = content.replace(/<button([^>]*className=[\"\'\`][^\"\'\`]*?)(rounded-lg|rounded-xl|rounded-2xl|rounded-md)([^\"\'\`]*[\"\'\`])/g, '<button$1rounded-full$3');
      
      // Also match Link ... className=... with button-like styling?
      // For now just focus on buttons as requested.
      
      if (content !== newContent) {
        fs.writeFileSync(fullPath, newContent);
        console.log('Updated', fullPath);
      }
    }
  }
}
replaceInDir('src');
