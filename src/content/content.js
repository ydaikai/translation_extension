// オーバーレイが表示されているかどうかを追跡するフラグ
let isOverlayDisplayed = false;

let currentSelectedText = '';
let x = 0;
let y = 0;

document.addEventListener('mouseup', function(event) {
    let selectedText = window.getSelection().toString().trim();
	if (selectedText.length > 0) {
        currentSelectedText = selectedText;
	}
    let existingOverlay = document.getElementById('translationOverlay');

    let selection = window.getSelection();
    if (selection.rangeCount > 0) {
        let range = selection.getRangeAt(0);
        let commonAncestor = range.commonAncestorContainer;

        // commonAncestorが要素ノードでない場合、親要素を取得
        let parentElement = commonAncestor.nodeType === 3 ? commonAncestor.parentNode : commonAncestor;

        // 翻訳結果テキスト内の選択をチェック
        if (parentElement && parentElement.closest('.translation-result-text')) {
            return; // 翻訳結果テキストが選択されている場合、処理を終了
        }
    }

    if (selectedText.length > 0 && !existingOverlay) {
        let overlay = createTranslationOverlay(event);
        document.body.appendChild(overlay);
        isOverlayDisplayed = true;
    }
});

document.addEventListener('click', function(event) {
    let overlay = document.getElementById('translationOverlay');
    if (overlay && !overlay.contains(event.target) && !isOverlayDisplayed) {
        overlay.remove();
        isOverlayDisplayed = false; // オーバーレイが削除されたらフラグを更新
        console.log('Translation overlay removed');
    } else {
        isOverlayDisplayed = false; // クリックイベントが発生したらフラグをリセット
    }
});

function createTranslationOverlay(event) {
    let overlay = document.createElement('div');
    overlay.id = 'translationOverlay';
    overlay.style.position = 'absolute';
	x = event.clientX;
	y = event.clientY;
    overlay.style.left = `${x}px`;
    overlay.style.top = `${y}px`;
    overlay.style.padding = '8px';
    overlay.style.background = 'white';
    overlay.style.border = '1px solid black';
    overlay.style.borderRadius = '4px';
    overlay.style.zIndex = '1000';
    overlay.style.cursor = 'pointer';

    let translateButton = document.createElement('div');
    translateButton.textContent = 'Translate';
    translateButton.style.padding = '4px 8px';
    translateButton.style.margin = '4px';
    translateButton.style.background = '#f0f0f0';
    translateButton.style.borderRadius = '4px';
    translateButton.style.textAlign = 'center';

    // ボタンのクリックイベント
    translateButton.addEventListener('click', function() {
        if (!currentSelectedText) {
			console.log("No text selected");
			return;
		}
		console.log("Sending message to background script:", currentSelectedText);

		chrome.runtime.sendMessage({
            action: 'translateText',
            text: currentSelectedText
        });
        window.getSelection().removeAllRanges();
        overlay.remove();
        isOverlayDisplayed = false; // クリック後にフラグを更新
    });

    overlay.appendChild(translateButton);
    return overlay;
}

function createTranslationResultOverlay(translation, x, y) {
    let overlay = document.createElement('div');
    overlay.style.position = 'absolute';
    overlay.style.left = `${x}px`;
    overlay.style.top = `${y}px`;
    overlay.style.width = '600px'; // 幅を固定
    overlay.style.height = '400px'; // 高さを固定
    overlay.style.background = 'white';
    overlay.style.border = '1px solid black';
    overlay.style.borderRadius = '4px';
    overlay.style.zIndex = '1000';
    overlay.style.display = 'flex';
    overlay.style.flexDirection = 'column';
    overlay.style.justifyContent = 'space-between';

	let contentContainer = document.createElement('div');
    contentContainer.style.overflowY = 'auto'; // 縦スクロールのみ
    contentContainer.style.padding = '8px';
    contentContainer.style.flexGrow = '1';


    

    // 翻訳結果のテキスト
    let translationText = document.createElement('div');
    translationText.textContent = translation;
	translationText.className = 'translation-result-text'; // 識別子を設定
	translationText.style.marginBottom = '20px'; // ボタンとの間隔
    contentContainer.appendChild(translationText);

    overlay.appendChild(contentContainer);

    // ボタンコンテナ
    let buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.justifyContent = 'space-between';
    buttonContainer.style.padding = '8px';

	// ドラッグ機能の追加
    buttonContainer.onmousedown = function(event) {
        let shiftX = event.clientX - overlay.getBoundingClientRect().left;
        let shiftY = event.clientY - overlay.getBoundingClientRect().top;

        function moveAt(pageX, pageY) {
            overlay.style.left = pageX - shiftX + 'px';
            overlay.style.top = pageY - shiftY + 'px';
        }

        function onMouseMove(event) {
            moveAt(event.pageX, event.pageY);
        }

        document.addEventListener('mousemove', onMouseMove);
        overlay.onmouseup = function() {
            document.removeEventListener('mousemove', onMouseMove);
            overlay.onmouseup = null;
        };
    };
    buttonContainer.ondragstart = function() {
        return false;
    };

    // コピー用のボタン
    let copyButton = document.createElement('button');
    copyButton.textContent = 'Copy';
    copyButton.onclick = function() {
        navigator.clipboard.writeText(translation).then(() => {
            console.log('Translation copied to clipboard');
        });
    };
    buttonContainer.appendChild(copyButton);

    // 閉じるボタン
    let closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.onclick = function() {
        overlay.remove();
    };
    buttonContainer.appendChild(closeButton);

    overlay.appendChild(buttonContainer);

    return overlay;
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'translationResult') {
        console.log("Translated text:", request.translation);

        let x = window.innerWidth / 2; // ウィンドウの中央に配置する例
        let y = window.innerHeight / 2;

        let translationOverlay = createTranslationResultOverlay(request.translation, x, y);
        document.body.appendChild(translationOverlay);
    }
});