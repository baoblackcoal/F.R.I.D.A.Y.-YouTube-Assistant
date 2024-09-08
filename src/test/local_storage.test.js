const { addItem, deleteItem, checkItem, updateItem } = require('../contentscript/local_storage.js');
const jestChrome = require('jest-chrome');

describe('Chrome Local Storage Operations', () => {
    beforeEach(() => {
        // Mock Chrome storage API methods
        jestChrome.storage.local.set.mockClear();
        jestChrome.storage.local.get.mockClear();
        jestChrome.storage.local.remove.mockClear();
    });

    test('should add an item to local storage', () => {
        addItem('key1', 'value1');
        expect(jestChrome.storage.local.set).toHaveBeenCalledWith({ key1: 'value1' }, expect.any(Function));
    });

    test('should delete an item from local storage', () => {
        deleteItem('key1');
        expect(jestChrome.storage.local.remove).toHaveBeenCalledWith('key1', expect.any(Function));
    });

    test('should check if an item exists in local storage', (done) => {
        jestChrome.storage.local.get.mockImplementation((keys, callback) => {
            callback({ key1: 'value1' });
        });

        checkItem('key1', (exists) => {
            expect(exists).toBe(true);
            done();
        });
    });

    test('should update an item in local storage', () => {
        updateItem('key1', 'newValue1');
        expect(jestChrome.storage.local.set).toHaveBeenCalledWith({ key1: 'newValue1' }, expect.any(Function));
    });
});
