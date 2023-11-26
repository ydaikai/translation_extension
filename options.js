// options.js

function saveOptions() {
    let apiKey = document.getElementById('apiKey').value;
    let targetLanguage = document.getElementById('targetLanguage').value;

    chrome.storage.sync.set({ apiKey: apiKey, targetLanguage: targetLanguage }, function() {
        console.log('設定が保存されました。');
    });
}

function restoreOptions() {
    chrome.storage.sync.get(['apiKey', 'targetLanguage'], function(items) {
        document.getElementById('apiKey').value = items.apiKey || '';
        document.getElementById('targetLanguage').value = items.targetLanguage || '';
    });
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('saveButton').addEventListener('click', saveOptions);
