import { app } from 'electron';
const fs = require('fs');
const path = require('path');
const { exec} = require('child_process');
const shellEscape = require('shell-escape');

(async () => {
  const fixPath = (await import('fix-path')).default;
  fixPath();
})();

const getSettingsData = async () => {
  const settingsFilePath = getSettingsFilePath();

  try {
    await fs.promises.access(settingsFilePath);
    const fileContents = await fs.promises.readFile(settingsFilePath, 'utf8');

    return JSON.parse(fileContents);
  } catch (error) {
    console.error('Error in getSettingsData:', error);
    if (error.code === 'ENOENT') {
      return { path: '' };
    }
    throw error;
  }
};

const saveSettingsData = async (settingsDataToSave) => {
  const allowedKeys = ['path'];
  const settingsFilePath = getSettingsFilePath();

  try {
    // Validate that the input is a valid JSON object
    if (typeof settingsDataToSave !== 'object' || settingsDataToSave === null) {
      throw new Error('Invalid input: settingsDataToSave must be a valid JSON object');
    }

    // Filter the input to only include allowed keys
    const filteredSettingsData = Object.keys(settingsDataToSave)
      .filter(key => allowedKeys.includes(key))
      .reduce((obj, key) => {
        obj[key] = settingsDataToSave[key];
        return obj;
      }, {});

    const jsonData = JSON.stringify(filteredSettingsData, null, 2);

    await fs.promises.writeFile(settingsFilePath, jsonData, 'utf8');
  } catch (error) {
    console.error('Error saving settings data:', error);
    throw error;
  }
};

const filterDirectoryStructure = (structure, query) => {
  const lowerCaseQuery = query.toLowerCase();

  return structure
    .map(item => {
      const lowerCasePath = item.path.toLowerCase();

      if (lowerCasePath.includes(lowerCaseQuery)) {
        // If the current item's path includes the query, include the item
        return {
          ...item,
          // Recursively filter the children
          children: filterDirectoryStructure(item.children, lowerCaseQuery)
        };
      } else {
        // Recursively filter the children
        const filteredChildren = filterDirectoryStructure(item.children, lowerCaseQuery);
        if (filteredChildren.length > 0) {
          // If any children match the query, include the item with the filtered children
          return {
            ...item,
            children: filteredChildren
          };
        }
      }
      // Exclude the item if neither it nor its children match the query
      return null;
    })
    .filter(item => item !== null); // Filter out null items and cast to DirectoryStructure
};

const getPasswordStoreEntries = async (query) => {
  const dirPath = await getApplicationDataPath();
  const excludePatterns = [/^\./];

  const directoryStructure = readDirectoryStructure(dirPath, excludePatterns);

  if (!query) {
    return directoryStructure;
  }

  return filterDirectoryStructure(directoryStructure, query);
};

const getPasswordStoreEntry = async (entryPath) => {
  const escapedPath = shellEscape([entryPath]);
  const passCommand = `pass ${escapedPath}`;

  return new Promise((resolve, reject) => {
    exec(passCommand, (error, stdout, stderr) => {
      if (error) {
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

const deletePasswordStoreEntry = async (entryPath) => {
  const escapedPath = shellEscape([entryPath]);
  const passCommand = `pass rm ${escapedPath}`;

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

const getSettingsFilePath = () => {
  const userDataPath = app.getPath('userData');

  return path.join(userDataPath, 'settings.json');
};

const getApplicationDataPath = async () => {
  const settingsData = await getSettingsData();

  //throw error here (we don't want the save method to save on empty path

  if (settingsData.hasOwnProperty('path')) {
    return settingsData.path;
  }

  return '';
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

export { getSettingsData, saveSettingsData, getPasswordStoreEntries, getPasswordStoreEntry, savePasswordStoreEntry, deletePasswordStoreEntry };
