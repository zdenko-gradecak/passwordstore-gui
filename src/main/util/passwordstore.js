const fs = require('fs');
const path = require('path');
const { exec} = require('child_process');
const shellEscape = require('shell-escape');

const getPasswordStoreEntries = () => {
  const dirPath = '/home/disablable/.password-store'; // Update this to the correct path
  const excludePatterns = [/^\./];

  return readDirectoryStructure(dirPath, excludePatterns);
};

const getPasswordStoreEntry = async (entryPath) => {
  const escapedPath = shellEscape([entryPath]);
  const passCommand = `pass ${escapedPath}`;

  return new Promise((resolve, reject) => {
    exec(passCommand, (error, stdout, stderr) => {
      if (error) {
        console.log(stderr);
        return reject(stderr);
      }
      resolve(stdout);
    });
  });
}

const savePasswordStoreEntry = async (entryPath, content) => {
  const escapedPath = shellEscape([entryPath]);
  const escapedContent = shellEscape([content]);
  const passCommand = `echo ${escapedContent} | pass insert -m ${escapedPath}`;

  return new Promise((resolve, reject) => {
    exec(passCommand, (error, stdout, stderr) => {
      if (error) {
        console.log(stderr);
        return reject(stderr);
      }
      resolve(stdout);
    });
  });
};

const readDirectoryStructure = (dirPath, excludePatterns = [], currentPath = '') => {
  const result = [];

  const items = fs.readdirSync(dirPath);
  items.forEach(item => {
    if (excludePatterns.some(pattern => pattern.test(item))) {
      return;
    }

    const fullPath = path.join(dirPath, item);
    const itemPath = path.join(currentPath, item);
    const stats = fs.statSync(fullPath);

    if (stats.isDirectory()) {
      result.push({
        name: item,
        path: itemPath,
        children: readDirectoryStructure(fullPath, excludePatterns, itemPath)
      });

      return;
    }

    if (stats.isFile()) {
      const ext = path.extname(item).toLowerCase();
      if (ext === '.gpg' || ext === '.pgp' || ext === '.asc') {
        const nameWithoutExtension = removeFileExtension(item);
        const itemPathWithoutExtension = removeFileExtension(itemPath);
        result.push({
          name: nameWithoutExtension,
          path: itemPathWithoutExtension,
          children: []
        });
      }
    }
  });

  return result;
};

const removeFileExtension = (fileName) => {
  return fileName.replace(/^(.*?)(\.[^.]*$|$)/, '$1');
};

export { getPasswordStoreEntries, getPasswordStoreEntry, savePasswordStoreEntry };
