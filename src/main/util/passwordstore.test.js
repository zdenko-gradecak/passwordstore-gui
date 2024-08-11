const fs = require('fs');
const { exec } = require('child_process');
const { getPasswordStoreEntries, getPasswordStoreEntry, savePasswordStoreEntry } = require('../util/passwordstore.js');
const { deletePasswordStoreEntry } = require('./passwordstore');

jest.mock('fs');

describe('getPasswordStoreEntries', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('correctly transfers directory hierarchy to JSON data structure (up to 4 levels of depth)', () => {
    const mockStructure = {
      '/home/disablable/.password-store': ['level1'],
      '/home/disablable/.password-store/level1': ['level2'],
      '/home/disablable/.password-store/level1/level2': ['level3'],
      '/home/disablable/.password-store/level1/level2/level3': ['level4'],
      '/home/disablable/.password-store/level1/level2/level3/level4': ['file1.gpg', 'file2.pgp', 'file3.asc'],
    };

    const mockStats = (isDirectory) => ({
      isDirectory: () => isDirectory,
      isFile: () => !isDirectory
    });

    fs.readdirSync.mockImplementation((dirPath) => {
      return mockStructure[dirPath] || [];
    });

    fs.statSync.mockImplementation((fullPath) => {
      const isDirectory = fullPath in mockStructure;
      return mockStats(isDirectory);
    });

    const expectedResult = [
      {
        name: 'level1',
        path: 'level1',
        children: [
          {
            name: 'level2',
            path: 'level1/level2',
            children: [
              {
                name: 'level3',
                path: 'level1/level2/level3',
                children: [
                  {
                    name: 'level4',
                    path: 'level1/level2/level3/level4',
                    children: [
                      {
                        name: 'file1',
                        path: 'level1/level2/level3/level4/file1',
                        children: []
                      },
                      {
                        name: 'file2',
                        path: 'level1/level2/level3/level4/file2',
                        children: []
                      },
                      {
                        name: 'file3',
                        path: 'level1/level2/level3/level4/file3',
                        children: []
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ];

    const result = getPasswordStoreEntries();
    expect(result).toEqual(expectedResult);
  });

  test('excludes patterns correctly', () => {
    const mockStructure = {
      '/home/disablable/.password-store': ['folder1', 'folder2', 'folder3'],
      '/home/disablable/.password-store/folder1': ['file1.gpg'],
      '/home/disablable/.password-store/folder2': ['file2.pgp'],
      '/home/disablable/.password-store/folder3': ['file3.asc', 'file4.txt'],
    };

    const mockStats = (isDirectory) => ({
      isDirectory: () => isDirectory,
      isFile: () => !isDirectory
    });

    fs.readdirSync.mockImplementation((dirPath) => {
      return mockStructure[dirPath] || [];
    });

    fs.statSync.mockImplementation((fullPath) => {
      const isDirectory = fullPath in mockStructure;
      return mockStats(isDirectory);
    });

    const expectedResult = [
      {
        name: 'folder1',
        path: 'folder1',
        children: [
          {
            name: 'file1',
            path: 'folder1/file1',
            children: []
          },
        ],
      },
      {
        name: 'folder2',
        path: 'folder2',
        children: [
          {
            name: 'file2',
            path: 'folder2/file2',
            children: []
          },
        ],
      },
      {
        name: 'folder3',
        path: 'folder3',
        children: [
          {
            name: 'file3',
            path: 'folder3/file3',
            children: []
          },
        ],
      },
    ];

    const result = getPasswordStoreEntries();
    expect(result).toEqual(expectedResult);
  });

  test('returns an empty array for an empty directory', () => {
    fs.readdirSync.mockImplementation(() => []);

    const result = getPasswordStoreEntries('/empty');
    expect(result).toEqual([]);
  });

  test('handles folder not found (incorrect path) case', () => {
    fs.readdirSync.mockImplementation(() => {
      throw new Error('Folder not found');
    });

    expect(() => getPasswordStoreEntries('/invalid/path')).toThrow('Folder not found');
  });

  test('filters folders and files by given search term', () => {
    const mockStructure = {
      '/home/disablable/.password-store': ['Ron', 'Bob'],
      '/home/disablable/.password-store/Ron': ['Amazon', 'Google'],
      '/home/disablable/.password-store/Ron/Amazon': ['aws.gpg'],
      '/home/disablable/.password-store/Ron/Google': ['rons_gmail.gpg'],
      '/home/disablable/.password-store/Bob': ['Google'],
      '/home/disablable/.password-store/Bob/Google': ['bobs_gmail.gpg'],
    };

    const mockStats = (isDirectory) => ({
      isDirectory: () => isDirectory,
      isFile: () => !isDirectory
    });

    fs.readdirSync.mockImplementation((dirPath) => {
      return mockStructure[dirPath] || [];
    });

    fs.statSync.mockImplementation((fullPath) => {
      const isDirectory = fullPath in mockStructure;
      return mockStats(isDirectory);
    });

    // Test filter by folder name
    const expectedResultByFolderName = [
      {
        name: 'Ron',
        path: 'Ron',
        children: [
          {
            name: 'Google',
            path: 'Ron/Google',
            children: [
              {
                name: 'rons_gmail',
                path: 'Ron/Google/rons_gmail',
                children: []
              }
            ]
          }
        ]
      },
      {
        name: 'Bob',
        path: 'Bob',
        children: [
          {
            name: 'Google',
            path: 'Bob/Google',
            children: [
              {
                name: 'bobs_gmail',
                path: 'Bob/Google/bobs_gmail',
                children: []
              }
            ]
          }
        ]
      }
    ];

    const resultForSearchByFolderName = getPasswordStoreEntries('Google');
    expect(expectedResultByFolderName).toEqual(resultForSearchByFolderName);

    // Test filter by file name
    const expectedResultByFileName = [
      {
        name: 'Ron',
        path: 'Ron',
        children: [
          {
            name: 'Amazon',
            path: 'Ron/Amazon',
            children: [
              {
                name: 'aws',
                path: 'Ron/Amazon/aws',
                children: []
              }
            ]
          }
        ]
      }
    ];

    const resultForSearchByFileName = getPasswordStoreEntries('aws');
    expect(expectedResultByFileName).toEqual(resultForSearchByFileName);
  });
});

jest.mock('child_process', () => ({
  exec: jest.fn(),
}));

describe('getPasswordStoreEntry', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should execute pass command and return stdout', async () => {
    const mockStdout = 'mocked output';
    exec.mockImplementation((command, callback) => {
      callback(null, mockStdout, null);
    });

    const entryPath = 'Rocketbook("getrocketbook.co.uk")';
    const result = await getPasswordStoreEntry(entryPath);

    expect(exec).toHaveBeenCalledWith(expect.stringContaining('\'Rocketbook("getrocketbook.co.uk")\''), expect.any(Function));
    expect(result).toBe(mockStdout);
  });

  test('should reject with stderr on error', async () => {
    const mockStderr = 'error message';
    exec.mockImplementation((command, callback) => {
      callback(new Error('error'), null, mockStderr);
    });

    const entryPath = 'Rocketbook(getrocketbook.co.uk)';

    await expect(getPasswordStoreEntry(entryPath)).rejects.toEqual(mockStderr);
    expect(exec).toHaveBeenCalledWith(expect.stringContaining('\'Rocketbook(getrocketbook.co.uk)\''), expect.any(Function));
  });
});

describe('savePasswordStoreEntry', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should execute pass command, escape special chars and return stdout', async () => {
    // Arrange
    const mockStdout = 'mocked output';
    exec.mockImplementation((command, callback) => {
      callback(null, mockStdout, null);
    });

    const entryPath = 'Rocketbook(getrocketbook.co.uk)';
    /* eslint-disable */
    const content = `rocket-password
rocket@rocket.com
Some other content
Special chars: \ ' " & | ; $ ( ) < > * ? [ ] { } ~ !
1234567890`;
    /* eslint-enable */

    // Act
    const result = await savePasswordStoreEntry(entryPath, content);

    // Assert
    const escapedPath = 'Rocketbook(getrocketbook.co.uk)';
    /* eslint-disable */
    const escapedContent = `'rocket-password
rocket@rocket.com
Some other content
Special chars:  '\\'' \" & | ; $ ( ) < > * ? [ ] { } ~ !
1234567890'`;
    /* eslint-enable */

    expect(exec).toHaveBeenCalledWith(expect.stringContaining(`echo ${escapedContent} | pass insert -m '${escapedPath}'`), expect.any(Function));
    expect(result).toBe(mockStdout);
  });
});

describe('deletePasswordStoreEntry', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should execute pass command for deletion with escaped special chars and return stdout', async () => {
    // Arrange
    const mockStdout = 'mocked output';
    exec.mockImplementation((command, callback) => {
      callback(null, mockStdout, null);
    });

    const entryPath = 'Rocketbook(getrocketbook.co.uk)';

    // Act
    const result = await deletePasswordStoreEntry(entryPath);

    // Assert
    const escapedPath = 'Rocketbook(getrocketbook.co.uk)';

    expect(exec).toHaveBeenCalledWith(expect.stringContaining(`pass rm '${escapedPath}'`), expect.any(Function));
    expect(result).toBe(mockStdout);
  });
});
