// Add item to local storage
const addItem = (key, value) => {
    chrome.storage.local.set({ [key]: value }, () => {
        console.log(`Item added: ${key} = ${value}`);
    });
};

// Delete item from local storage
const deleteItem = (key) => {
    chrome.storage.local.remove(key, () => {
        console.log(`Item deleted: ${key}`);
    });
};

// Check if an item exists in local storage
const checkItem = (key, callback) => {
    chrome.storage.local.get([key], (result) => {
        callback(result[key] !== undefined);
    });
};

// Update an item in local storage
const updateItem = (key, newValue) => {
    chrome.storage.local.set({ [key]: newValue }, () => {
        console.log(`Item updated: ${key} = ${newValue}`);
    });
};

// // Example usage (remove in production)
// addItem('name', 'John Doe');
// checkItem('name', (exists) => console.log(`Item exists: ${exists}`));
// updateItem('name', 'Jane Doe');
// deleteItem('name');
