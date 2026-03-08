# English Conversion Guide for Star-Office-UI-INJ

This document provides a step-by-step guide to convert the entire project to English-only.

## Why This Matters

The project currently has mixed-language UI (Chinese, English, Japanese). To make it fully English:
- Remove UI language toggle buttons
- Remove non-English translations from `I18N` object
- Translate any remaining non-English comments/strings to English
- Update documentation

## Files to Modify

### 1. **frontend/index.html** (CRITICAL - Large file ~5500 lines)

#### Remove Language Toggle UI
- **Lines 1433-1436**: Delete the `lang-toggle-group` div with EN/JP/CN buttons
  ```html
  <!-- REMOVE -->
  <div id="lang-toggle-group" style="...">
      <button ... onclick="setUILanguage('en')">EN</button>
      <button ... onclick="setUILanguage('ja')">JP</button>
      <button ... onclick="setUILanguage('zh')">CN</button>
  </div>
  ```

#### Fix I18N Language Selection
- **Line 1442**: Change `let uiLang = localStorage.getItem('uiLang') || 'en';` 
  to `const uiLang = 'en';`

#### Simplify I18N Object
- **Lines 1443-1527**: Remove `zh: {...}` and `ja: {...}` blocks
- Keep only `en: {...}` translations
- Result: Much smaller I18N object with just English

#### Remove Language Change Function
- **Lines ~1626**: Remove or stub out `function setUILanguage(lang) {...}`

#### Translate All UI Strings
Search for and replace these patterns in the JavaScript:
- `"工作记录"` → `"Work Log"`
- `"访 客 列 表"` → `"Visitor List"`
- `"正在加载 Star 的像素办公室"` → `"Loading Star's pixel office"`

### 2. **frontend/game.js**

Search for Chinese comments and strings:
- Replace any Chinese variable names/comments with English equivalents
- Translate console.log messages

### 3. **frontend/layout.js**

- Translate any Chinese strings/comments to English

### 4. **backend/app.py**

- Line ~150-200: Check for Chinese strings in status/state names
- Replace with English: `"待命中"` → `"Idle"`

### 5. **backend/memo_utils.py**

- Check for Chinese in date formatting or default messages

### 6. **backend/wallet_utils.py**, **backend/viem_wallet.py**

- Comments should already be English, but verify

### 7. **Documentation Files**

Delete (if bilingual):
- `README.ja.md` — Japanese docs
- Keep: `README.md` (English-only) or `README.en.md`

Delete or update:
- `README.zh.md` if exists
- `frontend/join-office-skill.md` — check for CN/JP

### 8. **Other Files**

Check these for non-English comments:
- `set_state.py`
- `SKILL.md`
- `electron-shell/main.js`
- `desktop-pet/README.md`
- Any `.md` files in `docs/`

## Translation Reference

Common UI Strings:

| Chinese | English |
|---------|---------|
| 状态 | Status |
| 待命 | Idle |
| 工作 | Work |
| 同步 | Sync |
| 报警 | Alert |
| 装修房间 | Decorate Room |
| 工作记录 | Work Log |
| 访客列表 | Visitor List |
| 正在加载 | Loading |
| 请稍候 | Please wait |

## Implementation Steps

1. **Backup**: `git checkout -b english-conversion`
2. **Edit index.html**: Remove language UI and I18N zh/ja blocks
3. **Fix app.py**: Update status messages
4. **Test**: Run server, verify UI displays only English
5. **Delete** multilingual docs (README.ja.md, etc.)
6. **Commit**: `git commit -m "chore: English-only project conversion"`
7. **Push**: `git push origin english-conversion`

## Automated Approach (Optional)

If you have sed/Python skills:

```bash
# Remove language toggle
sed -i '/<div id="lang-toggle-group"/,/<\/div>/d' frontend/index.html

# Fix uiLang
sed -i "s/let uiLang = .*/const uiLang = 'en';/" frontend/index.html

# Python: Remove zh/ja from I18N (complex regex, see convert_to_english.py)
python3 /tmp/convert_to_english.py frontend/index.html
```

## Verification Checklist

After conversion:
- [ ] No Chinese characters in UI  
- [ ] No Japanese characters in UI
- [ ] Language toggle buttons removed
- [ ] All console.log/comments in English
- [ ] README is English-only
- [ ] README.ja.md and README.zh.md (if exists) deleted
- [ ] `git status` shows expected changes
- [ ] Server starts without errors
- [ ] Browser UI loads with only English text

## Estimated Time

- Manual: 30-60 minutes (careful, low-risk)
- Automated: 10-15 minutes (but needs verification)

---

**Note**: This guide assumes you're comfortable with text editing. If unsure, do it manually line-by-line rather than with find-replace to avoid breaking code.
