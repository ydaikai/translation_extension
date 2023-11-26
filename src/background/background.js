// background.js

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	console.log("Message received in background script:", request); // ログを追加
    if (request.action === 'translateText') {
        // APIリクエストのロジックをここに追加
        // 例えば、fetch APIを使用してリクエストを送信する
        // APIキーと翻訳先の言語は、chrome.storageから取得する

        // 設定を取得する
        chrome.storage.sync.get(['apiKey', 'targetLanguage'], function(items) {
            // let apiKey = items.apiKey; // OpenAIのAPIキー
			let apiKey = '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';
            let targetLanguage = items.targetLanguage || 'ja'; // デフォルトの翻訳先言語

            let prompt = `Translate this into ${targetLanguage}: ${request.text}`;

			console.log("Translation started");

            // OpenAIのGPT-3.5-turboエンジンにリクエストを送信
            fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: "gpt-3.5-turbo",
                    messages: [
						{
						  "role": "user",
						  "content": prompt
						}
					],
                    max_tokens: 500,
                    temperature: 0.5,
                    n: 1,
                    stop: "\n"
                })
            })
            .then(response => response.json())
            .then(data => {
                console.log("OpenAI API response:", data);
				// コンテンツスクリプトに翻訳結果を送信
                chrome.tabs.sendMessage(sender.tab.id, {
                    action: 'translationResult',
                    translation: data.choices[0].message.content.trim()
                });
            })
            .catch(error => {
                console.error('Error:', error);
            });
        });
    }
});
